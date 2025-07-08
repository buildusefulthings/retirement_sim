import React from 'react';
import './App.css';

function PaymentCancelled() {
  const handleReturn = () => {
    window.location.href = '/';
  };

  return (
    <div className="App">
      <div className="payment-cancelled">
        <div className="cancelled-content">
          <div className="cancelled-icon">✕</div>
          <h1>Payment Cancelled</h1>
          <p>Your payment was cancelled. No charges were made to your account.</p>
          <p>You can try again anytime or return to the simulator.</p>
          
          <button onClick={handleReturn} className="return-btn">
            Return to Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancelled; 