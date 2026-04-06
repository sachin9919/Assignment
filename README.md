# Zorvyn Finance Backend (Assignment 2)

Node.js + Express + TypeScript REST API for finance records with role-based access control (RBAC) and dashboard summary analytics.

## Architecture (how a request flows)
1. **HTTP** hits Express (`src/app.ts`): security headers (`helmet`), **CORS**, JSON body parsing, logging (`morgan`).
2. **Static files** (`public/`) serve the local tester UI and Swagger HTML; **`GET /openapi.json`** returns the OpenAPI spec.
3. **API routes** under `/api/*` are grouped by domain: `auth`, `users`, `records`, `dashboard` (`src/routes/`).
4. **Validation** (`zod` + `src/utils/validate.ts`) runs on body/query where used.
5. **Auth** (`src/middleware/authenticate.ts`): reads `Authorization: Bearer <JWT>`, verifies signature, loads the user from storage, rejects inactive users, attaches `req.user` (`id`, `role`).
6. **RBAC** (`src/middleware/rbac.ts`): `requireRoles(...)` returns **403** if the user’s role is not allowed for that route.
7. **Services** (`src/services/`) hold business logic (login/seed, user CRUD, records, dashboard aggregates).
8. **Persistence** (`src/storage/fileDb.ts`): reads/writes **`data/db.json`** (users + financial records) with serialized writes to avoid corrupting the file.
9. **Errors** (`src/utils/errorHandler.ts`): consistent JSON errors; validation failures return **400** with details.

## Tech Stack
- `express` (REST API)
- `typescript` (type-safe backend)
- `jsonwebtoken` (JWT auth)
- `zod` (request validation)
- `bcryptjs` (password hashing)
- `data/db.json` (file-backed storage; simple mock persistence)

## Setup
1. Install dependencies:
   - `npm install`
2. Start the server:
   - `npm run dev`
3. API base URL:
   - `http://localhost:8080`

### How to use it (step by step)

This project is a **backend API only** (no separate “website” with pages). You use it from the **browser** via **Swagger UI**, or from tools like Postman.

1. Start the server: `npm run dev`
2. Open in your browser (pick one):
   - **`http://localhost:8080`** or **`http://localhost:8080/index.html`** — **simple tester page** (buttons + JSON output; use this if Swagger looks blank)
   - **`http://localhost:8080/swagger.html`** — Swagger UI loaded from CDN (often works when `/api-docs` is broken)
   - **`http://localhost:8080/api-docs`** — bundled Swagger UI
   - Raw spec: **`http://localhost:8080/openapi.json`**
3. In Swagger, expand **`POST /api/auth/seed`** → click **Try it out** → **Execute**.  
   Copy one of the `token` values from the response (or use **Login** with the demo emails/passwords below).
4. Click the **Authorize** button (lock icon at the top), paste: `Bearer <your-token>` (include the word `Bearer` and a space), then **Authorize**.
5. Try **`GET /api/records`** or **`GET /api/dashboard/summary`** — you should see JSON results.

**Why `localhost:8080` works now:**  
There was no page at the root URL `/`. The API lives under paths like `/api/...`. Now `public/index.html` is served at `/` so you get the simple tester page.

**If Swagger shows 200 in the terminal but no response in the browser:**  
Helmet’s default Content Security Policy can block Swagger UI from rendering the response panel. This project disables that for local Swagger; restart `npm run dev` and hard-refresh the page (Ctrl+F5).

Other useful URLs:
- **`http://localhost:8080/health`** → `{ "ok": true }` (server is running)

### Environment Variables (optional)
Create a `.env` file if you want to override defaults:
- `PORT` (default: `8080`)
- `JWT_SECRET` (default: `dev-secret-change-me`)

## Authentication
Use Bearer tokens:
- Header: `Authorization: Bearer <token>`

### Seed demo users (recommended for evaluation)
`POST /api/auth/seed`

Returns:
- JWT tokens for roles: `viewer`, `analyst`, `admin`
- Demo credentials:
  - viewer: `viewer@example.com` / `viewer123`
  - analyst: `analyst@example.com` / `analyst123`
  - admin: `admin@example.com` / `admin123`

### Login
`POST /api/auth/login`
Body:
- `email`
- `password`

## Role-Based Access Control
Roles:
- `viewer`: read-only for their own records + dashboard
- `analyst`: read-only for their own records + dashboard
- `admin`: full management for users + their records (and can manage other users via `?userId=...`)

Rules enforced in backend:
- `viewer` cannot create/update/delete records
- `analyst` cannot create/update/delete records
- `admin` can create/update/delete records
- user management endpoints are `admin` only

Inactive users cannot authenticate.

## API Endpoints

### Health Check
- `GET /health`

### Users (admin only)
- `GET /api/users` (list)
- `GET /api/users/:id` (get one)
- `POST /api/users` (create)
- `PATCH /api/users/:id` (update role/status/password/email/name)

### Financial Records
All record routes require JWT auth.

Read:
- `GET /api/records`
  - Supports filtering/pagination:
    - `from`, `to` (ISO date strings)
    - `type` (`income` | `expense`)
    - `category`
    - `search` (matches category and notes)
    - `page` (default `1`)
    - `limit` (default `20`, max `100`)
    - `userId` (admin only; filter another user's records)
- `GET /api/records/:id`
  - Optional `?userId=` (admin only)

Write (admin only):
- `POST /api/records`
  - Optional `?userId=` (admin only; sets `ownerUserId`)
  - Body:
    - `amount` (positive number)
    - `type` (`income` | `expense`)
    - `category`
    - `date` (ISO date string)
    - `notes` (optional)
- `PATCH /api/records/:id`
  - Optional `?userId=` (admin only)
  - Body: same as create, but all fields optional except validation constraints
- `DELETE /api/records/:id`
  - Optional `?userId=` (admin only)

### Dashboard Summary
`GET /api/dashboard/summary`
- Supports query:
  - `from`, `to`
  - `type` (optional, limits totals/trends to one record type)
  - `userId` (admin only)

Response includes:
- `totals`: `totalIncome`, `totalExpenses`, `netBalance`
- `categoryWiseTotals`: totals split by income/expense per category
- `recentActivity`: last 10 records by date (within date filter)
- `monthlyTrends`: monthly income/expense and net over the selected period

## API Documentation
- Swagger UI: `GET /api-docs`

## Assumptions / Notes
- Each financial record belongs to an `ownerUserId` (the authenticated user).
- `admin` can manage/read other users' data by passing `?userId=` on relevant endpoints.
- Storage is file-backed (`data/db.json`) for easy local evaluation. Document changes persist across server restarts.

