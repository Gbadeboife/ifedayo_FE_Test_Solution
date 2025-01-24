"use strict";
const app = require("./app");

const PORT = 3001;

const onListen = async () => {
  console.log("Server running at ", `http://localhost:${PORT}`);
  console.log("\n");
};

const server = app.listen(PORT, onListen);

module.exports = { server, onListen, PORT };
