# Smart Attendance Management System

A MERN-based attendance system for classrooms that uses short-lived QR codes, teacher/student login, automatic schedule-based session generation, attendance reporting, and basic proxy detection.

## What The Project Does

- Teachers log in and manage attendance from a dashboard.
- Teachers can create manual sessions or define recurring class schedules.
- Scheduled classes automatically create attendance sessions using `node-cron`.
- Each session gets a QR code and attendance link.
- Students scan the QR and open the attendance page in the browser.
- If the browser is not logged in, the student enters roll number or phone number plus password.
- After login, attendance is verified and marked for that student account.
- Duplicate attendance is blocked.
- Same device/browser cannot be used to mark attendance for another student in the same session.
- Teachers can view:
  - active sessions
  - today’s sessions
  - past session history
  - present students
  - absent students
  - suspicious or blocked attempts

## Current User Flow

### Teacher flow

1. Login as a teacher.
2. Open the teacher dashboard at `/teacher`.
3. Either:
   - create a manual session, or
   - create a recurring schedule
4. For a session, the system shows a QR code and attendance link.
5. Clicking a session card opens `/teacher/sessions/:sessionId`.
6. On the session details page, the teacher can see:
   - QR code
   - session stats
   - present students
   - absent students
   - suspicious incidents

### Student flow

1. Student scans the QR code.
2. The phone opens the attendance page at `/attendance/:sessionId?token=...`.
3. If the browser is not logged in, the student logs in there using roll number or phone number plus password.
4. The backend verifies:
   - session exists
   - QR token matches
   - session is not expired
   - student has not already marked
   - same device is not being used for another student in the same session
5. Attendance is saved.
6. Student can view history and analytics at `/student`.

## Main Screens

- `/login`
  - teacher and student login
- `/teacher`
  - dashboard
  - manual session creation
  - recurring schedule management
  - today’s sessions
  - past sessions
- `/teacher/sessions/:sessionId`
  - full session details page
- `/student`
  - student attendance history and analytics
- `/attendance/:sessionId`
  - QR attendance page for students

## Tech Stack

- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT
- QR generation: `qrcode`
- Scheduling: `node-cron`

## Project Structure

