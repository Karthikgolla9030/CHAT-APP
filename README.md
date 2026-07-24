# OmniRoute - Random Chat Web Application

A modern, secure, and feature-rich random chat web application similar to Omegle, built with Django, Django REST Framework, Django Channels, and Bootstrap 5.

## Features

- Authentication (Register, Login, Guest)
- Rich Profiles with completion score
- Intelligent Matching Engine (Exact/Balanced/Random)
- Real-time Chat via WebSockets
- Typing Indicators & Seen Status
- Friends System with Requests
- Block & Report Features
- Real-time Notifications
- Dark Mode Support
- Admin Moderation Panel
- REST APIs
- Rate Limiting & Safety Filters

## Quick Start

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Docker

```bash
docker-compose up --build
```

## Tech Stack

- Python 3.10+
- Django 4.2
- Django REST Framework
- Django Channels
- Bootstrap 5
- SQLite / PostgreSQL
- Redis (production)

## Deployment on Render

### Prerequisites

- A GitHub repository with this project
- A Render account (https://render.com)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/omniroute.git
git push -u origin main
```

### 2. Create PostgreSQL Database on Render

1. Go to Render Dashboard → New → PostgreSQL
2. Name: `omniroute-db`
3. Database: `omniroute`
4. User: `omniroute`
5. Copy the **Internal Database URL** (e.g., `postgres://omniroute:password@host:5432/omniroute`)

### 3. Create Redis on Render

1. Go to Render Dashboard → New → Redis
2. Name: `omniroute-redis`
3. Copy the **Internal Redis URL** (e.g., `redis://red-crxxx:6379`)

### 4. Create Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Name: `omniroute`
4. Runtime: `Python 3`
5. Build Command:
   ```bash
   pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```
6. Start Command:
   ```bash
   gunicorn omniroute.wsgi:application
   ```
7. Select the region closest to your database

### 5. Environment Variables

Add these environment variables in Render → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DJANGO_SECRET_KEY` | `your-random-secret-key-here` | Generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` | Disable debug mode |
| `DATABASE_URL` | `postgres://omniroute:pass@host:5432/omniroute` | From your Render PostgreSQL instance |
| `REDIS_URL` | `redis://red-crxxx:6379` | From your Render Redis instance |
| `ALLOWED_HOSTS` | `your-app.onrender.com,localhost,127.0.0.1` | Your Render domain |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.onrender.com` | Optional: frontend domain if separate |
| `CSRF_TRUSTED_ORIGINS` | `https://your-app.onrender.com` | Required for HTTPS forms |
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | For production email |
| `EMAIL_HOST` | `smtp.gmail.com` | Your SMTP host |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USE_TLS` | `True` | Enable TLS |
| `EMAIL_HOST_USER` | `your-email@gmail.com` | Your email |
| `EMAIL_HOST_PASSWORD` | `your-app-password` | Your email app password |

### 6. Deploy

Click **Create Web Service**. Render will:
1. Install dependencies from `requirements.txt`
2. Run migrations
3. Collect static files
4. Start Gunicorn

### 7. Create Superuser

After deployment, create a superuser:

```bash
render ssh omniroute
python manage.py createsuperuser
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | Yes | `django-insecure-omniroute-change-in-production` | Django secret key |
| `DEBUG` | No | `False` | Debug mode |
| `DATABASE_URL` | Yes | `sqlite:///db.sqlite3` | PostgreSQL URL |
| `REDIS_URL` | Yes | `redis://localhost:6379/0` | Redis URL |
| `ALLOWED_HOSTS` | No | `localhost,127.0.0.1,.onrender.com` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | No | `` | Comma-separated origins for CORS |
| `CSRF_TRUSTED_ORIGINS` | No | `` | Comma-separated origins for CSRF |
| `EMAIL_BACKEND` | No | `django.core.mail.backends.smtp.EmailBackend` | Email backend |
| `EMAIL_HOST` | No | `smtp.gmail.com` | SMTP host |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_USE_TLS` | No | `True` | Use TLS |
| `EMAIL_HOST_USER` | No | `` | SMTP username |
| `EMAIL_HOST_PASSWORD` | No | `` | SMTP password |

## Production Configuration Details

### Database
- PostgreSQL is used in production via `DATABASE_URL`
- SQLite is used in development
- Connection pooling enabled with `conn_max_age=600`
- SSL required in production

### Static Files
- Served via WhiteNoise
- Collected to `staticfiles/` directory
- Compressed and cached for performance

### Media Files
- Local media storage configured for development
- For production, configure S3 or Cloudinary

### Security
- `SECURE_SSL_REDIRECT` enabled in production
- `SESSION_COOKIE_SECURE` and `CSRF_COOKIE_SECURE` enabled in production
- `SECURE_HSTS_SECONDS` set to 1 year in production
- `X_FRAME_OPTIONS` set to `DENY`
- `SECURE_BROWSER_XSS_FILTER` enabled in production
- `SECURE_CONTENT_TYPE_NOSNIFF` enabled in production

### CORS
- Configured via `CORS_ALLOWED_ORIGINS`
- Only allow trusted origins in production

### CSRF
- Trusted origins configured via `CSRF_TRUSTED_ORIGINS`
- Required for HTTPS forms

### Channels / WebSockets
- Uses Redis channel layer via `REDIS_URL`
- Falls back to InMemory for local development

### Celery
- Uses Redis broker via `REDIS_URL`
- Falls back to localhost for development

## API Endpoints

### Auth
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/guest-login/`
- `POST /api/auth/logout/`
- `GET/PUT /api/auth/profile/`

### Chat
- `GET /api/chat/rooms/`
- `GET /api/chat/rooms/<id>/`
- `POST /api/chat/rooms/<id>/disconnect/`

### Matching
- `POST /api/matching/join-queue/`
- `POST /api/matching/leave-queue/`
- `POST /api/matching/request/`

### Friends
- `GET /api/friends/list/`
- `POST /api/friends/request/`
- `POST /api/friends/block/`

### Notifications
- `GET /api/notifications/`
- `POST /api/notifications/<id>/read/`

## WebSocket

- `ws://<host>/ws/chat/<room_id>/` - Chat
- `ws://<host>/ws/notifications/` - Notifications
- `ws://<host>/ws/match/` - Matching

## Testing

```bash
python manage.py test
```

## License

MIT
