# Deployment Guide

This guide covers deploying the 123tracker application to production.

## Prerequisites

- PostgreSQL database with pgvector extension
- Auth0 account with configured API and Application
- SendGrid API key (optional, for email notifications)
- Domain names for frontend and backend (recommended)

## Backend Deployment

### Option 1: Render

1. **Create PostgreSQL Database**
   - Go to Render Dashboard → New → PostgreSQL
   - Note the Internal/External Database URL
   - Connect via psql and enable pgvector:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

2. **Create Web Service**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Settings:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - **Health Check Path**: `/health`

3. **Environment Variables**
   ```
   DATABASE_URL=<postgres-url-from-step-1>
   AUTH0_DOMAIN=<your-tenant>.auth0.com
   AUTH0_AUDIENCE=https://<your-api-identifier>
   SENDGRID_API_KEY=<your-key>
   FRONTEND_URL=https://<your-frontend-domain>
   COMPARE_THRESHOLD=0.80
   MAX_NOTES_PER_SESSION=200
   SOLO_HIGH_RETENTION_THRESHOLD=85
   SOLO_LOW_RETENTION_THRESHOLD=60
   PYTHON_VERSION=3.12.0
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Test: `curl https://<your-backend-domain>/health`

### Option 2: Railway

1. **Create New Project**
   - Go to Railway Dashboard → New Project → Deploy from GitHub repo

2. **Add PostgreSQL**
   - Add Service → Database → PostgreSQL
   - In PostgreSQL service, go to Variables and note `DATABASE_URL`
   - Connect via Railway CLI and enable pgvector:
     ```bash
     railway connect postgres
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

3. **Configure Backend Service**
   - Select your repository
   - Settings → Root Directory: `backend`
   - Add environment variables (same as Render)

4. **Custom Start Command**
   - Settings → Deploy → Custom Start Command:
     ```bash
     alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

### Option 3: Docker + Any Cloud Provider

1. **Build and Push Docker Image**
   ```bash
   cd backend
   docker build -t your-registry/123tracker-backend:latest .
   docker push your-registry/123tracker-backend:latest
   ```

2. **Deploy to Cloud Provider**
   - AWS ECS, Google Cloud Run, Azure Container Instances, etc.
   - Ensure DATABASE_URL points to your PostgreSQL instance
   - Expose port 8000
   - Set health check to `/health`

## Frontend Deployment

### Option 1: Vercel

1. **Connect Repository**
   - Go to Vercel Dashboard → New Project
   - Import your GitHub repository

2. **Configure Project**
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**
   ```
   VITE_AUTH0_DOMAIN=<your-tenant>.auth0.com
   VITE_AUTH0_CLIENT_ID=<your-spa-client-id>
   VITE_AUTH0_AUDIENCE=https://<your-api-identifier>
   VITE_API_URL=https://<your-backend-domain>
   ```

4. **Deploy**
   - Click "Deploy"
   - Note your deployment URL

### Option 2: Netlify

1. **Connect Repository**
   - Go to Netlify Dashboard → New site from Git
   - Choose your repository

2. **Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

3. **Environment Variables**
   - Same as Vercel (see above)

4. **Deploy**
   - Click "Deploy site"

### Option 3: Docker + Nginx

1. **Build and Push Docker Image**
   ```bash
   cd frontend
   docker build -t your-registry/123tracker-frontend:latest .
   docker push your-registry/123tracker-frontend:latest
   ```

2. **Deploy to Cloud Provider**
   - Expose port 80
   - Configure SSL/TLS certificate

## Auth0 Configuration

### API Configuration

1. **Create API** (if not exists)
   - Go to Auth0 Dashboard → Applications → APIs → Create API
   - Name: `123tracker API`
   - Identifier: `https://api.123tracker.com` (or your domain)
   - Signing Algorithm: RS256

2. **Note the Identifier**
   - Use this as `AUTH0_AUDIENCE` in backend
   - Use this as `VITE_AUTH0_AUDIENCE` in frontend

### SPA Application Configuration

1. **Create Application** (if not exists)
   - Go to Auth0 Dashboard → Applications → Create Application
   - Name: `123tracker Web`
   - Type: Single Page Web Applications

2. **Configure URLs**
   - **Allowed Callback URLs**:
     ```
     http://localhost:5173,
     https://<your-frontend-domain>
     ```
   - **Allowed Logout URLs**:
     ```
     http://localhost:5173,
     https://<your-frontend-domain>
     ```
   - **Allowed Web Origins**:
     ```
     http://localhost:5173,
     https://<your-frontend-domain>
     ```
   - **Allowed Origins (CORS)**:
     ```
     http://localhost:5173,
     https://<your-frontend-domain>
     ```

