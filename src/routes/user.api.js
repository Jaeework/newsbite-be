const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");
const userWordsController = require("../controllers/userWords.controller");
const userNewsController = require("../controllers/userNews.controller");

// user
router.get("/me", authMiddleware, userController.getUserById);
router.put("/me", authMiddleware, userController.updateUser);
router.delete("/me", authMiddleware, userController.deleteUser);

// userNews
router.post("/news/:id", authMiddleware, userNewsController.createUserNews);
router.delete("/news/:id", authMiddleware, userNewsController.deleteUserNews);
router.get("/news", authMiddleware, userNewsController.getUserNewsList);
router.put("/news/:id/hide", authMiddleware, userNewsController.hideUserNews);

// userWords
router.post("/words", authMiddleware, userWordsController.createMyWords);
router.get(
  "/words/export",
  authMiddleware,
  userWordsController.exportMyWordsCSV
);
router.get("/words", authMiddleware, userWordsController.getMyWords);
router.put(
  "/words/:userWordId",
  authMiddleware,
  userWordsController.updateMyWord
);
router.delete(
  "/words/:userWordId",
  authMiddleware,
  userWordsController.deleteMyWord
);

module.exports = router;
