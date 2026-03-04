const express = require("express");
const router = express.Router();

const authMiddleware  = require("../middlewares/auth.middleware");  // 요청이 들어오면 JWT 토큰 검사해서 통과/실패를 결정하는 “인증 미들웨어”
const userController = require("../controllers/user.controller");    // "내 정보 조회” 같은 실제 로직 수행

router.get("/", authMiddleware, userController.getMe);  // authMiddleware: 이 라우트는 로그인한 사용자만 접근 가능하게 하려고 미들웨어를 끼운 것
                                                       // userController.getMe: 인증이 성공한 다음에만 실행되는 최종 컨트롤러 함수, req.userId를 이용해 DB에서 사용자 정보를 찾고 응답

module.exports = router;


/*
[실행 흐름(순서)]

GET /api/me 요청
  → authMiddleware 실행
      → 성공이면 next()
          → userController.getMe 실행
      → 실패면 401 응답하고 끝
*/
