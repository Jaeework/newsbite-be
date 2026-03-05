const News = require("../models/News");
const ApiError = require("../utils/ApiError");
const newsController = {};

// 뉴스 전체 조회
newsController.getAllNews = async (req, res, next) => {
  try {
    const news = await News.find({});

    if (!news || news.length === 0) {
      throw new ApiError("뉴스가 없습니다.", 404, true);
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (err) {
    next(err);
  }
};

// 뉴스 상세 조회
newsController.getNewsById = async (req, res, next) => {
  try {
    const newsId = req.params.id;
    const product = await News.findById({ _id: newsId });
    if (!product) {
      throw new ApiError("뉴스를 찾을 수 없습니다.", 404, true);
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

// 뉴스 단어로 조회
// newsController.getNewsByWord = async (req, res, next) => {
//   try {
//     const { word } = req.params;
//     let query = {};
//     if (word) {
//       query = { content: { $regex: word, $options: "i" } };
//     } else {
//       throw new ApiError("검색어를 입력해주세요.", 400, true);
//     }
//     const news = await News.find(query);
//     if (!news || news.length === 0) {
//       throw new ApiError("검색 결과가 없습니다.", 404, true);
//     }
//     res.status(200).json({
//       success: true,
//       data: news,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

module.exports = newsController;
