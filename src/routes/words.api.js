const express = require("express");
const router = express.Router();

const userWordsController = require("../controllers/userWords.controller");

router.use((req, res, next) => {
  req.userId = "680000000000000000000100";
  next();
});

// 단어 저장
router.post("/", userWordsController.createMyWord);

// 단어장 조회
router.get("/", userWordsController.getMyWords);

// 상태 수정
router.put("/:userWordId", userWordsController.updateMyWord);

// 단어 삭제
router.delete("/:userWordId", userWordsController.deleteMyWord);

//csv 다운로드
router.get("/export", userWordsController.exportMyWordsCSV);

module.exports = router;
