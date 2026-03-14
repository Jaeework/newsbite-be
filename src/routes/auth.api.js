const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// 회원가입 API 라우팅
router.post("/signup", authController.signup);

// 로그인 API 라우팅
router.post("/signin", authController.signin);
router.post("/signout", authController.signout);
router.post("/refresh", authController.refresh);
router.get("/check-email", authController.checkDuplicateEmail);
router.get("/verify-email", authController.verifyEmail);

// 구글 로그인
router.post("/google", authController.googleSignin);

module.exports = router;
