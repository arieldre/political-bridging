export interface QuestionOption {
  value: number; // 0-4 (Likert) or arbitrary for hobby cards
  label: string;
}

export interface Question {
  id: string;
  section: 'hobbies' | 'values' | 'politics';
  axis?: 'security' | 'religion' | 'economics'; // politics only
  type: 'multiselect' | 'likert' | 'scale';
  text: string;
  subtext?: string;
  leftLabel?: string;  // for scale: left pole
  rightLabel?: string; // for scale: right pole
  options?: QuestionOption[]; // for multiselect
  weight?: number; // for scoring, default 1.0
}

export const HOBBY_OPTIONS = [
  { id: 'hiking', label: 'טיולים וטבע', emoji: '🥾' },
  { id: 'cooking', label: 'בישול ואוכל', emoji: '🍳' },
  { id: 'gaming', label: 'גיימינג', emoji: '🎮' },
  { id: 'sports', label: 'ספורט', emoji: '⚽' },
  { id: 'reading', label: 'קריאה', emoji: '📚' },
  { id: 'music', label: 'מוזיקה', emoji: '🎵' },
  { id: 'travel', label: 'טיולים בחו"ל', emoji: '✈️' },
  { id: 'photography', label: 'צילום', emoji: '📷' },
  { id: 'diy', label: 'עשה זאת בעצמך', emoji: '🔧' },
  { id: 'pets', label: 'חיות מחמד', emoji: '🐾' },
  { id: 'art', label: 'אמנות ועיצוב', emoji: '🎨' },
  { id: 'movies', label: 'סרטים וסדרות', emoji: '🎬' },
  { id: 'tech', label: 'טכנולוגיה', emoji: '💻' },
  { id: 'yoga', label: 'יוגה ומדיטציה', emoji: '🧘' },
  { id: 'volunteering', label: 'התנדבות', emoji: '🤝' },
  { id: 'dance', label: 'ריקוד', emoji: '💃' },
];

