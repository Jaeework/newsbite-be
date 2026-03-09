const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

module.exports = function optionalAuth(req,res,next) {
    try{
        const authHeader = req.headers.authorization; // Bearer <token>


        //토큰이없거나 Bearer로 시작 안할 경우(비로그인) 일경우 다음으로 진행
         if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.userId = decoded.userId;

        next();

    }catch(error) {

        return next();
    }
};