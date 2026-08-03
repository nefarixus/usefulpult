export type Lang = "ru" | "en";

export const translations = {
  ru: {
    app_title: "Пульт",

    tab_clock: "Время",
    tab_weather: "Погода",
    tab_currency: "Курс валют",
    tab_tasks: "Мои дела",
    tab_words: "Случайные слова",
    tab_settings: "Настройки",

    clock_title: "Сейчас",

    weather_title: "Погода",
    weather_locating: "определяю, где ты...",
    weather_auto_location: "по геолокации",
    weather_feels_like: "ощущается как",
    weather_now: "сейчас",
    weather_error: "не удалось получить погоду",
    weather_clear: "ясно",
    weather_partly_cloudy: "малооблачно",
    weather_cloudy: "облачно",
    weather_fog: "туман",
    weather_drizzle: "морось",
    weather_rain: "дождь",
    weather_snow: "снег",
    weather_storm: "гроза",
    weather_unknown: "погода",

    currency_title: "Курс валют",
    currency_loading: "получаю курсы...",
    currency_error: "курсы сейчас недоступны",

    tasks_title: "Мои дела",
    tasks_empty: "список пуст",
    tasks_placeholder: "добавить пункт...",

    words_title: "Случайные слова",
    words_button: "сгенерировать ещё",
    words_copied: "скопировано",

    settings_title: "Настройки",
    settings_theme: "Цветовая тема",
    settings_language: "Язык",
    settings_autostart: "Запускать вместе с Windows",

    theme_amber: "Янтарь",
    theme_ocean: "Океан",
    theme_forest: "Лес",
    theme_rose: "Роза",
    settings_custom_color: "свой цвет",

    city_search_placeholder: "город...",
    city_search_loading: "ищу...",
    city_search_error: "не удалось найти",
    city_search_empty: "ничего не нашлось",
    city_search_popular: "популярные города",
  },
  en: {
    app_title: "Pult",

    tab_clock: "Time",
    tab_weather: "Weather",
    tab_currency: "Exchange rates",
    tab_tasks: "My tasks",
    tab_words: "Random words",
    tab_settings: "Settings",

    clock_title: "Right now",

    weather_title: "Weather",
    weather_locating: "locating you...",
    weather_auto_location: "auto-detect",
    weather_feels_like: "feels like",
    weather_now: "now",
    weather_error: "couldn't load the weather",
    weather_clear: "clear",
    weather_partly_cloudy: "partly cloudy",
    weather_cloudy: "cloudy",
    weather_fog: "fog",
    weather_drizzle: "drizzle",
    weather_rain: "rain",
    weather_snow: "snow",
    weather_storm: "storm",
    weather_unknown: "weather",

    currency_title: "Exchange rates",
    currency_loading: "fetching rates...",
    currency_error: "rates unavailable right now",

    tasks_title: "My tasks",
    tasks_empty: "list is empty",
    tasks_placeholder: "add an item...",

    words_title: "Random words",
    words_button: "generate more",
    words_copied: "copied",

    settings_title: "Settings",
    settings_theme: "Color theme",
    settings_language: "Language",
    settings_autostart: "Launch with Windows",

    theme_amber: "Amber",
    theme_ocean: "Ocean",
    theme_forest: "Forest",
    theme_rose: "Rose",
    settings_custom_color: "custom color",

    city_search_placeholder: "city...",
    city_search_loading: "searching...",
    city_search_error: "search failed",
    city_search_empty: "no results",
    city_search_popular: "popular cities",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["ru"];

export const DAYS: Record<Lang, string[]> = {
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const DAYS_SHORT: Record<Lang, string[]> = {
  ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export const MONTHS: Record<Lang, string[]> = {
  ru: [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};