```text
Attendance sysytrm/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

## Backend Architecture

- `routes/`
  - defines REST endpoints
- `controllers/`
  - request/response handling
- `services/`
  - actual business logic
  - auth
  - session creation
  - schedule automation
  - attendance verification
  - reporting
- `models/`
  - MongoDB schema definitions
- `middlewares/`
  - auth, error handling, not found
- `utils/`
  - helpers for tokens, device info, normalization, async wrappers

## Core Data Models

### `User`

Used for both teachers and students.

Important fields:
- `name`
- `phoneNumber`
- `passwordHash`
- `role`
- `rollNumber`
- `section`
- `department`
- `isDemo`

### `AttendanceSession`

Stores one attendance event.

Important fields:
- `publicSessionId`
- `qrToken`
- `teacher`
- `schedule`
- `courseName`
- `section`
- `room`
- `validityMinutes`
- `classDurationMinutes`
- `sessionSource`
- `startedAt`
- `expiresAt`
- `closedAt`

### `AttendanceRecord`

Stores a successful attendance mark.

Important fields:
- `session`
- `student`
- `studentName`
- `rollNumber`
- `studentIdentifier`
- `device`
- `submittedAt`

### `AttendanceIncident`

Stores blocked or suspicious attempts.

Examples:
- invalid QR
- expired session
- duplicate attempt
- proxy blocked

### `ClassSchedule`

Stores recurring teacher schedule definitions.

Important fields:
- `teacher`
- `courseName`
- `section`
- `room`
- `days`
- `startTime`
- `classDurationMinutes`
- `qrValidityMinutes`
- `isActive`

## How Scheduling Works

- Backend starts a cron task when the server boots.
- Cron runs every minute.
- It checks active schedules whose:
  - day matches today
  - start time matches current minute
- If no session exists yet for that schedule and date, the backend:
  - creates an `AttendanceSession`
  - generates the attendance link
  - generates the QR code
- Those auto-created sessions then appear in the teacher dashboard and session history like manual sessions.

## How QR Attendance Works

The QR code stores a browser-openable URL, not raw JSON.

Format:

```text
{FRONTEND_BASE_URL}/attendance/{publicSessionId}?token={qrToken}&issuedAt={startedAt}&expiresAt={expiresAt}
```

Example:

```text
http://192.168.1.5:5173/attendance/abc123?token=xyz456&issuedAt=...&expiresAt=...
```

Important:
- `FRONTEND_BASE_URL` must be reachable from the phone
- do not use `localhost` if you want QR scanning to work on a mobile device
- use your laptop’s local IP instead

## How Attendance Verification Works

When a student submits attendance, backend checks:

1. session exists
2. QR token is valid
3. session is still active
4. student has not already marked attendance
5. same device/browser signature has not already been used for another student in that session

If any rule fails, the backend creates an `AttendanceIncident`.

## How Absent Students Are Calculated

For a selected session:

1. backend reads the session’s `section`
2. backend fetches all student users in that section
3. backend fetches all attendance records for that session
4. backend subtracts present student IDs from the section roster

Formula:

```text
Absent Students = All Students In Session Section - Students Who Marked Attendance
```

That is why students must be linked to a `section`.

## Auth System

- Login is implemented.
- Backend accepts:
  - teacher phone number + password
  - student roll number or phone number + password
- JWT is returned after login.
- Frontend stores auth in local storage under `smart-attendance-auth`.
- Teacher routes require role `teacher`.
- Student routes require role `student`.

## Demo Accounts

These accounts are seeded automatically by backend startup.

### Teachers

- `9000000001` / `teacher123`
- `9000000002` / `teacher123`

### Students

- `23CSE101` / `student123`
- `23CSE102` / `student123`
- `23CSE103` / `student123`

Student phone numbers also exist:

- `9111111101`
- `9111111102`
- `9111111103`

## API Overview

### Health

- `GET /api/v1/health`

### Auth

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Teacher

- `GET /api/v1/teacher/dashboard/summary`
- `GET /api/v1/teacher/sessions`
- `POST /api/v1/teacher/sessions`
- `GET /api/v1/teacher/sessions/today`
- `GET /api/v1/teacher/sessions/:sessionId`
- `PATCH /api/v1/teacher/sessions/:sessionId/close`
- `GET /api/v1/teacher/sessions/:sessionId/attendance`
- `GET /api/v1/teacher/sessions/:sessionId/incidents`
- `GET /api/v1/teacher/schedules`
- `POST /api/v1/teacher/schedules`
- `PATCH /api/v1/teacher/schedules/:scheduleId`
- `DELETE /api/v1/teacher/schedules/:scheduleId`

### Student

- `GET /api/v1/student/dashboard`
- `GET /api/v1/student/attendance/:sessionId/verify`
- `POST /api/v1/student/attendance/:sessionId/mark`

### Public QR endpoint

- `GET /api/v1/public/attendance/:sessionId`

## Environment Variables

### Backend: `backend/.env`

Start by copying from [backend/.env.example](/C:/Users/dhire/OneDrive/Desktop/Attendance%20sysytrm/backend/.env.example).

Example:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/smart-attendance?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173,http://192.168.1.5:5173
FRONTEND_BASE_URL=http://192.168.1.5:5173
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

Notes:
- `CLIENT_ORIGIN` supports multiple origins separated by commas
- include both `localhost` and your local IP if you use laptop browser + phone browser
- `FRONTEND_BASE_URL` is what gets encoded inside the QR

### Frontend: `frontend/.env`

Create this file manually inside `frontend/`:

```env
VITE_API_BASE_URL=http://192.168.1.5:5000/api/v1
```

If you only test on the same laptop, you can use:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## How To Run The Project

### 1. Install dependencies

From the project root:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure MongoDB

This project now works well with MongoDB Atlas.

Create a cluster, user, and database connection string, then place it in:

```env
backend/.env
```

### 3. Configure backend and frontend env files

Make sure:

- backend `MONGODB_URI` is valid
- backend `FRONTEND_BASE_URL` uses your laptop IP for QR on mobile
- backend `CLIENT_ORIGIN` includes the frontend origins you will use
- frontend `VITE_API_BASE_URL` points to the backend

### 4. Start the backend

From root:

```bash
npm run backend
```

Or from `backend/`:

```bash
npm run dev
```

### 5. Start the frontend

Open another terminal:

```bash
npm run frontend
```

Or from `frontend/`:

```bash
npm run dev
```

### 6. Open the app

- Login page:
  - `http://localhost:5173`
  - or `http://<your-local-ip>:5173`
- Teacher dashboard:
  - login as teacher
- Student dashboard:
  - login as student
- QR attendance:
  - generated from teacher session page

## Mobile QR Setup

To make QR scanning work on a phone:

1. connect phone and laptop to the same Wi-Fi
2. set `FRONTEND_BASE_URL` to your laptop IP
3. set `VITE_API_BASE_URL` to your laptop IP
4. include that frontend origin in `CLIENT_ORIGIN`
5. restart backend and frontend after env changes
6. create a new session so a new QR is generated

If the QR still opens `localhost`, the backend was not restarted after the `.env` change.

## Recommended Run Sequence

1. Start backend
2. Start frontend
3. Login as teacher
4. Create a manual session or schedule
5. Open a session details page
6. Scan the QR on a student device
7. Login on the QR page if needed
8. Mark attendance
9. Review present, absent, and suspicious entries from the teacher session page

## Notes

- Vite runs on port `5173`
- Backend runs on port `5000`
- Vite is configured with `host: 0.0.0.0`, so it can be reached on your local network
- Demo users are seeded by backend startup
- Session reporting is section-based, so student records should have the correct `section`

