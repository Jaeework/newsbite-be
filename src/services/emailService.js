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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- 헤더 -->
          <div style="background-color: #1a1a2e; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
              NEWSBITE
            </h1>
          </div>

          <!-- 본문 -->
          <div style="padding: 40px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 12px;">
              이메일 인증을 완료해주세요
            </h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
              아래 버튼을 클릭하면 회원가입이 완료됩니다.<br/>
              링크는 <strong style="color: #111827;">24시간</strong> 동안 유효합니다.
            </p>

            <!-- 버튼 -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${verificationUrl}"
                style="display: inline-block; background-color: #2f5d83; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                이메일 인증하기
              </a>
            </div>

            <!-- 구분선 -->
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 24px;" />

            <!-- 링크 직접 복사 -->
            <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">
              버튼이 작동하지 않으면 아래 링크를 복사해 브라우저에 붙여넣으세요.
            </p>
            <p style="color: #4f46e5; font-size: 12px; word-break: break-all; margin: 0 0 24px;">
              ${verificationUrl}
            </p>

            <p style="color: #d1d5db; font-size: 12px; margin: 0;">
              본인이 요청하지 않은 경우 이 이메일을 무시하세요.
            </p>
          </div>

        </div>
      `,
    });
  } catch (error) {
    throw new ApiError("이메일 발송에 실패했습니다", 502);
  }
};
