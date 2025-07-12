import React, { useState } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from './AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import ClientManagement from './ClientManagement';

// Initialize Stripe with environment variable
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RblCy2cgrofQckH5WPY6gKoArTxNVx7KrXAADLJIvwkRYWbbAmkTjjkKct603mcB5ECjOhtpCnEvNADTyOR30Cd00XdCQJWMk');

// Get API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  // State for simulation parameters
  const [params, setParams] = useState({
    balance: 1000000,
    apy: 0.07,
    draw: 0.04,
    duration: 30,
    curr_exp: 50000,
    tax_rate: 0.22,
    inflation: 0.025,
    annual_contrib: 0,
    annual_contrib_years: 0,
    drawdown_start: 0,
    apy_mean: 0.07,
    apy_sd: 0.01,
    inflation_mean: 0.025,
    inflation_sd: 0.01,
    simulations: 1000,
    target_success_rate: 0.9
  });

  // State for results, loading, and error
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Monte Carlo state
  const [mcLoading, setMcLoading] = useState(false);
  const [mcError, setMcError] = useState(null);
  const [mcResults, setMcResults] = useState(null);
  const [mcHasRun, setMcHasRun] = useState(false);

  // State to hold latest simulation results before saving
  const [latestSim, setLatestSim] = useState({
    basic: null,
    monteCarlo: null,
  });
  const [simToSave, setSimToSave] = useState(null);

  // Advanced Simulations state
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auth state
  const { user, login, signup, logout, resetPassword } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [authError, setAuthError] = useState('');

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // User credits state
  const [userCredits, setUserCredits] = useState({
    credits: 0,
    subscription_status: 'none',
    unlimited: false
  });
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Client management state
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [showClientManagement, setShowClientManagement] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simulation run limits
  const FREE_RUN_LIMIT = 5;
  const [runCount, setRunCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on mobile when clicking outside
  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Fetch user credits
  const fetchUserCredits = async (userId) => {
    if (!userId) return;
    
    setCreditsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user-credits?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data);
      }
    } catch (err) {
      console.error('Error fetching user credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Fetch user clients
  const fetchClients = async (userId) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // Callback to update clients from child
  const handleClientsChanged = () => {
    if (user) fetchClients(user.uid);
  };

  // Check if backend is running
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: 1000000,
          apy: 0.07,
          draw: 0.04,
          duration: 30,
          curr_exp: 50000,
          tax_rate: 0.22,
          inflation: 0.025
        })
      });
      console.log('Backend health check - Status:', response.status);
      return response.status !== 0; // 0 means network error
    } catch (err) {
      console.error('Backend health check failed:', err);
      return false;
    }
  };

  // Track runs for guests (localStorage) and logged-in users (in-memory)
  React.useEffect(() => {
    if (user) {
      setRunCount(0); // Reset for new session/login
      setLimitReached(false);
      fetchUserCredits(user.uid);
      fetchClients(user.uid);
    } else {
      const guestRuns = parseInt(localStorage.getItem('guestRunCount') || '0', 10);
      setRunCount(guestRuns);
      setLimitReached(guestRuns >= FREE_RUN_LIMIT);
      setUserCredits({ credits: 0, subscription_status: 'none', unlimited: false });
      setClients([]);
      setSelectedClient('');
    }
    
    // Check backend health on mount
    checkBackendHealth();
  }, [user]);

  // Check if user can run simulation
  const canRunSimulation = () => {
    if (!user) {
      return !limitReached;
    }
    
    if (userCredits.unlimited || userCredits.subscription_status === 'active') {
      return true;
    }
    
    return userCredits.credits > 0;
  };

  // Increment run count after simulation
  const incrementRunCount = () => {
    if (user) {
      // For logged-in users, credits are managed by backend
      fetchUserCredits(user.uid);
    } else {
      const guestRuns = parseInt(localStorage.getItem('guestRunCount') || '0', 10) + 1;
      localStorage.setItem('guestRunCount', guestRuns);
      setRunCount(guestRuns);
      setLimitReached(guestRuns >= FREE_RUN_LIMIT);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: isNaN(Number(value)) ? value : Number(value)
    }));
  };

  // Handle Monte Carlo config changes
  const handleMonteCarloConfigChange = (e) => {
    const { name, value } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: isNaN(Number(value)) ? value : Number(value)
    }));
  };

  // Handle form submit: call backend API
  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!canRunSimulation()) return;
    
    console.log('Starting simulation...');
    console.log('User:', user ? user.uid : 'guest');
    console.log('Can run simulation:', canRunSimulation());
    console.log('Selected client:', selectedClient);
    
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const requestData = { ...params };
      if (user) {
        requestData.user_id = user.uid;
        if (selectedClient) {
          requestData.client_id = selectedClient;
        }
      }
      
      console.log('Sending simulation request:', requestData);
      
      const response = await fetch(`${API_BASE_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      console.log('Simulation response status:', response.status);
      
      if (response.status === 402) {
        const errorData = await response.json();
        setError(errorData.error || 'No credits remaining. Please purchase more credits or subscribe.');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Simulation successful:', data);
      setResults(data);
      setLatestSim(prev => ({ ...prev, basic: { parameters: params, results: data } }));
      incrementRunCount();
      
      // Show success message if saved to client
      if (user && selectedClient) {
        const selectedClientName = clients.find(c => c.id === selectedClient)?.name;
        setError(''); // Clear any previous errors
        alert(`✅ Simulation saved to client: ${selectedClientName}`);
      }
      
      // Refresh clients to update simulation counts
      if (user && selectedClient) {
        fetchClients(user.uid);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(`Failed to fetch simulation results: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSimulation = async (simulationType) => {
    const simToSave = latestSim[simulationType];
    if (!simToSave || !selectedClient) {
      alert("Please select a client and run a simulation first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/${selectedClient}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          simulation_data: simToSave,
          type: simulationType,
        }),
      });

      if (response.ok) {
        alert('Simulation saved successfully!');
        fetchClients(user.uid); // Refresh client data
        // Clear the saved sim so it can't be saved again
        setLatestSim(prev => ({ ...prev, [simulationType]: null }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save simulation.');
      }
    } catch (err) {
      setError('An error occurred while saving the simulation.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Monte Carlo simulation
  const handleMonteCarlo = async () => {
    if (!canRunSimulation()) return;
    
    console.log('Starting Monte Carlo simulation...');
    console.log('User:', user ? user.uid : 'guest');
    console.log('Can run simulation:', canRunSimulation());
    console.log('Selected client:', selectedClient);
    
    setMcLoading(true);
    setMcError(null);
    setMcResults(null);
    try {
      const requestData = { ...params };
      if (user) {
        requestData.user_id = user.uid;
        if (selectedClient) {
          requestData.client_id = selectedClient;
        }
      }
      
      console.log('Sending Monte Carlo request:', requestData);
      
      const response = await fetch(`${API_BASE_URL}/api/monte-carlo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      console.log('Monte Carlo response status:', response.status);
      
      if (response.status === 402) {
        const errorData = await response.json();
        setMcError(errorData.error || 'No credits remaining. Please purchase more credits or subscribe.');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Monte Carlo API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Monte Carlo successful:', data);
      setMcResults(data.success_rates);
      setMcHasRun(true);
      setLatestSim(prev => ({ ...prev, monteCarlo: { parameters: params, results: data } }));
      incrementRunCount();
      
      // Show success message if saved to client
      if (user && selectedClient) {
        const selectedClientName = clients.find(c => c.id === selectedClient)?.name;
        setMcError(''); // Clear any previous errors
        alert(`✅ Monte Carlo simulation saved to client: ${selectedClientName}`);
      }
      
      // Refresh clients to update simulation counts
      if (user && selectedClient) {
        fetchClients(user.uid);
      }
    } catch (err) {
      console.error('Monte Carlo error:', err);
      setMcError(`Failed to fetch Monte Carlo results: ${err.message}`);
    } finally {
      setMcLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async (planType) => {
    if (!user) {
      setAuthError('Please log in to make a payment.');
      return;
    }
    
    console.log('Starting payment for plan:', planType, 'User:', user.uid);
    setPaymentLoading(true);
    setAuthError(''); // Clear previous errors
    setCouponError(''); // Clear coupon errors
    setCouponSuccess(''); // Clear coupon success
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_type: planType,
          user_id: user.uid,
          coupon_code: couponCode.trim() // Send coupon code if provided
        })
      });
      
      console.log('Payment response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const data = await response.json();
      
      // Check if this was a coupon redemption (no Stripe session)
      if (data.coupon_redeemed) {
        setCouponSuccess('Coupon applied successfully! 100 credits have been added to your account.');
        setCouponCode(''); // Clear the coupon code
        // Refresh user credits
        fetchUserCredits(user.uid);
        setShowPayment(false); // Close payment modal
        return;
      }
      
      // Normal Stripe flow
      const { sessionId } = data;
      console.log('Got session ID:', sessionId);
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setAuthError(`Payment failed: ${err.message}. Please try again.`);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Render results as a table
  const renderResultsTable = () => {
    if (!results) return null;
    const years = Object.keys(results).sort((a, b) => {
      const ay = parseInt(a.split('-')[1], 10);
      const by = parseInt(b.split('-')[1], 10);
      return ay - by;
    });
    return (
      <div className="results-table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Principal</th>
              <th>Income (Pre-Tax)</th>
              <th>Real Income (Post-Tax)</th>
              <th>Projected Spend</th>
              <th>Surplus</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td>{year}</td>
                <td>
                  {results[year]['principal'] != null && typeof results[year]['principal'] === 'number'
                    ? `$${Math.round(results[year]['principal']).toLocaleString()}`
                    : ''}
                </td>
                <td>
                  {results[year]['income'] != null && typeof results[year]['income'] === 'number'
                    ? `$${Math.round(results[year]['income']).toLocaleString()}`
                    : ''}
                </td>
                <td>
                  {results[year]['real_income cap'] != null && typeof results[year]['real_income cap'] === 'number'
                    ? `$${Math.round(results[year]['real_income cap']).toLocaleString()}`
                    : ''}
                </td>
                <td>
                  {results[year]['projected_spend'] != null && typeof results[year]['projected_spend'] === 'number'
                    ? `$${Math.round(results[year]['projected_spend']).toLocaleString()}`
                    : ''}
                </td>
                <td>
                  {results[year]['surplus'] != null && typeof results[year]['surplus'] === 'number'
                    ? `$${Math.round(results[year]['surplus']).toLocaleString()}`
                    : ''}
                </td>
                <td>{typeof results[year]['status'] === 'string' ? results[year]['status'] : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Monte Carlo chart
  const renderMonteCarloChart = () => {
    if (!mcResults || !Array.isArray(mcResults)) return null;
    // Only use numbers, filter out anything else
    const safeData = mcResults.map(v => (typeof v === 'number' && isFinite(v)) ? v * 100 : 0);
    const labels = safeData.map((_, i) => `Year ${i + 1}`);
    // Find the first year below the target
    const belowTargetIdx = safeData.findIndex(v => v < (params.target_success_rate * 100));
    const belowTargetYear = belowTargetIdx !== -1 ? belowTargetIdx + 1 : null;
    const data = {
      labels,
      datasets: [
        {
          label: 'Success Rate',
          data: safeData,
          fill: false,
          borderColor: '#1976d2',
          backgroundColor: '#1976d2',
          tension: 0.2,
        },
        {
          label: `Target Success Rate (${(params.target_success_rate * 100).toFixed(0)}%)`,
          data: Array(safeData.length).fill(params.target_success_rate * 100),
          borderColor: '#388e3c',
          borderWidth: 2,
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false,
          type: 'line',
        },
      ],
    };
    const options = {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: 'Monte Carlo Success Rate by Year (%)',
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: 'Success Rate (%)' },
        },
        x: {
          title: { display: true, text: 'Year' },
        },
      },
    };
    return (
      <div className="mc-chart-wrapper">
        <Line data={data} options={options} />
        {belowTargetYear && (
          <div className="below-target-label">
            <span>Falls below target in <b>Year {belowTargetYear}</b></span>
          </div>
        )}
      </div>
    );
  };

  // Advanced Simulations fields
  const renderAdvancedSimulations = () => (
    <div className="advanced-section">
      <div className="advanced-fields">
        <label>
          APY Mean (default 0.07):
          <input
            type="number"
            name="apy_mean"
            step="0.0001"
            value={params.apy_mean}
            onChange={handleMonteCarloConfigChange}
          />
        </label>
        <label>
          APY Std Dev (default 0.01):
          <input
            type="number"
            name="apy_sd"
            step="0.0001"
            value={params.apy_sd}
            onChange={handleMonteCarloConfigChange}
          />
        </label>
        <label>
          Inflation Mean (default 0.025):
          <input
            type="number"
            name="inflation_mean"
            step="0.0001"
            value={params.inflation_mean}
            onChange={handleMonteCarloConfigChange}
          />
        </label>
        <label>
          Inflation Std Dev (default 0.01):
          <input
            type="number"
            name="inflation_sd"
            step="0.0001"
            value={params.inflation_sd}
            onChange={handleMonteCarloConfigChange}
          />
        </label>
      </div>
      <div className="advanced-note">
        <b>Note:</b> These parameters assume a <b>normal distribution</b> for APY and inflation in the Monte Carlo simulation.
      </div>
    </div>
  );

  // Payment options component
  const renderPaymentOptions = () => (
    <div className="payment-options">
      <h3>Upgrade Your Plan</h3>
      <p>Choose a plan to continue running simulations:</p>
      
      {/* Coupon Code Section */}
      <div className="coupon-section">
        <h4>Have a Coupon Code?</h4>
        <div className="coupon-input-group">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="coupon-input"
            disabled={paymentLoading}
          />
          <button
            onClick={() => handlePayment('coupon')}
            disabled={paymentLoading || !couponCode.trim()}
            className="coupon-btn"
          >
            {paymentLoading ? 'Processing...' : 'Apply Coupon'}
          </button>
        </div>
        {couponError && <div className="coupon-error">{couponError}</div>}
        {couponSuccess && <div className="coupon-success">{couponSuccess}</div>}
      </div>
      
      <div className="payment-cards">
        <div className="payment-card">
          <h4>5 Credits</h4>
          <p className="price">$5</p>
          <p>5 additional simulation runs</p>
          <button 
            onClick={() => handlePayment('credits_5')}
            disabled={paymentLoading}
            className="payment-btn"
          >
            {paymentLoading ? 'Processing...' : 'Buy 5 Credits'}
          </button>
        </div>
        <div className="payment-card">
          <h4>15 Credits</h4>
          <p className="price">$10</p>
          <p>15 additional simulation runs</p>
          <button 
            onClick={() => handlePayment('credits_15')}
            disabled={paymentLoading}
            className="payment-btn"
          >
            {paymentLoading ? 'Processing...' : 'Buy 15 Credits'}
          </button>
        </div>
        <div className="payment-card featured">
          <h4>Unlimited</h4>
          <p className="price">$20/month</p>
          <p>Unlimited simulations + Professional features</p>
          <button 
            onClick={() => handlePayment('unlimited')}
            disabled={paymentLoading}
            className="payment-btn featured"
          >
            {paymentLoading ? 'Processing...' : 'Subscribe Unlimited'}
          </button>
        </div>
      </div>
    </div>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      setShowLogin(false);
      setAuthError('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      await signup(email, password);
      setShowSignup(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError('Signup failed: ' + error.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      await resetPassword(resetEmail);
      setShowForgotPassword(false);
      setResetEmail('');
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      setAuthError('Password reset failed: ' + error.message);
    }
  };

  // --- Insights and Recommendation Section for Monte Carlo ---
  const renderMonteCarloInsights = () => {
    if (!mcResults || !results) return null;
    // Insights logic (similar to backend)
    const insights = [];
    const avgSuccessRate = mcResults && mcResults.length > 0 ? (mcResults.reduce((a, b) => a + b, 0) / mcResults.length) : 0;
    if (avgSuccessRate < 0.7) {
      insights.push('⚠️ Low success rate in Monte Carlo analysis. Consider reducing withdrawal rate or increasing savings.');
    } else if (avgSuccessRate > 0.9) {
      insights.push('✅ High success rate indicates good retirement plan.');
    } else {
      insights.push('ℹ️ Moderate success rate. Consider fine-tuning your strategy.');
    }
    insights.push('📊 Consider running multiple scenarios to test different strategies.');
    insights.push('🔄 Review and update your plan annually as circumstances change.');
    insights.push('💡 Consult with a financial advisor for personalized advice.');

    // Milestones: find first year real_income cap >= 75,000 and >= 200,000
    let yearTo75k = null;
    let yearTo200k = null;
    const sortedYears = Object.keys(results).sort((a, b) => {
      const ay = parseInt(a.split('-')[1], 10);
      const by = parseInt(b.split('-')[1], 10);
      return ay - by;
    });
    for (const year of sortedYears) {
      const val = results[year]['real_income cap'];
      if (yearTo75k === null && typeof val === 'number' && val >= 75000) {
        yearTo75k = year;
      }
      if (yearTo200k === null && typeof val === 'number' && val >= 200000) {
        yearTo200k = year;
      }
    }

    return (
      <div className="mc-insights-section">
        <h3>Insights and Recommendation</h3>
        <ul className="mc-insights-list">
          {insights.map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
        <div className="mc-milestones">
          <div><b>Milestone:</b> Avg US Livable Income ($75,000): <span>{yearTo75k ? yearTo75k : 'Not reached'}</span></div>
          <div><b>Milestone:</b> Comfortable Lifestyle ($200,000): <span>{yearTo200k ? yearTo200k : 'Not reached'}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand-row">
          <span className="brand-icon" aria-label="GlidePath logo">
            {/* Hand-drawn style paper airplane SVG */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6,24 44,10 22,44 20,30 6,24" stroke="#222" strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
              <polyline points="44,10 20,30 22,44" stroke="#222" strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
              <polyline points="6,24 20,30 44,10" stroke="#222" strokeWidth="1.2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
              <line x1="20" y1="30" x2="28" y2="18" stroke="#222" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="13" y1="26" x2="21" y2="29" stroke="#222" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="16" y1="27" x2="24" y2="30" stroke="#222" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="18" y1="28" x2="26" y2="31" stroke="#222" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </span>
          <h1>GlidePath</h1>
        </div>
        <p>Inspire and achieve your journey to "FIRE", a retirement planning simulator.</p>
      </header>
      <div className="auth-bar">
        {user ? (
          <>
            <span>Welcome, {user.email}</span>
            {!creditsLoading && (
              <div className="user-credits">
                {userCredits.unlimited ? (
                  <span className="unlimited-badge">Unlimited</span>
                ) : userCredits.subscription_status === 'active' ? (
                  <span className="subscription-badge">Active Subscription</span>
                ) : (
                  <span className="credits-badge">{userCredits.credits} Credits</span>
                )}
              </div>
            )}
            <button onClick={toggleSidebar} className="sidebar-toggle">
              {sidebarOpen ? '✕' : '☰'} Clients
            </button>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <span className="guest-info">
              {runCount}/{FREE_RUN_LIMIT} free runs remaining
            </span>
            <button onClick={() => { setShowLogin(true); setShowSignup(false); setShowForgotPassword(false); }}>Login</button>
            <button onClick={() => { setShowSignup(true); setShowLogin(false); setShowForgotPassword(false); }}>Sign Up</button>
          </>
        )}
      </div>
      {showLogin && !showForgotPassword && (
        <form onSubmit={handleLogin} className="auth-form">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
          <button type="button" onClick={() => setShowLogin(false)}>Cancel</button>
          <button type="button" onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}>Forgot Password?</button>
          {authError && <div className="error-message">{authError}</div>}
        </form>
      )}
      {showForgotPassword && (
        <form onSubmit={handleForgotPassword} className="auth-form">
          <h3>Reset Password</h3>
          <input type="email" placeholder="Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
          <button type="submit">Send Reset Email</button>
          <button type="button" onClick={() => { setShowForgotPassword(false); setShowLogin(true); }}>Back to Login</button>
          {authError && <div className="error-message">{authError}</div>}
        </form>
      )}
      {showSignup && (
        <form onSubmit={handleSignup} className="auth-form">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Sign Up</button>
          <button type="button" onClick={() => setShowSignup(false)}>Cancel</button>
          {authError && <div className="error-message">{authError}</div>}
        </form>
      )}
      {!canRunSimulation() && !showPayment && (
        <div className="limit-reached">
          <div className="error-message">
            {user
              ? userCredits.unlimited 
                ? 'Something went wrong with your unlimited subscription. Please contact support.'
                : userCredits.subscription_status === 'active'
                ? 'Your subscription has expired. Please renew to continue.'
                : `You have no credits remaining. Please purchase more credits or subscribe.`
              : `You have reached your free simulation limit (${FREE_RUN_LIMIT}). Please log in or sign up for more runs.`}
          </div>
          {user && (
            <button onClick={() => setShowPayment(true)} className="upgrade-btn">
              View Payment Options
            </button>
          )}
        </div>
      )}
      {showPayment && renderPaymentOptions()}
      
      <div className="app-container">
        {/* Sidebar */}
        {user && (
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Client Management</h3>
              <button onClick={toggleSidebar} className="sidebar-close">✕</button>
            </div>
            <div className="sidebar-content">
              <ClientManagement onClientsChanged={handleClientsChanged} />
            </div>
          </aside>
        )}
        
        {/* Main Content */}
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`} onClick={closeSidebar}>
          <form className="sim-form" onSubmit={handleSimulate}>
            <h2>Simulation Parameters</h2>
            
            {/* Client Selector for logged-in users */}
            {user && (
              <div className="client-selector">
                <label>
                  Associate with Client (Optional):
                  <select 
                    value={selectedClient} 
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="">No client selected</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} (Age: {client.age})
                      </option>
                    ))}
                  </select>
                </label>
                {selectedClient ? (
                  <div className="client-info-display">
                    <small>
                      ✅ Simulation will be saved to selected client. 
                      Each client can have up to 5 simulations.
                    </small>
                  </div>
                ) : clients.length > 0 ? (
                  <div className="client-info-display">
                    <small>
                      💡 Select a client to save this simulation and generate reports later.
                    </small>
                  </div>
                ) : (
                  <div className="client-info-display">
                    <small>
                      💡 Create a client in Client Management to save simulations and generate reports.
                    </small>
                  </div>
                )}
              </div>
            )}
            
            <div className="form-grid">
              <label>
                Starting Balance ($):
                <input type="number" name="balance" value={params.balance} onChange={handleChange} />
              </label>
              <label>
                APY (e.g. 0.07):
                <input type="number" step="0.0001" name="apy" value={params.apy} onChange={handleChange} />
              </label>
              <label>
                Draw Rate (e.g. 0.04):
                <input type="number" step="0.0001" name="draw" value={params.draw} onChange={handleChange} />
              </label>
              <label>
                Years:
                <input type="number" name="duration" value={params.duration} onChange={handleChange} />
              </label>
              <label>
                Current Annual Expense (after-tax $):
                <input type="number" name="curr_exp" value={params.curr_exp} onChange={handleChange} />
              </label>
              <label>
                Tax Rate (e.g. 0.22):
                <input type="number" step="0.0001" name="tax_rate" value={params.tax_rate} onChange={handleChange} />
              </label>
              <label>
                Inflation (e.g. 0.025):
                <input type="number" step="0.0001" name="inflation" value={params.inflation} onChange={handleChange} />
              </label>
              <label>
                Annual Contribution ($):
                <input type="number" name="annual_contrib" value={params.annual_contrib} onChange={handleChange} />
              </label>
              <label>
                Contribution Years:
                <input type="number" name="annual_contrib_years" value={params.annual_contrib_years} onChange={handleChange} />
              </label>
              <label>
                Drawdown Start Year:
                <input type="number" name="drawdown_start" value={params.drawdown_start} onChange={handleChange} />
              </label>
            </div>
            <button type="submit" disabled={loading || !canRunSimulation()}>
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
          </form>
          <section className="results">
            <h2>Results</h2>
            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading-message">Loading...</div>}
            {!loading && results && (
              <>
                {latestSim.basic && selectedClient && (
                  <div className="save-action-bar">
                    <span>Save this simulation to your selected client:</span>
                    <button onClick={() => handleSaveSimulation('basic')} className="save-btn">
                      Save to Client
                    </button>
                  </div>
                )}
                {renderResultsTable()}
              </>
            )}
            {!loading && !results && !error && (
              <>
                <div className="chart-placeholder">[Chart will appear here]</div>
                <div className="table-placeholder">[Table will appear here]</div>
              </>
            )}
          </section>
          <section className="monte-carlo">
            <div className="mc-header-row">
              <h2>Monte Carlo Simulation</h2>
              <button
                type="button"
                className="mc-advanced-link"
                onClick={() => setShowAdvanced((prev) => !prev)}
                aria-expanded={showAdvanced}
              >
                {showAdvanced ? 'Hide Advanced Parameters' : 'Configure Advanced Parameters'}
              </button>
            </div>
            {!canRunSimulation() && (
              <div className="error-message">
                {user
                  ? userCredits.unlimited 
                    ? 'Something went wrong with your unlimited subscription. Please contact support.'
                    : userCredits.subscription_status === 'active'
                    ? 'Your subscription has expired. Please renew to continue.'
                    : `You have no credits remaining. Please purchase more credits or subscribe.`
                  : `You have reached your free simulation limit (${FREE_RUN_LIMIT}). Please log in or sign up for more runs.`}
              </div>
            )}
            {mcHasRun && (
              <div className="mc-config">
                <label>
                  Number of Simulations:
                  <input
                    type="number"
                    name="simulations"
                    min="100"
                    max="10000"
                    step="100"
                    value={params.simulations}
                    onChange={handleMonteCarloConfigChange}
                  />
                </label>
                <label>
                  Target Success Rate (%):
                  <input
                    type="number"
                    name="target_success_rate"
                    min="0"
                    max="1"
                    step="0.01"
                    value={params.target_success_rate}
                    onChange={handleMonteCarloConfigChange}
                  />
                </label>
              </div>
            )}
            <div className="mc-btn-row">
              <button onClick={handleMonteCarlo} disabled={mcLoading || !canRunSimulation()} className="mc-btn">
                {mcLoading ? 'Running Monte Carlo...' : (mcHasRun ? 'Run Monte Carlo Again' : 'Run Monte Carlo')}
              </button>
            </div>
            {showAdvanced && renderAdvancedSimulations()}
            {mcError && <div className="error-message">{mcError}</div>}
            {mcLoading && <div className="loading-message">Loading Monte Carlo...</div>}
            {!mcLoading && mcResults && (
              <>
                {latestSim.monteCarlo && selectedClient && (
                  <div className="save-action-bar">
                    <span>Save this scenario to your selected client:</span>
                    <button onClick={() => handleSaveSimulation('monteCarlo')} className="save-btn">
                      Save to Client
                    </button>
                  </div>
                )}
                {renderMonteCarloChart()}
                {renderMonteCarloInsights()}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
