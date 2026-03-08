const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const userController = {};

// GET  /api/user/me  (“로그인한 내 정보 조회” API)
userController.getUserById = async(req, res, next)=>{
    
    // DB 조회 중 오류(연결 문제, 잘못된 id 등)
    try {
        // req.userId: 로그인 토큰(JWT)을 검증하는 미들웨어에서 넣어둔 값, 즉 현재 로그인한 사용자 id
        const user = await User.findById(req.userId); // password 필드는 빼고 가져오기


        // 404: 리소스 없음 (유저 없음)
        if (!user) return next(new ApiError("User not found", 404, false));

        return res.status(200).json({ success: true, data: user });           
    } catch(error){     //   DB에러, mongoose 내부 오류, 기타 예외
      return next(error);  // 서버 쪽 문제
    }
};


// PUT /api/user/me (내정보 수정)
userController.updateUser = async (req, res, next) => {
  try {
    const { nickname, level, password } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return next(new ApiError("User not found", 404, false));
    }

    if (nickname !== undefined) user.nickname = nickname;
    if (level !== undefined) user.level = level;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    return next(error);
  }
};


// DELETE /api/user/me (회원탈퇴는 DB 삭제보다 del_flag=true로 “탈퇴 처리”)
userController.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return next(new ApiError("User not found", 404, false));
    }

    user.del_flag = true;
    await user.save();

    return res.status(200).json({
      success: true,
      data: null
    });

  } catch (error) {
    return next(error);
  }
};

module.exports = userController;
