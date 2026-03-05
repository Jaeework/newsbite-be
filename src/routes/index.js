const express = require("express");
const router = express.Router();
const newsApi = require("./news.api");
const authApi = require("./auth.api");
const userApi = require("./user.api");

router.use("/news", newsApi);
router.use("/auth", authApi);
router.use("/me", userApi);

module.exports = router;
