require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

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

    if (result.status === "completed") return result;
    if (result.status === "failed") throw new Error(JSON.stringify(result));

    console.log("Status:", result.status);
  }
}
app.get("/run", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(400).json({ error: "Missing API key" });
    }

    const job = await createListingsJob();

    if (!job.poll_url) {
      return res.status(500).json({ error: "No poll_url returned", job });
    }

    const result = await pollJob(job.poll_url);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
app.get("/run", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(400).json({ error: "Missing API key" });
    }

    const job = await createListingsJob();

    if (!job.poll_url) {
      return res.status(500).json({ error: "No poll_url returned", job });
    }

    const result = await pollJob(job.poll_url);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
