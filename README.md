# TalentFlow AI – AI-Powered Resume Screening & Recruitment Management System

TalentFlow AI is a production-ready, enterprise-grade AI recruitment platform built on the **MERN** stack (MongoDB, Express.js, React.js, Node.js) with TypeScript. It empowers HR teams to upload individual or bulk resumes, automatically extract structured candidate data via AI, evaluate candidates against departmental job benchmarks with transparent scoring, and assign suitable candidates to categorized departmental managers.

---

## ⚡ Core Highlights & Capabilities

### 1. Role-Based Access Control (RBAC)
- **Admin**: Complete system sovereignty, user management, mandatory manager classification assignments, audit trail, global analytics.
- **HR**: Resume ingestion (single & bulk/folder), AI screening verification, job requirements management, AI candidate matching, HR-to-Manager allocation wizard, recruitment reports.
- **Manager**: Strictly scoped to assigned candidates within their specific classification:
  - 🏛️ **Advocate Manager**
  - 💻 **IT Development Manager**
  - 🚚 **Field Executive Manager**

### 2. Document Processing & Ingestion
- Supports **PDF**, **DOCX**, **DOC**, and scanned document formats.
- Native PDF text extraction (`pdf-parse`) with automatic fallback to **OCR** (`tesseract.js`) when scanned image PDFs or image resumes are detected.
- Native DOCX extraction via `mammoth`.
- Dual-mode background queue: uses **BullMQ + Redis** when available, or an in-memory asynchronous concurrent background queue when running locally without Redis.
- Document deduplication via SHA-256 file hashing, email matching, and phone validation.

### 3. Document Information Extraction & Rule-Based Matching
- Deterministic extraction engine using specialized parsers and structural pattern recognition.
- **Zero Hallucination / No External AI APIs**: Does not invent missing candidate data. Missing fields are stored as `null` or unverified for HR review and editing.
- Extracts: Personal information, professional summary, total & relevant experience, company history, skills (technical, languages, frameworks, databases, tools, soft skills), education, and certifications.
- **Transparent Requirement Matching**: Weighted comparison across skills (50%), experience (30%), and education/domain fit (20%). Generates overall score (0–100%), matched/missing skills, strengths, potential gaps, and actionable recommendations.

### 4. Ephemeral File Storage & Privacy Architecture
- **Zero File Retention**: In accordance with enterprise data protection and privacy standards, uploaded resumes are stored in a temporary local cache solely during extraction and are deleted immediately once candidate data is parsed and saved to MongoDB.
- No reliance on AWS S3 or third-party cloud storage buckets.
- Full extracted text and structured candidate records remain permanently available in MongoDB for search, filtering, and manager review.
- On-demand re-upload: HR can re-upload a document at any time if physical re-verification or profile refreshing is needed.

### 4. Enterprise SaaS Design System
- Built with **Tailwind CSS**, custom palette: Midnight Navy (`#111827`), Slate (`#334155`), Teal (`#0D9488`), Emerald (`#059669`), Indigo (`#6366F1`), and Slate Background (`#F8FAFC`).
- Interactive **Recharts** visualizations for recruitment pipelines, monthly velocity, and department distributions.
- Real-time updates via **Socket.IO** for live background resume processing progress and instant manager notifications.

---

## 📁 Project Directory Structure
```
talentflow-ai/
├── backend/
│   ├── src/
│   │   ├── config/             # DB & environment configuration
│   │   ├── controllers/        # REST API controllers
│   │   ├── middleware/         # Auth, RBAC, Multer, Error handling, Audit logging
│   │   ├── models/             # Mongoose schemas (User, Candidate, Resume, Requirement, Assignment, Feedback, Interview, Notification, ActivityLog, MatchResult)
│   │   ├── queues/             # BullMQ / In-Memory background worker
│   │   ├── routes/             # Express API subrouters
│   │   ├── services/           # Storage, Parser, AI, Matching, Notification services
│   │   ├── utils/              # JWT, Logger, Seed script
│   │   ├── tests/              # Jest unit & integration tests
│   │   └── server.ts           # Server bootstrap & Socket.IO initialization
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Modal, Badge, StatsCard, Pagination, LoadingSkeleton, Header, Sidebar
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── layouts/            # DashboardLayout
│   │   ├── pages/
│   │   │   ├── admin/          # Admin Dashboard, User Management, Candidate Management, Assignments, Reports, Activity Logs, Settings
│   │   │   ├── hr/             # HR Dashboard, Resume Upload (Single & Bulk), Upload History, Candidate Database, Profile Details, Requirements, AI Screening, Matching, Assignment Wizard, Reports
│   │   │   ├── manager/        # Manager Dashboard, Assigned Candidates, Interviews, Reports
│   │   │   ├── auth/           # Login (with quick-fill demo buttons), Forgot Password, Reset Password
│   │   │   └── shared/         # Notifications, 404
│   │   ├── routes/             # AppRoutes & ProtectedRoute guards
│   │   ├── services/           # Axios API client & services
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                       # ARCHITECTURE.md, API_DOCUMENTATION.md, RBAC_GUIDE.md, DEPLOYMENT_GUIDE.md
├── .gitignore
├── README.md
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.x or v20.x+)
- **MongoDB** (Local or MongoDB Atlas)
- **Redis** (Optional: falls back seamlessly to in-memory queue)

### 2. Backend Setup
```bash
cd backend
npm install
# Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env, then provision the Admin account:
npm run seed
npm run dev      # Starts Express API & Socket.IO server at http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev      # Launches Vite development server at http://localhost:5173
```

---

## 🔑 Administrator Authentication
The system initializes with a single default administrator account provisioned via environment variables:
- **Admin Email**: Defined by `SEED_ADMIN_EMAIL` (e.g. `admin@yourcompany.com`)
- **Admin Password**: Defined by `SEED_ADMIN_PASSWORD` (hashed securely using bcrypt, 10 salt rounds)
- **Role**: `Admin` (Access to System Sovereignty, User Management, Audit Logs, and Global Recruitment Analytics)

> Once logged in, the Admin can create organizational HR specialists and departmental managers (Advocate Manager, IT Development Manager, Field Executive Manager) via the Admin User Management portal.

---

## 🧪 Automated Testing
Run the backend test suite:
```bash
cd backend
npm test
```

---

## 🛡️ Security & Privacy
- **Zero-Retention Ephemeral Ingestion**: Uploaded resumes (PDF/DOCX) are parsed in an ephemeral stream and immediately deleted from local disk after extraction. No cloud storage (AWS S3) credentials or external buckets are required.
- **Candidate Data Integrity**: All structured candidate information, extraction confidence scores, and raw parsed text are securely stored in MongoDB. Missing candidate fields are left as null rather than being artificially generated.
- **Audit History**: All candidate profile edits, status modifications, and assignments are logged to the `ActivityLog` collection with actor, previous values, and timestamps.
- **Strict Classification Scoping**: Managers cannot query candidates outside their assigned portfolio or department classification.
