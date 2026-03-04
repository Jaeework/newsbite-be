const express = require("express");
const router = express.Router();
const meApi = require("./me.api");

router.use("/me", meApi);

module.exports = router;
