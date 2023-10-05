const express = require("express");
const cors = require("cors");
const { exec, execSync } = require("child_process");
const path = require("path");
const app = express();
const port = 3000;
const fs = require("fs");

const { search, generate_llm_response } = require(path.join(
  __dirname,
  "scripts/search.js"
));

const summary_mapping_path = path.join(
  __dirname,
  "../data/summary_mapping.json"
);

const summaryMapping = require(path.join(summary_mapping_path));

app.use(cors());

app.get("/view_data", (req, res) => {
  try {
    console.log("view_data");
    res.sendFile(path.join(__dirname, "../data/collected.json"));
  } catch (err) {
    console.log(err);
  }
});

app.get("/fetch_details", (req, res) => {
  try {
    console.log("fetch_details");
    const response = execSync("node scripts/fetch_details.js").toString();
    console.log(response);
    res.json(JSON.parse(response));
    console.log("fetch_details");
  } catch (err) {
    console.log(err);
  }
});

// app.get("/scrape_data", (req, res) => {
//   try {
//     console.log("scrape_data");
//     const response = execSync("node scripts/scrape_data.js").toString();
//     res.json(JSON.parse(response));
//   } catch (err) {
//     console.log(err);
//   }
// });

let isScraping = false; // Add a variable to track scraping status

app.get("/scrape_data", (req, res) => {
  try {
    console.log("scrape_data");
    if (isScraping) {
      // Scrape is already in progress
      res.json({ message: "There is already a Scrape in Progress" });
    } else {
      isScraping = true;
      const scrape = exec("node scripts/scrape_data.js");
      scrape.stdout.on("data", (data) => {
        console.log(data);
      });
      scrape.stderr.on("data", (data) => {
        console.log(data);
      });
      scrape.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
        isScraping = false; // Reset scraping status when process ends
      });
      res.json({ message: "Scrape Started" });
    }
  } catch (err) {
    console.log(err);
  }
});

let isEmbedding = false; // Add a variable to track embedding status

app.get("/embed_data", (req, res) => {
  try {
    console.log("embed_data");
    if (isEmbedding) {
      console.log(`There is already an Embedding in Progress`);
      res.json({ message: "There is already an Embedding in Progress" });
    } else {
      console.log(`Starting Embedding`);
      isEmbedding = true;
      res.json({ message: "Embedding Started" });
      const embed = exec("node scripts/embed_data.js");
      embed.stdout.on("data", (data) => {
        console.log(data);
      });
      embed.stderr.on("data", (data) => {
        console.log(data);
      });
      embed.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
        isEmbedding = false; // Reset embedding status when process ends
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// app.get("/search", (req, res) => {
//   try {
//     console.log("search");
//     // const response = execSync("node scripts/search.js").toString();
//     // the arguments to the search script are the search terms (passed in as a query string) like this:
//     //   `http://localhost:3000/search?q=${encodeURIComponent(searchQuery)}`
//     const searchQuery = req.query.q;
//     console.log({ searchQuery });
//     const response = execSync(
//       `node scripts/search.js ${searchQuery}`
//     ).toString();
//     res.json(JSON.parse(response));
//   } catch (err) {
//     console.log(err);
//   }
// });

app.get("/search", async (req, res) => {
  try {
    console.log("search");
    const searchQuery = req.query.q;
    console.log({ searchQuery });

    const searchResults = await search(searchQuery);
    const matches = searchResults.map((match) => summaryMapping[match.id]);

    const matches_string = matches.join("\n");
    console.log({ matches_string });
    const llm_response = await generate_llm_response(
      searchQuery,
      matches_string
    );
    console.log({ llm_response });

    res.json({ searchResults: matches, llmResponse: llm_response });
    // res.json({ searchResults, llm_response });
    // res.json({ test: "test" });
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`ToolFinder server listening at http://localhost:${port}`);
});
