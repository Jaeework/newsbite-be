const News = require("../models/News");
const Word = require("../models/Word");
const NewsWords = require("../models/NewsWord")
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
    const newsId = req.params.id;
    const news = await News.findById({ _id: newsId });
    if (!news) {
      throw new ApiError("뉴스를 찾을 수 없습니다.", 404, true);
    }

    const newsWords = await NewsWords.find({ news : newsId}).populate('word');

    const allwords = newsWords.map(newsword => newsword.word);
    const abbreviations = allwords.filter(word => word.type === 'abbreviation')
    const words = allwords.filter(word => word.type !== 'abbreviation'
    )

    res.status(200).json({
      success: true,
      data: news,words,abbreviations
    });
  } catch (err) {
    next(err);
  }
};

module.exports = newsController;
