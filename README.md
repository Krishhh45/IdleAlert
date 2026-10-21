# IdleAlert 🏫⚡

> **AI-Powered Classroom Surveillance & Automated Cellular Energy Conservation System**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF.svg?logo=ultralytics&logoColor=black)](https://github.com/ultralytics/ultralytics)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Overview

Educational institutions waste significant amounts of electrical energy every day because ceiling fans and lights are left running in vacant lecture halls, classrooms, and seminar rooms. Traditional PIR (passive infrared) motion sensors often fail due to line-of-sight obstructions, lack of spatial understanding, and inability to detect whether electrical appliances are actually powered on.

**IdleAlert** solves this problem by combining **Ultralytics YOLOv8s computer vision** with a specialized **Classroom Optical Fixture Analyzer**. The system operates across **live webcam streams** and **recorded CCTV videos/images** to detect:
1. **Human Occupants** (with high recall across dense seating and partially occluded desks).
2. **Ceiling Fans** (distinguishing rotating `Fan ON` vs. stationary `Fan OFF` via temporal motion blur).
3. **Classroom Lights** (distinguishing illuminated `Light ON` vs. unlit `Light OFF` fixtures via luminance & HSV saturation analysis).

When active appliances are detected in an **unoccupied room**, IdleAlert immediately logs the energy wastage event, alerts the web dashboard, and dispatches an **automated cellular SMS alert** to facility staff or administrators.

---

## 🚀 Key Features

* 👁️ **Multi-Input Surveillance**:
  * **Live Stream Monitoring**: Real-time webcam streaming with live HUD bounding box overlays and dynamic telemetry.
  * **Media Analysis**: Upload recorded classroom images or CCTV MP4 videos for full frame-by-frame neural inference, event timeline generation, and browser-playable H.264 video rendering.
* 🧠 **Precision Hybrid Detection Engine**:
  * **Human Occupancy**: YOLOv8s with Non-Maximum Suppression (NMS, IoU 0.45) detecting students in deep perspective rows without false duplicates.
  * **Ceiling Fixture Analyzer**: Identifies tube lights, panel troffers, and ceiling fans strictly in the ceiling plane, eliminating false positives on chairs, desks, walls, and doors.
* ⚡ **5-Rule Energy Decision Matrix**:
  * Evaluates room occupancy against active equipment states to categorize incidents into **Normal**, **Warning**, or **Critical Energy Wastage**.
* 📲 **Automated Cellular SMS Alerts**:
  * Integrated with the **TextBee Gateway API** to dispatch real-time SMS alerts directly to the administrator's mobile device.
  * Built-in rate limiting and deduplication preventing alert spam.
* 📊 **Analytics & Incident Management**:
  * Live metrics, occupancy trends, equipment usage charts, and complete alert lifecycle management (**Active** $\rightarrow$ **Acknowledged** $\rightarrow$ **Resolved**).
* 🎨 **Modern SaaS Interface**:
  * Built with React 18, TypeScript, Tailwind CSS, Framer Motion, and Dark/Light mode support.

---

## ⚙️ Energy Decision Matrix

IdleAlert enforces five core rules to classify classroom conditions:

| Rule | Occupancy | Equipment State | Severity | System Action |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `Person > 0` | Any (Fan / Light ON or OFF) | 🟢 **Normal** | Legitimate usage; no alert triggered. |
| **2** | `Person = 0` | Fan ON, Light OFF | 🟡 **Warning** | Logs event, displays warning toast, sends SMS. |
| **3** | `Person = 0` | Light ON, Fan OFF | 🟡 **Warning** | Logs event, displays warning toast, sends SMS. |
| **4** | `Person = 0` | Fan ON + Light ON | 🔴 **Critical** | Critical energy wastage; triggers high-priority alert + immediate SMS. |
| **5** | `Person = 0` | Fan OFF + Light OFF | 🟢 **Normal** | Energy conserved; classroom properly secured. |

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **AI / Computer Vision** | **Ultralytics YOLOv8s**, **PyTorch** | Deep-learning occupancy detector |
| **Vision Processing** | **OpenCV (`cv2`)**, **NumPy** | Optical fixture analysis, morphology, Canny edges |
| **Backend Framework** | **FastAPI**, **Uvicorn** | Asynchronous REST API & streaming |
| **Video Transcoding** | **FFmpeg** | Browser-compatible H.264 MP4 encoding |
| **Database & ORM** | **SQLite**, **SQLAlchemy** | Relational storage for logs, sessions, and alerts |
| **Cellular SMS Gateway**| **TextBee API** | Automated SMS notification delivery |
| **Frontend Framework** | **React 18**, **TypeScript**, **Vite** | Single Page Application (SPA) |
| **Styling & UI** | **Tailwind CSS**, **Framer Motion** | Responsive UI, dark/light themes, smooth transitions |
| **Data Visualization** | **Recharts**, **Lucide Icons** | Interactive metrics and charts |

---

## 📁 Repository Structure

```text
IdleAlert/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── detector.py          # YOLOv8s + Optical Fixture Analyzer
│   │   │   └── energy_analyzer.py   # Energy rule engine & decision matrix
│   │   ├── api/
│   │   │   ├── alerts.py            # Alert lifecycle management endpoints
│   │   │   ├── analysis.py          # Image & video analysis processing
│   │   │   ├── analytics.py         # Historical trends and telemetry stats
│   │   │   ├── auth.py              # User authentication & SMS profile
│   │   │   ├── classrooms.py        # Classroom directory management
│   │   │   └── monitoring.py        # Real-time live camera feed handler
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── alert_service.py     # Incident dispatcher & deduplicator
│   │   │   ├── sms_service.py       # TextBee SMS gateway integration
│   │   │   └── video_service.py     # H.264 video rendering pipeline
│   │   ├── config.py                # Environment & model configurations
│   │   ├── database.py              # SQLite engine & session factory
│   │   └── main.py                  # FastAPI application entry point
│   ├── .env.example                 # Environment variables template
│   ├── requirements.txt             # Python dependencies
│   └── run.py                       # Backend server launcher
├── frontend/
│   ├── src/
│   │   ├── components/              # Modular UI components & layouts
│   │   ├── context/                 # Auth, Alert, Classroom & Theme contexts
│   │   ├── pages/                   # Dashboard, Live Monitoring, Analysis, etc.
│   │   ├── services/                # Axios API client
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json                 # Node dependencies & scripts
│   ├── tailwind.config.js           # Tailwind theme configuration
│   └── vite.config.ts               # Vite build configuration
├── start_system.bat                 # One-click Windows runner
└── .gitignore
```

---

## ⚡ Getting Started

### Prerequisites

* **Python 3.10+**
* **Node.js 18+** & **npm**
* **Git**

---

### 1. Installation

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

---

### 2. Configuration

Create your `.env` file in the `backend/` directory using the provided template:

```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env` with your TextBee credentials if you wish to enable live cellular SMS notifications:
```env
TEXTBEE_API_KEY=your_textbee_api_key_here
TEXTBEE_DEVICE_ID=your_textbee_device_id_here
SMS_RATE_LIMIT_SECONDS=300
```
*(If left unconfigured, IdleAlert operates normally with in-app dashboard alerts).*

---

### 3. Running the Application

#### Option A: One-Click Startup (Windows)
Double-click `start_system.bat` in the project root to start both backend and frontend servers simultaneously.

#### Option B: Manual Startup

**Terminal 1 — Backend (FastAPI)**
```bash
cd backend
python run.py
```
> API will be available at: **http://localhost:8000**  
> Swagger Documentation: **http://localhost:8000/docs**

**Terminal 2 — Frontend (Vite + React)**
```bash
cd frontend
npm run dev
```
> Web UI will be available at: **http://localhost:5173**

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/model-info` | Detection engine capability & loaded weights |
| `POST` | `/api/monitoring/frame` | Ingests live webcam base64 frame for real-time analysis |
| `POST` | `/api/analysis/image` | Uploads and analyzes a static image file |
| `POST` | `/api/analysis/video` | Uploads and processes a classroom video stream |
| `GET` | `/api/alerts` | Fetches active and historical alerts |
| `PATCH`| `/api/alerts/{id}/resolve`| Resolves an alert incident |
| `GET` | `/api/analytics` | Aggregated telemetry data for dashboard charts |

---

