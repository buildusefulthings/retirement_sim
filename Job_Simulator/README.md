# Job_Simulator

**Job_Simulator** is a full-stack web application to help users confidently compare two or more job offers (or current vs. offer) across compensation, quality of life, benefits, and career growth, surfacing a clear recommendation or ranking.

## Features
- **User Authentication** (Firebase)
- **Stripe Payments** (credits/subscription)
- **CRUD for Job Offers** (add, edit, delete, compare)
- **Job Offer Comparison Engine**
- **Insights & Recommendations** (comp, quality of life, growth, risk)
- **Downloadable PDF Reports**
- **Modern React Frontend**
- **Flask Backend**
- **Dockerized (frontend + backend)**
- **Docker Compose for easy deployment**

## MVP Inputs
- Basic Offer Details (title, company, location, start date)
- Compensation (base, bonus, signing, equity, vesting, growth)
- Benefits & Perks (401k, health, PTO, stipends, etc.)
- Cost of Living (location index, commute)
- Career Factors (team, growth, work-life, stability)

## MVP Outputs
- Total Comp Over Time (net comp graph, 5-year take-home)
- Quality-of-Life Adjusted Score (true hourly, comp/COL)
- Career Growth & Risk (promotion, equity, risk profile)
- Final Recommendation (ranking, priorities weighting)

## Quick Start
1. Clone repo and `cd Job_Simulator`
2. Build and run with Docker Compose:
   ```sh
   docker-compose build
   docker-compose up -d
   ```
3. Access frontend at [http://localhost:8080](http://localhost:8080)

---

**Customize and extend as needed for your job offer comparison MVP!** 