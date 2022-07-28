require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const logger = require("morgan");
const commentsRouter = require("./routes/comments");

const app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(commentsRouter);

module.exports = app;
