# Testing the Frontend

## Prerequisites

1. Backend must be running at the URL specified in `VITE_API_URL`
2. Auth0 application must be configured with the correct credentials
3. Node.js and npm must be installed

## Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Update `.env` with your values:
```
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
VITE_API_URL=http://localhost:8000
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

## Test Scenarios

### 1. Authentication Flow
- [ ] Landing page shows login button
- [ ] Click login redirects to Auth0
- [ ] After login, dashboard loads
- [ ] Logout button works

### 2. Dashboard
- [ ] Empty state shows when no topics exist
- [ ] Topics display after creating them
- [ ] Click on topic navigates to detail page
- [ ] Create Topic button navigates to form

### 3. Create Topic
- [ ] Form validates empty title
- [ ] Form validates empty description
- [ ] Mode selection works (automated/solo)
- [ ] Create button submits and redirects
- [ ] Cancel button goes back

### 4. Topic Detail
- [ ] Topic information displays correctly
- [ ] Sessions list shows with proper dates
- [ ] Status badges show correct colors
- [ ] Open button navigates to correct session type
- [ ] Reschedule shows date picker
- [ ] Complete/Skip buttons update status

### 5. Automated Session
- [ ] Can add bullet points
- [ ] Can remove bullet points
- [ ] Submit validates at least one point
- [ ] Compare shows recall score
- [ ] Missed points display correctly
- [ ] Back button returns to topic

### 6. Solo Session
- [ ] Form validates 0-100 range
- [ ] Submit saves metrics
- [ ] Chart displays trend data
- [ ] Suggestion text shows
- [ ] Back button returns to topic

## Common Issues

### API Connection
- Verify backend is running
- Check CORS settings in backend
- Verify API URL in .env

### Auth0
- Check domain and client ID
- Verify audience matches backend
- Check callback URLs in Auth0 dashboard

### Build Errors
- Clear node_modules and reinstall
- Check TypeScript errors with `npm run build`
- Verify all environment variables are set

## Production Build

Test production build:
```bash
npm run build
npm run preview
```

Visit http://localhost:4173 to test the production build.
