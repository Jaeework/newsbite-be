const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// 회원가입 API 라우팅
router.post("/signup", authController.signup);

// 로그인 API 라우팅
router.post("/signin", authController.signin);

module.exports = router;