<div align="center">

# 🌿 Sukoon

### *A safe space to feel heard.*

**Sukoon** is an AI-powered emotional support chat application designed for youth. It provides a warm, judgment-free environment where users can express themselves and receive empathetic, meaningful responses — powered by large language models and a secure modern backend.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sukoon--sable.vercel.app-6c5ce7?style=for-the-badge&logo=vercel)](https://sukoon-sable.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb?style=for-the-badge&logo=react)](https://github.com/Radhetare/Sukoon)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?style=for-the-badge&logo=fastapi)](https://github.com/Radhetare/sukoon-backend)

</div>

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## 🧠 About the Project

Sukoon (meaning *peace* or *calm* in Hindi/Urdu) is a full-stack web application that bridges AI and emotional wellness. Users can have real-time, context-aware conversations with an AI companion that listens empathetically, reflects feelings, and gently encourages healthy coping.

The project is split into two repositories:
- **[Frontend](https://github.com/Radhetare/Sukoon)** — React + TypeScript SPA
- **[Backend](https://github.com/Radhetare/sukoon-backend)** — FastAPI REST API with authentication and AI chat

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript 6 | Type-safe JavaScript |
| Vite 8 | Build tool & dev server |
| React Router DOM v6 | Client-side routing |
| CSS Modules | Component-scoped styling |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| Groq SDK | LLM inference (fast AI responses) |
| MongoDB + Motor | Async NoSQL database |
| PyMongo + DNSPython | MongoDB connection utilities |
| Python-JOSE | JWT authentication |
| Bcrypt | Password hashing |
| Pydantic v2 | Request/response validation |
| Python-dotenv | Environment config management |

---

## ✨ Features

- 💬 **AI Chat Interface** — Real-time conversational UI with smooth message rendering
- 🔐 **User Authentication** — Secure JWT-based signup, login, and session management
- 🧾 **Conversation History** — Persisted chat sessions stored per user in MongoDB
- 🎨 **Theming Support** — Light/dark mode with CSS variable-based theming
- 📱 **Responsive Design** — Mobile-friendly layout that works on all screen sizes
- 🔒 **Hashed Passwords** — Bcrypt encryption ensures no plaintext credentials are stored
- ⚡ **Fast AI Responses** — Powered by Groq's inference API for near-instant LLM replies
- 🛡️ **CORS & API Security** — Configured cross-origin policies for safe frontend-backend communication

---

## 📁 Project Structure

```
Sukoon/                        # Frontend repository
├── public/                    # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   ├── pages/                 # Route-level page components
│   ├── styles/                # Global and theme CSS
│   └── main.tsx               # App entry point
├── index.html
├── vite.config.ts
└── package.json

sukoon-backend/                # Backend repository
├── app/
│   ├── routers/               # API route handlers (auth, chat, etc.)
│   ├── models/                # Pydantic data models
│   ├── services/              # Business logic (AI, DB operations)
│   └── main.py                # FastAPI app entry point
├── requirements.txt
├── runtime.txt
└── .env                       # Environment variables (not committed)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18+ and **npm** (for the frontend)
- **Python** 3.11+ (for the backend)
- **MongoDB** — a running local instance or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI
- A **Groq API key** — get one free at [console.groq.com](https://console.groq.com)

---

### Frontend Setup

```bash
# 1. Clone the frontend repository
git clone https://github.com/Radhetare/Sukoon.git
cd Sukoon

# 2. Install dependencies
npm install

# 3. Create a .env file and add your backend URL
echo "VITE_API_URL=http://localhost:8000" > .env

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

> **Build for production:**
> ```bash
> npm run build
> ```

---

### Backend Setup

```bash
# 1. Clone the backend repository
git clone https://github.com/Radhetare/sukoon-backend.git
cd sukoon-backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create a .env file with your credentials (see below)

# 5. Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs available at `http://localhost:8000/docs`

---

## 🔑 Environment Variables

### Backend — `.env`

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sukoon
SECRET_KEY=your_jwt_secret_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend — `.env`

```env
VITE_API_URL=http://localhost:8000
```

> ⚠️ Never commit `.env` files to version control. They are already included in `.gitignore`.

---

## 🌐 Deployment

The frontend is deployed on **Vercel** and the backend can be deployed on platforms like **Render**, **Railway**, or **Fly.io**.

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | [sukoon-sable.vercel.app](https://sukoon-sable.vercel.app) |
| Backend | Render / Railway | Configure `VITE_API_URL` accordingly |

---

<div align="center">

Made with 💜 by [Radhe Tare](https://github.com/Radhetare)

</div>
