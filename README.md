# 🎓 Student Marks & School Results Portal

A modern full-stack web application for classroom teachers, students, and schools to manage and review academic performance with automated grading, marksheet generation, and MongoDB persistence.

---

## 📂 Project Architecture

The project is cleanly separated into independent **Frontend** and **Backend** directories:

```
ccbdi/
├── backend/                  # Node.js + Express + MongoDB Backend
│   ├── models/               # Mongoose Schemas (Student, Teacher)
│   ├── db.js                 # Database connection & management
│   ├── server.js             # REST API endpoints
│   ├── package.json          # Backend-specific dependencies
│   ├── .env                  # Port & MongoDB URI configuration
│   └── .env.example
│
├── frontend/                 # Vite + React + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/       # UI components (Portals, Modals, Tables)
│   │   ├── services/         # API integration layer
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Calculations & authentication helpers
│   ├── index.html            # Single Page Entrypoint
│   ├── vite.config.js        # Vite build & proxy settings
│   ├── tsconfig.json         # TypeScript configuration
│   ├── tailwind.config.cjs   # Tailwind styling setup
│   └── package.json          # Frontend-specific dependencies
│
├── package.json              # Root orchestrator with unified npm scripts
├── .gitignore                # Git exclusions
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
Run the command below in the project root to install all dependencies for both frontend and backend:
```bash
npm run install:all
```

### 2. Start Both Frontend & Backend (One Command)
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## ⚙️ Running Separately

### Backend Only
```bash
# Option A: From root
npm run server

# Option B: Inside backend folder
cd backend
npm run dev
```

### Frontend Only
```bash
# Option A: From root
npm run client

# Option B: Inside frontend folder
cd frontend
npm run dev
```

---

## 🔑 Key Features & Login Rules
- **Teacher Portal**: Class teacher registration & login. Enforces 1 teacher per class & section.
- **Student Result Portal**: Students login using Roll Number and PIN formatted strictly as `123$rollno` (e.g., Roll #201 $\rightarrow$ PIN: `123$201`).
- **School & Class Results**: Direct school directory and class marksheet viewer with pass/fail badges, rankings, and individual printable report cards.