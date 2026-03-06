const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");
const userWordsController = require("../controllers/userWords.controller");
const userNewsController = require("../controllers/userNews.controller");

router.get("/me", authMiddleware, userController.getMe); 
router.put("/me", authMiddleware, userController.updateMe);
router.delete("/me", authMiddleware, userController.deleteMe);
router.post("/news/:id", authMiddleware, userNewsController.createUserNews);
router.delete("/news/:id", authMiddleware, userNewsController.deleteUserNews);
router.get("/news", authMiddleware, userNewsController.getUserNewsList);
router.put("/news/:id/hide", authMiddleware, userNewsController.hideUserNews);
router.post("/words/:wordId", authMiddleware, userWordsController.createMyWord);
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
