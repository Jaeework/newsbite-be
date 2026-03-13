const News = require("../models/News");
const Word = require("../models/Word");
const NewsWords = require("../models/NewsWord");
const UserWord = require("../models/UserWord");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const newsController = {};
const LEVEL_ORDER = { A2: 1, B1: 2, B2: 3, C1: 4 };

// 뉴스 전체 조회
newsController.getAllNews = async (req, res, next) => {
  try {
    const { keyword, page = 1, limit = 12, level } = req.query;
    const { userId } = req;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    let userLevel = null;
    if (userId) {
      const user = await User.findById(userId);
      if (user) userLevel = user.level;
    }

    const matchStage = {};
    if (level) matchStage.level = level;

    if (keyword) {
      const words = await Word.find({
        text: { $regex: keyword, $options: "i" },
      }).populate({
        path: "news",
        select: "news",
      });

      const newsIdsByWord = words.flatMap((w) =>
        (w.news || []).map((nw) => nw.news).filter(Boolean),
      );

      matchStage.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { _id: { $in: newsIdsByWord } },
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          levelOrder: {
            $switch: {
              branches: [
                // 특정 레벨 필터 없을 때만 유저 레벨을 0순위로
                ...(userLevel && !level ? [{ case: { $eq: ["$level", userLevel] }, then: 0 }] : []),
                ...Object.entries(LEVEL_ORDER).map(([k, v]) => ({
                  case: { $eq: ["$level", k] },
                  then: v,
                })),
              ],
              default: 99,
            },
          },
          createdDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
      {
        $sort: {
          createdDate: -1,
          levelOrder: 1,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await News.aggregate(pipeline);
    const totalItems = result.total[0]?.count ?? 0;

    if (keyword && totalItems === 0) {
      throw new ApiError("검색 결과가 없습니다.", 404, true);
    }

    res.status(200).json({
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

// 뉴스 상세 조회
newsController.getNewsById = async (req, res, next) => {
  try {
    const { userId } = req;
    const newsId = req.params.id;

    // 뉴스 정보 조회
    const news = await News.findById(newsId);
    if (!news) {
      throw new ApiError("뉴스를 찾을 수 없습니다.", 404, true);
    }

    // 해당 뉴스의 모든 단어 데이터 가져오기
    const newsWords = await NewsWords.find({ news: newsId }).populate("word");
    const allWords = newsWords.map((nw) => nw.word);

    // 약어(abbreviation)와 일반 단어 분리
    const abbreviations = allWords.filter((word) => word.type === "abbreviation");
    const baseWords = allWords.filter((word) => word.type !== "abbreviation");

    // 일반 단어 처리 (유저 존재 여부에 따른 분기)
    let words = [];

    if (userId) {
      // 로그인이 된 경우: DB에서 사용자의 학습 현황 조회
      const wordIds = baseWords.map((word) => word._id);
      const userWords = await UserWord.find({
        user: userId,
        word: { $in: wordIds },
      });

      const userWordStatusMap = {};
      userWords.forEach((uw) => {
        userWordStatusMap[uw.word.toString()] = uw.isDone;
      });

      words = baseWords.map((word) => {
        const wordObj = word.toObject();
        wordObj.isDone = userWordStatusMap[word._id.toString()] || false;
        return wordObj;
      });
    } else {
      // 유저 정보가 없는 경우: 모든 단어를 false로 설정
      words = baseWords.map((word) => {
        const wordObj = word.toObject();
        wordObj.isDone = false;
        return wordObj;
      });
    }

    // 결과 응답
    res.status(200).json({
      success: true,
      data: {
        news,
        words,
        abbreviations,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = newsController;
