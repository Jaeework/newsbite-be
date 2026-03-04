const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

module.exports = function auth(req,res,next) {
    try{
        const authHeader = req.headers.authorization; // Bearer <token>

         if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Unauthorized");
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.userId = decoded.userId;

        next();

    }catch(error) {

        if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));  // 유효하지 않은 토큰
    }

    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired")); // 만료된 토큰
    }

    return next(error);  
    }
};