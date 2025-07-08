# Retirement Simulator

A comprehensive retirement planning application with Monte Carlo simulations, client management, and PDF report generation.

## Features

- **Retirement Simulation Engine** - Calculate retirement feasibility with customizable parameters
- **Monte Carlo Analysis** - Run thousands of simulations with variable market conditions
- **Client Management** - Organize simulations by client with detailed tracking
- **PDF Report Generation** - Professional reports with charts and insights
- **User Authentication** - Firebase-based user management
- **Payment Integration** - Stripe-powered credit system and subscriptions
- **Responsive Design** - Modern UI that works on all devices

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd retirement_simulator
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access at http://localhost:8080
```

## 🚀 Production Deployment

**Ready for production!** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides.

### Quick Deploy Options:

1. **[Railway](https://railway.app)** (Recommended) - Automatic deployment, free tier
2. **[Render](https://render.com)** - Free tier, easy setup
3. **[Heroku](https://heroku.com)** - Classic choice, paid plans
4. **[DigitalOcean](https://digitalocean.com)** - Good performance, reasonable pricing

### Production Setup:

1. **Environment Variables** - Set up your production keys:
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   REACT_APP_API_URL=https://your-backend-url.com
   ```

2. **Deploy** - Choose your platform and follow the deployment guide

3. **Custom Domain** - Configure your domain (optional)

## Architecture

```
retirement_simulator/
├── backend/                 # Flask API server
│   ├── app.py              # Main Flask application
│   ├── simulator.py        # Retirement calculation engine
│   ├── report_generator.py # PDF report generation
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Production container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── AuthContext.js # Firebase authentication
│   │   └── App.css        # Styles
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile         # Production container
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
└── DEPLOYMENT.md          # Deployment guides
```

## Environment Variables

### Required for Production:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `REACT_APP_API_URL` - Backend API URL

### Optional:
- `WEBHOOK_SECRET` - Stripe webhook secret
- `FIREBASE_*` - Firebase configuration (if using Firebase)

## API Endpoints

### Core Simulation
- `POST /api/simulate` - Run basic retirement simulation
- `POST /api/monte-carlo` - Run Monte Carlo analysis

### User Management
- `GET /api/user-credits` - Get user credits and subscription status
- `POST /api/create-checkout-session` - Create Stripe checkout session

### Client Management
- `GET /api/clients` - Get user's clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/<id>` - Update client
- `DELETE /api/clients/<id>` - Delete client

### Reports
- `POST /api/clients/<id>/report` - Generate PDF report

## Security Features

- ✅ Environment variable configuration
- ✅ CORS protection
- ✅ Input validation
- ✅ Secure payment processing
- ✅ User authentication
- ✅ Health check endpoints

## Monitoring

- **Health Checks**: `/health` endpoint for backend monitoring
- **Logs**: Platform-specific logging integration
- **Error Handling**: Comprehensive error responses
- **Performance**: Optimized Docker containers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For deployment help, see [DEPLOYMENT.md](DEPLOYMENT.md) or open an issue on GitHub.

---

**Ready to deploy?** Check out the [deployment guide](DEPLOYMENT.md) to get your retirement simulator live! 
🚀
