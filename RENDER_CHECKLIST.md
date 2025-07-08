# Render Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code committed to GitHub
- [ ] `render.yaml` file present in root
- [ ] `requirements.txt` in backend folder
- [ ] `package.json` in frontend folder
- [ ] Environment variables configured in code

### 2. Stripe Setup
- [ ] Stripe account created
- [ ] Switched to Live mode
- [ ] Copied Live Secret Key (`sk_live_...`)
- [ ] Copied Live Publishable Key (`pk_live_...`)
- [ ] Webhook endpoint noted (optional)

### 3. Render Account
- [ ] Signed up at render.com
- [ ] Connected GitHub account
- [ ] Verified email address

---

## 🚀 Deployment Steps

### Option 1: Blueprint Deployment (Recommended)
1. [ ] Go to render.com dashboard
2. [ ] Click "New +" → "Blueprint"
3. [ ] Select your GitHub repository
4. [ ] Render auto-detects `render.yaml`
5. [ ] Add environment variables:
   - [ ] `STRIPE_SECRET_KEY` = `sk_live_your_key`
   - [ ] `REACT_APP_STRIPE_PUBLISHABLE_KEY` = `pk_live_your_key`
   - [ ] `WEBHOOK_SECRET` = `whsec_your_webhook_secret` (optional)
6. [ ] Click "Apply" to deploy

### Option 2: Manual Deployment
1. [ ] Deploy Backend:
   - [ ] "New +" → "Web Service"
   - [ ] Connect GitHub repo
   - [ ] Build Command: `pip install -r backend/requirements.txt`
   - [ ] Start Command: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT`
   - [ ] Add environment variables
   - [ ] Deploy

2. [ ] Deploy Frontend:
   - [ ] "New +" → "Static Site"
   - [ ] Connect GitHub repo
   - [ ] Build Command: `cd frontend && npm install && npm run build`
   - [ ] Publish Directory: `frontend/build`
   - [ ] Add environment variables
   - [ ] Deploy

---

## 🔧 Environment Variables

### Backend (Web Service)
```
FLASK_ENV=production
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend (Static Site)
```
REACT_APP_API_URL=https://your-backend-name.onrender.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

---

## ✅ Post-Deployment Testing

### Backend Health Check
- [ ] Visit: `https://your-backend-name.onrender.com/health`
- [ ] Should return: `{"status": "healthy", "service": "retirement-simulator-backend"}`

### Frontend Testing
- [ ] Visit your frontend URL
- [ ] [ ] App loads without errors
- [ ] [ ] No console errors in browser
- [ ] [ ] Can sign up/login
- [ ] [ ] Can run basic simulation
- [ ] [ ] Can run Monte Carlo simulation
- [ ] [ ] Coupon code "friends&fam" works
- [ ] [ ] Can create/manage clients
- [ ] [ ] Can generate PDF reports
- [ ] [ ] Stripe payments work
- [ ] [ ] Mobile responsive

### Payment Testing
- [ ] [ ] Test coupon code: "friends&fam"
- [ ] [ ] Test 5-credit purchase ($5)
- [ ] [ ] Test 15-credit purchase ($10)
- [ ] [ ] Test unlimited subscription ($20/month)

---

## 🆘 Common Issues & Solutions

### Build Failures
- [ ] Check Node.js version (>=16.0.0)
- [ ] Check Python version (3.11)
- [ ] Verify all dependencies in requirements.txt/package.json

### Environment Variables
- [ ] Variables added to correct service
- [ ] No typos in variable names
- [ ] Redeploy after adding variables

### CORS Errors
- [ ] Verify REACT_APP_API_URL points to correct backend
- [ ] Check backend CORS configuration
- [ ] Both services deployed successfully

### Stripe Issues
- [ ] Using live keys (not test keys)
- [ ] Keys added to correct service
- [ ] Webhook endpoint correct (if using)

---

## 📊 Monitoring

### Check Logs
- [ ] Backend logs: No errors
- [ ] Frontend build: Successful
- [ ] Health checks: Passing

### Performance
- [ ] First load time: <5 seconds
- [ ] API responses: <2 seconds
- [ ] No 500 errors

---

## 🎉 Success!

Your app is live at:
- **Frontend**: `https://your-frontend-name.onrender.com`
- **Backend**: `https://your-backend-name.onrender.com`

### Next Steps
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring alerts
- [ ] Share with users
- [ ] Monitor performance
- [ ] Scale as needed

---

## 📞 Need Help?

- **Render Docs**: [docs.render.com](https://docs.render.com)
- **Render Support**: Available in dashboard
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **GitHub Issues**: For app-specific problems

**Happy deploying! 🚀** 