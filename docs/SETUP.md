# Rahila Labs - Project Setup Guide

## New Project Structure

The project has been reorganized with a clear separation of concerns:

```
/
├── frontend/              # All Next.js frontend code
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   └── ...other frontend configs
├── backend/               # Flask API
│   ├── app/
│   ├── scripts/
│   ├── requirements.txt
│   └── run.py
├── rahila_labs_rider_app/ # Flutter mobile app
│   ├── lib/
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
├── docs/
└── README.md
```

## Setup Instructions

### 1. Database & Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Backend runs on `localhost:5000`

### 2. Frontend Web Portals

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `localhost:3000`

### 3. Flutter Rider App

```bash
cd rahila_labs_rider_app
flutter pub get
flutter run
```

### Quick Start (All Services)

From the root directory:

```bash
# Terminal 1: Backend
cd backend && python run.py

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Flutter (with emulator/device connected)
cd rahila_labs_rider_app && flutter run
```

## Build & Deployment

### Frontend Deployment

```bash
cd frontend
./deploy_frontend.sh
```

### Backend Deployment

Refer to `backend/startup.sh` or deployment documentation.
