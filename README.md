# PayTrack

אפליקציית web לניהול הכנסות, הוצאות ומעקב תשלומים לעסק ביתי — לפי נושאים, לקוחות וספקים.

## Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt (httpOnly cookie) |
| גרפים | Recharts |

## מבנה הפרויקט

```
PayTrack/
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # דפי האפליקציה
│       ├── components/      # רכיבים משותפים
│       ├── context/         # Auth context
│       ├── types/           # TypeScript types
│       └── api.ts           # Axios instance
└── server/
    ├── prisma/
    │   ├── schema.prisma    # מודל הנתונים
    │   └── migrations/      # היסטוריית migrations
    └── src/
        ├── routes/          # Express routers
        ├── middleware/      # Auth middleware
        └── lib/             # Prisma client, balance utils
```

## מודל נתונים

### הכנסות
```
User → Topic
User → Client → Payment (work order) → PaymentTransaction
User → Client → ClientPayment (money received)
```

### הוצאות
```
User → ExpenseCategory (topic)
ExpenseCategory → Supplier → Expense (invoice)
Supplier → SupplierPayment (money paid)
```

**מאזן לקוח:** `totalOwed (work orders) − totalPaid (client payments)`

**מאזן ספק:** `totalInvoiced (expenses) − totalPaid (supplier payments)`

סטטוסי תשלום: `PENDING | PARTIAL | PREPAID | PAID | OVERDUE | CREDITED`

סוגי תנועות: `PAYMENT | CREDIT | PREPAYMENT | PREPAYMENT_APPLY`

## התקנה והפעלה

### דרישות מקדימות
- Node.js 18+
- PostgreSQL

### התקנה

```bash
# התקנת כל התלויות
npm run install:all

# הגדרת משתני סביבה
cp server/.env.example server/.env
# ערוך את server/.env עם פרטי ה-DB שלך
```

`server/.env` צריך להכיל:
```
DATABASE_URL="postgresql://user:password@localhost:5432/paytrack"
JWT_SECRET="your-secret-key"
```

### הגדרת Database

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

### הפעלה

```bash
# מ-root — מפעיל server + client ביחד
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

## תכונות

### הכנסות
- **דשבורד** — KPI cards, גרף הכנסות חודשי (Recharts), לקוחות אחרונים עם badge מאזן
- **נושאים** — ארגון לקוחות לפי תחומי עיסוק; דף נושא עם פירוט לקוחות ותשלומים
- **תשלומים** — רשימה מקובצת לפי לקוח עם יתרה; הוספה/מחיקה inline
- **דוחות** — סינון לפי תאריך / נושא / לקוח / סטטוס + ייצוא CSV
- **לקוח** — הזמנות עבודה (FIFO coverage) + הכנסות שהתקבלו + מאזן

### הוצאות
- **דשבורד** — KPI cards, גרף הוצאות חודשי, ספקים אחרונים עם badge מאזן
- **נושאים** — קטגוריות הוצאות; דף נושא עם ספקים מקושרים, חשבוניות ותשלומים לספק
- **תשלומים** — רשימה מקובצת לפי ספק עם יתרה; עריכת חשבוניות, תשלומים וספקים inline
- **דוחות** — סינון לפי תאריך / ספק / נושא + ייצוא CSV

### כללי
- **Auth** — הרשמה, התחברות, התנתקות (JWT בcookie)
- **עיצוב** — sidebar gradient כהה, כרטיסי KPI עם gradient, RTL מלא
- **טיפים לעסק ביתי** — דף בבניה (בקרוב)
