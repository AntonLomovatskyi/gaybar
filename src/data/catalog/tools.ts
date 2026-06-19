/**
 * Canonical bar tools & glassware with line icons (MaterialCommunityIcons) + Ukrainian
 * descriptions. `toolInfo(rawName)` folds the many OCR/spelling variants (Джигер/Джиггер/
 * Джиґер, Колінз/Коллінз, Ситечко/Файн…) onto one canonical entry for the tap-to-view sheet.
 */
import { normalize } from "@/domain/text";

export interface ToolInfo {
  id: string;
  nameUk: string;
  icon: string; // MaterialCommunityIcons glyph name
  kind: "tool" | "glass";
  desc: string;
}

type Entry = ToolInfo & { match: RegExp };

const CANON: Entry[] = [
  // ---- glassware (check before generic tool words) ----
  {
    id: "glass-flute",
    kind: "glass",
    icon: "glass-flute",
    nameUk: "Флюте",
    desc: "Високий вузький келих для ігристого.",
    match: /флюте/,
  },
  {
    id: "glass-coupe",
    kind: "glass",
    icon: "glass-cocktail",
    nameUk: "Шампанське блюдце",
    desc: "Широкий неглибокий келих на ніжці.",
    match: /блюдц|купе|келих сауер/,
  },
  {
    id: "glass-martini",
    kind: "glass",
    icon: "glass-cocktail",
    nameUk: "Коктейльний келих",
    desc: "Келих-конус на ніжці для коктейлів без льоду.",
    match: /мартіні|коктейльн\w* келих/,
  },
  {
    id: "glass-wine",
    kind: "glass",
    icon: "glass-wine",
    nameUk: "Келих для вина",
    desc: "Келих на ніжці для вина та спритців.",
    match: /келих для вина|бокал для вина/,
  },
  {
    id: "glass-collins",
    kind: "glass",
    icon: "glass-mug-variant",
    nameUk: "Колінз",
    desc: "Висока вузька склянка для лонгів.",
    match: /колінз|коллінз/,
  },
  {
    id: "glass-highball",
    kind: "glass",
    icon: "glass-mug-variant",
    nameUk: "Хайбол",
    desc: "Висока пряма склянка.",
    match: /хайбол/,
  },
  {
    id: "glass-sling",
    kind: "glass",
    icon: "glass-mug-variant",
    nameUk: "Слінг",
    desc: "Висока склянка для тропічних лонгів.",
    match: /слінг/,
  },
  {
    id: "glass-rocks",
    kind: "glass",
    icon: "cup",
    nameUk: "Рокс",
    desc: "Низька широка склянка (олд-фешен).",
    match: /рокс/,
  },
  {
    id: "glass-tiki",
    kind: "glass",
    icon: "glass-tulip",
    nameUk: "Тікі-келих",
    desc: "Декоративний келих для тікі-коктейлів.",
    match: /тікі/,
  },
  {
    id: "glass-hurricane",
    kind: "glass",
    icon: "glass-tulip",
    nameUk: "Харрікейн",
    desc: "Вигнутий високий келих.",
    match: /харрікейн/,
  },
  {
    id: "glass-shot",
    kind: "glass",
    icon: "cup",
    nameUk: "Чарка",
    desc: "Маленька склянка для шотів.",
    match: /чарка|шот|стопк/,
  },
  // ---- tools ----
  {
    id: "shaker",
    kind: "tool",
    icon: "shaker",
    nameUk: "Шейкер",
    desc: "Ємність для збивання коктейлів з льодом.",
    match: /шейкер/,
  },
  {
    id: "jigger",
    kind: "tool",
    icon: "beaker-outline",
    nameUk: "Джигер",
    desc: "Мірний стаканчик для точного дозування.",
    match: /джигер|джиггер|джиґер/,
  },
  {
    id: "fine-strainer",
    kind: "tool",
    icon: "filter-variant",
    nameUk: "Дрібне сито",
    desc: "Дрібне ситечко для подвійного проціджування.",
    match: /файн|ситечк|дрібне сито|сито/,
  },
  {
    id: "strainer",
    kind: "tool",
    icon: "filter-outline",
    nameUk: "Стрейнер",
    desc: "Фільтр-пружина для проціджування з шейкера.",
    match: /стрейнер/,
  },
  {
    id: "muddler",
    kind: "tool",
    icon: "silverware-variant",
    nameUk: "Мадлер",
    desc: "Товкачик для розминання інгредієнтів.",
    match: /мадлер/,
  },
  {
    id: "mixing-glass",
    kind: "tool",
    icon: "cup",
    nameUk: "Склянка для змішування",
    desc: "Склянка для перемішування (стиру).",
    match: /склянка для змішув|змішувальна склянка/,
  },
  {
    id: "bar-spoon",
    kind: "tool",
    icon: "spoon-sugar",
    nameUk: "Барна ложка",
    desc: "Довга ложка для перемішування.",
    match: /ложка/,
  },
  {
    id: "citrus-press",
    kind: "tool",
    icon: "fruit-citrus",
    nameUk: "Прес для цитрусових",
    desc: "Прес для вичавлювання цитрусового соку.",
    match: /прес для цитрус|сквізер|сквизер|сквіз/,
  },
  {
    id: "channel-knife",
    kind: "tool",
    icon: "knife",
    nameUk: "Ніж для цедри",
    desc: "Ніж для зрізання цедри.",
    match: /ніж для цедри|пиллер|пілер/,
  },
  { id: "knife", kind: "tool", icon: "knife", nameUk: "Ніж", desc: "Барний ніж.", match: /ніж/ },
  {
    id: "blender",
    kind: "tool",
    icon: "blender",
    nameUk: "Блендер",
    desc: "Блендер для змішування з льодом.",
    match: /блендер/,
  },
  {
    id: "torch",
    kind: "tool",
    icon: "torch",
    nameUk: "Пальник",
    desc: "Газовий пальник для карамелізації/підпалу.",
    match: /пальник/,
  },
  {
    id: "ice-scoop",
    kind: "tool",
    icon: "snowflake",
    nameUk: "Совок для льоду",
    desc: "Совок для набирання льоду.",
    match: /совок/,
  },
  {
    id: "pitcher",
    kind: "tool",
    icon: "cup-water",
    nameUk: "Глечик",
    desc: "Глечик/пітчер для подачі.",
    match: /глечик|пітчер|питчер/,
  },
  {
    id: "straws",
    kind: "tool",
    icon: "silverware-variant",
    nameUk: "Трубочки",
    desc: "Трубочки для подачі.",
    match: /трубочк/,
  },
  {
    id: "pick",
    kind: "tool",
    icon: "silverware-variant",
    nameUk: "Коктейльна шпажка",
    desc: "Шпажка для прикрас.",
    match: /шпажк/,
  },
  {
    id: "grater",
    kind: "tool",
    icon: "silverware-variant",
    nameUk: "Тертушка",
    desc: "Тертка (напр. для мускату).",
    match: /тертушк|тертк/,
  },
  {
    id: "sprayer",
    kind: "tool",
    icon: "spray-bottle",
    nameUk: "Спреєр",
    desc: "Спреєр для ароматизації.",
    match: /спреєр|спрей/,
  },
];

export const TOOL_BY_ID: Record<string, ToolInfo> = Object.fromEntries(CANON.map((t) => [t.id, t]));

export function toolInfo(raw: string): ToolInfo {
  const n = normalize(raw);
  for (const t of CANON) if (t.match.test(n)) return t;
  return { id: "other", nameUk: raw, icon: "silverware-variant", kind: "tool", desc: "Барний інструмент." };
}
