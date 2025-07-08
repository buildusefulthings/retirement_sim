import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import './App.css';

function PaymentSuccess() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const refreshCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Wait a moment for Stripe webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch(`http://localhost:5000/api/user-credits?user_id=${user.uid}`);
        if (response.ok) {
          // Credits updated successfully
          setLoading(false);
        } else {
          setError('Failed to refresh credits. Please refresh the page.');
        }
      } catch (err) {
        setError('Failed to refresh credits. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    refreshCredits();
  }, [user]);

  const handleContinue = () => {
    window.location.href = '/';
  };

  return (
    <div className="App">
      <div className="payment-success">
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for your purchase. Your credits have been added to your account.</p>
          
          {loading && (
            <div className="loading-message">
              Updating your account...
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button onClick={handleContinue} className="continue-btn">
            Continue to Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess; 