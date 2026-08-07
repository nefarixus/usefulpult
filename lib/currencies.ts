export type Currency = { code: string; ru: string; en: string };

// Matches what open.er-api.com (ExchangeRate-API's free open-access
// endpoint) supports — includes RUB, unlike the ECB-based Frankfurter
// API this used to run on.
export const CURRENCIES: Currency[] = [
  { code: "USD", ru: "Доллар США", en: "US Dollar" },
  { code: "EUR", ru: "Евро", en: "Euro" },
  { code: "RUB", ru: "Российский рубль", en: "Russian Ruble" },
  { code: "GBP", ru: "Фунт стерлингов", en: "British Pound" },
  { code: "JPY", ru: "Японская иена", en: "Japanese Yen" },
  { code: "CHF", ru: "Швейцарский франк", en: "Swiss Franc" },
  { code: "CNY", ru: "Китайский юань", en: "Chinese Yuan" },
  { code: "AUD", ru: "Австралийский доллар", en: "Australian Dollar" },
  { code: "CAD", ru: "Канадский доллар", en: "Canadian Dollar" },
  { code: "TRY", ru: "Турецкая лира", en: "Turkish Lira" },
  { code: "PLN", ru: "Польский злотый", en: "Polish Zloty" },
  { code: "SEK", ru: "Шведская крона", en: "Swedish Krona" },
  { code: "NOK", ru: "Норвежская крона", en: "Norwegian Krone" },
  { code: "DKK", ru: "Датская крона", en: "Danish Krone" },
  { code: "INR", ru: "Индийская рупия", en: "Indian Rupee" },
  { code: "KRW", ru: "Южнокорейская вона", en: "South Korean Won" },
  { code: "BRL", ru: "Бразильский реал", en: "Brazilian Real" },
  { code: "MXN", ru: "Мексиканское песо", en: "Mexican Peso" },
  { code: "ZAR", ru: "Южноафриканский рэнд", en: "South African Rand" },
  { code: "HKD", ru: "Гонконгский доллар", en: "Hong Kong Dollar" },
  { code: "SGD", ru: "Сингапурский доллар", en: "Singapore Dollar" },
  { code: "NZD", ru: "Новозеландский доллар", en: "New Zealand Dollar" },
  { code: "CZK", ru: "Чешская крона", en: "Czech Koruna" },
  { code: "HUF", ru: "Венгерский форинт", en: "Hungarian Forint" },
  { code: "ILS", ru: "Израильский шекель", en: "Israeli Shekel" },
  { code: "RON", ru: "Румынский лей", en: "Romanian Leu" },
  { code: "THB", ru: "Тайский бат", en: "Thai Baht" },
  { code: "IDR", ru: "Индонезийская рупия", en: "Indonesian Rupiah" },
  { code: "MYR", ru: "Малайзийский ринггит", en: "Malaysian Ringgit" },
  { code: "PHP", ru: "Филиппинское песо", en: "Philippine Peso" },
  { code: "BGN", ru: "Болгарский лев", en: "Bulgarian Lev" },
  { code: "ISK", ru: "Исландская крона", en: "Icelandic Krona" },
];
