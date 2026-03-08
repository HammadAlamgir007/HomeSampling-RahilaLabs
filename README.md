# Rahila Labs

A comprehensive full-stack healthcare platform designed to modernize home diagnostic services. This system coordinates patient bookings, laboratory test management, and field rider logistics.

## System Overview

The Rahila Labs platform consists of three main components:

### 1. Web Portals (Frontend)
Built with Next.js, React, and Tailwind CSS.
- **Patient Portal:** Allows users to log in, browse a massive live-synced catalog of 880+ lab tests, filter by category/department, and schedule home collection appointments with integrated shopping-cart UI.
- **Admin Dashboard:** A robust control panel for lab administrators. Features include managing test catalogs (Code, Category, Specimen, Turnaround Time), assigning tasks to logged-in riders, tracking rider GPS data, and monitoring orders in real-time.

### 2. Core API (Backend)
Built with Python and Flask, utilizing SQLite for data storage.
- **Catalog Management:** Supports complex operations like parsing PDF rate lists (`import_catalog.py`) to keep the DB perfectly synced with hospital catalogs.
- **Task & Rider Routing:** Endpoints that handle the intricate logic of assigning, re-assigning, and tracking the active task counts of riders in the field.
- **Authentication:** Secure JWT generation and werkzeug password hashing.

### 3. Rider Application (Mobile)
A mobile application built using Flutter and Dart.
- **Task Execution:** Riders receive active tasks linked to their profile, helping them navigate to patient homes for sample collection.
- **Notifications system:** Polling-based local notification service alerting riders to new tasks or changes to their schedules.
- **Status Reporting:** Keeps the Admin Dashboard updated regarding real-time job progression.

## Getting Started

### Prerequisites
- Node.js (for the frontend panel)
- Python 3.12+ (for the backend API)
- Flutter SDK (for the Rider mobile app)

### Running the Services Locally

**1. Database and Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python run.py
```
*(The backend runs on `localhost:5000` by default)*

**2. Frontend Web Portals:**
```bash
# In the root project directory
npm install
npm run dev
```
*(The frontend runs on `localhost:3000` by default)*

**3. Flutter Rider App:**
Connect your physical device or Android emulator:
```bash
cd rahila_labs_rider_app
flutter pub get
flutter run
```

## Features Deep Dive

* **Intelligent PDF Syncing:** An internal script utilizes `pdftotext` to analyze raw hospital PDF format catalogs, categorize strings dynamically by layout spacing, and automatically build/update a catalog of hundreds of tests seamlessly. 
* **Lag-Free Rendering Engine:** The patient `app/patient/book-test` and `app/services` systems use tailored memory-capped logic to successfully process 886 items natively on-device for an instantaneous search & filter experience without crashing the DOM.
* **Smart Rider Polling:** The Flutter application implements a lightweight background ping system with `flutter_local_notifications` indicating real-time updates via a top-bar bell interface as long as the app is actively running.