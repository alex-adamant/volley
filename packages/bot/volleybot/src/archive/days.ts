export interface Result {
  name: string;
  score: number;
}

export interface Game {
  A1: string;
  A2: string;
  B1: string;
  B2: string;
  pointsA: number;
  pointsB: number;
}

export interface Day {
  id: number;
  date: Date;
  games?: Game[][];
  results?: Result[][];
  playersIn?: string[];
  playersOut?: string[];
}

const stayedTop6 = 2.5 / 4; // 0.625
const relegatedTop6 = 1 / 4; // 0.25

const stayedTop5 = 8 / 3 / 4; // 0.6666666666666666
const relegatedTop5 = 1 / 4; // 0.25

const stayedTop4 = 52 / 90; // 0.5777777777777777
const relegatedTop4 = 8 / 30; // 0.26666666666666666

const stayedTopOneDown5 = 28 / 48; // 0.5833333333333334
const relegatedTopOneDown5 = 2 / 12; // 0.16666666666666666

const promoted6 = 3 / 4; // 0.75
const stayed6 = 2 / 4; // 0.5
const relegated6 = 1 / 4; // 0.25

const promotedTwoOne6 = 3 / 4; // 0.75
const stayedTwoOne6 = 4 / 3 / 3; // 0.4444444444444444
const relegatedTwoOne6 = 2 / 3 / 4; // 0.16666666666666666

const promoted5 = 3 / 4; // 0.75
const stayed5 = 2 / 4; // 0.5
const relegated5 = 1 / 4; // 0.25

const promotedTwoOne5 = 3 / 4; // 0.75
const stayedTwoOne5 = 10 / 3 / 2 / 4; // 0.4166666666666667
const relegatedTwoOne5 = 2 / 3 / 4; // 0.16666666666666666

const promoted4 = 19 / 30; // 0.6333333333333333
const relegated4 = 11 / 30; // 0.36666666666666664

const promoted7 = 3 / 4; // 0.75
const stayed7 = 2 / 4; // 0.5
const relegated7 = 1 / 4; // 0.25

const promotedTwoOne4 = 38 / 60; // 0.6333333333333333
const stayedTwoOne4 = 14 / 30; // 0.4666666666666667
const relegatedTwoOne4 = 8 / 30; // 0.26666666666666666

const promotedOneOne4 = 22 / 30; // 0.7333333333333333
const stayedOneOne4 = 30 / 60; // 0.5
const relegatedOneOne4 = 8 / 30; // 0.26666666666666666

const promotedBottom5 = 3 / 4; // 0.75
const stayedBottom5 = 4 / 3 / 4; // 0.33333333

const promotedBottom6 = 3 / 4; // 0.75
const stayedBottom6 = 6 / 16; // 0.375

const promotedBottom7 = 3 / 4; // 0.75
const stayedBottom7 = 2 / 5; // 0.4

const promotedBottom8 = 3 / 4; // 0.75
const stayedBottom8 = 2.5 / 6; // 0.4166666666666667

