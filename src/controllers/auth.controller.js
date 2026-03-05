const bcrypt = require("bcryptjs");
const User = require("../models/User"); 
const ApiError = require("../utils/ApiError");


// 회원가입 API: signup (중복 이메일 체크 → 비밀번호 해시 → 유저 저장 → JWT 발급 → token+user 응답)
// POST  /api/auth/signup
exports.signup = async (req, res, next) => {
    try{
        const { nickname, email, password, level } = req.body;

        const existing = await User.findOne({email});
        if(existing) {
            throw new ApiError(400, "이미 가입된 이메일입니다.", true);
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

        // 로그인 토근 발행 (자동로그인) , jwt.sign(payload, secretKey, options)
        const token = user.generateToken();

        // 성공 응답 보내기, 201은 새 리소스 생성됨(회원 생성)
        return res.status(201).json({
            success: true,
            data: {
                user: {                              // 프론트에서 바로 쓰기 좋게 유저 정보도 함께 내려주기
                    id: user._id,
                    nickname: user.nickname,
                    email: user.email,
                    level: user.level,
                },
                token,                                 // 프론트가 저장할 JWT 토큰을 같이 내려주기
            },
        });

     // 서버 내부 오류(DB 연결 문제 등), 500은 서버 에러
    }catch(error) {
        return next(error);
    }
};

// 로그인 API: signin (이메일 유저 찾기 → 비밀번호 해시 비교 → JWT 발급 → token+user 응답)
// POST  /api/auth/signin
exports.signin = async (req,res, next) => {
    
    // 로그인 과정에서 에러 대비
    try{
        const {email, password} =req.body;   

        const user = await User.findOne({email, del_flag: false});  // 탈퇴 유저 로그인 방지   
        if(!user) {
            return next(new ApiError(400, "이메일 또는 비밀번호가 틀렸습니다.", true));
        }

        // 사용자가 입력한 평문 password와 DB에 저장된 해시 user.password를 비교
        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch) {
            return next(new ApiError(400, "이메일 또는 비밀번호가 틀렸습니다."));
        }

        // 로그인 성공했으면 토큰 발급
        const token = user.generateToken();

        // 응답으로 token과 user 정보를 내려주기
        return res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    nickname: user.nickname,
                    email: user.email,
                    level: user.level,
                },
                token,
            },
        });

    }catch(error) {
        // 서버 에러 (500)
        return next(error);
    }
};