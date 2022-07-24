var express = require("express");
var router = express.Router();

router.get("/comments", function (req, res) {
  const comments = [
    {
      user_name: "Johnny Domino",
      avatar_url: "https://avatars.githubusercontent.com/u/368767?v=4",
      created_at: "45 min ago",
      body: "I comment, therefore I am.",
      upvote_count: 4,
    },
  ];
  res.send(comments);
});

module.exports = router;
