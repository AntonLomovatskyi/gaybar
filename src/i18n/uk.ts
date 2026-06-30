/**
 * Ukrainian UI strings (app chrome only — recipe text is rendered verbatim from data).
 * Plain typed object for now; can be moved behind i18next (already a dep) when EN is added.
 */
export interface Strings {
  tabs: { collection: string; bar: string; shopping: string; favourites: string };
  common: {
    search: string;
    searchPlaceholder: string;
    filters: string;
    sort: string;
    clear: string;
    apply: string;
    cancel: string;
    all: string;
    none: string;
    add: string;
    remove: string;
    save: string;
    surprise: string;
  };
  sort: { card: string; name: string; strength: string; ingredients: string; rating: string };
  recipe: {
    ingredients: string;
    tools: string;
    glass: string;
    steps: string;
    start: string;
    rate: string;
    addToShopping: string;
    viewCard: string;
  };
  stepper: { step: string; of: string; back: string; next: string; done: string; finished: string; iMadeIt: string };
  bar: {
    title: string;
    ingredients: string;
    tools: string;
    whatCanIMake: string;
    makeable: string;
    almost: string;
    missing: string;
    addIngredient: string;
    empty: string;
  };
  shopping: { title: string; servings: string; people: string; empty: string; needed: string };
  favourites: { empty: string };
  home: { cocktailOfDay: string; forYou: string };
  sets: {
    tab: string;
    builder: string;
    curated: string;
    people: string;
    varieties: string;
    drinksPerPerson: string;
    localOnly: string;
    generate: string;
    total: string;
    plan: string;
    start: string;
    shoppingFor: string;
    cocktails: string;
    availLocal: string;
    availSpecialty: string;
    availRare: string;
    nextCocktail: string;
  };
}

export const t: Strings = {
  tabs: {
    collection: "Колекція",
    bar: "Мій бар",
    shopping: "Покупки",
    favourites: "Обране",
  },
  common: {
    search: "Пошук",
    searchPlaceholder: "Назва, інгредієнт…",
    filters: "Фільтри",
    sort: "Сортування",
    clear: "Очистити",
    apply: "Застосувати",
    cancel: "Скасувати",
    all: "Усі",
    none: "Нічого не знайдено",
    add: "Додати",
    remove: "Прибрати",
    save: "Зберегти",
    surprise: "Здивуй мене",
  },
  sort: {
    card: "За номером",
    name: "За назвою (А–Я)",
    strength: "За міцністю",
    ingredients: "За к-стю інгредієнтів",
    rating: "За оцінкою",
  },
  recipe: {
    ingredients: "Інгредієнти",
    tools: "Інструменти",
    glass: "Келих",
    steps: "Приготування",
    start: "Почати приготування",
    rate: "Оцінити",
    addToShopping: "Додати в покупки",
    viewCard: "Оригінал картки",
  },
  stepper: {
    step: "Крок",
    of: "з",
    back: "Назад",
    next: "Далі",
    done: "Готово",
    finished: "Смачного! 🍸",
    iMadeIt: "Я приготував(-ла)",
  },
  bar: {
    title: "Мій бар",
    ingredients: "Інгредієнти",
    tools: "Інструменти",
    whatCanIMake: "Що я можу приготувати",
    makeable: "Можна приготувати",
    almost: "Майже (бракує 1–2)",
    missing: "Бракує",
    addIngredient: "Додати інгредієнт",
    empty: "Додай інгредієнти, які маєш, щоб побачити, що можна зробити.",
  },
  shopping: {
    title: "Список покупок",
    servings: "Порцій",
    people: "Людей",
    empty: "Додай коктейлі, щоб скласти список.",
    needed: "Потрібно",
  },
  favourites: {
    empty: "Постав ♥ коктейлям, і вони з’являться тут.",
  },
  home: {
    cocktailOfDay: "Коктейль дня",
    forYou: "Для тебе",
  },
  sets: {
    tab: "Сети",
    builder: "Зібрати вечірку",
    curated: "Готові сети",
    people: "Людей",
    varieties: "Різних коктейлів",
    drinksPerPerson: "Напоїв на людину",
    localOnly: "Лише доступне в Чернівцях",
    generate: "Згенерувати сет",
    total: "Всього напоїв",
    plan: "План вечірки",
    start: "Почати готувати все",
    shoppingFor: "Закупівля на вечірку",
    cocktails: "Коктейлі",
    availLocal: "Доступно локально",
    availSpecialty: "Спеціалізований магазин",
    availRare: "Рідкісні інгредієнти",
    nextCocktail: "Наступний коктейль",
  },
};
