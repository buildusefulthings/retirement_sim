import React, { useState } from 'react';
import './SupportPage.css';

const SupportPage = ({ onBackToHome }) => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send to a backend
    console.log('Contact form submitted:', contactForm);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="support-page">
      {/* Header */}
      <header className="support-header">
        <div className="container">
          <button onClick={onBackToHome} className="back-btn">
            ← Back to Home
          </button>
          <h1>Support Center</h1>
          <p>We're here to help you plan your perfect retirement</p>
        </div>
      </header>

      {/* Quick Help Section */}
      <section className="quick-help">
        <div className="container">
          <h2>Quick Help</h2>
          <div className="help-grid">
            <div className="help-card">
              <div className="help-icon">🚀</div>
              <h3>Getting Started</h3>
              <p>New to GlidePath? Learn the basics and run your first simulation.</p>
              <a href="#getting-started" className="help-link">View Guide</a>
            </div>
            <div className="help-card">
              <div className="help-icon">💳</div>
              <h3>Billing & Payments</h3>
              <p>Questions about Patreon subscriptions, discount codes, or billing.</p>
              <a href="#billing" className="help-link">View Guide</a>
            </div>
            <div className="help-card">
              <div className="help-icon">📊</div>
              <h3>Using Simulations</h3>
              <p>Learn how to interpret results and use advanced features.</p>
              <a href="#simulations" className="help-link">View Guide</a>
            </div>
            <div className="help-card">
              <div className="help-icon">🔧</div>
              <h3>Troubleshooting</h3>
              <p>Common issues and how to resolve them quickly.</p>
              <a href="#troubleshooting" className="help-link">View Guide</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-categories">
            <div className="faq-category">
              <h3>Getting Started</h3>
              <div className="faq-items">
                <div className="faq-item">
                  <h4>How do I create my first retirement simulation?</h4>
                  <p>Simply enter your current age, retirement age, current savings, annual income, and expected expenses. Click "Run Simulation" to see your retirement projection.</p>
                </div>
                <div className="faq-item">
                  <h4>What's the difference between Basic and Monte Carlo simulations?</h4>
                  <p>Basic simulations use fixed assumptions, while Monte Carlo runs thousands of scenarios to show the probability of success with different market conditions.</p>
                </div>
                <div className="faq-item">
                  <h4>How accurate are the projections?</h4>
                  <p>Our simulations use historical market data and realistic assumptions, but remember that past performance doesn't guarantee future results. Use them as planning tools, not predictions.</p>
                </div>
              </div>
            </div>

            <div className="faq-category">
              <h3>Account & Billing</h3>
              <div className="faq-items">
                <div className="faq-item">
                  <h4>How do I join Patreon for unlimited access?</h4>
                  <p>Click "Join Patreon" in the payment section, complete your Patreon membership, then return to verify your membership for unlimited access.</p>
                </div>
                <div className="faq-item">
                  <h4>Can I use discount codes with Patreon?</h4>
                  <p>Discount codes are for free credits only. Once you join Patreon, you get unlimited access, so you won't need additional credits.</p>
                </div>
                <div className="faq-item">
                  <h4>How do I cancel my Patreon subscription?</h4>
                  <p>You can cancel anytime through your Patreon account settings. You'll keep access until the end of your current billing period.</p>
                </div>
              </div>
            </div>

            <div className="faq-category">
              <h3>Features & Usage</h3>
              <div className="faq-items">
                <div className="faq-item">
                  <h4>How do I save and compare different scenarios?</h4>
                  <p>Create a profile, run simulations, and save them to that profile. You can then compare different scenarios side-by-side.</p>
                </div>
                <div className="faq-item">
                  <h4>Can I export my results?</h4>
                  <p>Yes! You can generate PDF reports with your simulation results that you can save or share with financial advisors.</p>
                </div>
                <div className="faq-item">
                  <h4>Is my financial data secure?</h4>
                  <p>Absolutely! All data is encrypted and stored securely. We never share your personal information with third parties.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="contact-section">
        <div className="container">
          <h2>Still Need Help?</h2>
          <p>Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.</p>
          
          {formSubmitted ? (
            <div className="success-message">
              <h3>✅ Message Sent!</h3>
              <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="general">General Question</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={contactForm.message}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Please describe your question or issue in detail..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="submit-btn">
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Community Section */}
      <section className="community-section">
        <div className="container">
          <h2>Join Our Community</h2>
          <div className="community-cards">
            <div className="community-card">
              <div className="community-icon">💬</div>
              <h3>Patreon Community</h3>
              <p>Join our Patreon supporters for exclusive discussions, early access to features, and direct feedback channels.</p>
              <a href="https://www.patreon.com/builduseful" className="community-link" target="_blank" rel="noopener noreferrer">
                Join Patreon
              </a>
            </div>
            <div className="community-card">
              <div className="community-icon">📧</div>
              <h3>Email Updates</h3>
              <p>Get notified about new features, tips, and retirement planning insights delivered to your inbox.</p>
              <a href="#newsletter" className="community-link">
                Subscribe
              </a>
            </div>
            <div className="community-card">
              <div className="community-icon">🐛</div>
              <h3>Report Bugs</h3>
              <p>Found a bug or have a suggestion? Help us improve GlidePath by reporting issues and sharing ideas.</p>
              <a href="#bug-report" className="community-link">
                Report Issue
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="support-footer">
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

export default SupportPage;
