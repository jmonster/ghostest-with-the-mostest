var express = require("express");
var router = express.Router();
const collectNestedRecords = require("../lib/collect-nested-records");

const clients = new Set();

if (!process.env.DATABASE_URL) {
  console.error("Missing environment variable: DATABASE_URL");
  process.exit(1);
}

const pg = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
});

// `/comments` returns the first 1000 comments
router.get("/comments", async function (req, res) {
  // TODO accept a query that specifies the offset for pagination

  // fetch the oldest 1000 comments
  // consider doing the newest 1000?
  const comments = await pg("comments")
    .orderBy("created_at", "asc")
    .limit(1000);

  const nestedComments = collectNestedRecords(comments);
  return res.send(nestedComments);
});

router.post("/comments/new", async function (req, res) {
  // TODO validate input
  const { users_name, avatar_url, body, parentPath } = req.body;

  const {
    rows: [{ uuid_generate_v4: uuid }],
  } = await pg.raw("select uuid_generate_v4();"); // let PG generate a uuid (vs installing another dependency)
  const uuidWithoutDashes = uuid.replace(/-/g, ""); // ltree won't accept dashes in the path

  // persist this new comment
  const result = await pg("comments")
    .returning([
      "id",
      "users_name",
      "avatar_url",
      "body",
      "path",
      "created_at",
      "upvote_count",
    ])
    .insert({
      id: uuid,
      users_name,
      avatar_url,
      body,
      path: parentPath
        ? `${parentPath}.${uuidWithoutDashes}`
        : uuidWithoutDashes, // append this comment's ID as the next node in the path
    });

  if (result.length < 1) return res.sendStatus(500);
  res.send(result[0]);
});

router.post("/comments/upvote", async function (req, res) {
  const comment_id = req.body.id;
  const users_name = req.body.users_name;

  await pg.transaction(async function (trx) {
    try {
      const result = await Promise.all([
        // create the unique record (comment_id, users_name)
        trx("upvotes").insert({
          comment_id,
          users_name,
        }),

        // update cached upvote count property
        // TODO consider a DB function that automatically maintains this property and removes the need for a transaction
        trx.raw(
          `UPDATE comments SET upvote_count = upvote_count + 1 WHERE id = ? RETURNING upvote_count`,
          comment_id
        ),
      ]);

      res.sendStatus(204);

      // broadcast this change to all connected clients
      const data = {
        upvoteCount: result[1].rows[0].upvote_count,
        commentID: comment_id,
      };
      const message = `data: ${JSON.stringify(data)}`;
      clients.forEach((client) => client.response.write(`${message}\n\n`));
    } catch (err) {
      console.error(err);
      // TODO handle different types of errors, notify the user, etc
      res.sendStatus(409); // 409 Conflict, or should it be 422 Unprocessable Entity?
    }
  });
});

router.get("/comments/broadcast", async function (req, res) {
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const clientId = Date.now(); // TODO switch to guids to avoid collisons
  const newClient = {
    id: clientId,
    response: res,
  };

  // add to collection to be notified
  clients.add(newClient);

  // cleanup client on disconnect
  req.once("close", () => {
    clients.delete(newClient);
  });
});

module.exports = router;
