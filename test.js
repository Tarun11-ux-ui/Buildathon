require("dotenv").config();

const API_KEY = process.env.ANAKIN_API_KEY;
const BASE_URL = "https://api.anakin.io";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createListingsJob() {
  const response = await fetch(`${BASE_URL}/v1/wire/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      action_id: "zl_search_listings",
      params: {
        region_id: "10221",
        region_type: 7,
        status: "ForSale",
        min_price: 0,
        max_price: 800000,
        beds: 3,
        baths: 2,
      },
    }),
  });

  return await response.json();
}

async function pollJob(pollUrl) {
  while (true) {
    await sleep(3000);

    const response = await fetch(`${BASE_URL}${pollUrl}`, {
      headers: {
        "X-API-Key": API_KEY,
      },
    });

    const result = await response.json();

    console.log("Status:", result.status);

    if (result.status === "completed") {
      return result;
    }

    if (result.status === "failed") {
      throw new Error(JSON.stringify(result, null, 2));
    }
  }
}

async function main() {
  try {
    if (!API_KEY) {
      console.log("ANAKIN_API_KEY not found in .env");
      return;
    }

    console.log("Creating Zillow listings job...");

    const job = await createListingsJob();

    console.log("Job Response:");

    console.log(JSON.stringify(job, null, 2));

    if (!job.poll_url) {
      console.log("No poll_url returned.");

      console.log("Request probably failed.");

      return;
    }

    console.log("\nPolling job...\n");

    const finalResult = await pollJob(job.poll_url);

    console.log("\n=== FINAL RESULT ===\n");

    console.log(JSON.stringify(finalResult, null, 2));
  } catch (error) {
    console.error("\nERROR:\n");

    console.error(error);
  }
}

main();
