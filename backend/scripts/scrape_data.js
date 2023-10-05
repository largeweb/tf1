const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const fetched_pairs_path = path.join(
  __dirname,
  "../../data/fetched_pairs.json"
);
const final_links_dictionary_path = path.join(
  __dirname,
  "../../data/collected.json"
);

const categories = [
  "tech",
  "changeset",
  "crypto",
  "ai",
  "infosec",
  "webdev",
  "design",
  "product",
  "marketing",
  "founders",
  "mobile_dev",
  "devops",
  "sales",
  "people",
  "health",
  "education",
  "retail",
  "finance",
  "climate",
  "it",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchArchives = async (category) => {
  try {
    const url = `https://tldr.tech/${category}/archives`;
    console.log(`Fetching ${url}...`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const links = [];

    $(`a[href^='/${category}/']`).each(function () {
      try {
        console.log(`Fetching ${category} and ${$(this).attr("href")}...`);
        const linkUrl = "https://tldr.tech" + $(this).attr("href");
        const linkSubject = $(this).text();
        links.push({ url: linkUrl, subject: linkSubject });
      } catch (error) {
        console.error(`Category is empty.`);
      }
    });

    return { category, links };
  } catch (error) {
    // console.error("fetchArchives error: ", error.message);
    // say not found
    console.error(`Category Archives is not found.`);
  }
};

const fetchContent = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const data = [];

    $("div.mt-3").each(function () {
      const title = $(this).children("a").children("h3").text();
      const summary = $(this).children("div").text();
      const link = $(this).children("a").attr("href");
      data.push({ url: link, title: title, summary: summary });
    });

    return data;
  } catch (error) {
    console.error("fetchContent error: ", error.message);
  }
};

const fetchAllCategories = async () => {
  try {
    console.log("Fetching all categories...");
    const initialScrapeCollection = {};

    for (const category of categories) {
      try {
        console.log(`Fetching ${category}...`);
        const { category: cat, links } = await fetchArchives(category);
        initialScrapeCollection[cat] = links;
        await wait(200);
      } catch (error) {
        console.error("Category is empty.");
      }
    }

    return initialScrapeCollection;
  } catch (error) {
    console.error("fetchAllCategories error: ", error.message);
  }
};

async function getCategoryDatePairs(initialScrapeCollection) {
  const pairs = new Set([]);
  for (const category in initialScrapeCollection) {
    const reportLinks = initialScrapeCollection[category];
    for (const reportLink of reportLinks) {
      const tldrReportDate = reportLink.url.split("/").pop();
      pairs.add(`${category},${tldrReportDate}`);
    }
  }
  return pairs;
}

async function loadFetchedPairs() {
  if (fs.existsSync(fetched_pairs_path)) {
    const fetched_pairs = JSON.parse(
      fs.readFileSync(fetched_pairs_path, "utf-8")
    );
    return new Set(fetched_pairs);
  } else {
    const emptySet = new Set([]);
    fs.writeFileSync(fetched_pairs_path, JSON.stringify([...emptySet]));
    return emptySet;
  }
}

async function saveInFetchedPairs(pair) {
  const pairs = await loadFetchedPairs();
  pairs.add(pair);
  fs.writeFileSync(fetched_pairs_path, JSON.stringify([...pairs]));
}

async function loadFinalLinksDictionary() {
  if (fs.existsSync(final_links_dictionary_path)) {
    console.log("Loading final_links_dictionary.json...");
    const finalLinks = JSON.parse(
      fs.readFileSync(final_links_dictionary_path, "utf-8")
    );
    return finalLinks;
  } else {
    return { links: [] };
  }
}

async function appendToFinalLinksDictionary(newLinks) {
  const finalLinks = await loadFinalLinksDictionary();
  console.log("Appending to final_links_dictionary.json...");
  // print first 100 characters of finalLinks
  console.log(JSON.stringify(finalLinks, null, 2).slice(0, 100));
  finalLinks.push(...newLinks);
  fs.writeFileSync(
    final_links_dictionary_path,
    JSON.stringify(finalLinks, null, 2)
  );
}

const processInitialScrapeCollection = async (initialScrapeCollection) => {
  const fetchedPairs = await loadFetchedPairs();
  for (const category in initialScrapeCollection) {
    const reportLinks = initialScrapeCollection[category];
    for (const reportLink of reportLinks) {
      const tldrReportDate = reportLink.url.split("/").pop();
      const pair = `${category},${tldrReportDate}`;

      if (!fetchedPairs.has(pair)) {
        await wait(200);
        const articles = await fetchContent(reportLink.url);
        const tldrCategory = category;
        const tldrReportUrl = reportLink.url;
        const tldrReportSubject = reportLink.subject;
        const newLinks = [];

        for (const article of articles) {
          newLinks.push({
            tldr_category: tldrCategory,
            tldr_report_date: tldrReportDate,
            tldr_report_url: tldrReportUrl,
            tldr_report_subject: tldrReportSubject,
            tldr_report_link_title: article.title,
            tldr_report_link_summary: article.summary,
            url: article.url,
            embedded: false,
          });
          console.log(article.url);
        }
        await appendToFinalLinksDictionary(newLinks);
        await saveInFetchedPairs(pair);
      }
    }
  }
  console.log("Done processing initial scrape collection.");
};

fetchAllCategories()
  .then(processInitialScrapeCollection)
  .catch((error) => {
    console.error("Error during processing: ", error.message);
  });
