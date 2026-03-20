const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const http = require("http");

const TOKEN = "8635175520:AAGPQrP4p9RKaYRCHfI8dkNini4g7GfFaWQ";
const ADMIN_ID = "8231104195";
const bot = new TelegramBot(TOKEN, { polling: true });

const DB_FILE = "users.json";
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const PREMIUM_USERS = new Set([]);

const WORDS = [
  { en: "abandon", uz: "tark etmoq", example: "He had to abandon the plan." },
  { en: "abroad", uz: "chet elda", example: "She studied abroad." },
  { en: "absorb", uz: "singdirmoq", example: "Plants absorb sunlight." },
  { en: "achieve", uz: "erishmoq", example: "Work hard to achieve your goals." },
  { en: "ancient", uz: "qadimiy", example: "This is an ancient city." },
  { en: "anxious", uz: "tashvishli", example: "She felt anxious before the exam." },
  { en: "appreciate", uz: "qadrlamoq", example: "I appreciate your help." },
  { en: "assume", uz: "faraz qilmoq", example: "Do not assume the worst." },
  { en: "benefit", uz: "foyda", example: "Exercise has many benefits." },
  { en: "capable", uz: "qodir", example: "You are capable of great things." },
];

function getRandomWords(count) {
  return [...WORDS].sort(() => Math.random() - 0.5).slice(0, count);
}

bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;
  const name = msg.from.first_name || "Dostim";
  const db = loadDB();
  db[userId] = { name, joined: new Date().toISOString(), score: db[userId]?.score || 0 };
  saveDB(db);
  bot.sendMessage(userId, `Salom, ${name}! English Learning Bot ga xush kelibsiz!\n\n/soz - Yangi soz\n/quiz - Test\n/top - Top sozlar\n/premium - Premium\n/help - Yordam`);
});

bot.onText(/\/soz/, (msg) => {
  const userId = msg.from.id;
  const words = getRandomWords(3);
  let text = "Bugungi sozlar:\n\n";
  words.forEach((w, i) => {
    text += `${i + 1}. ${w.en.toUpperCase()}\n${w.uz}\n${w.example}\n\n`;
  });
  bot.sendMessage(userId, text);
});

bot.onText(/\/quiz/, (msg) => {
  const userId = msg.from.id;
  const word = getRandomWords(1)[0];
  const wrong = WORDS.filter(w => w.en !== word.en).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.uz);
  const answers = [...wrong, word.uz].sort(() => Math.random() - 0.5);
  const buttons = answers.map(ans => [{ text: ans, callback_data: `q_${ans === word.uz ? "ok" : "no"}` }]);
  bot.sendMessage(userId, `"${word.en.toUpperCase()}" - qaysi tarjima togri?`, { reply_markup: { inline_keyboard: buttons } });
});

bot.on("callback_query", (q) => {
  const userId = q.from.id;
  const db = loadDB();
  if (q.data === "q_ok") {
    db[userId] = db[userId] || {};
    db[userId].score = (db[userId].score || 0) + 1;
    saveDB(db);
    bot.answerCallbackQuery(q.id, { text: "Togri! +1 ball" });
    bot.sendMessage(userId, `Togri! Ballingiz: ${db[userId].score}\n\nYana: /quiz`);
  } else {
    bot.answerCallbackQuery(q.id, { text: "Notogri!" });
    bot.sendMessage(userId, "Notogri! Qayta: /quiz");
  }
});

bot.onText(/\/top/, (msg) => {
  let text = "TOP 10 SOZ:\n\n";
  WORDS.slice(0, 10).forEach((w, i) => { text += `${i + 1}. ${w.en} - ${w.uz}\n`; });
  bot.sendMessage(msg.from.id, text);
});

bot.onText(/\/premium/, (msg) => {
  bot.sendMessage(msg.from.id, "PREMIUM - Oyiga 15,000 som\nClick yoki Payme orqali tolov qiling!");
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.from.id, "/soz - Yangi soz\n/quiz - Test\n/top - 10 ta soz\n/premium - Premium\n/help - Yordam");
});

bot.onText(/\/users/, (msg) => {
  if (String(msg.from.id) !== ADMIN_ID) return;
  const db = loadDB();
  bot.sendMessage(msg.from.id, `Jami foydalanuvchilar: ${Object.keys(db).length} ta`);
});

http.createServer((req, res) => res.end("Bot ishlayapti!")).listen(process.env.PORT || 3000);
console.log("Bot ishlamoqda...");