export const QUESTIONS: Question[] = [
  // ===== SECTION 1: HOBBIES (handled via HOBBY_OPTIONS multiselect, 1 question) =====
  {
    id: 'h01',
    section: 'hobbies',
    type: 'multiselect',
    text: 'מה הדברים שאתה/את הכי אוהב/ת לעשות?',
    subtext: 'בחר/י לפחות 3 תחומי עניין (אפשר יותר)',
  },

  // ===== SECTION 2: VALUES (10 Likert 1-5) =====
  {
    id: 'v01',
    section: 'values',
    type: 'likert',
    text: 'משפחה היא הדבר החשוב ביותר בחיי',
    leftLabel: 'ממש לא מסכים/ה',
    rightLabel: 'מסכים/ה מאוד',
  },
  {
    id: 'v02',
    section: 'values',
    type: 'likert',
    text: 'עדיף לבחור קריירה מספקת על פני קריירה מרוויחה',
    leftLabel: 'ממש לא',
    rightLabel: 'בהחלט כן',
  },
  {
    id: 'v03',
    section: 'values',
    type: 'likert',
    text: 'מסורת ומנהגים הם עוגן חשוב בחיים',
    leftLabel: 'ממש לא',
    rightLabel: 'בהחלט כן',
  },
  {
    id: 'v04',
    section: 'values',
    type: 'likert',
    text: 'אני מעדיף/ת קהילה חזקה על פני עצמאות אישית',
    leftLabel: 'עצמאות אישית',
    rightLabel: 'קהילה חזקה',
  },
  {
    id: 'v05',
    section: 'values',
    type: 'likert',
    text: 'אני מוכן/ה לקחת סיכונים גדולים כדי להשיג מטרות',
    leftLabel: 'שמרן/ית',
    rightLabel: 'ריסקי/ת',
  },
  {
    id: 'v06',
    section: 'values',
    type: 'likert',
    text: 'אני אופטימי/ת לגבי עתיד המדינה',
    leftLabel: 'פסימי/ת',
    rightLabel: 'אופטימי/ת',
  },
  {
    id: 'v07',
    section: 'values',
    type: 'likert',
    text: 'כנות מוחלטת חשובה יותר מדיפלומטיה',
    leftLabel: 'דיפלומטיה קודמת',
    rightLabel: 'כנות קודמת',
  },
  {
    id: 'v08',
    section: 'values',
    type: 'likert',
    text: 'אני מאמין/ה שעבודה קשה תמיד מניבה תוצאות',
    leftLabel: 'לא בהכרח',
    rightLabel: 'בהחלט כן',
  },
  {
    id: 'v09',
    section: 'values',
    type: 'likert',
    text: 'קשר לטבע ולסביבה הוא חלק מרכזי בחיי',
    leftLabel: 'פחות חשוב לי',
    rightLabel: 'מרכזי מאוד',
  },
  {
    id: 'v10',
    section: 'values',
    type: 'likert',
    text: 'אני סומך/ת על המוסדות הממשלתיים לטפל בבעיות חברתיות',
    leftLabel: 'לא סומך/ת',
    rightLabel: 'סומך/ת מאוד',
  },

  // ===== SECTION 3: POLITICS — SECURITY AXIS (3-4 questions) =====
  {
    id: 'p01',
    section: 'politics',
    axis: 'security',
    type: 'scale',
    text: 'מה דעתך על פתרון שתי המדינות?',
    leftLabel: 'תומך/ת בחוזקה',
    rightLabel: 'מתנגד/ת בחוזקה',
    weight: 1.2,
  },
  {
    id: 'p02',
    section: 'politics',
    axis: 'security',
    type: 'scale',
    text: 'בתגובה לאיומי ביטחון — ישראל צריכה להגיב:',
    leftLabel: 'בעצמה בחוזקה',
    rightLabel: 'בדרכי שלום ודיפלומטיה',
    weight: 1.0,
  },
  {
    id: 'p03',
    section: 'politics',
    axis: 'security',
    type: 'scale',
    text: 'ההתנחלויות ביהודה ושומרון הן:',
    leftLabel: 'מכשול לשלום',
    rightLabel: 'זכות היסטורית',
    weight: 1.1,
  },
  {
    id: 'p04',
    section: 'politics',
    axis: 'security',
    type: 'scale',
    text: 'שירות צבאי חובה לכולם — כולל חרדים וערבים — הוא:',
    leftLabel: 'הכרחי לשוויון',
    rightLabel: 'לא מעשי/לא רצוי',
    weight: 0.9,
  },

  // ===== SECTION 3: POLITICS — RELIGION AXIS (3-4 questions) =====
  {
    id: 'p05',
    section: 'politics',
    axis: 'religion',
    type: 'scale',
    text: 'מה תפקידה של הדת בחיים הציבוריים בישראל?',
    leftLabel: 'הפרדה מוחלטת מדת',
    rightLabel: 'הדת צריכה להנחות את המדינה',
    weight: 1.2,
  },
  {
    id: 'p06',
    section: 'politics',
    axis: 'religion',
    type: 'scale',
    text: 'תחבורה ציבורית בשבת בערים:',
    leftLabel: 'בעד בהחלט',
    rightLabel: 'נגד בהחלט',
    weight: 1.0,
  },
  {
    id: 'p07',
    section: 'politics',
    axis: 'religion',
    type: 'scale',
    text: 'מי צריך להכריע בענייני גירושין וגיור?',
    leftLabel: 'רק אזרחי — חוק אזרחי',
    rightLabel: 'רק הרבנות — חוק דתי',
    weight: 1.1,
  },
  {
    id: 'p08',
    section: 'politics',
    axis: 'religion',
    type: 'scale',
    text: 'הרחבת זכויות LGBTQ+ בישראל:',
    leftLabel: 'תומך/ת בחוזקה',
    rightLabel: 'מתנגד/ת בחוזקה',
    weight: 1.0,
  },

  // ===== SECTION 3: POLITICS — ECONOMICS AXIS (3-4 questions) =====
  {
    id: 'p09',
    section: 'politics',
    axis: 'economics',
    type: 'scale',
    text: 'מדינת הרווחה בישראל צריכה להיות:',
    leftLabel: 'הרבה יותר חזקה',
    rightLabel: 'קטנה יותר, שוק חופשי',
    weight: 1.0,
  },
  {
    id: 'p10',
    section: 'politics',
    axis: 'economics',
    type: 'scale',
    text: 'פתרון משבר הדיור:',
    leftLabel: 'דיור ציבורי ורגולציה',
    rightLabel: 'שוק חופשי ובנייה פרטית',
    weight: 1.1,
  },
  {
    id: 'p11',
    section: 'politics',
    axis: 'economics',
    type: 'scale',
    text: 'הפרטת שירותים ממשלתיים (בריאות, חינוך):',
    leftLabel: 'נגד הפרטה',
    rightLabel: 'בעד הפרטה',
    weight: 1.0,
  },
  {
    id: 'p12',
    section: 'politics',
    axis: 'economics',
    type: 'scale',
    text: 'שכר מינימום גבוה הוא:',
    leftLabel: 'הכרחי לשוויון',
    rightLabel: 'פוגע בשוק העבודה',
    weight: 0.9,
  },
];
