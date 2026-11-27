# CampusVoice – Grievance Management System (MERN)

Students and staff submit grievances that are **auto-routed to the right department officer** and tracked until resolved. Officers update status and add remarks; complainants get **live Socket.IO notifications** on every change; admins manage departments/users and see aggregation reports.

## Tech
Backend: express, mongoose, dotenv, bcrypt, jsonwebtoken, socket.io · Frontend: react, react-router-dom, Fetch API, Context API, socket.io-client (Vite).

## Run locally
Prerequisites: Node 18+, MongoDB running locally (or an Atlas URI).

```bash
# 1. Backend
cd backend
cp .env.example .env        # then edit the two JWT secrets (and MONGO_URI if needed)
npm install
npm run seed                # demo data (clears existing data!)
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Demo logins (password `Password@123`)
| Role | Email |
|---|---|
| Admin | admin@campusvoice.test |
| Officer (IT/Infrastructure) | officer.infrastructure@campusvoice.test |
| Other officers | officer.academic@… , officer.hostel@… , officer.administration@… , officer.student@… (all `@campusvoice.test`) |
| Complainant (student) | student@campusvoice.test |
| Complainant (staff) | staff@campusvoice.test |

## Environment variables (`backend/.env`)
| Variable | Description |
|---|---|
| PORT | API port (5000) |
| MONGO_URI | MongoDB connection string |
| JWT_ACCESS_SECRET / JWT_REFRESH_SECRET | Secrets for the two tokens (use long random strings) |
| ACCESS_EXPIRES / REFRESH_EXPIRES | Token lifetimes (15m / 7d) |
| CLIENT_URL | Frontend origin for CORS + Socket.IO |

Frontend (`frontend/.env`, production only): `VITE_API_URL` = deployed API URL.

## Features mapped to the brief
- Roles: **complainant, officer, admin** (RBAC via `authorize()` middleware)
- Grievance submission with category, priority and **status history**
- **Auto-assignment**: category → department → officer with the fewest open grievances (aggregation)
- Officer updates status (pending → in_progress → resolved/rejected, validated flow) and adds remarks
- **Live notification** to the complainant on every status change/remark (Socket.IO, JWT checked in handshake; Node `EventEmitter` decouples controllers from notifications)
- **Reports with aggregation**: resolution time and pending counts per department, plus status/category breakdowns
- Mandatory items: MVC structure, `.env`, bcrypt + JWT access/refresh (rotating), protected + RBAC routes, Mongoose validation + relationships, aggregation + indexes, central error middleware, Postman collection, React routing/controlled forms/Context API/protected pages

## API summary (all under `/api`)
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /auth/register | public | Register (complainant) |
| POST | /auth/login | public | Login → access + refresh token |
| POST | /auth/refresh | public | Rotate refresh token |
| POST | /auth/logout | auth | Revoke refresh token |
| GET | /auth/me | auth | Current user |
| GET | /grievances/meta | auth | Categories, priorities, statuses, transitions |
| POST | /grievances | complainant | Submit (auto-assigned) |
| GET | /grievances | auth | List (role-scoped; `status, priority, category, department, q, page, limit`) |
| GET | /grievances/:id | owner / assigned officer / admin | Detail |
| PATCH | /grievances/:id/status | officer, admin | Change status `{status, remarks}` |
| POST | /grievances/:id/remarks | officer, admin | Add remark `{text}` |
| PATCH | /grievances/:id/assign | admin | Reassign `{officerId}` |
| GET | /reports/summary | officer, admin | Aggregation report |
| GET/POST | /departments | auth / admin | List / create |
| PUT/DELETE | /departments/:id | admin | Update / delete |
| GET/POST | /users | admin | List / create officers & admins |
| PATCH | /users/:id | admin | Update role/department/active |
| GET | /notifications | auth | My notifications |
| PATCH | /notifications/read-all, /:id/read | auth | Mark read |

Responses: `{ success, ... }`; errors: `{ success:false, message, errors? }` with proper HTTP codes (400, 401, 403, 404, 409, 500).

Postman: import `backend/postman/CampusVoice.postman_collection.json`, run a **Login** request first (token is stored automatically). ER diagram: `docs/ER_DIAGRAM.md`.

## Deployment

### Backend on Render

1. Create a MongoDB Atlas database and allow connections from Render (or use an appropriately restricted IP allowlist).
2. In Render, create a Blueprint from this repository and use the included `render.yaml`. The service uses `backend` as its root directory, `npm ci` to build, `npm start` to run, and `/api/health` for health checks.
3. Set `MONGO_URI` to the Atlas connection string and `CLIENT_URL` to the exact Vercel frontend origin (for example, `https://your-project.vercel.app`, with no trailing slash). If the Vercel URL is not available yet, set `CLIENT_URL` after deploying the frontend and redeploy the Render service.
4. Render generates `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. `PORT` is supplied by Render; do not set it manually.

### Frontend on Vercel

1. Import the same repository into Vercel and set the project **Root Directory** to `frontend`.
2. Use the Vite defaults (`npm run build`, output directory `dist`) and set `VITE_API_URL` to the Render API origin (for example, `https://your-api.onrender.com`, with no trailing slash). This is a build-time variable.
3. The included `frontend/vercel.json` routes client-side React Router URLs back to the app entry point.

The backend's `CLIENT_URL` must match the deployed frontend origin exactly for API and Socket.IO connections. Do not commit deployment secrets or `.env` files; use the hosting providers' environment-variable settings. To create demo data, run `npm run seed` from `backend` against the configured database; **this clears existing data**.
