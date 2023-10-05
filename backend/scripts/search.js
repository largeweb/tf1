const axios = require("axios");
const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

require("dotenv").config();

// console.log(process.env.PINECONE_API_KEY);

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: "us-west4-gcp-free",
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const indexName = "tldr-summaries";
const MODEL = "text-embedding-ada-002";
const modelDimension = 1536;

(async () => {
  const pineconeIndexes = await pinecone.listIndexes();
  if (!pineconeIndexes.find((index) => index.name === indexName)) {
    console.log(`There is no index named ${indexName}. Creating one...`);
    await pinecone.createIndex({
      name: indexName,
      dimension: modelDimension,
    });
  } else {
    console.log(`Found index ${indexName}.`);
  }
})();

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
    embeddings.push(response.data);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  //   console.log(embeddings);
  //   console.log(JSON.stringify(embeddings));
  // return embeddings[0].data[0].embedding;
  // return it only if it's not undefined
  if (embeddings[0] !== undefined) {
    return embeddings[0].data[0].embedding;
  }
  return [];
}

// (async () => {
//   const index = pinecone.index(indexName);
//   const ids = Object.keys(summaryMapping);
//
//   let count = 0;
//   for (const id of ids) {
//   for (const id of ids.slice(2013)) {
// const summary = summaryMapping[id];
// const embeddings = await createEmbeddings([summary]);
// console.log("WE ARE HERE5");
// await index.upsert([{ id, values: embeddings }]);
// console.log(`Inserted ${count} / ${ids.length} summaries.`);
// count++;
//   }
//   console.log("Done inserting summaries.");
// })();

async function search(query) {
  console.log(`Searching for ${query}...`);
  const index = pinecone.index(indexName);
  console.log(`Index: ${index}`);
  const embeddings = await createEmbeddings([query]);
  console.log(`Embeddings: ${embeddings}`);
  const searchEmbedding = embeddings;
  console.log(`Search Embedding: ${searchEmbedding}`);
  const res = await index.query(
    { topK: 10, vector: searchEmbedding },
    10,
    true
  );
  return res.matches;
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

  //   console.log(chat.data);
  // read the JSON in a good way to see the entire tree
  //   console.log(JSON.stringify(chat, null, 2));
  const response = chat.choices[0].message.content;
  console.log(response);
  return response;
};

// (async () => {
//   //   const query =
//   //     "What was the cause of the major recession in the early 20th century?";
//   const query = process.argv.slice(2).join(" ");
//   const results = await search(query);

//   console.log(`Results for query: ${query}`);

//   const results_string = JSON.stringify(results);

//   const matches = [];

//   for (const match of results) {
//     console.log(`${match.score.toFixed(2)}: ${summaryMapping[match.id]}`);
//     matches.push(summaryMapping[match.id]);
//   }

//   const user_query = query;
//   const matches_string = matches.join("\n");
//   const llm_response = await generate_llm_response(user_query, matches_string);
//   console.log(llm_response);
// })();

module.exports = {
  search,
  generate_llm_response,
};
