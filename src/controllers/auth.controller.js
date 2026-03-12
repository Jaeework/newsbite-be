const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require("jsonwebtoken");
const validator = require("validator");

const authController = {};

// 회원가입 API: signup (중복 이메일 체크 → 비밀번호 해시 → 유저 저장 → JWT 발급 → token+user 응답)
// POST  /api/auth/signup
authController.signup = async (req, res, next) => {
  try {
    const { nickname, email, password, level } = req.body;

    if (!nickname || !email || !password || !level) {
      throw new ApiError("모든 필드를 입력해주세요.", 400, true);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError("이미 가입된 이메일입니다.", 400, true);
    }

    // 비밀번호 hash 로 변경, 암화화 강도(반복횟수) 10
    const hashed = await bcrypt.hash(password, 10);

    // DB에 새로운 유저를 저장  -> user._id 값이 생성됨
    const user = await User.create({
      nickname,
      email,
      password: hashed,
      level,
    });

    // 성공 응답 보내기, 201은 새 리소스 생성됨(회원 생성)
    return res.status(201).json({
      success: true,
      data: user,
    });

    // 서버 내부 오류(DB 연결 문제 등), 500은 서버 에러
  } catch (error) {
    return next(error);
  }
};

// 로그인 API: signin (이메일 유저 찾기 → 비밀번호 해시 비교 → JWT 발급 → token+user 응답)
// POST  /api/auth/signin
authController.signin = async (req, res, next) => {
  // 로그인 과정에서 에러 대비
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, del_flag: false }); // 탈퇴 유저 로그인 방지
    if (!user) {
      return next(
        new ApiError("이메일 또는 비밀번호를 확인하세요.", 400, true)
      );
    }

    // 사용자가 입력한 평문 password와 DB에 저장된 해시 user.password를 비교
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(
        new ApiError("이메일 또는 비밀번호를 확인하세요.", 400, true)
      );
    }

    // 로그인 성공했으면 토큰 발급
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 응답으로 token과 user 정보를 내려주기
    return res.status(200).json({
      success: true,
      data: {
        user,
        token: accessToken,
      },
    });
  } catch (error) {
    // 서버 에러 (500)
    return next(error);
  }
};

// Google 로그인 (ID Token Verify)
// POST /api/auth/google
authController.googleSignin = async (req, res, next) => {
  try {
    const idToken = req.body.idToken || req.body.credential;
    if (!idToken) {
      return next(new ApiError("idToken is required", 400, false));
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const nickname =
      payload?.name ||
      payload?.given_name ||
      (email ? email.split("@")[0] : "user");

    if (!email) {
      return next(new ApiError("Google 계정에 정보가 존재하지 않습니다.", 400, true));
    }

    // 탈퇴 유저는 막기
    let user = await User.findOne({ email });
    if (user?.del_flag) {
      return next(new ApiError("탈퇴 처리된 계정입니다.", 403, true));
    }

    // 없으면 자동 회원가입
    if (!user) {
      // 구글로그인은 password가 없으니 임시값 저장(로그인에는 사용 안 함)
      const tempPassword = await bcrypt.hash(`${email}:${Date.now()}`, 10);

      user = await User.create({
        nickname,
        email,
        password: tempPassword,
        level: "A2", // 기본값
      });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
        token: accessToken,
      },
    });
  } catch (error) {
    return next(error);
  }
};

authController.signout = async (req, res, next) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

authController.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return next(new ApiError("Refresh token not found", 401, false));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new ApiError("Invalid refresh token", 401, false));
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ success: true, data: {user: user, token: newAccessToken}});
  } catch(err) {
    return next(err);
  }
};

authController.checkDuplicateEmail = async (req, res, next) => {
  try {
    const {email} = req.query;
    if (!email) {
      return next(new ApiError("이메일을 입력해주세요", 400, true));
    }

    if (!validator.isEmail(email)) {
      throw new ApiError("올바른 이메일 형식이 아닙니다", 400, true);
    }

    const user = await User.findOne({email});

    return res.status(200).json({
      success: true,
      data: !!user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = authController;
