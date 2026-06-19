/** Curated cocktail sets (flights). Reference recipe ids; missing ids are skipped at render. */
export interface CocktailSet {
  id: string;
  title: string; // Ukrainian
  subtitle: string;
  cocktailIds: string[];
}

export const CURATED_SETS: CocktailSet[] = [
  {
    id: "classics",
    title: "Класика",
    subtitle: "Must-have коктейлі",
    cocktailIds: ["margarita", "old-fashioned", "daiquiri", "whiskey-sour", "cosmopolitan", "mojito"],
  },
  {
    id: "gin-night",
    title: "Джиновий вечір",
    subtitle: "Усе на джині",
    cocktailIds: ["clover-club", "basil-smash", "tom-collins", "french-75", "gin-and-tonic", "southside"],
  },
  {
    id: "tropical",
    title: "Тропіки",
    subtitle: "Відпустка у склянці",
    cocktailIds: [
      "pina-colada",
      "sex-on-the-beach",
      "daiquiri",
      "singapore-sling",
      "tequila-sunrise",
      "golden-mai-tai",
    ],
  },
  {
    id: "refreshing",
    title: "Освіжаючі лонги",
    subtitle: "Легкі та довгі",
    cocktailIds: ["mojito", "tom-collins", "caipiroska", "cucumber-lemonade", "gin-and-tonic"],
  },
  {
    id: "bitter-strong",
    title: "Гіркі та міцні",
    subtitle: "Для поціновувачів",
    cocktailIds: ["old-fashioned", "boulevardier", "sazerac", "vieux-carre"],
  },
  {
    id: "sours",
    title: "Сауери",
    subtitle: "Кисло-солодкий баланс",
    cocktailIds: ["whiskey-sour", "amaretto-sour", "naked-and-famous", "paper-plane", "penicillin", "bees-knees"],
  },
  {
    id: "non-alc",
    title: "Без алкоголю",
    subtitle: "Смачно і твереза",
    cocktailIds: ["iliuziia-obmanu", "cucumber-lemonade", "persona", "orange-mood"],
  },
  {
    id: "date-night",
    title: "Вечір на двох",
    subtitle: "Романтичний сет",
    cocktailIds: ["margarita", "cosmopolitan", "french-75", "aviation"],
  },
  {
    id: "whiskey-lovers",
    title: "Для шанувальників віскі",
    subtitle: "Глибокі та витримані",
    cocktailIds: ["old-fashioned", "whiskey-sour", "penicillin", "boulevardier", "sazerac", "paper-plane"],
  },
  {
    id: "crowd-pleasers",
    title: "Хіти вечірки",
    subtitle: "Сподобаються всім",
    cocktailIds: ["margarita", "mojito", "cosmopolitan", "pina-colada", "sex-on-the-beach", "tequila-sunrise"],
  },
  {
    id: "creamy-dessert",
    title: "Десертні",
    subtitle: "Солодке завершення",
    cocktailIds: ["alexander", "grasshopper", "golden-dream", "raffaello", "b-52"],
  },
  {
    id: "showstoppers",
    title: "Шоу та ефекти",
    subtitle: "Вражають гостей",
    cocktailIds: ["smoke-cloud", "el-bandito", "napoleon-dynamite", "dark-side-of-the-moon"],
  },
];
