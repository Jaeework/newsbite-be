const express = require("express");
const router = express.Router();
const newsController = require("../controllers/news.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// 뉴스 목록 조회 (전체 조회 및 단어 검색 검색 통합)
// 예시: GET /news  (전체 조회)
router.get("/", newsController.getAllNews);

// 뉴스 상세 조회
router.get("/:id", authMiddleware, newsController.getNewsById);

module.exports = router;
