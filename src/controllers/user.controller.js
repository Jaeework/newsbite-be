// 전제: 이 API는 auth 미들웨어를 거쳐서 req.userId가 이미 세팅된 상태

const User = require("../models/User");  // User Mongoose 모델을 가져오기
const ApiError = require("../utils/ApiError");

// GET  /api/me  (“로그인한 내 정보 조회” API)
exports.getMe = async(req, res, next)=>{
    
    // DB 조회 중 오류(연결 문제, 잘못된 id 등)
    try{
        // req.userId: 로그인 토큰(JWT)을 검증하는 미들웨어에서 넣어둔 값, 즉 현재 로그인한 사용자 id
        const user = await User.findById(req.userId).select("-password"); // password 필드는 빼고 가져오기


        // 404: 리소스 없음 (유저 없음)
        if (!user) {
            return next(new ApiError(404, "User not found"));
        }
        return res.status(200).json({
            success: true,
            data: user,
        });
            
    }catch(error){     //   DB에러, mongoose 내부 오류, 기타 예외
        return next(error);  // 서버 쪽 문제
    }
};