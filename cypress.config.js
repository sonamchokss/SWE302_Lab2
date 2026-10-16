const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

module.exports = defineConfig({
  e2e: {
    // Activity 1, step 2: the application URL (start it first with `npm start`)
    baseUrl: "http://localhost:3000",
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 5000,
    setupNodeEvents(on, config) {
      on("task", {
        // Removes one file from the downloads folder so a download test cannot pass on an old file.
        deleteDownload(fileName) {
          fs.rmSync(path.join(config.downloadsFolder, path.basename(fileName)), { force: true });
          return null;
        },
      });
    },
  },
});
