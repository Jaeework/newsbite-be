const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// 회원가입 API 라우팅
router.post("/signup", authController.signup);

// 로그인 API 라우팅
router.post("/signin", authController.signin);
router.post("/signout", authController.signout);

// 구글 로그인
router.post("/google", authController.googleSignin);
router.post("/refresh", authController.refresh);

module.exports = router;
