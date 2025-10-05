import React from 'react';
import './PricingPage.css';

const PricingPage = ({ onGetStarted, onBackToHome }) => {
  return (
    <div className="pricing-page">
      {/* Header */}
      <header className="pricing-header">
        <div className="container">
          <button onClick={onBackToHome} className="back-btn">
            ← Back to Home
          </button>
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that works best for your retirement planning needs</p>
        </div>
      </header>

      {/* Pricing Cards */}
      <section className="pricing-section">
        <div className="container">
          <div className="pricing-grid">
            {/* Free Tier */}
            <div className="pricing-card free">
              <div className="pricing-header-card">
                <h3>Free Trial</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/forever</span>
                </div>
                <p className="description">Perfect for trying out GlidePath</p>
              </div>
              <div className="features">
                <h4>What's Included:</h4>
                <ul>
                  <li>✅ 5 free simulations</li>
                  <li>✅ Basic retirement projections</li>
                  <li>✅ Interactive charts</li>
                  <li>✅ PDF report generation</li>
                  <li>✅ Profile management</li>
                </ul>
              </div>
              <div className="limitations">
                <h4>Limitations:</h4>
                <ul>
                  <li>❌ No Monte Carlo analysis</li>
                  <li>❌ Limited to 5 simulations</li>
                  <li>❌ Basic features only</li>
                </ul>
              </div>
              <button onClick={onGetStarted} className="pricing-btn secondary">
                Start Free Trial
              </button>
            </div>

            {/* Patreon Tier */}
            <div className="pricing-card patreon featured">
              <div className="popular-badge">Most Popular</div>
              <div className="pricing-header-card">
                <h3>Patreon Supporter</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">5</span>
                  <span className="period">/month</span>
                </div>
                <p className="description">Unlimited access to all features</p>
              </div>
              <div className="features">
                <h4>Everything in Free, plus:</h4>
                <ul>
                  <li>✅ Unlimited simulations</li>
                  <li>✅ Advanced Monte Carlo analysis</li>
                  <li>✅ Multiple scenario comparison</li>
                  <li>✅ Advanced reporting features</li>
                  <li>✅ Priority support</li>
                  <li>✅ Early access to new features</li>
                </ul>
              </div>
              <div className="patreon-benefits">
                <h4>Patreon Benefits:</h4>
                <ul>
                  <li>🎯 Support independent development</li>
                  <li>🎯 Join our community</li>
                  <li>🎯 Direct feedback channel</li>
                  <li>🎯 Behind-the-scenes updates</li>
                </ul>
              </div>
              <button onClick={onGetStarted} className="pricing-btn primary">
                Join Patreon
              </button>
            </div>

            {/* Premium Tier */}
            <div className="pricing-card premium">
              <div className="pricing-header-card">
                <h3>Premium Supporter</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">10</span>
                  <span className="period">/month</span>
                </div>
                <p className="description">Maximum support for advanced features</p>
              </div>
              <div className="features">
                <h4>Everything in Patreon, plus:</h4>
                <ul>
                  <li>✅ Advanced portfolio analysis</li>
                  <li>✅ Tax optimization strategies</li>
                  <li>✅ Social Security optimization</li>
                  <li>✅ Healthcare cost planning</li>
                  <li>✅ Estate planning tools</li>
                  <li>✅ Priority feature requests</li>
                </ul>
              </div>
              <div className="premium-benefits">
                <h4>Premium Benefits:</h4>
                <ul>
                  <li>💎 VIP support channel</li>
                  <li>💎 Monthly strategy sessions</li>
                  <li>💎 Custom report templates</li>
                  <li>💎 Beta testing access</li>
                </ul>
              </div>
              <button onClick={onGetStarted} className="pricing-btn primary">
                Go Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Discount Codes Section */}
      <section className="discount-section">
        <div className="container">
          <h2>Special Offers</h2>
          <div className="discount-cards">
            <div className="discount-card">
              <h3>Family Discount</h3>
              <div className="discount-code">FAMILY2024</div>
              <p>50 free credits for family members</p>
            </div>
            <div className="discount-card">
              <h3>Friends Discount</h3>
              <div className="discount-code">FRIENDS</div>
              <p>25 free credits for friends</p>
            </div>
            <div className="discount-card">
              <h3>Early Bird</h3>
              <div className="discount-code">EARLYBIRD</div>
              <p>100 free credits for early adopters</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How does the free trial work?</h3>
              <p>You get 5 free simulations to test all the basic features. No credit card required, and you can use discount codes to get more credits.</p>
            </div>
            <div className="faq-item">
              <h3>What happens after I use my free simulations?</h3>
              <p>You can either join Patreon for unlimited access, use discount codes for more free credits, or create a new account (though we recommend supporting the project!).</p>
            </div>
            <div className="faq-item">
              <h3>Can I cancel my Patreon subscription anytime?</h3>
              <p>Yes! You can cancel your Patreon subscription at any time. You'll keep access until the end of your current billing period.</p>
            </div>
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We use Patreon for all subscriptions, which accepts all major credit cards, PayPal, and other payment methods supported by Patreon.</p>
            </div>
            <div className="faq-item">
              <h3>Is my financial data secure?</h3>
              <p>Absolutely! All your data is encrypted and stored securely. We never share your personal information with third parties.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use discount codes with Patreon?</h3>
              <p>Discount codes are for free credits only. Once you join Patreon, you get unlimited access, so you won't need additional credits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta">
        <div className="container">
          <h2>Ready to Start Planning Your Retirement?</h2>
          <p>Join thousands of people who are already using GlidePath to plan their perfect retirement.</p>
          <div className="cta-actions">
            <button onClick={onGetStarted} className="cta-button primary large">
              Start Your Free Trial
            </button>
            <p className="cta-note">No credit card required • 5 free simulations</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>GlidePath</h3>
              <p>Your trusted retirement planning companion</p>
            </div>
            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#support">Support</a>
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

export default PricingPage;
