const express = require("express");
const path = require("path");
const cors = require("cors");
const clientMetadata = require("./metadata.json");
const { withSSR } = require("./ReactSSRService");

let app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cors());

if (process.env.IS_HTTPS === "true") {
  app.set("trust proxy", 1);
  session.cookie.secure = true;
  session.cookie.sameSite = "strict";
}

// SSR
const clientMetadataArray = Object.entries(clientMetadata);
clientMetadataArray.forEach(([route, metadata]) => {
  app.get(route, withSSR({ metadata }));
});

app.use(express.static(path.join(__dirname, "dist")));

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  return res.status(err.status || 500).json({
    message: err.message,
  });
});

//404
app.use(withSSR({ metadata: clientMetadata[""] }));

module.exports = app;
