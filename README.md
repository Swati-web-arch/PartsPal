# PartsPal 🤖 — Robotics Club Lab Inventory & Kit Checkout System

> **Round 2 Build Task (PS-05 PartsPal - Standard / Robotics)**  
> Built with React (Vite) and Node.js (Express).

---

## 📌 Problem Statement & App Overview
The robotics club lab lends out Arduinos, sensors, motor drivers, and specialized project kits (like line-follower kits). Without an organized system, parts go missing before competition season and teams struggle to coordinate checkouts.

**PartsPal** provides a complete end-to-end management platform tailored for both students and lab organizing committee leads:
1. **Dual Role Sign In**: Quick onboarding for **Participants (P)** (email + reg no) and secure access for **OC Leads (OC)** (passcode authenticated).
2. **Key Challenge (All-or-Nothing Kit Issuing)**: The server verifies stock for every single component in a kit before decrementing. If even one part is out of stock, the issue fails atomically with a descriptive error naming the exact missing parts.
3. **Dynamic Kit Builder & Part Manager**: OC leads can customize kit contents on the fly (e.g. adding wheels to a robotic car kit) or create brand new kits and add new parts into the lab inventory with immediate synchronization.
4. **Smart Defective Return & Replacement**: If a student returns a kit with a damaged motor or broken sensor, the OC lead can mark the kit defective, record defect notes, and **immediately issue a fresh replacement kit** on the spot.
5. **Printable QR Codes**: Instant QR code generation for student pickup codes and printable kit shelf labels.
6. **Grace Period & Overdue Tracking**: 10-minute grace period with humanized timers (*"Due in 2h"*, *"In Grace Period (5m left)"*, *"⚠️ Overdue by 30m"*).
7. **Live Stats Bar**: Real-time overview of Lab Stock, Active Checkouts, Overdue Items, and Defective Logs.

---

## 🚀 Features Implemented

### Core Features (PS-05 Specification)
- [x] **Inventory Management**: Real-time available and total stock, search bar, and category filters (`Sensors`, `Microcontrollers`, `Drivers`, `Motors`, `Mechanical`, `Power`).
- [x] **All-or-Nothing Kit Issuing**: Strict server validation preventing partial kit checkouts.
- [x] **Who Has What**: Active checkouts dashboard with student name, registration number, checkout time, and expected return time.
- [x] **Overdue Highlighting**: Dynamic red alerts on cards past their return time (accounting for the 10-minute grace period).
- [x] **Return Processing**: Restores stock to inventory upon return confirmation.

### High-Impact Additions & Stretch Goals
- [x] **Role-Based Portals**: Clean separate views for **Participants** and **OC Leads** with seamless role switching.
- [x] **Custom Kit Creator**: OC leads can assemble and publish new kits from existing parts or create brand-new parts (e.g. `L298N Motor Driver`, `Linear Actuator`) directly from the kit builder.
- [x] **Lab Stock Editor**: OC leads can adjust total owned units as new lab supplies arrive.
- [x] **Defective Return & Instant Replacement**: Handles damaged returns and immediately issues replacement kits to participants.
- [x] **QR Code Labels & Scanner**: Instant QR generation for pickup codes and printable shelf labels (`qrcode`).
- [x] **Quick Return Presets**: 1-click presets on request forms (`+2 Hours`, `+4 Hours`, `Tomorrow 9:00 AM`).
- [x] **Member Borrowing History**: Searchable history by registration number with return condition logs.
- [x] **Live Lab Stats Bar**: Real-time counter of available parts, active loans, and defective incidents.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, `qrcode`, CSS3 (Mobile-responsive).
- **Backend**: Node.js, Express, CORS, `dotenv`.
- **Data Store**: Clean in-memory store initialized with seed components for lab testing.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate as Participant (`p`) or OC Member (`oc` with passcode) |
| `GET` | `/api/parts` | Fetch lab inventory with optional search and category filters |
| `POST` | `/api/parts` | Register a new component in lab inventory |
| `PATCH` | `/api/parts/:id` | Adjust total owned stock or low-stock thresholds |
| `GET` | `/api/kits` | Fetch all kits with detailed part breakdown and `canIssueCount` |
| `POST` | `/api/kits` | Create a brand new robotics kit |
| `PATCH` | `/api/kits/:id` | Modify items and quantities inside an existing kit |
| `POST` | `/api/issues` | Participant checkout request (generates pickup code) |
| `POST` | `/api/issues/:id/approve` | OC approval with atomic all-or-nothing stock decrement |
| `POST` | `/api/issues/:id/reject` | OC rejects a pending request |
| `PATCH` | `/api/issues/:id/return` | Standard return (restores non-defective stock) |
| `POST` | `/api/issues/:id/return-defective` | Process damaged return and issue replacement kit |
| `GET` | `/api/issues` | List issues; supports `?status=overdue` and `?regNo=` |

---

## 💻 How to Run Locally

### 1. Clone & Navigate
```bash
git clone <your-repo-url>
cd partspal-1
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
Server starts on `http://localhost:5000`.

### 3. Start the Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
Client starts on `http://localhost:5173`. Open in your browser!

---

## 🧪 Evaluator Demo Walkthrough
1. **Participant View**:
   - Log in as **Participant (P)** (`alex@vit.ac.in`, `22BCE1234`).
   - Request the **Robotic Car Line-Follower Kit** using the quick preset `+4 Hours`.
   - View the generated **Pickup Code** (e.g. `K-4821`) and click **📱 Open Scannable QR Code**.
2. **OC Lead View**:
   - Log out and log in as **OC Member (OC)** with passcode.
   - Check the **📥 Pending Requests** tab, locate `K-4821`, and click **Approve & Issue**.
   - Check the **Live Stats Bar** to watch Active Checkouts increment!
3. **Customize Kit**:
   - Navigate to **🧰 Customize Kits & Parts** $\rightarrow$ click **+ Create New Kit**.
   - Click **+ Create Brand New Part** and add `L298N Motor Driver` with 10 units in stock.
   - Publish the kit $\rightarrow$ switch to the participant view to see it immediately available with live stock calculations!
4. **Defective Return & Replacement**:
   - Under **📋 Who Has What**, click **⚠️ Mark Defective & Replace Kit** on an active kit checkout.
   - Enter defect notes and confirm $\rightarrow$ the old kit is marked defective and a **fresh replacement kit** is issued immediately to that student!

---

## 🌐 Live Deployment Links
- **Frontend (Vercel / Netlify)**: `[Insert live client URL]`
- **Backend (Render)**: `[Insert live Render URL]`

---

## 🤖 How I Used AI
As encouraged by the competition rules (*"Use AI as a helper, not as the builder"*):
- Used Google Antigravity / Gemini as an interactive coding mentor to plan the application architecture, refine business logic (e.g. all-or-nothing validation, 10-minute grace period calculations), and pair-program the full-stack implementation step by step.
