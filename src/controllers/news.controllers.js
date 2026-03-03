const News = require("../models/News");
const newsController = {};

// 뉴스 전체 조회
newsController.getAllNews = async (req, res) => {
  try {
    const news = await News.find({});

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch news",
      error: error.message,
    });
  }
};

// 뉴스 상세 조회
newsController.getNewsById = async (req, res) => {
  try {
    const newsId = req.params.id;
    const product = await News.findById({ _id: newsId });
    if (!product) {
      throw new Error("News not found");
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch news",
      error: error.message,
    });
  }
};

// 뉴스 단어로 조회
newsController.getNewsByWord = async (req, res) => {
  try {
    const { word } = req.query;
    let query = {};
    if (word) {
      query = { title: { $regex: word, $options: "i" } };
    }
    const news = await News.find(query);
    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch news",
      error: error.message,
    });
  }
};

module.exports = newsController;
