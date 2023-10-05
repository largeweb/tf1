const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAI } = require("openai");
require("dotenv").config();
// ...
// The rest of your code including createEmbeddings, search, and generate_llm_response functions
// ...

const openaiApiKey = process.env.OPENAI_API_KEY;
const MODEL = "text-embedding-ada-002";

async function createEmbeddings(queries) {
  console.log(queries);
  const headers = { Authorization: `Bearer ${openaiApiKey}` };
  const embeddings = [];
  for (const query of queries) {
    if (query === "") continue;
    if (query === undefined) continue;
    const data = { model: MODEL, input: query };
    const axiosConfig = { headers };
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      data,
      axiosConfig
    );
    // console.log(response.data);
    console.log("WE ARE HERE");
    embeddings.push(response.data);
    // console.log("WE ARE HERE");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log(`Embeddings: ${embeddings}`);
  console.log(embeddings);
  if (embeddings.length === 0) {
    return [];
  }

  return embeddings[0].data[0].embedding;
}

const generate_llm_response = async (user_query, matches_string) => {
  const llm_model = "gpt-3.5-turbo-0301";
  const llm_max_tokens = 256;
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. Given the retrieved text, you must generate a response to the user's query that is relevant and helpful.",
    },
    {
      role: "user",
      content: `The user's query is: ${user_query}\n\nThe retrieved text is:\n${matches_string}\n\nPlease generate a response to the user's query that is relevant only to the retrieved text and is helpful. Do not generate any information that is irrelevant, unless specified directly by the user's query.`,
    },
  ];
  console.log(messages);
  const chat = await openai.chat.completions.create({
    model: llm_model,
    temperature: 0.9,
    max_tokens: llm_max_tokens,
    messages: messages,
  });

  const response = chat.choices[0].message.content;
  return response;
};

async function search(query) {
  const index = pinecone.index(indexName);
  const embeddings = await createEmbeddings([query]);
  const searchEmbedding = embeddings;
  const res = await index.query(
    { topK: 10, vector: searchEmbedding },
    10,
    true
  );
  return res.matches;
}

// for now just console log a JSON string saying "TO BE IMPLEMENTED"
// console.log(JSON.stringify("TO BE IMPLEMENTED"));

/* Update these paths for the local file system if required */
const summaryMappingPath = path.join(
  __dirname,
  "../../data/summary_mapping.json"
);
const urlMappingPath = path.join(__dirname, "../../data/url_mapping.json");
const collectedDataPath = path.join(__dirname, "../../data/collected.json");

(async () => {
  const collectedData = JSON.parse(fs.readFileSync(collectedDataPath));
  const summaryMapping = JSON.parse(fs.readFileSync(summaryMappingPath));
  const urlMapping = JSON.parse(fs.readFileSync(urlMappingPath));

  for (let link of collectedData) {
    if (!link.embedded) {
      console.log(`Embedding ${link.tldr_report_link_summary}`);
      const embeddings = await createEmbeddings([
        link.tldr_report_link_summary,
      ]);
      console.log("WE ARE HERE5");

      link.embedded = true;
      fs.writeFileSync(
        collectedDataPath,
        JSON.stringify(collectedData, null, 2)
      );
    } else {
      console.log(`Skipping ${link.tldr_report_link_summary}`);
    }
  }
})();
