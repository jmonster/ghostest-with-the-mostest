var express = require("express");
var router = express.Router();

const pg = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
});

// `/comments` returns the first 1000 comments
router.get("/comments", async function (req, res) {
  // TODO accept a query that specifies the offset for pagination
  // TODO convert created_at to friendlier time_ago format
  return res.send(
    // fetch the oldest 1000 comments; consider doing the newest 1000?
    // > ORDER BY created_at DESC LIMIT 1000 ORDER BY created_at ASC
    await pg("comments").orderBy("created_at", "asc").limit(1000)
  );
});

router.post("/comments/new", async function (req, res) {
  // TODO validate input
  const { users_name, avatar_url, body, parentPath } = req.body;

  const {
    rows: [{ uuid_generate_v4: uuid }],
  } = await pg.raw("select uuid_generate_v4();"); // let PG generate a uuid (vs installing another dependency)

  // Note: I switched to guids from incrementing ids such that comments could be created,
  //       with their path, in one db trip. Incrementing ids required that I create the record,
  //       then update the path to contain it.
  //       Of course, I could also write a DB function that automates that... if time permits!

  // persist this new comment
  await pg("comments").insert({
    id: uuid,
    users_name,
    avatar_url,
    body,
  });

  // TODO push this new comment to connected clients

  res.sendStatus(201);
});

router.post("/comments/upvote", async function (req, res) {
  const comment_id = req.body.id;
  const users_name = req.body.users_name;

  await pg.transaction(async function (trx) {
    try {
      await Promise.all([
        trx("upvotes").insert({
          comment_id,
          users_name,
        }),

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
