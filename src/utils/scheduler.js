const cron = require("node-cron");
const { fetchAndStoreNews, clearOldNews } = require("../services/news.service");

const initSchedule = () => {
  // 앱 시작 시 최초 1회 실행 (필요한 경우)
  fetchAndStoreNews();

  // 1. 뉴스 수집: 매주 월요일 자정 (0 0 * * 1)
  cron.schedule("0 0 * * 1", () => {
    console.log("주간 뉴스 수집을 시작합니다.");
    fetchAndStoreNews();
  });

  // 2. 오래된 뉴스 삭제 : 스케쥴은 매일 자정 (0 0 * * *)
  cron.schedule("0 0 * * *", () => {
    console.log("오래된 뉴스 삭제를 시작합니다.");
    clearOldNews();
  });

  console.log("뉴스 수집(매주) 및 삭제(2개월) 스케줄러가 등록되었습니다.");
};

module.exports = initSchedule;
