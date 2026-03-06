const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// 회원가입 API 라우팅
router.post("/signup", authController.signup);

// 로그인 API 라우팅
router.post("/signin", authController.signin);

// 구글 로그인
router.post("/google", authController.googleSignin);

// 로그아웃 API 라우팅
router.post("/signout", authMiddleware, authController.signout);



module.exports = router;
