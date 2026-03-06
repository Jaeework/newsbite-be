const axios = require("axios");
const News = require("../models/News");
const Word = require("../models/Word");
const NewsWord = require("../models/NewsWord");
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeNewsContentWithAi = async (content) => {
  try {
    //const prompt = process.env.NEWS_AI_PROMPT + content;
    const prompt = `Role: You are a professional English education content creator and data engineer for Korean learners. Analyze the provided news article and generate level-specific learning content in JSON format.

[Goal]
Organize the most important economic and political information by level. Extract words, idioms, abbreviations/initialisms, and examples suitable for each level's paragraphs.
Each paragraph must be written at a difficulty level that the learner of the corresponding level can read and understand.

[Core Rules]
- Do not repeat the entire article. Do not repeat similar content. Include only key information.
- Never use introductory or concluding sentences. List only information and facts.
- Ensure that the content between levels does not overlap.
- Vocabulary in the paragraphs must be at a level understandable by the corresponding CEFR level learner.
- You must extract only the words actually used in the text of the corresponding level.
- You must generate content and words for all four CEFR levels (A2, B1, B2, C1).
- Korean translations should avoid literal expressions like '멀리입니다' and use natural spoken language such as '거리가 꽤 멉니다'.
- Expand the content to be around 1,500 characters (KOR, excluding spaces) to ensure it is rich. (Simple summarization is strictly prohibited).

[Content Generation Rules]
1. Level-specific Rewriting: Rewrite one article into four levels: A2 (Basic), B1 (Intermediate), B2 (Upper-Intermediate), and C1 (Advanced).
   - A2: Very simple vocabulary, mainly short simple sentences.
   - B1: Everyday vocabulary, clear sentence structure, includes phrasal verbs.
   - B2: Introduction of professional vocabulary, diverse sentence structures, and idioms.
   - C1: Advanced vocabulary close to the original, journalism style, sophisticated expressions.
2. Content Structure: Include only key information (economic/political facts) without flowery language. Increase depth and contextual complexity as the level rises.
3. Quantity Rules:
   - The 'content' body for each level must be very detailed.
   - Compose at least 5 paragraphs per level, but **the maximum number of paragraphs in the 'content' array is strictly limited to 10.**
   - *IMPORTANT* Expand the content so the total text is approximately 1,500 characters (KOR, excluding spaces). (Simple summarization is strictly prohibited).
4. Language Rules: All 'content' and 'title' are written in English; 'meaning' is written in Korean.
5. Structural Rules: 
   - title: English title written with vocabulary of the corresponding level.
   - content: English array of the body text divided into paragraph units. **The length of this array must not exceed 10.**
   - translated_content: Korean translation array corresponding 1:1 with the 'content' array. **The length of this array must not exceed 10.**

[URGENT: NO DOUBLE SPACES]
- Double spaces are strictly prohibited in all Korean/English texts.
- Use only single spaces.

[Words Array Rules]
1. word (10 items): Key keywords to serve as 'hints' before reading.
2. idioms (5 items): 
   - A2/B1: Must focus on simple Phrasal Verbs like 'go up', 'look for'.
   - B2/C1: Select idioms appropriate for the news context.
3. abbreviation (a items):
   - In the 'meaning' field, provide 'easy explanations' in Korean (e.g., GDP -> 한 나라가 번 돈의 합계).
   - Extract only those actually used in the 'content' body of that level.
   - Provide enough items for the learner to read the paragraph smoothly.
4. Field Details:
   - meaning: Key Korean meaning of the word/idiom.
   - example: 1 English example sentence based on economic/political topics where the usage is clear.
   - example_meaning: Korean translation of the example. (Avoid literal translations; use natural context).
   - type: Use only one of "word", "idiom", or "abbreviation".
5. Composition & Sorting (Important): Extract at least 15 items per level and sort them in the following order:
   - (1) word (10) → (2) idiom (5) → (3) abbreviation (All abbreviations in the text).

[Language Rules]
- Korean translations/interpretations must avoid translator-style (~입니다, ~함) and use natural Korean sentences suitable for professional educational materials.
- Use natural sentence endings actually used by Korean speakers (~예요, ~입니다, ~해요, etc.).
- **STRICT RULE: All Korean fields (translated_content, meaning, example_meaning) must be written 100% in Korean. Do not include any English words (e.g., "articulates", "framing", "CEO"). Translate these terms into natural Korean context (e.g., '명확하게 설명하다', '틀을 잡다', '최고경영자').**
- **Ensure the Korean translation feels like a cohesive story or report, not just a literal word-for-word replacement.**
- **Contextual Vocabulary: Use professional terminology appropriate for the topic. For example, instead of '작물이 작아지다', use '수확량이 감소하다'; instead of '음식을 기르다', use '농작물을 재배하다'.**
- **Naturally rearrange the subject and object to ensure the sentence flows like native Korean news content.**

[Output Format]
- Provide ONLY pure JSON code. (No greetings, explanations, or closing remarks).
- Strictly adhere to the schema below.
- Use normalized single spaces for all string values.

{
  "aiData": [
    {
      "news": {
        "title": "Level-specific Title",
        "content": ["Paragraph 1 sentence...", "Paragraph 2 sentence..."],
        "translated_content": ["문단 1 해석...", "문단 2 해석..."],
        "level": "A2"
      },
      "words": [
        {
          "text": "word/idiom/abbr",
          "type": "word|idiom|abbreviation",
          "meaning": "Korean meaning",
          "example": "Simple example sentence",
          "example_meaning": "Natural Korean translation"
        }
      ]
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: `content: ${content}`,
        },
      ],
      response_format: { type: "json_object" }, // JSON 출력 보장
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("AI 분석 에러:", err.message);
    return null; // 분석 실패 시 null 반환
  }
};

const fetchAndStoreNews = async () => {
  const totalStartTime = Date.now(); // 전체 작업 시작 시간 기록
  console.log("뉴스 수집 시작:", new Date().toLocaleString());

  try {
    const API_KEY = process.env.GUARDIAN_API_KEY;
    const BASE_URL = "https://content.guardianapis.com/search";

    const response = await axios.get(BASE_URL, {
      params: {
        "api-key": API_KEY,
        section: "business", // 비즈니스 섹션 뉴스만 가져오기
        "show-fields": "all",
        "page-size": 5, // 한 번에 최대 5개 기사 가져오기
        "order-by": "newest", // 최신 기사부터 가져오기
      },
    });

    const articles = response.data.response.results;
    if (articles.length === 0) return;

    for (const item of articles) {
      const bodyText = item.fields?.bodyText;
      if (!bodyText) continue;

      const articleStartTime = Date.now();
      console.log(
        `\n[분석 시작] ${item.webTitle} (${new Date().toLocaleTimeString()})`,
      );

      const aiResponse = await analyzeNewsContentWithAi(bodyText);
      if (!aiResponse || !Array.isArray(aiResponse.aiData)) {
        console.log(
          `[데이터 오류] AI 응답 형식이 올바르지 않습니다. 기사: ${item.webTitle}`,
        );
        continue;
      }
      console.log(`[분석 데이터]${JSON.stringify(aiResponse.aiData)}`);

      const allWordsFromAi = aiResponse.aiData.flatMap((d) => d.words);
      const uniqueWordTexts = [...new Set(allWordsFromAi.map((w) => w.text))];

      const wordOperations = uniqueWordTexts
        .map((text) => {
          const wordData = allWordsFromAi.find((w) => w.text === text);
          if (!wordData) return null; // 안전장치: wordData가 없는 경우 null 반환
          return {
            updateOne: {
              filter: { text },
              update: {
                $setOnInsert: {
                  text,
                  type: wordData.type,
                  meaning: wordData.meaning,
                  example: wordData.example,
                  example_meaning: wordData.example_meaning,
                },
              },
              upsert: true,
            },
          };
        })
        .filter((op) => op !== null); // null인 항목 제거

      // 업서트 방식으로 단어 데이터 저장
      await Word.bulkWrite(wordOperations);

      const dbWords = await Word.find(
        { text: { $in: uniqueWordTexts } },
        "_id text",
      );
      const wordMap = new Map(dbWords.map((w) => [w.text, w._id]));

      const newsToInsert = aiResponse.aiData.map((data) => ({
        title: data.news.title,
        content: data.news.content,
        translated_content: data.news.translated_content,
        url: item.webUrl,
        image: item.fields?.thumbnail || null,
        published_at: new Date(item.webPublicationDate),
        level: data.news.level,
        source: "The Guardian",
      }));

      const insertedNews = await News.insertMany(newsToInsert);

      const newsWordOperations = [];

      for (let i = 0; i < insertedNews.length; i++) {
        const currentNews = insertedNews[i];
        const currentAiWords = aiResponse.aiData[i].words;

        currentAiWords.forEach((w) => {
          const wordId = wordMap.get(w.text);
          if (wordId) {
            newsWordOperations.push({
              updateOne: {
                filter: { news: currentNews._id, word: wordId },
                update: { news: currentNews._id, word: wordId },
                upsert: true,
              },
            });
          }
        });
      }

      if (newsWordOperations.length > 0) {
        await NewsWord.bulkWrite(newsWordOperations);
      }

      const articleEndTime = Date.now();
      const duration = ((articleEndTime - articleStartTime) / 1000).toFixed(2);
      console.log(`[DB저장 완료] (소요시간: ${duration}초)`);
      // --- 기사별 AI 분석 시간 측정 종료 ---
    }

    const totalEndTime = Date.now();
    const totalDuration = ((totalEndTime - totalStartTime) / 1000 / 60).toFixed(
      2,
    );
    console.log(`\n=========================================`);
    console.log(`모든 뉴스 수집 및 AI 분석 완료!`);
    console.log(`총 소요 시간: 약 ${totalDuration}분`);
    console.log(`=========================================`);
  } catch (err) {
    console.error("에러 발생:", err.message);
  }
};

const clearOldNews = async () => {
  try {
    // 생성일로부터 60일이 지난 뉴스와 연관된 NewsWord 데이터를 삭제
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const oldNews = await News.find({
      createdAt: { $lt: sixtyDaysAgo },
    }).select("_id");
    const oldNewsIds = oldNews.map((news) => news._id);

    await NewsWord.deleteMany({ news: { $in: oldNewsIds } });
    await News.deleteMany({ _id: { $in: oldNewsIds } });

    console.log(
      "60일 이상 지난 뉴스 및 연관 단어 데이터가 삭제되었습니다. 삭제된 뉴스 수:",
      oldNewsIds.length,
    );
  } catch (err) {
    console.error("뉴스 삭제 중 에러 발생:", err.message);
  }
};

module.exports = { fetchAndStoreNews, clearOldNews };
