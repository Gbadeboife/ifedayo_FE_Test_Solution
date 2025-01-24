const path = require("path");
const fs = require("fs");

const DEFAULT_OPTIONS = {
  withSSR: { metadata: { title: "", description: "" } },
};

module.exports = {
  withSSR(options = DEFAULT_OPTIONS.withSSR) {
    options = { ...DEFAULT_OPTIONS.withSSR, ...options };

    return async function (_, res, next) {
      try {
        const file = fs.readFileSync(
          path.join(__dirname, "dist", "index.html"),
          "utf-8"
        );

        if (!file) {
          return next();
        }

        const title = options.metadata?.title;
        const description = options.metadata?.description;
        const version = options.version ?? "1.0.0";
        console.log(options);
        const final = file
          ?.replace(new RegExp("{{{title}}}", "g"), title)
          ?.replace(new RegExp("{{{description}}}", "g"), description);
        // ?.replace("__BUILDNUMBER__", version);

        return res.status(200).send(final);
      } catch (error) {
        if (process.env.DEBUG === "TRUE") {
          console.log("React SSR Error", error, __filename);
        }
        return next();
      }
    };
  },
};
