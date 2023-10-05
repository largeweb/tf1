// const fs = require("fs");
// const path = require("path");

// // const data = require("../data/collected.json");
// // use path.join to make sure we are using the correct path
// const collected_path = path.join(__dirname, "../../data/collected.json");
// const data = require(collected_path);
// // console.log(data);

// // lets make a function that takes in a category and returns the number of entries in that category
// const countEntriesInCategory = (category) => {
//   return data.filter((link) => link.tldr_category === category).length;
// };

// // lets make a function that takes in a category and returns the number of embedded entries in that category
// const countEmbeddedEntriesInCategory = (category) => {
//   return data.filter(
//     (link) => link.tldr_category === category && link.embedded === true
//   ).length;
// };

// // lets make a function that takes in a category and returns the percentage of embedded entries in that category
// const percentageEmbeddedEntriesInCategory = (category) => {
//   return (
//     (countEmbeddedEntriesInCategory(category) /
//       countEntriesInCategory(category)) *
//     100
//   );
// };

// // lets make a function that returns the total number of entries
// const countTotalEntries = () => {
//   return data.length;
// };

// // lets make a function that returns the total number of embedded entries
// const countTotalEmbeddedEntries = () => {
//   return data.filter((link) => link.embedded === true).length;
// };

// // lets make a function that returns the percentage of embedded entries
// const percentageTotalEmbeddedEntries = () => {
//   return (countTotalEmbeddedEntries() / countTotalEntries()) * 100;
// };

// // lets make a function that returns the date that collected.json was last modified
// const lastModified = () => {
//   return fs.statSync(collected_path).mtime;
// };

// // lets make a function that returns all the different categories in collected.json
// const categories = () => {
//   return [...new Set(data.map((link) => link.tldr_category))];
// };

// // console.log("Total Entries: ", countTotalEntries());
// // console.log("Total Embedded Entries: ", countTotalEmbeddedEntries());
// // console.log("Percentage Embedded Entries: ", percentageTotalEmbeddedEntries());
// // console.log("Last Modified: ", lastModified());
// // console.log("Categories: ", categories());
// // categories().forEach((category) => {
// //   console.log("Category: ", category);
// //   console.log("Entries in Category: ", countEntriesInCategory(category));
// //   console.log(
// //     "Embedded Entries in Category: ",
// //     countEmbeddedEntriesInCategory(category)
// //   );
// //   console.log(
// //     "Percentage Embedded Entries in Category: ",
// //     percentageEmbeddedEntriesInCategory(category)
// //   );
// // });

// console.log(
//   JSON.stringify(
//     {
//       total_entries: countTotalEntries(),
//       total_embedded_entries: countTotalEmbeddedEntries(),
//       percentage_embedded_entries: percentageTotalEmbeddedEntries(),
//       last_modified: lastModified(),
//       categories: categories().map((category) => {
//         return {
//           category: category,
//           entries_in_category: countEntriesInCategory(category),
//           embedded_entries_in_category:
//             countEmbeddedEntriesInCategory(category),
//           percentage_embedded_entries_in_category:
//             percentageEmbeddedEntriesInCategory(category),
//         };
//       }),
//     },
//     null,
//     2
//   )
// );

// the script above will find details about the collected.json file
// we need a new script that simply prints out the entire collected.json file in json format
const fs = require("fs");
const path = require("path");

const collected_path = path.join(__dirname, "../../data/collected.json");
const data = require(collected_path);

// lets make a function that simply prints out the entire collected.json file in json format
const printCollected = () => {
  console.log(JSON.stringify(data));
};

// await printCollected();
(async () => {
  await printCollected();
})();
