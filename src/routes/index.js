const express = require("express");
const router = express.Router();
const newsApi = require("./news.api");

router.use("/news", newsApi);

module.exports = router;
