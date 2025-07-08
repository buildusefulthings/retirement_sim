# Environment Variables Setup Guide

This guide will help you set up all the necessary environment variables for your retirement simulator deployment.

## Required Environment Variables

### Backend Environment Variables

#### 1. Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**How to get these:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_live_`)
4. For webhook secret, go to **Developers** → **Webhooks**
5. Create a webhook endpoint pointing to `https://your-backend-domain.com/api/webhook`
6. Copy the webhook signing secret (starts with `whsec_`)

### Frontend Environment Variables

#### 1. Stripe Configuration
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
```

**How to get this:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_live_`)

#### 2. API Configuration
```
REACT_APP_API_URL=https://your-backend-domain.com
```

**Set this to your backend deployment URL** (e.g., `https://retirement-sim-backend.onrender.com`)

#### 3. Firebase Configuration
```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**How to get these:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **General**
4. Scroll down to **Your apps** section
5. Copy the configuration values from your web app

## Platform-Specific Setup

### Render.com

#### Backend Service Environment Variables:
1. Go to your backend service dashboard
2. Navigate to **Environment** tab
3. Add the following variables:

```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Frontend Service Environment Variables:
1. Go to your frontend service dashboard
2. Navigate to **Environment** tab
3. Add the following variables:

```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
REACT_APP_API_URL=https://your-backend-service-name.onrender.com
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Railway.app

#### Backend Service:
1. Go to your backend service
2. Click **Variables** tab
3. Add:

```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Frontend Service:
1. Go to your frontend service
2. Click **Variables** tab
3. Add:

```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
REACT_APP_API_URL=https://your-backend-service-name.railway.app
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Heroku

#### Backend:
```bash
heroku config:set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
heroku config:set WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Frontend:
```bash
heroku config:set REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
heroku config:set REACT_APP_API_URL=https://your-backend-app-name.herokuapp.com
heroku config:set REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
heroku config:set REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
heroku config:set REACT_APP_FIREBASE_PROJECT_ID=your_project_id
heroku config:set REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
heroku config:set REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
heroku config:set REACT_APP_FIREBASE_APP_ID=your_app_id
heroku config:set REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Vercel

#### Frontend (Vercel only hosts frontend):
1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:

```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Security Best Practices

### 1. Use Live Keys for Production
- **Never use test keys** (`sk_test_`, `pk_test_`) in production
- Always use live keys (`sk_live_`, `pk_live_`) for production deployments

### 2. Keep Secrets Secure
- **Never commit** environment variables to your repository
- Use your platform's secure environment variable storage
- Rotate keys regularly

### 3. Webhook Security
- Always verify webhook signatures using the webhook secret
- Use HTTPS endpoints for webhooks
- Test webhooks in Stripe's webhook testing tool

## Testing Your Setup

### 1. Verify Backend Environment Variables
```bash
# Test your backend health endpoint
curl https://your-backend-domain.com/health
```

### 2. Verify Frontend Environment Variables
- Open your frontend app
- Check browser console for any environment variable errors
- Test the payment flow with a test card

### 3. Test Stripe Integration
1. Use Stripe's test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any 3-digit CVC

## Troubleshooting

### Common Issues:

1. **"Invalid API key" errors**
   - Check that you're using live keys, not test keys
   - Verify the key format (starts with `sk_live_` or `pk_live_`)

2. **CORS errors**
   - Ensure your backend CORS settings include your frontend domain
   - Check that `REACT_APP_API_URL` is correct

3. **Webhook failures**
   - Verify webhook endpoint URL is accessible
   - Check webhook secret is correct
   - Ensure webhook is configured for the right events

4. **Environment variables not loading**
   - Restart your deployment after adding environment variables
   - Check variable names match exactly (case-sensitive)
   - Verify no extra spaces or quotes

5. **Firebase authentication errors**
   - Verify all Firebase environment variables are set correctly
   - Check that your Firebase project is properly configured
   - Ensure your domain is added to Firebase authorized domains

## Next Steps

After setting up environment variables:

1. **Deploy your application**
2. **Test the payment flow**
3. **Set up Stripe webhooks**
4. **Configure custom domains** (optional)
5. **Set up monitoring and logging**

## Support

If you encounter issues:
1. Check your platform's documentation
2. Verify all environment variables are set correctly
3. Test with Stripe's test mode first
4. Check application logs for specific error messages 