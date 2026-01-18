# 123tracker Frontend

React frontend for the 123tracker study tracking application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your configuration:
```bash
cp .env.example .env
```

3. Update the environment variables in `.env`:
- `VITE_AUTH0_DOMAIN`: Your Auth0 domain
- `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID
- `VITE_AUTH0_AUDIENCE`: Your Auth0 API audience
- `VITE_API_URL`: Backend API URL (e.g., `http://localhost:8000`)

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for routing
- **Auth0** for authentication
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Recharts** for data visualization

## Features

- **Dashboard**: View all your topics
- **Topic Management**: Create and manage learning topics
- **Automated Mode**: AI-powered note comparison with recall scoring
- **Solo Mode**: Manual self-assessment with trend visualization
- **Session Management**: Schedule, reschedule, complete, and skip sessions