3. **Note the Client ID**
   - Use this as `VITE_AUTH0_CLIENT_ID` in frontend

## Database Migration

### Initial Setup

On first deployment, migrations should run automatically via the build command.

If you need to run manually:

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head
```

### Future Migrations

1. Create migration:
   ```bash
   alembic revision --autogenerate -m "description"
   ```

2. Review generated migration file in `backend/alembic/versions/`

3. Apply migration:
   ```bash
   alembic upgrade head
   ```

4. Commit migration file to repository

## SendGrid Email Setup

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com

2. **Create API Key**
   - Settings → API Keys → Create API Key
   - Give it "Mail Send" permissions

3. **Verify Sender**
   - Settings → Sender Authentication
   - Verify a single sender email or entire domain

4. **Configure Backend**
   - Set `SENDGRID_API_KEY` environment variable
   - Update sender email in `backend/app/email.py` if needed

## Monitoring & Logging

### Health Checks

- Backend: `GET /health`
- Expected response: `{"status": "healthy", "service": "123tracker-api", "version": "1.0.0"}`

### Logging

The application uses Python's logging module. Configure log aggregation:

- **Render**: Logs available in dashboard
- **Railway**: Use Railway logging integration
- **Custom**: Configure log shipping to Datadog, New Relic, etc.

### Monitoring

Set up monitoring for:
- Response times
- Error rates
- Database connection pool
- Memory usage
- Scheduled job execution

## SSL/TLS Configuration

Most platforms (Vercel, Netlify, Render, Railway) provide automatic SSL certificates.

For custom setups:
- Use Let's Encrypt with Certbot
- Configure your reverse proxy (Nginx, Caddy) for HTTPS

## Scaling Considerations

### Backend Scaling

1. **Horizontal Scaling**
   - Multiple backend instances can run in parallel
   - Ensure database connection pool is configured properly
   - Use a load balancer

2. **Scheduler**
   - Only run scheduler on one instance
   - Use environment variable: `ENABLE_SCHEDULER=true` on primary instance only
   - Or use external cron service (EasyCron, etc.)

3. **Database**
   - Use connection pooling (already configured)
   - Consider read replicas for scaling reads
   - Monitor query performance

### Frontend Scaling

- CDN automatically handles scaling (Vercel, Netlify)
- For custom deployments, use CloudFront, Cloudflare, or similar

## Security Checklist

- [ ] All environment variables set correctly
- [ ] CORS configured to allow only your frontend domain
- [ ] Auth0 callback URLs restricted to your domains
- [ ] Database uses strong password
- [ ] Database not publicly accessible (use internal URLs)
- [ ] SSL/TLS enabled on all endpoints
- [ ] SendGrid API key kept secret
- [ ] Regular dependency updates
- [ ] Database backups configured
- [ ] Rate limiting configured (if needed)

## Troubleshooting

### Backend Issues

**502 Bad Gateway**
- Check backend logs
- Verify health check endpoint responds
- Check database connectivity

**Database Connection Errors**
- Verify DATABASE_URL is correct
- Check if database is accepting connections
- Verify pgvector extension is installed

**Auth0 Token Errors**
- Verify AUTH0_DOMAIN and AUTH0_AUDIENCE match Auth0 dashboard
- Check if API is configured correctly in Auth0
- Verify token in browser dev tools

### Frontend Issues

**Blank Page**
- Check browser console for errors
- Verify all VITE_* environment variables are set
- Check if backend API is accessible

**Auth0 Login Errors**
- Verify callback URLs in Auth0 match your frontend URL
- Check VITE_AUTH0_CLIENT_ID matches Auth0 application
- Check browser console for specific errors

**API Connection Errors**
- Verify VITE_API_URL points to correct backend
- Check CORS configuration on backend
- Check browser network tab for failed requests

## Rollback Procedure

If deployment fails:

1. **Revert Code**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Rollback Database**
   ```bash
   alembic downgrade -1  # Go back one migration
   ```

3. **Redeploy**
   - Platform will automatically redeploy after git push

## Post-Deployment Verification

1. **Backend**
   - [ ] `/health` endpoint returns 200
   - [ ] Can create topic via API
   - [ ] Database tables exist
   - [ ] Scheduler is running (check logs)

2. **Frontend**
   - [ ] Can access homepage
   - [ ] Can login with Auth0
   - [ ] Can create topic
   - [ ] Can view topic details
   - [ ] Can complete session

3. **Integration**
   - [ ] Frontend can authenticate with backend
   - [ ] API calls succeed
   - [ ] Embeddings are generated (for automated mode)
   - [ ] Comparisons work correctly

## Support

For issues:
1. Check application logs
2. Review this guide
3. Check Auth0 dashboard for auth issues
4. Review database logs for data issues
