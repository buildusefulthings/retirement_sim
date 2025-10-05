import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onGetStarted, onNavigateToPricing, onNavigateToSupport }) => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Plan Your Perfect <span className="highlight">Retirement</span>
          </h1>
          <p className="hero-subtitle">
            Stop guessing about your financial future. Get personalized retirement projections 
            with advanced Monte Carlo analysis and make confident decisions about your money.
          </p>
          <div className="hero-actions">
            <button onClick={onGetStarted} className="cta-button primary">
              Start Planning Now
            </button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="cta-button secondary">
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="chart-preview">
            <div className="chart-placeholder">
              📊 Retirement Projection
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="container">
          <h2 className="section-title">The Retirement Planning Problem</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">❓</div>
              <h3>Uncertainty</h3>
              <p>Most people have no idea if they're saving enough for retirement or how long their money will last.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">📈</div>
              <h3>Complex Calculations</h3>
              <p>Retirement planning involves complex math with inflation, market volatility, and life expectancy.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">💰</div>
              <h3>Expensive Advisors</h3>
              <p>Professional financial advisors cost thousands of dollars and may not be accessible to everyone.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">⏰</div>
              <h3>Time Pressure</h3>
              <p>Every year you wait to plan is a year of lost compound growth and preparation time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution-section">
        <div className="container">
          <h2 className="section-title">How GlidePath Solves This</h2>
          <div className="solution-content">
            <div className="solution-text">
              <h3>Advanced Retirement Simulation</h3>
              <p>Our sophisticated Monte Carlo analysis runs thousands of scenarios to show you the probability of success for different retirement strategies.</p>
              
              <h3>Personalized Projections</h3>
              <p>Input your specific situation - current savings, income, expenses, and goals - to get projections tailored to your life.</p>
              
              <h3>Multiple Scenarios</h3>
              <p>Test different retirement ages, savings rates, and spending levels to find the strategy that works best for you.</p>
              
              <h3>Professional Reports</h3>
              <p>Generate detailed PDF reports you can share with family or financial advisors.</p>
            </div>
            <div className="solution-visual">
              <div className="feature-highlights">
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <span>Monte Carlo Analysis</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Interactive Charts</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📄</span>
                  <span>PDF Reports</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💾</span>
                  <span>Save Scenarios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-large">🎲</div>
              <h3>Monte Carlo Simulation</h3>
              <p>Run thousands of retirement scenarios to understand the probability of success with different strategies.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">📈</div>
              <h3>Interactive Charts</h3>
              <p>Visualize your retirement projections with beautiful, interactive charts that show your financial trajectory.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">📄</div>
              <h3>Professional Reports</h3>
              <p>Generate detailed PDF reports with your retirement analysis that you can share with family or advisors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">💾</div>
              <h3>Save & Compare</h3>
              <p>Save multiple retirement scenarios and compare them side-by-side to find your optimal strategy.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">⚡</div>
              <h3>Instant Results</h3>
              <p>Get sophisticated retirement analysis in seconds, not weeks. No waiting for appointments or reports.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your financial data is encrypted and secure. We never share your personal information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Take Control of Your Retirement?</h2>
            <p>Join thousands of people who are already planning their perfect retirement with GlidePath.</p>
            <div className="cta-actions">
              <button onClick={onGetStarted} className="cta-button primary large">
                Start Your Free Analysis
              </button>
              <p className="cta-note">No credit card required • 5 free simulations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>GlidePath</h3>
              <p>Your trusted retirement planning companion</p>
            </div>
            <div className="footer-links">
              <a href="#features">Features</a>
              <button onClick={onNavigateToPricing} className="footer-link-btn">Pricing</button>
              <button onClick={onNavigateToSupport} className="footer-link-btn">Support</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 GlidePath. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
