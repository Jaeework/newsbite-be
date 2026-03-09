const News = require("../models/News");
const Word = require("../models/Word");
const NewsWords = require("../models/NewsWord");
const UserWord = require("../models/UserWord");
const ApiError = require("../utils/ApiError");
const newsController = {};

// 뉴스 전체 조회
newsController.getAllNews = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    //검색어 없으면 전체 조회
    if (!keyword) {
      const news = await News.find({});
      return res.status(200).json({
        success: true,
        data: news,
      });
    }

    //뉴스 제목 검색
    const newsByTitle = await News.find({
      title: { $regex: keyword, $options: "i" },
    });

    //단어로 검색
    const words = await Word.find({
      text: { $regex: keyword, $options: "i" },
    }).populate({
      path: "news",
      populate: {
        path: "news",
        select: "title content",
      },
    });

    const newsByWord = words.flatMap((w) =>
      (w.news || []).map((nw) => nw.news)
    );

    //중복 제거
    const newsMap = new Map();

    [...newsByTitle, ...newsByWord].forEach((news) => {
      newsMap.set(news._id.toString(), news);
    });

    const result = Array.from(newsMap.values());

    if (result.length === 0) {
      throw new ApiError("검색 결과가 없습니다.", 404, true);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// 뉴스 상세 조회
newsController.getNewsById = async (req, res, next) => {
  try {
    const {userId} = req;
    const newsId = req.params.id;


    // 뉴스 정보 조회
    const news = await News.findById(newsId);
    if (!news) {
      throw new ApiError("뉴스를 찾을 수 없습니다.", 404, true);
    }

    // 해당 뉴스의 모든 단어 데이터 가져오기
    const newsWords = await NewsWords.find({ news: newsId }).populate('word');
    const allWords = newsWords.map(nw => nw.word);

    // 약어(abbreviation)와 일반 단어 분리
    const abbreviations = allWords.filter(word => word.type === 'abbreviation');
    const baseWords = allWords.filter(word => word.type !== 'abbreviation');

    // 일반 단어 처리 (유저 존재 여부에 따른 분기)
    let words = [];

    if (userId) {
      // 로그인이 된 경우: DB에서 사용자의 학습 현황 조회
      const wordIds = baseWords.map(word => word._id);
      const userWords = await UserWord.find({
        user: userId,
        word: { $in: wordIds }
      });

      const userWordStatusMap = {};
      userWords.forEach(uw => {
        userWordStatusMap[uw.word.toString()] = uw.isDone;
      });

      words = baseWords.map(word => {
        const wordObj = word.toObject();
        wordObj.isDone = userWordStatusMap[word._id.toString()] || false;
        return wordObj;
      });
    } else {
      // 유저 정보가 없는 경우: 모든 단어를 false로 설정
      words = baseWords.map(word => {
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
        abbreviations
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = newsController;
