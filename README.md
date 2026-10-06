# PartsPal 🤖 — Robotics Club Lab Inventory

> **Round 2 Build Task (PS-05 PartsPal - Standard / Robotics)**  
> Built with React (Vite) and Node.js (Express).

---

## 📌 Problem Statement Overview
The robotics club lab lends out Arduinos, sensors, and motor drivers, but keeping track of who has what often leads to lost parts before competition season. PartsPal solves this by providing:
1. Complete inventory tracking with available vs. total counts and search/category filters.
2. Member checkout by registration number and expected return date.
3. **The Key Challenge**: All-or-nothing kit issuing (e.g., line-follower kits) with server-side validation preventing partial decrements.
4. "Who has what" real-time dashboard highlighting overdue borrow records in red.
5. Instant returns that accurately replenish the lab inventory.

---

## 🚀 Features Implemented

### Core Features (PS-05 Specification)
- [x] **Inventory Management**: Real-time available and total stock, search bar, and category filters (Sensors, Microcontrollers, Motors, Drivers, etc.).
- [x] **All-or-Nothing Kit Issuing (Key Challenge)**: Evaluates stock for every component in a kit (e.g. Line-Follower Kit with Arduino Uno, 2x IR Sensors, Motor Driver) before decrementing. If any component is short, the request fails atomically with a descriptive error naming the exact missing parts.
- [x] **"Who Has What" View**: Active checkouts displaying member details, registration number, checkout timestamp, and due date.
- [x] **Overdue Tracking**: Automatically flags checkouts whose due date has passed with red highlight borders and badges.
- [x] **One-Click Returns**: `PATCH /api/issues/:id/return` endpoint marks records returned and restores stock to lab inventory.

### Stretch Goals Implemented
- [x] **Low-Stock Warnings**: Visual warning badges on parts where `available <= lowStockThreshold`.
- [x] **Member Issue History**: History view filterable by student registration number.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Responsive CSS (mobile-ready).
- **Backend**: Node.js, Express, CORS, dotenv.
- **Data Store**: Clean in-memory store initialized with seed components for lab testing.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint for deployment sanity & uptime |
| `GET` | `/api/parts` | Fetch inventory parts with optional `?search=` and `?category=` |
| `POST` | `/api/parts` | Add a new component to lab inventory |
| `GET` | `/api/kits` | Fetch kits with component breakdown and calculated `canIssueCount` |
| `POST` | `/api/issues` | Issue single part or entire kit with all-or-nothing validation |
| `PATCH` | `/api/issues/:id/return` | Mark an issued item returned & restore inventory stock |
| `GET` | `/api/issues` | List issues; supports `?status=overdue` and `?regNo=` |

---

## 💻 How to Run Locally

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd partspal
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

### 3. Start the Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
The client will start on `http://localhost:5173`. Open your browser to test the application!

---

## 🧪 Evaluator Test Flow (Step-by-Step)
To verify the exact test flow specified in the build task PDF:
1. Open the **Kits** tab and locate the **Line-Follower Kit** (requires 1x Arduino Uno, 2x IR Sensors, 1x Motor Driver).
2. Click **Issue Kit**, enter student details, and confirm. Notice in the **Inventory** tab that stock drops for all 3 components simultaneously.
3. Issue the kit repeatedly until the **Motor Driver** runs out. Try to issue one more kit — the server rejects the request with:  
   `"Cannot issue kit. Insufficient stock for: Motor Driver (Needs: 1, Available: 0)"`  
   and verifies that none of the other parts' stock was reduced.
4. Navigate to **Who Has What**, click **Mark Returned** on an issued kit, and verify that the stock immediately replenishes in **Inventory**.

---

## 🌐 Live Deployment Links
- **Frontend (Vercel / Netlify)**: `[Insert your live client URL here]`
- **Backend (Render)**: `[Insert your Render backend URL here]`

*(Note: Render free instances spin down after inactivity and may take up to a minute to wake up on the first request).*

---

## 🤖 How I Used AI
As allowed by the competition rules:
- **Assistant & Mentor**: Used Google Antigravity / Gemini as an interactive pair-programming mentor to design the modular architecture, review business logic edge cases, and verify the all-or-nothing transaction flow.
- **Code Structuring**: Assisted in structuring clean Express routes, designing the in-memory data store, and building mobile-responsive React components with clean separation of concerns.
