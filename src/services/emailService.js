import nodemailer from "nodemailer";
import ApiError from "../utils/ApiError.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"NEWSBITE" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "[NEWSBITE] 이메일 인증을 완료해주세요",
      html: `
        <div>
          <h2>이메일 인증</h2>
          <p>아래 버튼을 클릭하면 인증이 완료됩니다.</p>
          <p>링크는 <strong>24시간</strong> 동안 유효합니다.</p>
          <a href="${verificationUrl}">이메일 인증하기</a>
          <p>본인이 요청하지 않은 경우 이 이메일을 무시하세요.</p>
        </div>
      `,
    });
  } catch (error) {
    throw new ApiError("이메일 발송에 실패했습니다", 502);
  }
};
