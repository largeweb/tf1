<script>
  import { onMount } from "svelte";

  let searchQuery = "";
  let leftData = [
    "Left Item 1",
    "Left Item 2",
    "Left Item 3",
    "Left Item 4",
    "Left Item 5",
    "Left Item 6",
    "Left Item 7",
    "Left Item 8",
  ];
  let rightData = "Your LLM response goes here";

  let jsonData = null;

  let buttonLoading = {
    view: false,
    details: false,
    scrape: false,
    embed: false,
    search: false,
  };

  async function processData(button, url) {
    buttonLoading[button] = true;
    const response = await fetchData(url);
    jsonData = response;
    buttonLoading[button] = false;
  }

  async function fetchData(url) {
    const response = await fetch(url);
    return await response.json();
  }

  function viewData() {
    processData("view", "http://localhost:3000/view_data");
  }

  function fetchDetails() {
    processData("details", "http://localhost:3000/fetch_details");
  }

  function scrapeData() {
    processData("scrape", "http://localhost:3000/scrape_data");
  }

  async function embedData() {
    buttonLoading.embed = true;
    await fetchData("http://localhost:3000/embed_data");
    buttonLoading.embed = false;
  }

  async function search() {
    buttonLoading.search = true;
    const link = `http://localhost:3000/search?q=${encodeURIComponent(
      searchQuery
    )}`;
    const response = await fetchData(link);
    leftData = response.searchResults;
    rightData = response.llmResponse;
    buttonLoading.search = false;
  }

  onMount(async () => {
    // turning it off for now
    // await viewData();
  });
</script>

<main>
  <h1>ToolFinder Application</h1>
  <button on:click={viewData} disabled={buttonLoading.view}>
    {buttonLoading.view ? "Loading..." : "View Data"}
  </button>
  <button on:click={fetchDetails} disabled={buttonLoading.details}>
    {buttonLoading.details ? "Loading..." : "Fetch Details"}
  </button>
  <button on:click={scrapeData} disabled={buttonLoading.scrape}>
    {buttonLoading.scrape ? "Loading..." : "Scrape Data"}
  </button>
  <button on:click={embedData} disabled={buttonLoading.embed}>
    {buttonLoading.embed ? "Loading..." : "Embed Data"}
  </button>

  <!-- JSON viewer -->
  {#if jsonData}
    <div class="json-viewer">
      {@html JSON.stringify(jsonData, null, 2)
        .replace(/\\n|\\t/g, "")
        .replace(/\\(\")/g, '"')
        .replace(/&quot;/g, '"')
        .replace(/\\u003c/g, "<")
        .replace(/\\u003e/g, ">")
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, "&quot;")}
    </div>
  {/if}

  <!-- <div>
    <input type="text" bind:value={searchQuery} placeholder="Search..." />
    <button on:click={search}>Search</button>
  </div> -->
  <div>
    <input type="text" bind:value={searchQuery} placeholder="Search..." />
    <button on:click={search} disabled={buttonLoading.search}>
      {buttonLoading.search ? "Loading..." : "Search"}
    </button>
  </div>

  <div style="display:flex; justify-content: space-around; margin-top: 20px">
    <div>
      <h2>Embedding Search Results</h2>
      {#each leftData as item}
        <p>{item}</p>
      {/each}
    </div>
    <div>
      <h2>LLM Response</h2>
      <!-- <p>{rightData}</p> -->
      <p>{rightData}</p>
    </div>
  </div>
</main>

<style>
  .json-viewer {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 10px;
    white-space: pre;
    font-family: monospace;
    overflow-x: auto;
  }
</style>
