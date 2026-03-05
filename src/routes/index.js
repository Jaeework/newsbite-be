const express = require("express");
const router = express.Router();

const authApi = require("./auth.api");
const meApi = require("./me.api");
const newsApi = require("./news.api");

router.use("/auth", authApi);
router.use("/me", meApi);
router.use("/news", newsApi);

module.exports = router;