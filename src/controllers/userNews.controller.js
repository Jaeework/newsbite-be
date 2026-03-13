const UserNews = require("../models/UserNews");
const News = require("../models/News");
const ApiError = require("../utils/ApiError");

const mongoose = require("mongoose");

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
      _id: id,
      user: userId,
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
    const { userId } = req;

    const { q, level, page = 1, limit = 12, sort = "recent" } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          is_hidden: false,
        },
      },
      {
        $lookup: {
          from: "news",
          localField: "news",
          foreignField: "_id",
          as: "newsDetail",
        },
      },
      {
        $unwind: "$newsDetail",
      },
    ];

    if (q && q.trim()) {
      pipeline.push({
        $match: {
          "newsDetail.title": {
            $regex: q.trim(),
            $options: "i",
          },
        },
      });
    }

    if (level && level !== "all") {
      pipeline.push({
        $match: {
          "newsDetail.level": level,
        },
      });
    }

    let sortStage;

    switch (sort) {
      case "oldest":
        sortStage = { createdAt: 1 };
        break;

      case "title":
        sortStage = { "newsDetail.title": 1 };
        break;

      default:
        sortStage = { createdAt: -1 };
    }

    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              createdAt: 1,
              news: {
                _id: "$newsDetail._id",
                title: "$newsDetail.title",
                image: "$newsDetail.image",
                level: "$newsDetail.level",
                source: "$newsDetail.source",
                published_at: "$newsDetail.published_at",
              },
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    });

    const [result] = await UserNews.aggregate(pipeline);

    const totalItems = result.total?.[0]?.count ?? 0;

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    });
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
      { returnDocument: "after" }
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
