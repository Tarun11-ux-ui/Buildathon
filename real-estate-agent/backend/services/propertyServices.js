const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../..", ".env") });

const ANAKIN_BASE_URL = "https://api.anakin.io";
const TASK_URL = `${ANAKIN_BASE_URL}/v1/wire/task`;
const ACTION_ID = "zl_search_listings";
const DEFAULT_REGION_TYPE = 7;
const DEFAULT_STATUS = "ForSale";
const MAX_POLL_ATTEMPTS = 300;
const POLL_INTERVAL_MS = 2000;
const CACHE_TTL_MS = 2 * 60 * 1000;

const searchCache = new Map();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCacheKey(query) {
  return JSON.stringify(query || {});
}

function getCacheEntry(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }
  return entry;
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Anakin returned invalid JSON: ${text}`);
  }
}

function buildParams(query) {
  const params = {
    region_id: query.regionId || "10001",
    region_type: query.regionType
      ? Number(query.regionType)
      : DEFAULT_REGION_TYPE,
    status: query.status || DEFAULT_STATUS,
  };

  if (query.minPrice) params.min_price = Number(query.minPrice);
  if (query.maxPrice) params.max_price = Number(query.maxPrice);
  if (query.beds) params.beds = Number(query.beds);
  if (query.baths) params.baths = Number(query.baths);

  return params;
}

async function pollAnakinJob(pollUrl, apiKey) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const url = `${ANAKIN_BASE_URL}${pollUrl}`;
    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
    });
    const result = await readJson(response);

    const retryDelay = Number(result.retry_after_ms) || POLL_INTERVAL_MS;
    console.log(
      `Anakin poll attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS} - status=${response.status} retry_after_ms=${retryDelay}`,
      { pollUrl: url, body: result },
    );

    if (!response.ok) {
      throw new Error(
        `Anakin poll failed with ${response.status}: ${JSON.stringify(result)}`,
      );
    }

    if (result.status === "completed") {
      return result;
    }

    if (result.status === "failed" || result.status === "error") {
      throw new Error(`Anakin job failed: ${JSON.stringify(result)}`);
    }

    await wait(retryDelay);
  }

  throw new Error(
    `Timed out waiting for Anakin Zillow listings after ${MAX_POLL_ATTEMPTS} attempts.`,
  );
}

async function searchProperties(query = {}) {
  const apiKey = process.env.ANAKIN_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANAKIN_API_KEY in D:\\Buildathon\\.env");
  }

  const cacheKey = getCacheKey(query);
  const cached = getCacheEntry(cacheKey);

  if (cached) {
    if (cached.promise) {
      console.log(`Reusing pending Anakin request for ${cacheKey}`);
      return cached.promise;
    }

    console.log(`Returning cached Anakin result for ${cacheKey}`);
    return cached.data;
  }

  const payload = {
    action_id: ACTION_ID,
    params: buildParams(query),
  };

  const taskPromise = (async () => {
    const response = await fetch(TASK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });
    const task = await readJson(response);

    console.log("Anakin task created", {
      request: payload,
      status: response.status,
      body: task,
    });

    if (!response.ok) {
      throw new Error(
        `Anakin task failed with ${response.status}: ${JSON.stringify(task)}`,
      );
    }

    if (task.status !== "completed" && !task.poll_url) {
      throw new Error(
        `Anakin task did not provide poll_url: ${JSON.stringify(task)}`,
      );
    }

    const result =
      task.status === "completed"
        ? task
        : await pollAnakinJob(task.poll_url, apiKey);

    if (!result?.data?.data?.listings) {
      throw new Error(
        `Anakin response missing listings: ${JSON.stringify(result)}`,
      );
    }

    return result.data.data.listings;
  })();

  searchCache.set(cacheKey, {
    promise: taskPromise,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  try {
    const listings = await taskPromise;
    searchCache.set(cacheKey, {
      data: listings,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return listings;
  } catch (error) {
    searchCache.delete(cacheKey);
    throw error;
  }
}

module.exports = {
  searchProperties,
};
