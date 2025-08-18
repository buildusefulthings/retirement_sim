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
import ProfileManagement from './ProfileManagement';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [authError, setAuthError] = useState('');

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [patreonAuthUrl, setPatreonAuthUrl] = useState('');
  const [patreonLoading, setPatreonLoading] = useState(false);

  // User credits state
  const [userCredits, setUserCredits] = useState({
    credits: 0,
    subscription_status: 'none',
    unlimited: false,
    patreon_member: false,
    patreon_tier: null
  });
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Profile management state
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [showProfileManagement, setShowProfileManagement] = useState(false);
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

  // Fetch user profiles
  const fetchProfiles = async (userId) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  // Callback to update profiles from child
  const handleProfilesChanged = () => {
    if (user) fetchProfiles(user.uid);
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
      fetchProfiles(user.uid);
    } else {
      const guestRuns = parseInt(localStorage.getItem('guestRunCount') || '0', 10);
      setRunCount(guestRuns);
      setLimitReached(guestRuns >= FREE_RUN_LIMIT);
      setUserCredits({ credits: 0, subscription_status: 'none', unlimited: false });
      setProfiles([]);
      setSelectedProfile('');
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
    console.log('Selected profile:', selectedProfile);
    
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const requestData = { ...params };
      if (user) {
        requestData.user_id = user.uid;
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
    } catch (err) {
      console.error('Simulation error:', err);
      setError(`Failed to fetch simulation results: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSimulation = async (simulationType) => {
    const simToSave = latestSim[simulationType];
    if (!simToSave || !selectedProfile) {
      alert("Please select a profile and run a simulation first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/${selectedProfile}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          simulation_data: simToSave,
          type: simulationType,
        }),
      });

      if (response.ok) {
        const selectedProfileName = profiles.find(p => p.id === selectedProfile)?.name;
        alert(`✅ ${simulationType === 'monteCarlo' ? 'Monte Carlo' : 'Basic'} simulation saved to profile: ${selectedProfileName}`);
        fetchProfiles(user.uid); // Refresh profile data
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

  const handleSaveBothSimulations = async () => {
    if (!selectedProfile) {
      alert("Please select a profile first.");
      return;
    }

    const basicSim = latestSim.basic;
    const monteCarloSim = latestSim.monteCarlo;

    if (!basicSim && !monteCarloSim) {
      alert("Please run at least one simulation (Basic or Monte Carlo) before saving.");
      return;
    }

    setLoading(true);
    try {
      const selectedProfileName = profiles.find(p => p.id === selectedProfile)?.name;
      let savedCount = 0;
      let errorMessages = [];

      // Save basic simulation if available
      if (basicSim) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/clients/${selectedProfile}/simulations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.uid,
              simulation_data: basicSim,
              type: 'basic',
            }),
          });

          if (response.ok) {
            savedCount++;
          } else {
            const errorData = await response.json();
            errorMessages.push(`Basic: ${errorData.error || 'Failed to save'}`);
          }
        } catch (err) {
          errorMessages.push('Basic: Network error');
        }
      }

      // Save Monte Carlo simulation if available
      if (monteCarloSim) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/clients/${selectedProfile}/simulations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.uid,
              simulation_data: monteCarloSim,
              type: 'monte_carlo',
            }),
          });

          if (response.ok) {
            savedCount++;
          } else {
            const errorData = await response.json();
            errorMessages.push(`Monte Carlo: ${errorData.error || 'Failed to save'}`);
          }
        } catch (err) {
          errorMessages.push('Monte Carlo: Network error');
        }
      }

      // Show results
      if (savedCount > 0) {
        const simTypes = [];
        if (basicSim) simTypes.push('Basic');
        if (monteCarloSim) simTypes.push('Monte Carlo');
        
        alert(`✅ ${savedCount} simulation(s) saved to profile: ${selectedProfileName}\n\nSaved: ${simTypes.join(' and ')}`);
        fetchProfiles(user.uid); // Refresh profile data
        
        // Clear saved simulations
        setLatestSim(prev => ({ 
          basic: basicSim ? null : prev.basic, 
          monteCarlo: monteCarloSim ? null : prev.monteCarlo 
        }));
      }

      if (errorMessages.length > 0) {
        setError(`Some simulations failed to save: ${errorMessages.join(', ')}`);
      }
    } catch (err) {
      setError('An error occurred while saving simulations.');
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
    console.log('Selected profile:', selectedProfile);
    
    setMcLoading(true);
    setMcError(null);
    setMcResults(null);
    try {
      const requestData = { ...params };
      if (user) {
        requestData.user_id = user.uid;
        if (selectedProfile) {
          requestData.client_id = selectedProfile;
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
    } catch (err) {
      console.error('Monte Carlo error:', err);
      setMcError(`Failed to fetch Monte Carlo results: ${err.message}`);
    } finally {
      setMcLoading(false);
    }
  };

  // Handle Patreon authentication
  const handlePatreonAuth = async () => {
    if (!user) {
      setAuthError('Please log in to verify your Patreon membership.');
      return;
    }
    
    setPatreonLoading(true);
    setAuthError('');
    
    try {
      // Get Patreon auth URL
      const response = await fetch(`${API_BASE_URL}/api/patreon/auth-url`);
      if (!response.ok) {
        throw new Error('Failed to get Patreon auth URL');
      }
      
      const data = await response.json();
      const authUrl = data.auth_url;
      
      // Open Patreon auth in a popup window
      const popup = window.open(authUrl, 'patreon-auth', 'width=600,height=700');
      
      // Listen for the callback
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'PATREON_CALLBACK') {
          const { code } = event.data;
          
          try {
            // Send auth code to backend
            const callbackResponse = await fetch(`${API_BASE_URL}/api/patreon/callback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: user.uid, code })
            });
            
            if (!callbackResponse.ok) {
              throw new Error('Failed to verify Patreon membership');
            }
            
            const callbackData = await callbackResponse.json();
            
            if (callbackData.is_member) {
              alert('✅ Patreon membership verified! You now have unlimited access to GlidePath.');
              setShowPayment(false);
              fetchUserCredits(user.uid); // Refresh user credits
            } else {
              alert('❌ Patreon membership not found. Please make sure you have joined our Patreon campaign.');
            }
          } catch (err) {
            console.error('Patreon callback error:', err);
            alert('Failed to verify Patreon membership. Please try again.');
          } finally {
            popup.close();
            window.removeEventListener('message', handleMessage);
            setPatreonLoading(false);
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (err) {
      console.error('Patreon auth error:', err);
      setAuthError('Failed to start Patreon authentication. Please try again.');
      setPatreonLoading(false);
    }
  };

  // Handle Patreon join (new function)
  const handlePatreonJoin = async (tier) => {
    if (!user) {
      setAuthError('Please log in to join the Patreon campaign.');
      return;
    }

    setPatreonLoading(true);
    setAuthError('');

    try {
      // Store user info in localStorage for the callback page
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        credits: userCredits
      }));

      const response = await fetch(`${API_BASE_URL}/api/patreon/join-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, tier })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join Patreon campaign.');
      }

      const data = await response.json();
      if (data.success) {
        // Redirect to Patreon OAuth for joining the campaign
        window.location.href = data.auth_url;
      } else {
        alert('❌ Failed to join Patreon campaign. Please try again.');
      }
    } catch (err) {
      console.error('Patreon join error:', err);
      setAuthError('Failed to join Patreon campaign: ' + err.message);
    } finally {
      setPatreonLoading(false);
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
          Annual Return Mean (default 0.07 as 7%):
          <input
            type="number"
            name="apy_mean"
            step="0.0001"
            value={params.apy_mean}
            onChange={handleMonteCarloConfigChange}
            onFocus={(e) => e.target.select()}
          />
        </label>
        <label>
          Annual Return Std Dev (default 0.01 as 1%):
          <input
            type="number"
            name="apy_sd"
            step="0.0001"
            value={params.apy_sd}
            onChange={handleMonteCarloConfigChange}
            onFocus={(e) => e.target.select()}
          />
        </label>
        <label>
          Inflation Rate Mean (default 0.025 as 2.5%):
          <input
            type="number"
            name="inflation_mean"
            step="0.0001"
            value={params.inflation_mean}
            onChange={handleMonteCarloConfigChange}
            onFocus={(e) => e.target.select()}
          />
        </label>
        <label>
          Inflation Rate Std Dev (default 0.01 as 1%):
          <input
            type="number"
            name="inflation_sd"
            step="0.0001"
            value={params.inflation_sd}
            onChange={handleMonteCarloConfigChange}
            onFocus={(e) => e.target.select()}
          />
        </label>
      </div>
      <div className="advanced-note">
        <b>Note:</b> These parameters assume a <b>normal distribution</b> for Annual Return and Inflation Rate in the Monte Carlo simulation.
      </div>
    </div>
  );

  // Payment options component
  const renderPaymentOptions = () => (
    <div className="payment-options">
      <h3>Support GlidePath on Patreon</h3>
      <p>Join our Patreon community to get unlimited access to retirement simulations and support the development of GlidePath!</p>
      
      <div className="patreon-info">
        <div className="patreon-benefits">
          <h4>🎯 What You Get:</h4>
          <ul>
            <li>✅ <strong>Unlimited Simulations</strong> - Run as many retirement scenarios as you want</li>
            <li>✅ <strong>Advanced Features</strong> - Monte Carlo analysis and detailed reports</li>
            <li>✅ <strong>Profile Management</strong> - Save and organize your retirement plans</li>
            <li>✅ <strong>Priority Support</strong> - Get help when you need it</li>
            <li>✅ <strong>Early Access</strong> - Try new features before anyone else</li>
          </ul>
        </div>
        
        <div className="patreon-tiers">
          <div className="tier-card">
            <h4>Basic Supporter</h4>
            <p className="price">$5/month</p>
            <ul>
              <li>Unlimited simulations</li>
              <li>Basic features</li>
              <li>Community access</li>
            </ul>
            <button 
              onClick={() => {
                window.open('https://www.patreon.com/14605506/join', '_blank');
              }}
              className="patreon-btn primary"
              disabled={patreonLoading}
            >
              {patreonLoading ? 'Loading...' : 'Join Basic Tier'}
            </button>
          </div>
          
          <div className="tier-card featured">
            <h4>Premium Supporter</h4>
            <p className="price">$10/month</p>
            <ul>
              <li>Everything in Basic</li>
              <li>Advanced features</li>
              <li>Priority support</li>
              <li>Early access to new features</li>
            </ul>
            <button 
              onClick={() => {
                window.open('https://www.patreon.com/14605506/join', '_blank');
              }}
              className="patreon-btn primary"
              disabled={patreonLoading}
            >
              {patreonLoading ? 'Loading...' : 'Join Premium Tier'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="patreon-actions">
        <button 
          onClick={handlePatreonAuth}
          className="patreon-btn secondary"
          disabled={patreonLoading}
        >
          {patreonLoading ? 'Verifying...' : 'I\'m Already a Patron'}
        </button>
      </div>
      
      <div className="patreon-note">
        <p><small>
          💡 <strong>How it works:</strong> Click any tier button above to join our Patreon campaign. 
          After completing your membership, return here and click "I'm Already a Patron" to verify and unlock unlimited access.
        </small></p>
      </div>
    </div>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    
    try {
      console.log('Attempting to login with email:', email);
      await login(email, password);
      console.log('Login successful');
      setShowLogin(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Login failed: ' + error.message);
    }
  };

  // Helper function to check password strength
  const getPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    return { checks, passedChecks, totalChecks: 5 };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password || !confirmPassword) {
      setAuthError('Please enter both email, password, and confirm password.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    // Password validation
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      setAuthError('Password must contain at least one uppercase letter.');
      return;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      setAuthError('Password must contain at least one lowercase letter.');
      return;
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      setAuthError('Password must contain at least one number.');
      return;
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setAuthError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).');
      return;
    }
    
    try {
      await signup(email, password);
      setShowSignup(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setAuthError('Signup failed: ' + error.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!resetEmail) {
      setAuthError('Please enter your email address.');
      return;
    }
    
    try {
      console.log('Attempting to send password reset email to:', resetEmail);
      await resetPassword(resetEmail);
      console.log('Password reset email sent successfully');
      setShowForgotPassword(false);
      setResetEmail('');
      alert('Password reset email sent! Check your inbox and spam folder.');
    } catch (error) {
      console.error('Password reset error:', error);
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
                {userCredits.patreon_member ? (
                  <span className="patreon-badge">Patreon Member</span>
                ) : userCredits.unlimited ? (
                  <span className="unlimited-badge">Unlimited</span>
                ) : userCredits.subscription_status === 'active' ? (
                  <span className="subscription-badge">Active Subscription</span>
                ) : (
                  <span className="credits-badge">{userCredits.credits} Credits</span>
                )}
              </div>
            )}
            <button onClick={toggleSidebar} className="sidebar-toggle">
              {sidebarOpen ? '✕' : '☰'} Profiles
            </button>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <span className="guest-info">
              {runCount}/{FREE_RUN_LIMIT} free runs remaining
            </span>
            <button onClick={() => { setShowLogin(true); setShowSignup(false); setShowForgotPassword(false); }}>Login</button>
            <button onClick={() => { setShowSignup(true); setShowLogin(false); setShowForgotPassword(false); setConfirmPassword(''); }}>Sign Up</button>
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
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          
          {/* Password Requirements */}
          {password && (
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={password.length >= 8 ? 'valid' : 'invalid'}>
                  ✓ At least 8 characters long
                </li>
                <li className={/[A-Z]/.test(password) ? 'valid' : 'invalid'}>
                  ✓ Contains uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'valid' : 'invalid'}>
                  ✓ Contains lowercase letter
                </li>
                <li className={/\d/.test(password) ? 'valid' : 'invalid'}>
                  ✓ Contains number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : 'invalid'}>
                  ✓ Contains special character
                </li>
              </ul>
              <div className="password-strength">
                Strength: {getPasswordStrength(password).passedChecks}/5
              </div>
            </div>
          )}
          
          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className={`password-match ${password === confirmPassword ? 'valid' : 'invalid'}`}>
              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}
          
          <button type="submit">Sign Up</button>
          <button type="button" onClick={() => { setShowSignup(false); setConfirmPassword(''); }}>Cancel</button>
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
              <h3>Profile Management</h3>
              <button onClick={toggleSidebar} className="sidebar-close">✕</button>
            </div>
            <div className="sidebar-content">
              <ProfileManagement onProfilesChanged={handleProfilesChanged} />
            </div>
          </aside>
        )}
        
        {/* Main Content */}
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`} onClick={closeSidebar}>
          <form className="sim-form" onSubmit={handleSimulate}>
            <h2>Simulation Parameters</h2>
            
            {/* Profile Selector for logged-in users */}
            {user && (
              <div className="profile-selector">
                <label>
                  Associate with Profile (Optional):
                  <select 
                    value={selectedProfile} 
                    onChange={(e) => setSelectedProfile(e.target.value)}
                  >
                    <option value="">No profile selected</option>
                    {profiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} (Age: {profile.age})
                      </option>
                    ))}
                  </select>
                </label>
                {selectedProfile ? (
                  <div className="profile-info-display">
                    <small>
                      ✅ Simulation will be saved to selected profile. 
                      Each profile can have up to 5 simulations.
                    </small>
                    <small className="override-notice">
                      ⚠️ Saving will replace any existing simulation of the same type.
                    </small>
                  </div>
                ) : profiles.length > 0 ? (
                  <div className="profile-info-display">
                    <small>
                      💡 Select a profile to save this simulation and generate reports later.
                    </small>
                  </div>
                ) : (
                  <div className="profile-info-display">
                    <small>
                      💡 Create a profile in Profile Management to save simulations and generate reports.
                    </small>
                  </div>
                )}
              </div>
            )}
            
            <div className="form-grid">
              <label>
                Starting Balance ($):
                <input 
                  type="number" 
                  name="balance" 
                  value={params.balance} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Annual Percentage Return (e.g. 0.07 as 7%):
                <input 
                  type="number" 
                  step="0.0001" 
                  name="apy" 
                  value={params.apy} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Draw-Down Rate (e.g. 0.04):
                <input 
                  type="number" 
                  step="0.0001" 
                  name="draw" 
                  value={params.draw} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Years to Simulation:
                <input 
                  type="number" 
                  name="duration" 
                  value={params.duration} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Current Annual Expense (after-tax $):
                <input 
                  type="number" 
                  name="curr_exp" 
                  value={params.curr_exp} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Tax Rate (e.g. 0.22):
                <input 
                  type="number" 
                  step="0.0001" 
                  name="tax_rate" 
                  value={params.tax_rate} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Inflation Rate (e.g. 0.025 as 2.5%):
                <input 
                  type="number" 
                  step="0.0001" 
                  name="inflation" 
                  value={params.inflation} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Annual Contribution ($):
                <input 
                  type="number" 
                  name="annual_contrib" 
                  value={params.annual_contrib} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Contribution Years:
                <input 
                  type="number" 
                  name="annual_contrib_years" 
                  value={params.annual_contrib_years} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <label>
                Drawdown Start Year:
                <input 
                  type="number" 
                  name="drawdown_start" 
                  value={params.drawdown_start} 
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                />
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
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                <label>
                  Target Success Rate (e.g. 0.90 as 90%):
                  <input
                    type="number"
                    name="target_success_rate"
                    min="0"
                    max="1"
                    step="0.01"
                    value={params.target_success_rate}
                    onChange={handleMonteCarloConfigChange}
                    onFocus={(e) => e.target.select()}
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
                {renderMonteCarloChart()}
                {renderMonteCarloInsights()}
              </>
            )}
          </section>
          
          {/* Unified Save Button */}
          {user && selectedProfile && (latestSim.basic || latestSim.monteCarlo) && (
            <section className="unified-save-section">
              <div className="save-action-bar">
                <span>Save simulations to your selected profile:</span>
                <div className="save-info">
                  <button onClick={handleSaveBothSimulations} className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save to Profile'}
                  </button>
                  <small className="override-notice">
                    ⚠️ This will replace any existing simulations of the same type
                  </small>
                </div>
              </div>
              <div className="save-details">
                <small>
                  {latestSim.basic && latestSim.monteCarlo ? 'Will save: Basic + Monte Carlo simulations' :
                   latestSim.basic ? 'Will save: Basic simulation' :
                   'Will save: Monte Carlo simulation'}
                </small>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
