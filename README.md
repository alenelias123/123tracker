# 123tracker - Spaced Repetition Study Tracker

A study tracker application with spaced repetition (days 1, 3, 7) supporting AI-powered automated note comparison and manual solo tracking.

## Features

- **Automated Mode**: AI-powered note comparison using embeddings and cosine similarity
- **Solo Mode**: Manual tracking with trend analysis and suggestions
- **Spaced Repetition**: Auto-scheduled sessions on days 1, 3, and 7
- **Email Notifications**: Daily reminders for scheduled sessions
- **Auth0 Integration**: Secure authentication with JWT
- **PostgreSQL + pgvector**: Vector similarity search for note comparison

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL with pgvector extension
- sentence-transformers (gte-small, 384-dim)
- APScheduler for email reminders
- Auth0 JWT authentication

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Auth0 React SDK
- Recharts for visualizations

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 16+ with pgvector extension
- Auth0 account (for authentication)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up environment variables (copy from `.env.example`):
```bash
cp ../.env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/tracker
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
SENDGRID_API_KEY=your-sendgrid-key  # Optional, logs to console if not set
FRONTEND_URL=http://localhost:5173
COMPARE_THRESHOLD=0.80
MAX_NOTES_PER_SESSION=200
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
VITE_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Auth0 Configuration

1. Create an Auth0 API:
   - Identifier: Use the same value as `AUTH0_AUDIENCE`
   - Signing Algorithm: RS256

2. Create an Auth0 SPA Application:
   - Application Type: Single Page Application
   - Allowed Callback URLs: `http://localhost:5173, https://your-production-url.com`
   - Allowed Logout URLs: `http://localhost:5173, https://your-production-url.com`
   - Allowed Web Origins: `http://localhost:5173, https://your-production-url.com`

3. Note the Client ID and use it as `VITE_AUTH0_CLIENT_ID`

### Database Setup with Docker

Quick start with Docker Compose:

```bash
docker-compose up -d
```

This starts PostgreSQL with pgvector extension on port 5432.

## Running Tests

### Backend Tests
```bash
cd backend
pytest
pytest --cov=app  # With coverage report
```

### Frontend Tests
```bash
cd frontend
npm test
npm test -- --coverage  # With coverage report
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Endpoints

### Topics
- `POST /topics` - Create topic (auto-creates sessions)
- `GET /topics` - List user's topics
- `GET /topics/{id}` - Get topic details

### Sessions
- `GET /topics/{id}/sessions` - List sessions
- `PATCH /sessions/{id}/reschedule` - Reschedule session
- `POST /sessions/{id}/complete` - Mark completed
- `POST /sessions/{id}/skip` - Mark skipped

### Automated Mode
- `POST /sessions/{id}/notes` - Add notes with embeddings
- `POST /sessions/{id}/compare` - Compare with previous session
- `GET /sessions/{id}/comparison` - Get comparison result

### Solo Mode
- `POST /sessions/{id}/solo` - Add metrics
- `GET /topics/{id}/solo/trend` - Get trend analysis

## Deployment

### Backend Deployment (Render/Railway/Fly.io)

1. Set environment variables in your platform
2. Connect to PostgreSQL database with pgvector
3. Run migrations: `alembic upgrade head`
4. Health check endpoint: `/health`

### Frontend Deployment (Vercel/Netlify)

1. Build command: `npm run build`
2. Output directory: `dist`
3. Set environment variables
4. Update Auth0 allowed URLs

### Database Migration

For production:
```bash
alembic upgrade head
```

To create new migration:
```bash
alembic revision --autogenerate -m "description"
```

## Architecture

### Data Model
- **users**: Auth0 user information
- **topics**: Study topics with mode (automated/solo)
- **sessions**: Scheduled study sessions (day 1, 3, 7)
- **note_points**: Bullet points with embeddings (automated mode)
- **comparisons**: AI comparison results
- **solo_metrics**: Manual metrics (solo mode)
- **notifications**: Email notification log

### AI Comparison Logic
1. Previous session notes are compared with current session notes
2. Each previous point is matched to the most similar current point using cosine similarity
3. Points below threshold (default 0.80) are marked as "missed"
4. Recall score = (matched points / total previous points) × 100

### Solo Mode Suggestions
- **≥85% remembered**: "Great retention! Consider increasing intervals."
- **<60% remembered**: "Low retention. Schedule sessions sooner."
- **Otherwise**: "Keep up the current pace."

## Troubleshooting

### Backend Issues

**Database connection errors:**
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure pgvector extension is installed: `CREATE EXTENSION vector;`

**Auth0 token errors:**
- Verify AUTH0_DOMAIN and AUTH0_AUDIENCE are correct
- Check token in browser dev tools
- Ensure API is configured correctly in Auth0

**Sentence-transformers download:**
- First run downloads ~100MB model
- Requires internet connection
- Model cached locally after first download

### Frontend Issues

**API connection errors:**
- Verify backend is running on correct port
- Check VITE_API_URL matches backend URL
- Verify CORS is configured correctly

**Auth0 login errors:**
- Check Auth0 application settings
- Verify callback URLs are whitelisted
- Check browser console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT
