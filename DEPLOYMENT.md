# Deployment Guide - Retirement Simulator

This guide covers deploying your retirement simulator to various cloud platforms.

## 🚀 Quick Deploy Options

### 1. Railway (Recommended - Easiest)

**Railway** is perfect for full-stack apps with automatic deployments.

#### Setup Steps:
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub** repository
3. **Create new project** → "Deploy from GitHub repo"
4. **Select your repository**
5. **Add environment variables**:
   ```
   STRIPE_SECRET_KEY=sk_live_your_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```
6. **Deploy!** Railway will automatically detect and build both services

#### Railway Configuration:
- **Backend**: Automatically detected as Python/Flask
- **Frontend**: Automatically detected as React
- **Custom domains**: Available in paid plans
- **SSL**: Automatic HTTPS

---

### 2. Render (Free Tier Available)

**Render** offers a generous free tier and easy deployment.

#### Setup Steps:
1. **Sign up** at [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect GitHub** repository
4. **Configure Backend**:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Environment Variables**: Add all from `env.example`
5. **Create Static Site** for frontend:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
6. **Deploy!**

---

### 3. Heroku (Classic Choice)

**Heroku** is reliable but requires paid plans.

#### Setup Steps:
1. **Install Heroku CLI**
2. **Create Heroku app**:
   ```bash
   heroku create your-retirement-simulator
   ```
3. **Add buildpacks**:
   ```bash
   heroku buildpacks:add heroku/python
   heroku buildpacks:add heroku/nodejs
   ```
4. **Set environment variables**:
   ```bash
   heroku config:set STRIPE_SECRET_KEY=sk_live_your_key
   heroku config:set REACT_APP_API_URL=https://your-app.herokuapp.com
   ```
5. **Deploy**:
   ```bash
   git push heroku main
   ```

---

### 4. DigitalOcean App Platform

**DigitalOcean** offers good performance and reasonable pricing.

#### Setup Steps:
1. **Sign up** at [digitalocean.com](https://digitalocean.com)
2. **Create App** → "Create App from Source Code"
3. **Connect GitHub** repository
4. **Configure services**:
   - **Backend**: Python service, build command: `pip install -r backend/requirements.txt`
   - **Frontend**: Static site, build command: `cd frontend && npm install && npm run build`
5. **Add environment variables**
6. **Deploy!**

---

## 🔧 Environment Variables

Set these in your cloud platform's dashboard:

### Required:
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
REACT_APP_API_URL=https://your-backend-url.com
```

### Optional:
```bash
WEBHOOK_SECRET=whsec_your_webhook_secret
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
```

---

## 🐳 Docker Deployment

### Local Docker Compose:
```bash
# Copy environment file
cp env.example .env
# Edit .env with your values
nano .env

# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Docker Deployment:
Most platforms support Docker deployments automatically. Just push your code with the Dockerfiles.

---

## 🔒 Security Checklist

- [ ] **Environment Variables**: All secrets in env vars, not in code
- [ ] **HTTPS**: Enable SSL/HTTPS
- [ ] **CORS**: Configure for your domain
- [ ] **Stripe Keys**: Use live keys for production
- [ ] **Firebase**: Configure auth domains
- [ ] **Database**: Use production database (if applicable)

---

## 📊 Monitoring & Maintenance

### Health Checks:
- Backend: `GET /health`
- Frontend: Automatic nginx health checks

### Logs:
- Check platform-specific logging
- Monitor for errors
- Set up alerts for downtime

### Updates:
- Enable automatic deployments from GitHub
- Test in staging environment first
- Monitor after deployments

---

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js/Python versions
   - Verify all dependencies in requirements.txt/package.json

2. **Environment Variables**:
   - Ensure all required vars are set
   - Check for typos in variable names

3. **CORS Errors**:
   - Update CORS configuration in backend
   - Verify frontend API URL

4. **Stripe Issues**:
   - Use correct live/test keys
   - Verify webhook endpoints

### Support:
- Check platform-specific documentation
- Review logs for error messages
- Test locally with Docker first

---

## 🎯 Next Steps

1. **Choose your platform** (Railway recommended)
2. **Set up environment variables**
3. **Deploy and test**
4. **Configure custom domain** (optional)
5. **Set up monitoring**
6. **Go live!**

Your retirement simulator will be accessible worldwide! 🌍 