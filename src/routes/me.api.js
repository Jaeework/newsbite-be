const express = require("express");
const router = express.Router();
const userNewsController = require("../controllers/userNews.controller");
const authMiddleware  = require("../middlewares/auth.middleware");

router.post("/news", authMiddleware, userNewsController.createUserNews);
router.delete("/news/:id", authMiddleware, userNewsController.deleteUserNews);
router.get("/news", authMiddleware, userNewsController.getUserNewsList);
router.post("/news/:id/hide", authMiddleware, userNewsController.hideUserNews);

module.exports = router;
