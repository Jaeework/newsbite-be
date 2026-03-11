const UserWord = require("../models/UserWord");
const Word = require("../models/Word");
const ApiError = require("../utils/ApiError");

const { Parser } = require("json2csv");

const userWordsController = {};

//단어 저장
userWordsController.createMyWords = async (req, res, next) => {
  try {
    const { userId } = req;
    const { wordIds } = req.body;

    if (!userId) throw new ApiError("Unauthorized", 401, false);
    if (!wordIds || !Array.isArray(wordIds)) {
      throw new ApiError("wordIds 배열이 필요합니다.", 400, false);
    }

    const existingWords = await UserWord.find({
      user: userId,
      word: { $in: wordIds },
    }).select("word");

    const existingWordIds = existingWords.map((uw) => uw.word.toString());

    const wordsToSave = wordIds.filter((id) => !existingWordIds.includes(id));

    if (wordsToSave.length === 0) {
      throw new ApiError("이미 모든 단어가 저장되어 있습니다.", 409, true);
    }

    const docs = wordsToSave.map((id) => ({ user: userId, word: id }));
    const newUserWords = await UserWord.insertMany(docs);

    res.status(200).json({
      success: true,
      data: newUserWords,
    });
  } catch (err) {
    next(err);
  }
};

//단어 조회, 검색, 정렬
userWordsController.getMyWords = async (req, res, next) => {
  try {
    const { userId } = req;

    const {
      q,
      status = "all",
      sort = "recent",
      type,
      page = 1,
      limit = 12,
    } = req.query;

    if (!userId) {
      throw new ApiError("Unauthorized", 401, false);
    }

    if (!["all", "done", "doing"].includes(status)) {
      throw new ApiError("Invalid request", 400, false);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = { user: userId };

    // 상태 필터
    if (status === "done") filter.isDone = true;
    if (status === "doing") filter.isDone = false;

    let query = UserWord.find(filter).populate({
      path: "word",
      match: {
        ...(type && type !== "all" ? { type } : {}),
        ...(q ? { text: { $regex: q, $options: "i" } } : {}),
      },
      select: "text meaning type example example_meaning",
      populate: {
        path: "news",
        populate: {
          path: "news",
          select: "title",
        },
      },
    });

    // 정렬
    if (sort === "recent") {
      query = query.sort({ createdAt: -1 });
    } else if (sort === "oldest") {
      query = query.sort({ createdAt: 1 });
    }

    // 페이지네이션
    query = query.skip(skip).limit(limitNum);

    let userWords = await query;

    userWords = userWords.filter((uw) => uw.word);

    if (sort === "alpha") {
      userWords.sort((a, b) => a.word.text.localeCompare(b.word.text));
    }

    const result = userWords.map((uw) => ({
      _id: uw._id,
      isDone: uw.isDone,
      createdAt: uw.createdAt,
      word: uw.word,
    }));

    const totalItems = await UserWord.countDocuments(filter);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    next(err);
  }
};

//학습 상태 업데이트
userWordsController.updateMyWord = async (req, res, next) => {
  try {
    const { userId } = req;
    const { userWordId } = req.params;
    const { status } = req.body;

    if (!userId) {
      throw new ApiError("Unauthorized", 401, false);
    }

    if (!["done", "doing"].includes(status)) {
      throw new ApiError("Invalid request", 400, false);
    }

    const updatedWord = await UserWord.findOneAndUpdate(
      { _id: userWordId, user: userId },
      { isDone: status === "done" },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedWord) {
      throw new ApiError("해당 단어를 찾을 수 없습니다.", 404, false);
    }

    res.status(200).json({
      success: true,
      data: updatedWord,
    });
  } catch (err) {
    next(err);
  }
};

//단어 삭제
userWordsController.deleteMyWord = async (req, res, next) => {
  try {
    const { userId } = req;
    const { userWordId } = req.params;

    if (!userId) {
      throw new ApiError("Unauthorized", 401, false);
    }

    const deletedWord = await UserWord.findOneAndDelete({
      _id: userWordId,
      user: userId,
    });

    if (!deletedWord) {
      throw new ApiError("삭제할 단어를 찾을 수 없습니다.", 404, true);
    }

    res.status(200).json({
      success: true,
      data: deletedWord,
    });
  } catch (err) {
    next(err);
  }
};

//단어장 csv 추출
userWordsController.exportMyWordsCSV = async (req, res, next) => {
  try {
    const { userId } = req;

    if (!userId) {
      throw new ApiError("Unauthorized", 401, false);
    }

    const userWords = await UserWord.find({ user: userId })
      .populate("word", "text meaning example example_meaning type")
      .sort({ createdAt: -1 });

    const data = userWords.map((uw) => ({
      단어: uw.word?.text || "",
      뜻: uw.word?.meaning || "",
      예문: uw.word?.example || "",
      예문뜻: uw.word?.example_meaning || "",
      타입: uw.word?.type || "",
    }));

    const fields = ["단어", "뜻", "예문", "예문 해석", "유형"];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    const today = new Date().toISOString().split("T")[0];

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment(`my-words-${today}.csv`);

    res.send("\uFEFF" + csv);
  } catch (err) {
    next(err);
  }
};

module.exports = userWordsController;
