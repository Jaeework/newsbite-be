const jwt = require("jsonwebtoken");

module.exports = function auth(req,res,next) {
    try{
        const authHeader = req.headers.authorization; // Bearer <token>

         if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ status: "fail", message: "Unauthorized" });
        }

        const token = authHeader?.split(" ")[1];

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.userId = decoded.userId;

        next();

    }catch(error) {
        return res.status(401).json({status:"fail", message: "Invalid token"});  // 유효하지 않은 토큰
    }
};