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
      if (user) {
        userLevel = user.level;
      }
    }

    const filter = {};
    if (level) filter.level = level;

    let resultNews = [];
    let totalItems = 0;

    //키워드 있을시
    if (keyword) {
      const [newsByTitle, words] = await Promise.all([
        News.find({ ...filter, title: { $regex: keyword, $options: "i" } }),
        Word.find({ text: { $regex: keyword, $options: "i" } }).populate({
          path: "news",
          populate: {
            path: "news",
            match: filter,
            select: "title content level createdAt",
          },
          options: { strictPopulate: false },
        }),
      ]);

      // 가상 필드(news)를 타고 들어가 실제 News 객체들만 추출
      const newsByWord = words.flatMap(
        (w) => (w.news || []).map((nw) => nw.news).filter((n) => n !== null), // match: filter에 걸러진 null 제거
      );

      // ID 기준으로 중복 제거 (Map 활용)
      const newsMap = new Map();
      [...newsByTitle, ...newsByWord].forEach((news) => {
        if (news && news._id) {
          newsMap.set(news._id.toString(), news);
        }
      });

      //정렬
      resultNews = Array.from(newsMap.values()).sort((a, b) => {
        // [맞춤 정렬] 유저 레벨과 일치하는 기사를 최상단으로
        if (userLevel) {
          if (a.level === userLevel && b.level !== userLevel) return -1;
          if (a.level !== userLevel && b.level === userLevel) return 1;
        }
        // 그 외에는 레벨 순서(A2->C1) 및 최신순 정렬
        const levelDiff = (LEVEL_ORDER[a.level] || 0) - (LEVEL_ORDER[b.level] || 0);
        if (levelDiff !== 0) return levelDiff;
        return new Date(b.published_at) - new Date(a.published_at);
      });

      totalItems = resultNews.length;
      resultNews = resultNews.slice(skip, skip + limitNum);
    } else {
      // 키워드 없을 시: 전체 데이터 조회 (메모리 정렬을 위해 페이징 없이 가져옴)
      resultNews = await News.find(filter).lean();
    }

    // 3. 통합 정렬 로직 (메모리 정렬)
    resultNews.sort((a, b) => {
      // 1순위: 로그인 유저 레벨과 일치하는 기사를 최상단으로
      if (userLevel && !level) {
        // 특정 레벨을 필터링하지 않았을 때만 적용
        if (a.level === userLevel && b.level !== userLevel) return -1;
        if (a.level !== userLevel && b.level === userLevel) return 1;
      }

      // 2순위: 레벨 순서 정렬 (A2 -> C1)
      const levelDiff = (LEVEL_ORDER[a.level] || 0) - (LEVEL_ORDER[b.level] || 0);
      if (levelDiff !== 0) return levelDiff;

      // 3순위: 발행일 최신순 (기사 뭉침 방지)
      return new Date(b.published_at || b.createdAt) - new Date(a.published_at || a.createdAt);
    });

    totalItems = resultNews.length;

    // 4. 페이징 처리 (slice)
    const finalData = resultNews.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      user: userId || "none", // 테스트용 유저 확인 필드
      data: finalData,
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
