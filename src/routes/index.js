const express = require("express");
const router = express.Router();
const meApi = require("./me.api");

router.use("/me", meApi);

const authApi = require("./auth.api");
const userApi = require("./user.api");

router.use("/auth", authApi);
router.use("/me", userApi);

module.exports = router;
