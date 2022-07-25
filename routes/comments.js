var express = require("express");
var router = express.Router();

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

  return res.send(comments);
});

router.post("/comments/new", async function (req, res) {
  // TODO validate input
  const { users_name, avatar_url, body, parentPath } = req.body;

  const {
    rows: [{ uuid_generate_v4: uuid }],
  } = await pg.raw("select uuid_generate_v4();"); // let PG generate a uuid (vs installing another dependency)

  // persist this new comment
  await pg("comments").insert({
    id: uuid,
    users_name,
    avatar_url,
    body,
  });

  // TODO handle errors gracefully
  // TODO broadcast this new comment to all connected clients

  res.sendStatus(201);
});

router.post("/comments/upvote", async function (req, res) {
  const comment_id = req.body.id;
  const users_name = req.body.users_name;

  await pg.transaction(async function (trx) {
    try {
      await Promise.all([
        // create the unique record (comment_id, users_name)
        trx("upvotes").insert({
          comment_id,
          users_name,
        }),

        // update cached upvote count property
        // TODO consider a DB function that automatically maintains this property
        //      and removes the need for a transaction
        trx.raw(
          `UPDATE comments SET upvote_count = upvote_count + 1 WHERE id = ?`,
          comment_id
        ),
      ]);

      res.sendStatus(204);
    } catch (err) {
      // TODO handle different types of errors, notify the user, etc
      res.sendStatus(409); // 409 Conflict, or should it be 422 Unprocessable Entity?
    }
  });
});

module.exports = router;
