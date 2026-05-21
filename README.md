# PayTrack

אפליקציית web לניהול הכנסות ומעקב תשלומים לפי נושאים ולקוחות.

## Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt (httpOnly cookie) |

## מבנה הפרויקט

```
PayTrack/
├── client/          # React frontend
└── server/          # Node.js + Express backend
    └── prisma/      # Schema + migrations
```

## מודל נתונים

```
User → Topic
User → Client → Payment (topic_id) → PaymentTransaction
```

סטטוסי תשלום: `pending | partial | prepaid | paid | overdue | credited`

סוגי תנועות: `payment | credit | prepayment | prepayment_apply`

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

### הגדרת Database

```bash
cd server
npx prisma migrate dev --name init
```

### הפעלה

```bash
# מ-root — מפעיל server + client ביחד
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

## תכונות

- **Auth** — הרשמה, התחברות, התנתקות
- **נושאים** — ארגון לקוחות לפי תחומי עיסוק
- **לקוחות** — ניהול לקוחות תחת נושאים
- **תשלומים** — תשלום מלא / חלקי / מראש / זיכוי
- **דשבורד** — סיכום הכנסות + גרף חודשי
- **דוחות** — סינון וייצוא CSV
