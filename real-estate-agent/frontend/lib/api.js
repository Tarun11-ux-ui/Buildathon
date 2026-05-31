export async function getProperties(options = {}) {
  const {
    regionId = "10221",
    status = "ForSale",
    minPrice = "",
    maxPrice = "",
    beds = "",
    baths = "",
  } = typeof options === "string" ? { regionId: options } : options;

  try {
    const params = new URLSearchParams({
      regionId,
      status,
    });

    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (beds) params.set("beds", beds);
    if (baths) params.set("baths", baths);

    const url = `http://localhost:5000/api/properties?${params.toString()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const result = await response.json();
    const payload = result?.data ?? result;

    if (!response.ok) {
      throw new Error(
        result?.error || `HTTP ${response.status}: Failed to fetch properties`,
      );
    }

    if (!payload || payload.length === 0) {
      throw new Error("No properties found in this region. Try a different region ID.");
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Request timeout: the Anakin Zillow API is taking too long. Try a different region or run the search again.",
      );
    }
    if (error instanceof TypeError) {
      throw new Error(
        `Connection error: Cannot reach backend at http://localhost:5000. Make sure the backend server is running.`,
      );
    }
    throw error;
  }
}
