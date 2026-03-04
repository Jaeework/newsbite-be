const express = require("express");
const router = express.Router();
const userWordsController = require("../controllers/userWords.controller");

router.post("/words", userWordsController.createMyWord);
router.get("/words/export", userWordsController.exportMyWordsCSV);
router.get("/words", userWordsController.getMyWords);
router.put("/words/:userWordId", userWordsController.updateMyWord);
router.delete("/words/:userWordId", userWordsController.deleteMyWord);

module.exports = router;