export const days: Day[] = [
  {
    id: 1,
    date: new Date("2022-10-30"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Сергей", score: stayedTop6 },
        { name: "Вова", score: stayedTop6 },
        { name: "Лёша", score: stayedTop6 },
        { name: "Игорь", score: relegatedTop6 },
        { name: "Тарас", score: relegatedTop6 },
      ],
      [
        { name: "Макс", score: promoted6 },
        { name: "Рома", score: promoted6 },
        { name: "Даня", score: stayed6 },
        { name: "Юра", score: stayed6 },
        { name: "Олег", score: relegated6 },
        { name: "Славик", score: relegated6 },
      ],
      [
        { name: "Никита", score: promoted5 },
        { name: "Влад", score: promoted5 },
        { name: "Андрей", score: stayed5 },
        { name: "Ира", score: relegated5 },
        { name: "Лиля", score: relegated5 },
      ],
      [
        { name: "Дима", score: promoted4 },
        { name: "Диана", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Таня", score: relegated4 },
      ],
    ],
  },
  {
    id: 2,
    date: new Date("2022-11-02"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Макс", score: stayedTop6 },
        { name: "Вова", score: stayedTop6 },
        { name: "Лёша", score: stayedTop6 },
        { name: "Игорь", score: relegatedTop6 },
        { name: "Рома", score: relegatedTop6 },
      ],
      [
        { name: "Вова 2", score: promoted5 },
        { name: "Юра", score: promoted5 },
        { name: "Влад", score: stayed5 },
        { name: "Даня", score: relegated5 },
        { name: "Олег", score: relegated5 },
      ],
      [
        { name: "Никита", score: promotedBottom5 },
        { name: "Дима", score: promotedBottom5 },
        { name: "Диана", score: stayedBottom5 },
        { name: "Юля", score: stayedBottom5 },
        { name: "Кирилл 2", score: stayedBottom5 },
      ],
    ],
  },

  {
    id: 3,
    date: new Date("2022-11-06"),
    results: [
      [
        { name: "Саша", score: stayedTop4 },
        { name: "Вова", score: stayedTop4 },
        { name: "Лёша", score: stayedTop4 },
        { name: "Рома", score: relegatedTop4 },
      ],
      [
        { name: "Тарас", score: promotedOneOne4 },
        { name: "Никита", score: stayedOneOne4 },
        { name: "Влад", score: stayedOneOne4 },
        { name: "Игорь", score: relegatedOneOne4 },
      ],
      [
        { name: "Диана", score: promotedOneOne4 },
        { name: "Олег", score: stayedOneOne4 },
        { name: "Дима", score: stayedOneOne4 },
        { name: "Славик", score: relegatedOneOne4 },
      ],
      [
        { name: "Андрей", score: promoted4 },
        { name: "Ира", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Лиля", score: relegated4 },
      ],
    ],
  },
  {
    id: 4,
    date: new Date("2022-11-13"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Макс", score: stayedTop6 },
        { name: "Вова", score: stayedTop6 },
        { name: "Сергей", score: stayedTop6 },
        { name: "Лёша", score: relegatedTop6 },
        { name: "Тарас", score: relegatedTop6 },
      ],
      [
        { name: "Никита", score: promoted5 },
        { name: "Диана", score: promoted5 },
        { name: "Рома", score: stayed5 },
        { name: "Юра", score: relegated5 },
        { name: "Даня", score: relegated5 },
      ],
      [
        { name: "Олег", score: promoted5 },
        { name: "Андрей", score: promoted5 },
        { name: "Игорь", score: stayed5 },
        { name: "Ира", score: relegated5 },
        { name: "Дима", score: relegated5 },
      ],
      [
        { name: "Славик", score: promoted4 },
        { name: "Лиля", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Кирилл 2", score: relegated4 },
      ],
    ],
  },
  {
    id: 5,
    date: new Date("2022-11-16"),
    results: [
      [
        { name: "Макс", score: stayedTop4 },
        { name: "Вова", score: stayedTop4 },
        { name: "Юра", score: stayedTop4 },
        { name: "Вова 2", score: relegatedTop4 },
      ],
      [
        { name: "Дима", score: promoted5 },
        { name: "Сергей", score: promoted5 },
        { name: "Игорь", score: stayed5 },
        { name: "Никита", score: relegated5 },
        { name: "Рома", score: relegated5 },
      ],
      [
        { name: "Олег", score: promotedBottom8 },
        { name: "Андрей", score: promotedBottom8 },
        { name: "Диана", score: stayedBottom8 },
        { name: "Даня", score: stayedBottom8 },
        { name: "Юля", score: stayedBottom8 },
        { name: "Ира", score: stayedBottom8 },
        { name: "Лиля", score: stayedBottom8 },
        { name: "Кирилл 2", score: stayedBottom8 },
      ],
    ],
  },
  {
    id: 6,
    date: new Date("2022-11-20"),
    results: [
      [
        { name: "Саша", score: stayedTop4 },
        { name: "Макс", score: stayedTop4 },
        { name: "Диана", score: stayedTop4 },
        { name: "Никита", score: relegatedTop4 },
      ],
      [
        { name: "Олег", score: promotedTwoOne5 },
        { name: "Андрей", score: promotedTwoOne5 },
        { name: "Тарас", score: stayedTwoOne5 },
        { name: "Рома", score: stayedTwoOne5 },
        { name: "Лёша", score: relegatedTwoOne5 },
      ],
      [
        { name: "Юра", score: promoted4 },
        { name: "Даня", score: promoted4 },
        { name: "Игорь", score: relegated4 },
        { name: "Славик", score: relegated4 },
      ],
      [
        { name: "Ира", score: promoted4 },
        { name: "Дима", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Таня", score: relegated4 },
      ],
    ],
  },
  {
    id: 7,
    date: new Date("2022-11-23"),
    playersIn: ["Олег 2"],
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Макс", score: stayedTop5 },
        { name: "Вова", score: stayedTop5 },
        { name: "Юра", score: relegatedTop5 },
        { name: "Дима", score: relegatedTop5 },
      ],
      [
        { name: "Вова 2", score: promotedTwoOne4 },
        { name: "Олег", score: promotedTwoOne4 },
        { name: "Андрей", score: stayedTwoOne4 },
        { name: "Лёша", score: relegatedTwoOne4 },
      ],
      [
        { name: "Никита", score: promotedBottom6 },
        { name: "Рома", score: promotedBottom6 },
        { name: "Диана", score: stayedBottom6 },
        { name: "Даня", score: stayedBottom6 },
        { name: "Ира", score: stayedBottom6 },
        { name: "Олег 2", score: stayedBottom6 },
      ],
    ],
  },
  {
    id: 8,
    date: new Date("2022-11-27"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Макс", score: stayedTop6 },
        { name: "Вова", score: stayedTop6 },
        { name: "Андрей", score: stayedTop6 },
        { name: "Диана", score: relegatedTop6 },
        { name: "Олег", score: relegatedTop6 },
      ],
      [
        { name: "Никита", score: promoted5 },
        { name: "Юра", score: promoted5 },
        { name: "Тарас", score: stayed5 },
        { name: "Рома", score: relegated5 },
        { name: "Сергей", score: relegated5 },
      ],
      [
        { name: "Дима", score: promotedBottom6 },
        { name: "Олег 2", score: promotedBottom6 },
        { name: "Влад", score: stayedBottom6 },
        { name: "Славик", score: stayedBottom6 },
        { name: "Юля", score: stayedBottom6 },
        { name: "Кирилл 2", score: stayedBottom6 },
      ],
    ],
  },
  {
    id: 9,
    date: new Date("2022-11-30"),
    results: [
      [
        { name: "Саша", score: stayedTop4 },
        { name: "Вова 2", score: stayedTop4 },
        { name: "Олег", score: stayedTop4 },
        { name: "Вова", score: relegatedTop4 },
      ],
      [
        { name: "Андрей", score: promoted6 },
        { name: "Рома", score: promoted6 },
        { name: "Дима", score: stayed6 },
        { name: "Игорь", score: stayed6 },
        { name: "Никита", score: relegated6 },
        { name: "Юра", score: relegated6 },
      ],
      [
        { name: "Олег 2", score: promotedBottom5 },
        { name: "Влад", score: promotedBottom5 },
        { name: "Лиля", score: stayedBottom5 },
        { name: "Юля", score: stayedBottom5 },
        { name: "Кирилл 2", score: stayedBottom5 },
      ],
    ],
  },
  {
    id: 10,
    date: new Date("2022-12-04"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Макс", score: stayedTop6 },
        { name: "Юра", score: stayedTop6 },
        { name: "Андрей", score: stayedTop6 },
        { name: "Никита", score: relegatedTop6 },
        { name: "Вова", score: relegatedTop6 },
      ],
      [
        { name: "Диана", score: promotedTwoOne6 },
        { name: "Тарас", score: promotedTwoOne6 },
        { name: "Олег", score: stayedTwoOne6 },
        { name: "Олег 2", score: stayedTwoOne6 },
        { name: "Даня", score: stayedTwoOne6 },
        { name: "Дима", score: relegatedTwoOne6 },
      ],
      [
        { name: "Игорь", score: promoted4 },
        { name: "Сергей", score: promoted4 },
        { name: "Рома", score: relegated4 },
        { name: "Ира", score: relegated4 },
      ],
      [
        { name: "Славик", score: 0.6 },
        { name: "Влад", score: 0.6 },
        { name: "Лиля", score: 0.3 },
      ],
    ],
  },
  {
    id: 11,
    date: new Date("2022-12-07"),
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Макс", score: stayedTop5 },
        { name: "Вова 2", score: stayedTop5 },
        { name: "Олег", score: relegatedTop5 },
        { name: "Андрей", score: relegatedTop5 },
      ],
      [
        { name: "Дима", score: promoted5 },
        { name: "Влад", score: promoted5 },
        { name: "Вова", score: stayed5 },
        { name: "Олег 2", score: stayed5 },
        { name: "Сергей", score: relegated5 },
        { name: "Игорь", score: relegated5 },
      ],
      [
        { name: "Юра", score: promotedBottom5 },
        { name: "Даня", score: promotedBottom5 },
        { name: "Ира", score: stayedBottom5 },
        { name: "Кирилл 2", score: stayedBottom5 },
        { name: "Юля", score: stayedBottom5 },
      ],
    ],
  },
  {
    id: 12,
    date: new Date("2022-12-11"),
    playersOut: ["Сергей"],
    results: [
      [
        { name: "Саша", score: stayedTop4 },
        { name: "Макс", score: stayedTop4 },
        { name: "Олег", score: stayedTop4 },
        { name: "Тарас", score: relegatedTop4 },
      ],
      [
        { name: "Вова", score: promoted5 },
        { name: "Даня", score: promoted5 },
        { name: "Игорь", score: stayed5 },
        { name: "Олег 2", score: relegated5 },
        { name: "Рома", score: relegated5 },
      ],
      [
        { name: "Кирилл 2", score: promotedBottom5 },
        { name: "Ира", score: promotedBottom5 },
        { name: "Славик", score: stayedBottom5 },
        { name: "Лиля", score: stayedBottom5 },
        { name: "Юля", score: stayedBottom5 },
      ],
    ],
  },
  {
    id: 13,
    date: new Date("2022-12-14"),
    playersIn: ["Кирилл"],
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Макс", score: stayedTop5 },
        { name: "Вова 2", score: stayedTop5 },
        { name: "Рома", score: relegatedTop5 },
        { name: "Влад", score: relegatedTop5 },
      ],
      [
        { name: "Вова", score: promoted5 },
        { name: "Олег 2", score: promoted5 },
        { name: "Олег", score: stayed5 },
        { name: "Андрей", score: relegated5 },
        { name: "Даня", score: relegated5 },
      ],
      [
        { name: "Тарас", score: promoted4 },
        { name: "Кирилл", score: promoted4 },
        { name: "Игорь", score: relegated4 },
        { name: "Юля", score: relegated4 },
      ],
    ],
  },

  // December 18
  {
    id: 14,
    date: new Date("2022-12-18"),
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Макс", score: stayedTop5 },
        { name: "Олег", score: stayedTop5 },
        { name: "Юра", score: relegatedTop5 },
        { name: "Вова", score: relegatedTop5 },
      ],
      [
        { name: "Андрей", score: promoted6 },
        { name: "Игорь", score: promoted6 },
        { name: "Тарас", score: stayed6 },
        { name: "Ира", score: stayed6 },
        { name: "Рома", score: relegated6 },
        { name: "Славик", score: relegated6 },
      ],
      [
        { name: "Дима", score: promotedBottom6 },
        { name: "Влад", score: promotedBottom6 },
        { name: "Кирилл", score: stayedBottom6 },
        { name: "Лиля", score: stayedBottom6 },
        { name: "Олег 2", score: stayedBottom6 },
        { name: "Юля", score: stayedBottom6 },
      ],
    ],
  },

  // December 21
  {
    id: 15,
    date: new Date("2022-12-21"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Макс", score: stayedTop6 },
        { name: "Дима", score: stayedTop6 },
        { name: "Вова", score: stayedTop6 },
        { name: "Олег 2", score: relegatedTop6 },
        { name: "Вова 2", score: relegatedTop6 },
      ],
      [
        { name: "Рома", score: promoted6 },
        { name: "Олег", score: promoted6 },
        { name: "Тарас", score: stayed6 },
        { name: "Кирилл", score: stayed6 },
        { name: "Влад", score: relegated6 },
        { name: "Юра", score: relegated6 },
      ],
      [
        { name: "Андрей", score: promotedBottom5 },
        { name: "Игорь", score: promotedBottom5 },
        { name: "Даня", score: stayedBottom5 },
        { name: "Ира", score: stayedBottom5 },
        { name: "Юля", score: stayedBottom5 },
      ],
    ],
  },

  // December 25
  {
    id: 16,
    date: new Date("2022-12-25"),

    playersOut: ["Вова 2"],
    results: [
      [
        { name: "Макс", score: stayedTop5 },
        { name: "Даня", score: stayedTop5 },
        { name: "Андрей", score: stayedTop5 },
        { name: "Олег", score: relegatedTop5 },
        { name: "Игорь", score: relegatedTop5 },
      ],
      [
        { name: "Вова", score: promoted5 },
        { name: "Дима", score: promoted5 },
        { name: "Тарас", score: stayed5 },
        { name: "Юра", score: relegated5 },
        { name: "Ира", score: relegated5 },
      ],
      [
        { name: "Славик", score: promoted4 },
        { name: "Кирилл", score: promoted4 },
        { name: "Рома", score: relegated4 },
        { name: "Юля", score: relegated4 },
      ],
    ],
  },

  // December 28
  {
    id: 17,
    date: new Date("2022-12-28"),

    playersIn: ["Алекс"],
    playersOut: ["Тарас"],
    results: [
      [
        { name: "Макс", score: stayedTop5 },
        { name: "Дима", score: stayedTop5 },
        { name: "Олег", score: stayedTop5 },
        { name: "Вова", score: relegatedTop5 },
        { name: "Рома", score: relegatedTop5 },
      ],
      [
        { name: "Кирилл", score: promotedTwoOne4 },
        { name: "Юра", score: promotedTwoOne4 },
        { name: "Андрей", score: stayedTwoOne4 },
        { name: "Игорь", score: relegatedTwoOne4 },
      ],
      [
        { name: "Ира", score: promotedBottom6 },
        { name: "Лёша", score: promotedBottom6 },
        { name: "Влад", score: stayedBottom6 },
        { name: "Даня", score: stayedBottom6 },
        { name: "Юля", score: stayedBottom6 },
        { name: "Алекс", score: stayedBottom6 },
      ],
    ],
  },

  // January 4
  {
    id: 18,
    date: new Date("2023-01-04"),

    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Макс", score: stayedTop6 },
        { name: "Дима", score: stayedTop6 },
        { name: "Олег", score: stayedTop6 },
        { name: "Кирилл", score: relegatedTop6 },
        { name: "Юра", score: relegatedTop6 },
      ],
      [
        { name: "Вова", score: promotedTwoOne5 },
        { name: "Рома", score: promotedTwoOne5 },
        { name: "Лёша", score: stayedTwoOne5 },
        { name: "Андрей", score: stayedTwoOne5 },
        { name: "Ира", score: relegatedTwoOne5 },
      ],
      [
        { name: "Влад", score: promoted4 },
        { name: "Даня", score: promoted4 },
        { name: "Игорь", score: relegated4 },
        { name: "Алекс", score: relegated4 },
      ],
    ],
  },

  // January 8
  {
    id: 19,
    date: new Date("2023-01-08"),

    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Вова", score: stayedTop6 },
        { name: "Даня", score: stayedTop6 },
        { name: "Андрей", score: stayedTop6 },
        { name: "Макс", score: relegatedTop6 },
        { name: "Дима", score: relegatedTop6 },
      ],
      [
        { name: "Олег", score: promotedTwoOne5 },
        { name: "Кирилл", score: promotedTwoOne5 },
        { name: "Влад", score: stayedTwoOne5 },
        { name: "Игорь", score: stayedTwoOne5 },
        { name: "Славик", score: relegatedTwoOne5 },
      ],
      [
        { name: "Юра", score: promotedBottom5 },
        { name: "Лиля", score: promotedBottom5 },
        { name: "Рома", score: stayedBottom5 },
        { name: "Таня", score: stayedBottom5 },
        { name: "Юля", score: stayedBottom5 },
      ],
    ],
  },

  // January 11
  {
    id: 20,
    date: new Date("2023-01-11"),

    playersOut: ["Макс"],
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Вова", score: stayedTop5 },
        { name: "Дима", score: stayedTop5 },
        { name: "Олег", score: relegatedTop5 },
        { name: "Рома", score: relegatedTop5 },
      ],
      [
        { name: "Кирилл", score: promoted5 },
        { name: "Андрей", score: promoted5 },
        { name: "Влад", score: stayed5 },
        { name: "Юра", score: relegated5 },
        { name: "Даня", score: relegated5 },
      ],
      [
        { name: "Олег 2", score: promoted4 },
        { name: "Ира", score: promoted4 },
        { name: "Игорь", score: relegated4 },
        { name: "Юля", score: relegated4 },
      ],
    ],
  },

  // January 15
  {
    id: 21,
    date: new Date("2023-01-15"),

    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Даня", score: stayedTop6 },
        { name: "Андрей", score: stayedTop6 },
        { name: "Кирилл", score: stayedTop6 },
        { name: "Олег", score: relegatedTop6 },
        { name: "Вова", score: relegatedTop6 },
      ],
      [
        { name: "Юра", score: promoted5 },
        { name: "Дима", score: promoted5 },
        { name: "Игорь", score: stayed5 },
        { name: "Лиля", score: relegated5 },
        { name: "Влад", score: relegated5 },
      ],
      [
        { name: "Славик", score: promoted4 },
        { name: "Рома", score: promoted4 },
        { name: "Таня", score: relegated4 },
        { name: "Олег 2", score: relegated4 },
      ],
    ],
  },

  // January 18
  {
    id: 22,
    date: new Date("2023-01-18"),

    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Вова", score: stayedTop5 },
        { name: "Рома", score: stayedTop5 },
        { name: "Дима", score: relegatedTop5 },
        { name: "Андрей", score: relegatedTop5 },
      ],
      [
        { name: "Олег 2", score: promoted6 },
        { name: "Юра", score: promoted6 },
        { name: "Игорь", score: stayed6 },
        { name: "Даня", score: stayed6 },
        { name: "Ира", score: relegated6 },
        { name: "Алекс", score: relegated6 },
      ],
    ],
  },

  // January 22
  {
    id: 23,
    date: new Date("2023-01-22"),

    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Дима", score: stayedTop5 },
        { name: "Кирилл", score: stayedTop5 },
        { name: "Юра", score: relegatedTop5 },
        { name: "Андрей", score: relegatedTop5 },
      ],
      [
        { name: "Олег", score: promotedTwoOne5 },
        { name: "Вова", score: promotedTwoOne5 },
        { name: "Славик", score: stayedTwoOne5 },
        { name: "Рома", score: stayedTwoOne5 },
        { name: "Игорь", score: relegatedTwoOne5 },
      ],
      [
        { name: "Влад", score: promotedBottom5 },
        { name: "Олег 2", score: promotedBottom5 },
        { name: "Юля", score: stayedBottom5 },
        { name: "Таня", score: stayedBottom5 },
        { name: "Лиля", score: stayedBottom5 },
      ],
    ],
  },

  // January 25
  {
    id: 24,
    date: new Date("2023-01-25"),

    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Олег 2", score: stayedTop5 },
        { name: "Кирилл", score: stayedTop5 },
        { name: "Юра", score: relegatedTop5 },
        { name: "Дима", score: relegatedTop5 },
      ],
      [
        { name: "Игорь", score: promoted6 },
        { name: "Андрей", score: promoted6 },
        { name: "Олег", score: stayed6 },
        { name: "Влад", score: stayed6 },
        { name: "Юля", score: relegated6 },
        { name: "Алекс", score: relegated6 },
      ],
    ],
  },

  // January 29
  {
    id: 25,
    date: new Date("2023-01-29"),

    playersIn: ["Жора"],
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Дима", score: stayedTop5 },
        { name: "Даня", score: stayedTop5 },
        { name: "Кирилл", score: relegatedTop5 },
        { name: "Олег", score: relegatedTop5 },
      ],
      [
        { name: "Юра", score: promoted5 },
        { name: "Олег 2", score: promoted5 },
        { name: "Андрей", score: stayed5 },
        { name: "Славик", score: relegated5 },
        { name: "Влад", score: relegated5 },
      ],
      [
        { name: "Игорь", score: promoted4 },
        { name: "Жора", score: promoted4 },
        { name: "Лиля", score: relegated4 },
        { name: "Юля", score: relegated4 },
      ],
    ],
  },

  // February 1
  {
    id: 26,
    date: new Date("2023-02-01"),

    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Кирилл", score: stayedTop5 },
        { name: "Андрей", score: stayedTop5 },
        { name: "Олег 2", score: relegatedTop5 },
        { name: "Вова", score: relegatedTop5 },
      ],
      [
        { name: "Даня", score: promotedTwoOne4 },
        { name: "Юра", score: promotedTwoOne4 },
        { name: "Олег", score: stayedTwoOne4 },
        { name: "Дима", score: relegatedTwoOne4 },
      ],
      [
        { name: "Жора", score: promoted4 },
        { name: "Лёша", score: promoted4 },
        { name: "Влад", score: relegated4 },
        { name: "Алекс", score: relegated4 },
      ],
    ],
  },

  // February 5
  {
    id: 27,
    date: new Date("2023-02-05"),
    results: [
      [
        { name: "Саша", score: stayedTopOneDown5 },
        { name: "Дима", score: stayedTopOneDown5 },
        { name: "Даня", score: stayedTopOneDown5 },
        { name: "Юра", score: stayedTopOneDown5 },
        { name: "Олег 2", score: relegatedTopOneDown5 },
      ],
      [
        { name: "Кирилл", score: promoted6 },
        { name: "Олег", score: promoted6 },
        { name: "Игорь", score: stayed6 },
        { name: "Жора", score: stayed6 },
        { name: "Андрей", score: relegated6 },
        { name: "Рома", score: relegated6 },
      ],
      [
        { name: "Влад", score: promoted4 },
        { name: "Кирилл 2", score: promoted4 },
        { name: "Славик", score: relegated4 },
        { name: "Юля", score: relegated4 },
      ],
    ],
  },

  // February 8
  {
    id: 28,
    date: new Date("2023-02-08"),

    results: [
      [
        { name: "Кирилл", score: stayedTop5 },
        { name: "Игорь", score: stayedTop5 },
        { name: "Даня", score: stayedTop5 },
        { name: "Андрей", score: relegatedTop5 },
        { name: "Юра", score: relegatedTop5 },
      ],
      [
        { name: "Олег", score: promoted5 },
        { name: "Олег 2", score: promoted5 },
        { name: "Рома", score: stayed5 },
        { name: "Лёша", score: relegated5 },
        { name: "Жора", score: relegated5 },
      ],
      [
        { name: "Влад", score: promotedBottom5 },
        { name: "Диана", score: promotedBottom5 },
        { name: "Алекс", score: stayedBottom5 },
        { name: "Никита", score: stayedBottom5 },
        { name: "Юля", score: stayedBottom5 },
      ],
    ],
  },

  // February 19
  {
    id: 29,
    date: new Date("2023-02-19"),
    playersOut: ["Алекс"],
    results: [
      [
        { name: "Саша", score: stayedTop4 },
        { name: "Дима", score: stayedTop4 },
        { name: "Кирилл", score: stayedTop4 },
        { name: "Юра", score: relegatedTop4 },
      ],
      [
        { name: "Андрей", score: promoted5 },
        { name: "Жора", score: promoted5 },
        { name: "Влад", score: stayed5 },
        { name: "Вова", score: relegated5 },
        { name: "Игорь", score: relegated5 },
      ],
      [
        { name: "Лёша", score: promotedBottom6 },
        { name: "Рома", score: promotedBottom6 },
        { name: "Ира", score: stayedBottom6 },
        { name: "Юля", score: stayedBottom6 },
        { name: "Лиля", score: stayedBottom6 },
        { name: "Таня", score: stayedBottom6 },
      ],
    ],
  },

  // February 22
  {
    id: 30,
    date: new Date("2023-02-22"),
    results: [
      [
        { name: "Саша", score: stayedTop4 },
        { name: "Кирилл", score: stayedTop4 },
        { name: "Игорь", score: stayedTop4 },
        { name: "Олег", score: relegatedTop4 },
      ],
      [
        { name: "Андрей", score: promotedTwoOne4 },
        { name: "Юра", score: promotedTwoOne4 },
        { name: "Влад", score: stayedTwoOne4 },
        { name: "Диана", score: relegatedTwoOne4 },
      ],
      [
        { name: "Жора", score: promoted4 },
        { name: "Вова", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Ира", score: relegated4 },
      ],
    ],
  },

  // February 26
  {
    id: 31,
    date: new Date("2023-02-26"),
    results: [
      [
        { name: "Саша", score: stayedTopOneDown5 },
        { name: "Андрей", score: stayedTopOneDown5 },
        { name: "Кирилл", score: stayedTopOneDown5 },
        { name: "Жора", score: stayedTopOneDown5 },
        { name: "Дима", score: relegatedTopOneDown5 },
      ],
      [
        { name: "Юра", score: promoted6 },
        { name: "Влад", score: promoted6 },
        { name: "Рома", score: stayed6 },
        { name: "Лёша", score: stayed6 },
        { name: "Олег", score: relegated6 },
        { name: "Кирилл 2", score: relegated6 },
      ],
      [
        { name: "Вова", score: promotedBottom5 },
        { name: "Игорь", score: promotedBottom5 },
        { name: "Юля", score: stayedBottom5 },
        { name: "Лиля", score: stayedBottom5 },
        { name: "Славик", score: stayedBottom5 },
      ],
    ],
  },

  // March 1
  {
    id: 32,
    date: new Date("2023-03-01"),
    playersOut: ["Кирилл 2"],
    results: [
      [
        { name: "Андрей", score: stayedTop4 },
        { name: "Юра", score: stayedTop4 },
        { name: "Кирилл", score: stayedTop4 },
        { name: "Игорь", score: relegatedTop4 },
      ],
      [
        { name: "Олег", score: promoted6 },
        { name: "Жора", score: promoted6 },
        { name: "Рома", score: stayed6 },
        { name: "Вова", score: stayed6 },
        { name: "Ира", score: relegated6 },
        { name: "Юля", score: relegated6 },
      ],
    ],
  },

  // March 8
  {
    id: 33,
    date: new Date("2023-03-08"),
    playersIn: ["Дима 2"],
    playersOut: ["Кирилл"],
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Олег", score: stayedTop6 },
        { name: "Жора", score: stayedTop6 },
        { name: "Юра", score: stayedTop6 },
        { name: "Андрей", score: relegatedTop6 },
        { name: "Игорь", score: relegatedTop6 },
      ],
      [
        { name: "Славик", score: promoted7 },
        { name: "Дима 2", score: promoted7 },
        { name: "Дима", score: stayed7 },
        { name: "Рома", score: stayed7 },
        { name: "Влад", score: stayed7 },
        { name: "Юля", score: relegated7 },
        { name: "Вова", score: relegated7 },
      ],
    ],
  },

  // March 12
  {
    id: 34,
    date: new Date("2023-03-12"),
    results: [
      [
        { name: "Саша", score: stayedTop4 },
        { name: "Жора", score: stayedTop4 },
        { name: "Андрей", score: stayedTop4 },
        { name: "Влад", score: relegatedTop4 },
      ],
      [
        { name: "Олег", score: promoted6 },
        { name: "Игорь", score: promoted6 },
        { name: "Лёша", score: stayed6 },
        { name: "Вова", score: stayed6 },
        { name: "Рома", score: relegated6 },
        { name: "Даня", score: relegated6 },
      ],
      [
        { name: "Ира", score: promoted4 },
        { name: "Славик", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Лиля", score: relegated4 },
      ],
    ],
  },

  // March 15
  {
    id: 35,
    date: new Date("2023-03-15"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Олег", score: stayedTop6 },
        { name: "Жора", score: stayedTop6 },
        { name: "Дима 2", score: stayedTop6 },
        { name: "Славик", score: relegatedTop6 },
        { name: "Юра", score: relegatedTop6 },
      ],
      [
        { name: "Игорь", score: promoted6 },
        { name: "Андрей", score: promoted6 },
        { name: "Дима", score: stayed6 },
        { name: "Влад", score: stayed6 },
        { name: "Рома", score: relegated6 },
        { name: "Даня", score: relegated6 },
      ],
      [
        { name: "Ира", score: promoted4 },
        { name: "Вова", score: promoted4 },
        { name: "Олег 2", score: relegated4 },
        { name: "Юля", score: relegated4 },
      ],
    ],
  },

  // March 19
  {
    id: 36,
    date: new Date("2023-03-19"),
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Олег", score: stayedTop6 },
        { name: "Андрей", score: stayedTop6 },
        { name: "Игорь", score: stayedTop6 },
        { name: "Юра", score: relegatedTop6 },
        { name: "Жора", score: relegatedTop6 },
      ],
      [
        { name: "Лёша", score: promoted5 },
        { name: "Вова", score: promoted5 },
        { name: "Дима", score: stayed5 },
        { name: "Влад", score: relegated5 },
        { name: "Ира", score: relegated5 },
      ],
      [
        { name: "Дима 2", score: promotedBottom6 },
        { name: "Диана", score: promotedBottom6 },
        { name: "Рома", score: stayedBottom6 },
        { name: "Никита", score: stayedBottom6 },
        { name: "Даня", score: stayedBottom6 },
        { name: "Олег 2", score: stayedBottom6 },
      ],
    ],
  },

  // March 22
  {
    id: 37,
    date: new Date("2023-03-22"),
    results: [
      [
        { name: "Игорь", score: stayedTop5 },
        { name: "Юра", score: stayedTop5 },
        { name: "Дима 2", score: stayedTop5 },
        { name: "Жора", score: relegatedTop5 },
        { name: "Андрей", score: relegatedTop5 },
      ],
      [
        { name: "Олег 2", score: promoted6 },
        { name: "Вова", score: promoted6 },
        { name: "Дима", score: stayed6 },
        { name: "Ира", score: stayed6 },
        { name: "Влад", score: relegated6 },
        { name: "Юля", score: relegated6 },
      ],
    ],
  },

  // March 26
  {
    id: 38,
    date: new Date("2023-03-26"),
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Игорь", score: stayedTop5 },
        { name: "Вова", score: stayedTop5 },
        { name: "Олег", score: relegatedTop5 },
        { name: "Андрей", score: relegatedTop5 },
      ],
      [
        { name: "Дима", score: promoted6 },
        { name: "Дима 2", score: promoted6 },
        { name: "Юра", score: stayed6 },
        { name: "Славик", score: stayed6 },
        { name: "Жора", score: relegated6 },
        { name: "Диана", score: relegated6 },
      ],
      [
        { name: "Рома", score: promotedBottom6 },
        { name: "Олег 2", score: promotedBottom6 },
        { name: "Ира", score: stayedBottom6 },
        { name: "Никита", score: stayedBottom6 },
        { name: "Юля", score: stayedBottom6 },
        { name: "Лиля", score: stayedBottom6 },
      ],
    ],
  },

  // March 29
  {
    id: 39,
    date: new Date("2023-03-29"),
    playersIn: ["Коля"],
    results: [
      [
        { name: "Саша", score: stayedTopOneDown5 },
        { name: "Дима 2", score: stayedTopOneDown5 },
        { name: "Олег 2", score: stayedTopOneDown5 },
        { name: "Вова", score: stayedTopOneDown5 },
        { name: "Игорь", score: relegatedTopOneDown5 },
      ],
      [
        { name: "Андрей", score: promotedBottom5 },
        { name: "Дима", score: promotedBottom5 },
        { name: "Жора", score: stayedBottom5 },
        { name: "Ира", score: stayedBottom5 },
        { name: "Олег", score: stayedBottom5 },
      ],
      [
        { name: "Влад", score: promoted4 },
        { name: "Рома", score: promoted4 },
        { name: "Коля", score: relegated4 },
        { name: "Юля", score: relegated4 },
      ],
    ],
  },

  // April 2
  {
    date: new Date("2023-04-02"),
    id: 40,
    results: [
      [
        { name: "Саша", score: stayedTop6 },
        { name: "Дима 2", score: stayedTop6 },
        { name: "Игорь", score: stayedTop6 },
        { name: "Лёша", score: stayedTop6 },
        { name: "Вова", score: relegatedTop6 },
        { name: "Дима", score: relegatedTop6 },
      ],
      [
        { name: "Андрей", score: promoted6 },
        { name: "Рома", score: promoted6 },
        { name: "Юра", score: stayed6 },
        { name: "Славик", score: stayed6 },
        { name: "Олег", score: relegated6 },
        { name: "Олег 2", score: relegated6 },
      ],
      [
        { name: "Жора", score: promotedBottom7 },
        { name: "Влад", score: promotedBottom7 },
        { name: "Диана", score: stayedBottom7 },
        { name: "Ира", score: stayedBottom7 },
        { name: "Никита", score: stayedBottom7 },
        { name: "Таня", score: stayedBottom7 },
        { name: "Лиля", score: stayedBottom7 },
      ],
    ],
  },

  // April 5
  {
    id: 41,
    date: new Date("2023-04-05"),
    results: [
      [
        { name: "Вова", score: stayedTop6 },
        { name: "Дима 2", score: stayedTop6 },
        { name: "Юра", score: stayedTop6 },
        { name: "Андрей", score: stayedTop6 },
        { name: "Олег 2", score: relegatedTop6 },
        { name: "Дима", score: relegatedTop6 },
      ],
      [
        { name: "Игорь", score: promoted7 },
        { name: "Олег", score: promoted7 },
        { name: "Влад", score: stayed7 },
        { name: "Жора", score: stayed7 },
        { name: "Рома", score: stayed7 },
        { name: "Ира", score: relegated7 },
        { name: "Юля", score: relegated7 },
      ],
    ],
  },

  // April 9
  {
    id: 42,
    date: new Date("2023-04-09"),
    results: [
      [
        { name: "Саша", score: 34 / 3 / 20 },
        { name: "Дима 2", score: 34 / 3 / 20 },
        { name: "Андрей", score: 34 / 3 / 20 },
        { name: "Игорь", score: 34 / 3 / 20 },
        { name: "Лёша", score: 34 / 3 / 20 },
        { name: "Рома", score: 2 / 12 },
      ],
      [
        { name: "Вова", score: promotedTwoOne6 },
        { name: "Жора", score: promotedTwoOne6 },
        { name: "Влад", score: stayedTwoOne6 },
        { name: "Славик", score: stayedTwoOne6 },
        { name: "Дима", score: stayedTwoOne6 },
        { name: "Юра", score: relegatedTwoOne6 },
      ],
      [
        { name: "Олег", score: 0.75 },
        { name: "Диана", score: 0.75 },
        { name: "Олег 2", score: 3 / 7 },
        { name: "Никита", score: 3 / 7 },
        { name: "Даня", score: 3 / 7 },
        { name: "Ира", score: 3 / 7 },
        { name: "Таня", score: 3 / 7 },
        { name: "Лиля", score: 3 / 7 },
        { name: "Коля", score: 3 / 7 },
      ],
    ],
  },

  // April 12
  {
    id: 43,
    date: new Date("2023-04-12"),
    playersOut: ["Коля", "Дима 2"],
    results: [
      [
        { name: "Олег 2", score: stayedTop5 },
        { name: "Андрей", score: stayedTop5 },
        { name: "Олег", score: stayedTop5 },
        { name: "Вова", score: relegatedTop5 },
        { name: "Юра", score: relegatedTop5 },
      ],
      [
        { name: "Жора", score: promotedBottom6 },
        { name: "Даня", score: promotedBottom6 },
        { name: "Юля", score: stayedBottom6 },
        { name: "Дима", score: stayedBottom6 },
        { name: "Влад", score: stayedBottom6 },
        { name: "Ира", score: stayedBottom6 },
      ],
    ],
  },

  // April 16
  {
    id: 44,
    date: new Date("2023-04-16"),
    results: [
      [
        { name: "Саша", score: stayedTop5 },
        { name: "Андрей", score: stayedTop5 },
        { name: "Жора", score: stayedTop5 },
        { name: "Лёша", score: relegatedTop5 },
        { name: "Вова", score: relegatedTop5 },
      ],
      [
        { name: "Влад", score: promoted5 },
        { name: "Олег", score: promoted5 },
        { name: "Рома", score: stayed5 },
        { name: "Славик", score: relegated5 },
        { name: "Диана", score: relegated5 },
      ],
      [
        { name: "Даня", score: promotedBottom8 },
        { name: "Никита", score: promotedBottom8 },
        { name: "Юра", score: stayedBottom8 },
        { name: "Ира", score: stayedBottom8 },
        { name: "Юля", score: stayedBottom8 },
        { name: "Олег 2", score: stayedBottom8 },
        { name: "Таня", score: stayedBottom8 },
        { name: "Лиля", score: stayedBottom8 },
      ],
    ],
  },

  // April 19
  {
    id: 45,
    date: new Date("2023-04-19"),
    results: [
      [
        { name: "Жора", score: stayedTop5 },
        { name: "Андрей", score: stayedTop5 },
        { name: "Игорь", score: stayedTop5 },
        { name: "Олег 2", score: relegatedTop5 },
        { name: "Даня", score: relegatedTop5 },
      ],
      [
        { name: "Ира", score: 0.6 },
        { name: "Юра", score: 0.6 },
        { name: "Рома", score: 0.3 },
      ],
    ],
  },
  // April 23
  {
    id: 46,
    date: new Date("2023-04-23"),
    results: [
      [
        { name: "Даня", score: promotedTwoOne6 },
        { name: "Славик", score: promotedTwoOne6 },
        { name: "Диана", score: stayedTwoOne6 },
        { name: "Лёша", score: stayedTwoOne6 },
        { name: "Рома", score: stayedTwoOne6 },
        { name: "Никита", score: relegatedTwoOne6 },
      ],
      [
        { name: "Ира", score: promotedBottom6 },
        { name: "Олег 2", score: promotedBottom6 },
        { name: "Юля", score: stayedBottom6 },
        { name: "Юра", score: stayedBottom6 },
        { name: "Лиля", score: stayedBottom6 },
        { name: "Таня", score: stayedBottom6 },
      ],
    ],
  },
  // April 26
  {
    id: 47,
    date: new Date("2023-04-26"),
    playersOut: ["Олег", "Диана", "Никита"],
    results: [
      [
        { name: "Рома", score: promoted4 },
        { name: "Вова", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Влад", score: relegated4 },
      ],
    ],
  },
  // April 30
  {
    id: 48,
    date: new Date("2023-04-30"),
    playersIn: ["Мага"],
    results: [
      [
        { name: "Юля", score: promoted4 },
        { name: "Мага", score: promoted4 },
        { name: "Лиля", score: relegated4 },
        { name: "Таня", score: relegated4 },
      ],
    ],
  },
  // May 3
  {
    id: 49,
    date: new Date("2023-05-03"),
    results: [
      [
        { name: "Ира", score: promoted4 },
        { name: "Олег 2", score: promoted4 },
        { name: "Юля", score: relegated4 },
        { name: "Мага", score: relegated4 },
      ],
    ],
  },
];
