import { browser } from "$app/environment";
import { derived, writable } from "svelte/store";

export const localeOptions = ["en", "ru"] as const;
export type Locale = (typeof localeOptions)[number];

const STORAGE_KEY = "volley-locale";

const ru: Record<string, string> = {
  Volley: "Волей",
  Menu: "Меню",
  League: "Лига",
  Language: "Язык",
  Select: "Выбрать",
  "Select league": "Выберите лигу",
  "Choose where to start": "Выберите, с чего начать",
  "We will remember the last league you opened.":
    "Мы запомним последнюю открытую лигу.",
  Players: "Игроки",
  Teams: "Команды",
  "League Stats": "Статистика лиги",
  Results: "Результаты",
  Admin: "Админ",
  Active: "Активные",
  All: "Все",
  "All time": "Все время",
  Range: "Период",
  Status: "Статус",
  "No players found.": "Игроки не найдены.",
  Player: "Игрок",
  Rating: "Рейтинг",
  "Win%": "Победы%",
  Games: "Игры",
  Points: "Очки",
  "Diff/G": "Разн/И",
  Diff: "Разница",
  Form: "Форма",
  Win: "Победа",
  Loss: "Поражение",
  With: "С",
  vs: "против",
  "Match details": "Детали матча",
  "Add match": "Добавить матч",
  "You can add a match for any day. If the day does not exist yet, it will be created.":
    "Можно добавить матч на любой день. Если даты еще нет в списке, создастся новый день.",
  "Manual entry": "Ручной ввод",
  "Need at least 4 players to create a match.":
    "Нужно минимум 4 игрока для создания матча.",
  Date: "Дата",
  Score: "Счет",
  "Team A": "Команда A",
  "Team B": "Команда B",
  "Save match": "Сохранить матч",
  "Delete match": "Удалить матч",
  "Tap to edit": "Нажмите для редактирования",
  "No matches yet.": "Матчей пока нет.",
  Standings: "Таблица",
  "No standings yet.": "Таблица пока пустая.",
  "W-L": "В-П",
  games: "игр",
  Today: "Сегодня",
  "Previous day": "Предыдущий день",
  "Next day": "Следующий день",
  Last: "Последний",
  Avg: "Ср.",
  "No matches in this range yet.": "В этом периоде пока нет матчей.",
  "Recent matches": "Последние матчи",
  "Best partners": "Лучшие партнеры",
  "Worst partners": "Худшие партнеры",
  "Tough opponents": "Сложные соперники",
  "Easy opponents": "Легкие соперники",
  "Not enough matches yet.": "Пока недостаточно матчей.",
  "over {games}": "за {games}",
  Back: "Назад",
  "Rating trend": "Динамика рейтинга",
  "Admin edit": "Редактирование админом",
  "Name + flags": "Имя + флаги",
  "Editing this player: name, `active`, `hidden`, `admin`.":
    "Редактирование этого игрока: имя, `active`, `hidden`, `admin`.",
  Name: "Имя",
  Hidden: "Скрыт",
  Delta: "Изм.",
  "Save player": "Сохранить игрока",
  Winrate: "Винрейт",
  "Season win %": "Победы в сезоне %",
  "For / against": "Набрано / пропущено",
  "Point margin": "Разница очков",
  "High / Low": "Макс / Мин",
  "Rating range": "Диапазон рейтинга",
  Placement: "Место",
  "Best / worst": "Лучшее / худшее",
  Streak: "Серия",
  "Longest W {wins}, L {losses}": "Макс W {wins}, L {losses}",
  "Last {count} games": "Последние {count} игр",
  "Admin access": "Доступ администратора",
  "Admin username": "Логин администратора",
  Username: "Логин",
  Password: "Пароль",
  "Create admin": "Создать админа",
  "Sign in": "Войти",
  "Sign out": "Выйти",
  "Admin users": "Админ-пользователи",
  "New admin username": "Логин нового админа",
  "Add admin": "Добавить админа",
  Seasons: "Сезоны",
  "Season name": "Название сезона",
  "Add season": "Добавить сезон",
  "Update season": "Обновить сезон",
  Delete: "Удалить",
  "No seasons yet.": "Сезонов пока нет.",
  "Create and manage seasons. Active season is used for season ratings.":
    "Создавайте и редактируйте сезоны. Активный сезон используется для сезонных рейтингов.",
  "Use a username and a password (min 6 chars).":
    "Используйте логин и пароль (минимум 6 символов).",
  "Invalid credentials.": "Неверные учетные данные.",
  "Username already exists.": "Такой логин уже существует.",
  "Invalid season data.": "Некорректные данные сезона.",
  "Invalid match data.": "Некорректные данные матча.",
  "Invalid player data.": "Некорректные данные игрока.",
  "Chat not found": "Чат не найден",
  "User not found": "Игрок не найден",
  "Result not found": "Результат не найден",
  "Match not found": "Матч не найден",
  "Season not found": "Сезон не найден",
  "Delete this season?": "Удалить этот сезон?",
  "Delete this match?": "Удалить этот матч?",
  "No admins yet. Create the initial admin account below.":
    "Пока нет админов. Создайте первого администратора ниже.",
  "Sign in with an existing admin account. If you need a new admin, ask an existing admin to add one.":
    "Войдите существующей админ-учеткой. Если нужен новый админ, попросите текущего админа добавить его.",
  "You are signed in. Admin tools are unlocked below.":
    "Вы вошли как админ. Инструменты доступны ниже.",
  "These logins control admin UI access.":
    "Эти аккаунты дают доступ к админ-интерфейсу.",
  "Admin accounts are stored in the database and use cookie sessions. Create the first admin once, then sign in here.":
    "Админ-аккаунты хранятся в базе и используют cookie-сессии. Один раз создайте первого админа, затем входите здесь.",
  Matches: "Матчи",
  Leaders: "Лидеры",
  "Shown / {shown} of {total}": "Показано {shown} из {total}",
  "Avg point diff": "Средняя разница очков",
  "Avg {value} / match": "Ср. {value} / матч",
  "Avg {value} / player": "Ср. {value} / игрок",
  Margin: "Разница",
  "Range {low} to {high}": "Диапазон {low} до {high}",
  "Closest match": "Ближайший матч",
  "Biggest win": "Крупнейшая победа",
  "Total points": "Всего очков",
  "Avg rating": "Средний рейтинг",
  "Last {date}": "Последний {date}",
  "Top rating": "Топ рейтинг",
  "Best win%": "Лучший win%",
  "Most games": "Больше всего игр",
  "Best diff": "Лучшая разница",
  "Serve side": "Сторона подачи",
  Side: "Сторона",
  Wins: "Победы",
  "No teams found.": "Команды не найдены.",
  Team: "Команда",
  Record: "Результат",
  "n/a": "н/д",
};

const replaceParams = (
  text: string,
  params: Record<string, string | number> = {},
) =>
  text.replace(/\{(\w+)}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });

function normalizeLocale(value: string | null | undefined): Locale {
  return value === "ru" ? "ru" : "en";
}

export const locale = writable<Locale>("en");

if (browser) {
  locale.set(normalizeLocale(localStorage.getItem(STORAGE_KEY)));
  locale.subscribe((value) => {
    localStorage.setItem(STORAGE_KEY, value);
    document.documentElement.lang = value;
  });
}

export function setLocale(value: string) {
  locale.set(normalizeLocale(value));
}

export const t = derived(locale, ($locale) => {
  return (text: string, params?: Record<string, string | number>) => {
    const translated = $locale === "ru" ? (ru[text] ?? text) : text;
    return replaceParams(translated, params);
  };
});

export const localeTag = derived(locale, ($locale) =>
  $locale === "ru" ? "ru-RU" : "en-US",
);
