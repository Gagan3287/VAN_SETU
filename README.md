# VanSetu — AI-Powered FRA Atlas & WebGIS Decision Support System (v2)

**Problem Statement**: SIH12508 — Ministry of Tribal Affairs (MoTA)  
**Goal**: Integrated Monitoring of Forest Rights Act (FRA) Implementation via WebGIS Atlas, Conflict Detection Engine, Risk Priority Engine, and Offline Field Verification.

---

## 🛠️ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### Step 1: Start PostgreSQL + PostGIS Database
```bash
docker compose up -d
```

### Step 2: Environment Setup
Copy `.env.example` to `.env` in root and backend:
```bash
cp .env.example .env
cp .env.example backend/.env
```

### Step 3: Install & Start Development Servers
```bash
# Install root dependencies
npm install

# Setup database schema
cd backend
npm install
npx prisma db push
npx ts-node src/seed.ts
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start concurrent development servers
npm run dev
```

Frontend will run at `http://localhost:5173` and Backend REST API at `http://localhost:5000`.

---

## 🔒 Security & Architecture Standards
1. **Server-Side Authority**: No direct database queries from client side. All data access goes through Express API with RBAC checks.
2. **Brute Force Protection**: 5 failed login attempts trigger 15-minute account lockout.
3. **Server-Side Refresh Token Revocation**: Revocation tracked via `refresh_tokens` table on logout.
4. **Data Privacy**: Synthetic demo data only; audit logging records user actions and IP addresses.

---

## 📜 License

This project is licensed under the Apache License, Version 2.0 — see the [LICENSE](file:///e:/SIH-2026/LICENSE) file for details.  
Copyright (c) 2026 **Vengala Gagan Chadra Tej**.

