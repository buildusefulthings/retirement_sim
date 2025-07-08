import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './App.css';

function ClientManagement(props) {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSimulations, setClientSimulations] = useState({});
  const [reportLoading, setReportLoading] = useState({});
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    date_created: ''
  });

  // Fetch clients on component mount
  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/clients?user_id=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        
        // Fetch simulations for each client
        for (const client of data) {
          await fetchClientSimulations(client.id);
        }
      } else {
        setError('Failed to fetch clients');
      }
    } catch (err) {
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientSimulations = async (clientId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}/simulations?user_id=${user.uid}`);
      if (response.ok) {
        const simulations = await response.json();
        setClientSimulations(prev => ({
          ...prev,
          [clientId]: simulations
        }));
      }
    } catch (err) {
      console.error('Error fetching simulations for client:', clientId, err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      date_created: ''
    });
    setEditingClient(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.age) {
      setError('Name and age are required');
      return;
    }

    setLoading(true);
    try {
      const url = editingClient 
        ? `http://localhost:5000/api/clients/${editingClient.id}`
        : 'http://localhost:5000/api/clients';
      
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          client_data: formData
        })
      });

      if (response.ok) {
        await fetchClients();
        resetForm();
        setError('');
        if (props.onClientsChanged) props.onClientsChanged();
        alert(`✅ Client "${formData.name}" created successfully!`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save client');
      }
    } catch (err) {
      setError('Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      age: client.age,
      date_created: client.date_created || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (clientId) => {
    if (!user || !window.confirm('Are you sure you want to delete this client? This will also delete all associated simulations.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}?user_id=${user.uid}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchClients();
        setError('');
        if (props.onClientsChanged) props.onClientsChanged();
        alert('✅ Client deleted successfully!');
      } else {
        setError('Failed to delete client');
      }
    } catch (err) {
      setError('Failed to delete client');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSimulation = async (clientId, simulationId) => {
    if (!user || !window.confirm('Are you sure you want to delete this simulation? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}/simulations/${simulationId}?user_id=${user.uid}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchClients();
        setError('');
        if (props.onClientsChanged) props.onClientsChanged();
        alert('✅ Simulation deleted successfully!');
      } else {
        setError('Failed to delete simulation');
      }
    } catch (err) {
      setError('Failed to delete simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFullReport = async (clientId) => {
    if (!user) return;

    // Use clientId for loading state to avoid conflicts
    setReportLoading(prev => ({ ...prev, [clientId]: true }));
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Retirement_Report_Client_${clientId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        // Refresh client list after report generation
        if (props.onClientsChanged) props.onClientsChanged();
      } else {
        setError('Failed to generate report.');
      }
    } catch (err) {
      setError('Failed to generate report.');
    } finally {
      setReportLoading(prev => ({ ...prev, [clientId]: false }));
    }
  };

  const getClientSimulationCount = (clientId) => {
    return clientSimulations[clientId]?.length || 0;
  };

  if (!user) {
    return (
      <div className="client-management">
        <div className="error-message">Please log in to manage clients.</div>
      </div>
    );
  }

  return (
    <div className="client-management">
      <div className="client-header">
        <h2>Client Management</h2>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="add-client-btn"
          disabled={loading}
        >
          Add New Client
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="client-form-overlay">
          <div className="client-form">
            <h3>{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Age:</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="120"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date Created:</label>
                <input
                  type="date"
                  name="date_created"
                  value={formData.date_created}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingClient ? 'Update Client' : 'Add Client')}
                </button>
                <button type="button" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="clients-list">
        {loading && !showAddForm ? (
          <div className="loading-message">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="no-clients">
            <p>No clients found. Add your first client to get started!</p>
          </div>
        ) : (
          clients.map(client => (
            <div className="client-card" key={client.id}>
              <div className="client-info">
                <h4>{client.name}</h4>
                <p>Age: {client.age}</p>
                <p>Simulations: {getClientSimulationCount(client.id)} / 5</p>
              </div>
              
              {/* Simulations List */}
              {clientSimulations[client.id] && clientSimulations[client.id].length > 0 && (
                <div className="simulations-list">
                  <h5>Saved Scenarios</h5>
                  {clientSimulations[client.id].map(sim => (
                    <div className="simulation-item" key={sim.id}>
                      <div className="simulation-info">
                        {sim.type === 'monteCarlo' ? 'Monte Carlo' : 'Basic Simulation'}
                        <small> (Saved: {new Date(sim.created_at).toLocaleDateString()})</small>
                      </div>
                      <div className="simulation-actions">
                        <button
                          onClick={() => handleDeleteSimulation(client.id, sim.id)}
                          disabled={loading}
                          className="delete-sim-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="client-actions">
                <button 
                  onClick={() => handleDownloadFullReport(client.id)}
                  className="report-btn"
                  disabled={loading || reportLoading[client.id] || getClientSimulationCount(client.id) === 0}
                >
                  {reportLoading[client.id] ? 'Generating...' : 'Download Full Report'}
                </button>
                <button 
                  onClick={() => handleEdit(client)}
                  disabled={loading}
                  className="edit-btn"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(client.id)}
                  disabled={loading}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ClientManagement; 