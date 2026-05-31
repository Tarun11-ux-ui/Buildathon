const express = require("express");
const router = express.Router();

const { searchProperties } = require("../services/propertyServices");

router.get("/", async (req, res) => {
  try {
    const query = req.query;

    const listings = await searchProperties(query);

    res.json({ data: listings });
  } catch (err) {
    console.error(err);

    const isTimeout = /timed out waiting for anakin/i.test(err.message);
    const status = isTimeout ? 504 : 500;

    res.status(status).json({
      error: err.message,
    });
  }
});

module.exports = router;
