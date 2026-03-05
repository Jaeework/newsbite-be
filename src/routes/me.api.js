const express = require("express");
const router = express.Router();
const userWordsController = require("../controllers/userWords.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/words", authMiddleware, userWordsController.createMyWord);
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
