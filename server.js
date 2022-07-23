#! /usr/bin/env node

require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");

const pathToHTML = path.join(__dirname, "client.html");
const PORT = 3000 || process.env.PORT;

const server = http.createServer(function (req, res) {
  const { size } = fs.statSync(pathToHTML);
  const contentStream = fs.createReadStream(pathToHTML);

  res.writeHead(200, {
    "Content-Type": "text/html",
    "Content-Length": size,
  });
  contentStream.pipe(res);
});

server.listen(PORT);

console.log(`Serving ${pathToHTML} at http://localhost:${PORT}`);
