# ConnectSphere - Decoupled Full-Stack Real-Time Matchmaking & Chat Application

ConnectSphere is a modern, high-performance real-time random chat application. Built as a decoupled full-stack project using **Django REST Framework + Django Channels** for the backend and **React.js + Vite + Tailwind CSS** for the frontend.

---

## Project Structure

```
omniroute/
├── backend/                  # Self-contained Django REST Framework + Channels (ASGI)
│   ├── manage.py
│   ├── build.sh
│   ├── Procfile
│   ├── requirements.txt
│   ├── config/               # ASGI/WSGI, Settings, and Routing
│   ├── accounts/             # JWT Authentication, User & Normalized Interests
│   ├── matchmaking/          # Intelligent Realtime Matching & Consumer
│   ├── chat/                 # Realtime Messaging & Typing Consumer
│   ├── friends/              # Friend Requests & Blocked Users
│   ├── notifications/        # Realtime WebSocket Notifications
│   ├── common/               # Utilities & Custom Exception Handling
│   └── websocket/            # JWT WebSocket Authentication Middleware
│
└── frontend/                 # Self-contained React 18 + Vite + Tailwind CSS App
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── components/       # Reusable Glassmorphism UI Components
        ├── context/          # Auth & Socket Context Providers
        ├── pages/            # Home, Login, Register, Dashboard, Matchmaking, Chat, Friends, Profile
        ├── services/         # Axios API Client with JWT Refresh Interceptors
        ├── styles/           # Global Tailwind CSS & Glassmorphism Utilities
        └── App.jsx           # App Routing & Protected Routes
```

---

## Running Locally

### 1. Backend Server (Django ASGI Daphne)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

### 2. Frontend Development Server (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Visit the app at **http://localhost:5173/**.

---

## Deployment on Render

This project uses a single **Render Blueprint (`render.yaml`)** to deploy both backend and frontend web services:

1. Push your repository to GitHub.
2. On Render, click **New +** $\rightarrow$ **Blueprint**.
3. Select your repository. Render automatically provisions:
   - **`omniroute-backend`**: Python Web Service (Runs `daphne -b 0.0.0.0 -p $PORT config.asgi:application`)
   - **`omniroute-frontend`**: Static Site (Runs `npm run build`, publishes `dist`)
