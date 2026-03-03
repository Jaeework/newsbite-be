const UserWord = require("../models/UserWord");
const Word = require("../models/Word");
const ApiError = require("../utils/ApiError");

const wordsController = {};

//단어 저장
wordsController.createMyWord = async (req, res) => {
  try {
    const { userId } = req;
    const { wordId } = req.body;

    if (!wordId) {
      throw new ApiError("Invalid request", 400, false);
    }

    //단어가 존재하는지 확인
    const word = await Word.findById(wordId);
    if (!word) {
      throw new ApiError("Invalid request", 400, false);
    }

    //유저 단어장에 저장 된 단어인지 확인
    const existUserWord = await UserWord.findOne({
      user: userId,
      word: wordId,
    });

    if (existUserWord) {
      throw new ApiError("이미 저장된 단어입니다.", 409, true);
    }

    //없으면 새로 저장
    const newUserWord = await UserWord.create({
      user: userId,
      word: wordId,
    });

    res.status(200).json({
      success: true,
      data: newUserWord,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
};

//단어 조회, 검색, 정렬
wordsController.getMyWords = async (req, res) => {
  try {
    const { userId } = req;
    const { q, status = "all", sort = "recent" } = req.query;

    if (!userId) {
      throw new ApiError("Unauthorized", 401, false);
    }

    const filter = { user: userId };

    //상태 필터
    if (status === "done") filter.isDone = true;
    if (status === "doing") filter.isDone = false;

    if (!["all", "done", "doing"].includes(status)) {
      throw new ApiError("Invalid request", 400, false);
    }

    let userWords = await UserWord.find(filter)
      .populate("word", "text meaning type tts_url")
      .sort({ createdAt: -1 });

    //검색어가 들어오면
    if (q) {
      userWords = userWords.filter((uw) =>
        uw.word?.text.toLowerCase().includes(q.toLowerCase())
      );
    }

    //알파벳 정렬
    if (sort === "alpha") {
      userWords.sort((a, b) => a.word.text.localeCompare(b.word.text));
    }

    res.status(200).json({
      success: true,
      data: userWords,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.isUserError ? err.message : null,
    });
  }
};

//학습 상태 업데이트
wordsController.updateMyWord = async (req, res) => {
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
      { new: true, runValidators: true }
    );

    if (!updatedWord) {
      throw new ApiError("해당 단어를 찾을 수 없습니다.", 404, false);
    }

    res.status(200).json({
      success: true,
      data: updatedWord,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.isUserError ? err.message : null,
    });
  }
};

//단어 삭제
wordsController.deleteMyWord = async (req, res) => {
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
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.isUserError ? err.message : null,
    });
  }
};

module.exports = wordsController;
