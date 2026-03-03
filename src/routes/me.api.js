const express = require("express");
const router = express.Router();
const userNewsController = require("../controllers/userNews.controller");

router.post("/news", userNewsController.createUserNews);
router.delete("/news/:id", userNewsController.deleteUserNews);
router.get("/news", userNewsController.getUserNewsList);
router.post("/news/:id/hide", userNewsController.hideUserNews);

module.exports = router;
