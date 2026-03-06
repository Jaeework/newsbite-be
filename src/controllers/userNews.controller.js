const UserNews = require("../models/UserNews");
const News = require("../models/News");
const ApiError = require("../utils/ApiError");

const userNewsController = {};

// 학습한 기사 저장
userNewsController.createUserNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) {
      throw new ApiError("잘못된 요청입니다. 다시 시도하세요.", 400, true);
    }

    const news = await News.findById(id);
    if (!news) {
      throw new ApiError("존재하지 않는 기사입니다", 404, true);
    }

    const existing = await UserNews.findOne({ user: userId, news: id });
    if (existing) {
      throw new ApiError("이미 저장된 기사입니다", 400, true);
    }

    const userNews = await UserNews.create({ user: userId, news: id });

    return res.status(201).json({ success: true, data: userNews });
  } catch (err) {
    next(err);
  }
};

// 학습 기사 삭제
userNewsController.deleteUserNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const userNews = await UserNews.findOneAndDelete({
      user: userId,
      news: id,
    });
    if (!userNews) {
      throw new ApiError("저장된 기사를 찾을 수 없습니다", 404, true);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// 학습 기사 목록 조회
userNewsController.getUserNewsList = async (req, res, next) => {
  try {
    const userId = req.userId;

    const userNewsList = await UserNews.find({
      user: userId,
      is_hidden: false,
    })
      .populate("news")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: userNewsList });
  } catch (err) {
    next(err);
  }
};

// 학습한 기사 목록에서 숨기기
userNewsController.hideUserNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const userNews = await UserNews.findOneAndUpdate(
      { user: userId, news: id },
      { is_hidden: true, hidden_at: new Date() },
      { returnDocument: "after" },
    );

    if (!userNews) {
      throw new ApiError("저장된 기사를 찾을 수 없습니다", 404, true);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = userNewsController;
