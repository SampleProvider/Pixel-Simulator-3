const express = require("express");
const app = express();
const server = require("http").Server(app);
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.use("/", express.static(__dirname + "/"));
server.listen(4000);
console.info("Server Started on port 4000");