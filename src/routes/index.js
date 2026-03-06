const express = require("express");
const router = express.Router();

const authApi = require("./auth.api");
const userApi = require("./user.api");
const newsApi = require("./news.api");

router.use("/auth", authApi);
router.use("/user", userApi);
router.use("/news", newsApi);

module.exports = router;