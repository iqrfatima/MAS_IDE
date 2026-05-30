# Project Setup Guide

## Backend Setup (FastAPI)

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

#### Windows

```bash
.\venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install fastapi uvicorn python-multipart openai
```

### 4. Run Backend Server

```bash
uvicorn main:app --reload
```

Backend will start at:

```text
http://127.0.0.1:8000
```

API Docs:

```text
http://127.0.0.1:8000/docs
```

---

# Frontend Setup (React + Electron)

### 1. Install Project Dependencies

```bash
npm install
```

### 2. Install Electron

```bash
npm install electron
```

### 3. Install Electron Monitor

```bash
npm install electronmon --save-dev
```

### 4. Install State Management & Utilities

```bash
npm install zustand lucide-react axios
```

### 5. Install TypeScript & Electron Types

```bash
npm install ts-node typescript @types/node @types/electron --save-dev
```

### 6. Additional Development Dependencies

```bash
npm install -D @types/node typescript ts-node
```

---


# Notes

* Ensure Node.js 20+ is installed.
* Ensure Python 3.10+ is installed.
* Activate the virtual environment before running backend commands.
* Keep backend and frontend running in separate terminals during development.
