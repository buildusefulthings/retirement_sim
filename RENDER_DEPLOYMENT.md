# Render Deployment Guide - Retirement Simulator

Complete step-by-step guide to deploy your retirement simulator on Render.

## 🎯 Quick Start (Recommended)

### Option 1: Blueprint Deployment (Easiest)

1. **Sign up** at [render.com](https://render.com)
2. **Click "New +"** → **"Blueprint"**
3. **Connect your GitHub** repository
4. **Select your repository**
5. **Render will auto-detect** the `render.yaml` configuration
6. **Add environment variables** (see below)
7. **Deploy!** 🚀

---

## 📋 Step-by-Step Manual Deployment

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2: Deploy Backend API

1. **Click "New +"** → **"Web Service"**
2. **Connect GitHub** repository
3. **Configure the service**:
   - **Name**: `retirement-simulator-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Plan**: Free

4. **Add Environment Variables**:
   ```
   FLASK_ENV=production
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

5. **Click "Create Web Service"**

### Step 3: Deploy Frontend

1. **Click "New +"** → **"Static Site"**
2. **Connect GitHub** repository
3. **Configure the service**:
   - **Name**: `retirement-simulator-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: Free

4. **Add Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-backend-name.onrender.com
   ```

5. **Click "Create Static Site"**

---

## 🔧 Environment Variables

### Backend Variables (Web Service)
```bash
FLASK_ENV=production
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Frontend Variables (Static Site)
```bash
REACT_APP_API_URL=https://your-backend-name.onrender.com
```

### How to Add Environment Variables:
1. Go to your service dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable with its value
5. Click **"Save Changes"**

---

## 🔑 Getting Your Stripe Keys

### 1. Go to Stripe Dashboard
- Visit [dashboard.stripe.com](https://dashboard.stripe.com)
- Sign in to your account

### 2. Switch to Live Mode
- Click the toggle in the top-right corner
- Switch from "Test mode" to "Live mode"

### 3. Get Your Keys
- Go to **Developers** → **API keys**
- Copy your **Publishable key** (starts with `pk_live_`)
- Copy your **Secret key** (starts with `sk_live_`)

### 4. Set Up Webhook (Optional)
- Go to **Developers** → **Webhooks**
- Click **"Add endpoint"**
- URL: `https://your-backend-name.onrender.com/api/webhook`
- Events: `checkout.session.completed`
- Copy the webhook secret

---

## 🌐 Custom Domains

### Add Custom Domain:
1. Go to your service dashboard
2. Click **"Settings"** tab
3. Scroll to **"Custom Domains"**
4. Click **"Add Domain"**
5. Enter your domain
6. Update your DNS records as instructed

### Update Environment Variables:
After adding custom domain, update:
```bash
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## 📊 Monitoring Your App

### Health Checks:
- Backend: `https://your-backend-name.onrender.com/health`
- Should return: `{"status": "healthy", "service": "retirement-simulator-backend"}`

### Logs:
- Go to your service dashboard
- Click **"Logs"** tab
- Monitor for errors and performance

### Metrics:
- Render provides basic metrics in the dashboard
- Monitor response times and error rates

---

## 🆘 Troubleshooting

### Common Issues:

#### 1. Build Failures
**Problem**: Build command fails
**Solution**:
- Check Node.js/Python versions in package.json/requirements.txt
- Verify all dependencies are listed
- Check build logs for specific errors

#### 2. Environment Variables Not Working
**Problem**: App can't find environment variables
**Solution**:
- Ensure variables are added to the correct service
- Check for typos in variable names
- Redeploy after adding variables

#### 3. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**:
- Verify `REACT_APP_API_URL` points to correct backend URL
- Check backend CORS configuration
- Ensure both services are deployed

#### 4. Stripe Payment Issues
**Problem**: Payments not working
**Solution**:
- Use live Stripe keys (not test keys)
- Verify webhook endpoint is correct
- Check Stripe dashboard for failed payments

#### 5. App Not Loading
**Problem**: Frontend shows blank page
**Solution**:
- Check browser console for errors
- Verify build completed successfully
- Check if API URL is accessible

### Debugging Steps:
1. **Check Logs**: Always check service logs first
2. **Test Endpoints**: Use curl or Postman to test API
3. **Verify Environment**: Ensure all variables are set
4. **Check Dependencies**: Verify all packages are installed

---

## 🔄 Updating Your App

### Automatic Deployments:
- Render automatically deploys when you push to your main branch
- No manual intervention needed

### Manual Deploy:
1. Go to your service dashboard
2. Click **"Manual Deploy"**
3. Select branch and click **"Deploy latest commit"**

### Rollback:
1. Go to your service dashboard
2. Click **"Deploys"** tab
3. Find the working version
4. Click **"Rollback"**

---

## 💰 Pricing & Limits

### Free Tier Limits:
- **Web Services**: 750 hours/month
- **Static Sites**: Unlimited
- **Bandwidth**: 100GB/month
- **Sleep**: Services sleep after 15 minutes of inactivity

### Paid Plans:
- **Starter**: $7/month - No sleep, more resources
- **Standard**: $25/month - Better performance
- **Pro**: $100/month - Production ready

---

## ✅ Post-Deployment Checklist

- [ ] **Backend Health Check**: Visit `/health` endpoint
- [ ] **Frontend Loading**: App loads without errors
- [ ] **Authentication**: User signup/login works
- [ ] **Simulations**: Can run basic and Monte Carlo simulations
- [ ] **Payments**: Stripe integration works
- [ ] **Coupon Code**: "friends&fam" grants 100 credits
- [ ] **Client Management**: Can create and manage clients
- [ ] **PDF Reports**: Can generate and download reports
- [ ] **Mobile Responsive**: App works on mobile devices
- [ ] **Custom Domain**: Set up (optional)

---

## 🎉 You're Live!

Your retirement simulator is now accessible at:
- **Frontend**: `https://your-frontend-name.onrender.com`
- **Backend**: `https://your-backend-name.onrender.com`

### Next Steps:
1. **Test thoroughly** using the checklist above
2. **Set up monitoring** and alerts
3. **Configure custom domain** (optional)
4. **Share with users** and gather feedback
5. **Monitor performance** and scale as needed

---

## 🆘 Need Help?

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Support**: Available in dashboard
- **Community**: Render Discord/forums
- **GitHub Issues**: For app-specific problems

**Happy deploying! 🚀** 