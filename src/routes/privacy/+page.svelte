<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<main class="min-h-screen bg-[#F8FAFF] py-12 px-4">
  <div class="max-w-2xl mx-auto">
    <button class="text-[#1E6FEB] text-sm mb-6 flex items-center gap-1" onclick={() => history.back()}>
      ← חזרה
    </button>

    <div class="card p-8 space-y-6 text-[#334155]">
      <div class="text-center mb-4">
        <span class="text-4xl">🔒</span>
        <h1 class="text-3xl font-bold mt-3" style="font-family: Rubik">מדיניות פרטיות</h1>
        <p class="text-sm text-[#94A3B8] mt-1">עודכן לאחרונה: אפריל 2026</p>
      </div>

      <section>
        <h2 class="text-xl font-bold mb-2">1. מי אנחנו</h2>
        <p class="text-sm leading-relaxed">
          גשר (Gesher) היא אפליקציה ישראלית לשיחות וידאו בין אנשים בעלי השקפות פוליטיות מנוגדות.
          המטרה שלנו היא לקדם שיח אזרחי מכבד ולאפשר פגישות אנושיות אמיתיות מעבר לקווי המחלוקת.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">2. נתונים שאנו אוספים</h2>
        <ul class="text-sm leading-relaxed space-y-1 list-disc list-inside">
          <li>כתובת אימייל ושם תצוגה — לצורך זיהוי החשבון</li>
          <li>שנת לידה — לאימות גיל (18+) בלבד</li>
          <li>תחומי עניין וערכים — לצורך ההתאמה</li>
          <li>דעות ועמדות פוליטיות — לאלגוריתם ההתאמה בלבד, אינן מוצגות לאף משתמש/ת אחר/ת</li>
          <li>נתוני שימוש כלליים (זמן בשיחה, מספר שיחות) — לשיפור השירות</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">3. כיצד אנו משתמשים בנתונים</h2>
        <p class="text-sm leading-relaxed">
          הנתונים משמשים אך ורק להפעלת אלגוריתם ההתאמה בין משתמשים, לניהול חשבון המשתמש,
          ולשיפור חוויית השימוש באפליקציה. אנו <strong>לא</strong> משתמשים בנתונים לפרסום ממוקד.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">4. שיתוף נתונים עם צדדים שלישיים</h2>
        <p class="text-sm leading-relaxed">
          אנו <strong>לא מוכרים ולא משתפים</strong> את הנתונים שלך עם כל גורם שלישי, לרבות חברות פרסום,
          ארגונים פוליטיים, מחקרים אקדמיים, או כל גוף אחר — ללא הסכמה מפורשת שלך.
          החריג היחיד הוא ספקי תשתית הנדרשים להפעלת השירות (שרתי Supabase) תחת הסכמי סודיות מחייבים.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">5. אחסון ואבטחה</h2>
        <p class="text-sm leading-relaxed">
          הנתונים מאוחסנים בשרתי Supabase באיחוד האירופי (Frankfurt, גרמניה), מוצפנים במנוחה ובמעבר.
          גישה לנתונים אישיים מוגבלת לצוות הליבה בלבד ומתועדת.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">6. הזכויות שלך</h2>
        <ul class="text-sm leading-relaxed space-y-1 list-disc list-inside">
          <li><strong>גישה:</strong> תוכל/י לבקש עותק של כל הנתונים שלך בכל עת</li>
          <li><strong>תיקון:</strong> תוכל/י לתקן נתונים שגויים דרך הגדרות החשבון</li>
          <li><strong>מחיקה:</strong> מחיקת חשבון תגרור מחיקת כל הנתונים תוך 30 יום</li>
          <li><strong>התנגדות:</strong> תוכל/י להתנגד לעיבוד נתונים מסוים — צור/י קשר לפרטים</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">7. גיל מינימלי</h2>
        <p class="text-sm leading-relaxed">
          גשר מיועדת לבני 18 ומעלה בלבד. אנו לא אוספים ביודעין נתונים ממשתמשים מתחת לגיל זה.
          אם נודע לנו שנרשם קטין, החשבון יימחק לאלתר.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">8. שינויים במדיניות</h2>
        <p class="text-sm leading-relaxed">
          שינויים מהותיים במדיניות זו ייודעו למשתמשים רשומים באימייל לפחות 14 יום מראש.
          המשך השימוש באפליקציה לאחר מועד השינוי מהווה הסכמה למדיניות המעודכנת.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold mb-2">9. יצירת קשר</h2>
        <p class="text-sm leading-relaxed">
          לכל שאלה, בקשה, או תלונה בנושא פרטיות ניתן לפנות אלינו:
          <a href="mailto:privacy@gesher.app" class="text-[#1E6FEB] underline">privacy@gesher.app</a>
        </p>
        <p class="text-sm leading-relaxed mt-1">
          נשתדל להשיב תוך 5 ימי עסקים.
        </p>
      </section>
    </div>

    <p class="text-center text-xs text-[#94A3B8] mt-6">גשר · גרסת מדיניות 1.0 · אפריל 2026</p>
  </div>
</main>
