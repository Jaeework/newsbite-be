// authMiddleware는 JWT 토큰을 검사하는 미들웨어
// authMiddlewares는 로그인 이후 API에 사용할 것.

const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

module.exports = function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization; // Bearer <token>

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError("Invalid token", 401)); // 유효하지 않은 토큰
    }

    if (error.name === "TokenExpiredError") {
      return next(new ApiError("Token expired", 401)); // 만료된 토큰
    }

    return next(error);
  }
};
