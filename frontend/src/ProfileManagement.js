import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './App.css';

// Get API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ProfileManagement(props) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileSimulations, setProfileSimulations] = useState({});
  const [reportLoading, setReportLoading] = useState({});
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    date_created: ''
  });

  // Fetch profiles on component mount
  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients?user_id=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
        
        // Fetch simulations for each profile
        for (const profile of data) {
          await fetchProfileSimulations(profile.id);
        }
      } else {
        setError('Failed to fetch profiles');
      }
    } catch (err) {
      setError('Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileSimulations = async (profileId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/${profileId}/simulations?user_id=${user.uid}`);
      if (response.ok) {
        const simulations = await response.json();
        setProfileSimulations(prev => ({
          ...prev,
          [profileId]: simulations
        }));
      }
    } catch (err) {
      console.error('Error fetching simulations for profile:', profileId, err);
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
    setEditingProfile(null);
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
      const url = editingProfile 
        ? `${API_BASE_URL}/api/clients/${editingProfile.id}`
        : `${API_BASE_URL}/api/clients`;
      
      const method = editingProfile ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          client_data: formData
        })
      });

      if (response.ok) {
        await fetchProfiles();
        resetForm();
        setError('');
        if (props.onProfilesChanged) props.onProfilesChanged();
        alert(`✅ Profile "${formData.name}" ${editingProfile ? 'updated' : 'created'} successfully!`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      age: profile.age,
      date_created: profile.date_created || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (profileId) => {
    if (!user || !window.confirm('Are you sure you want to delete this profile? This will also delete all associated simulations.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/${profileId}?user_id=${user.uid}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProfiles();
        setError('');
        if (props.onProfilesChanged) props.onProfilesChanged();
        alert('✅ Profile deleted successfully!');
      } else {
        setError('Failed to delete profile');
      }
    } catch (err) {
      setError('Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSimulation = async (profileId, simulationId) => {
    if (!user || !window.confirm('Are you sure you want to delete this simulation? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/${profileId}/simulations/${simulationId}?user_id=${user.uid}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProfiles();
        setError('');
        if (props.onProfilesChanged) props.onProfilesChanged();
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

  const handleDownloadFullReport = async (profileId) => {
    if (!user) return;

    // Use profileId for loading state to avoid conflicts
    setReportLoading(prev => ({ ...prev, [profileId]: true }));
    setError('');

    try {
      console.log(`Downloading report for profile ${profileId}`);
      const response = await fetch(`${API_BASE_URL}/api/clients/${profileId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Retirement_Report_Profile_${profileId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        console.log('Report downloaded successfully');
        // Refresh profile list after report generation
        if (props.onProfilesChanged) props.onProfilesChanged();
      } else {
        const errorData = await response.json();
        console.error('Report generation failed:', errorData);
        setError(`Failed to generate report: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Report download error:', err);
      setError(`Failed to download report: ${err.message}`);
    } finally {
      setReportLoading(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const getProfileSimulationCount = (profileId) => {
    return profileSimulations[profileId]?.length || 0;
  };

  if (!user) {
    return (
      <div className="profile-management">
        <div className="error-message">Please log in to manage profiles.</div>
      </div>
    );
  }

  return (
    <div className="profile-management">
      <div className="profile-header">
        <h2>Profile Management</h2>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="add-profile-btn"
          disabled={loading}
        >
          Add New Profile
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="profile-form-overlay">
          <div className="profile-form">
            <h3>{editingProfile ? 'Edit Profile' : 'Add New Profile'}</h3>
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
                  {loading ? 'Saving...' : (editingProfile ? 'Update Profile' : 'Add Profile')}
                </button>
                <button type="button" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="profiles-list">
        {loading && !showAddForm ? (
          <div className="loading-message">Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="no-profiles">
            <p>No profiles found. Add your first profile to get started!</p>
          </div>
        ) : (
          profiles.map(profile => (
            <div className="profile-card" key={profile.id}>
              <div className="profile-info">
                <h4>{profile.name}</h4>
                <p>Age: {profile.age}</p>
                <p>Simulations: {getProfileSimulationCount(profile.id)} / 5</p>
              </div>
              
              {/* Simulations List */}
              {profileSimulations[profile.id] && profileSimulations[profile.id].length > 0 && (
                <div className="simulations-list">
                  <h5>Saved Scenarios (Most Recent)</h5>
                  {(() => {
                    // Get the most recent simulation of each type
                    const simulations = profileSimulations[profile.id];
                    const basicSim = simulations.filter(s => s.type === 'basic').sort((a, b) => 
                      new Date(b.created_at) - new Date(a.created_at)
                    )[0];
                    const mcSim = simulations.filter(s => s.type === 'monte_carlo').sort((a, b) => 
                      new Date(b.created_at) - new Date(a.created_at)
                    )[0];
                    
                    const recentSims = [];
                    if (basicSim) recentSims.push(basicSim);
                    if (mcSim) recentSims.push(mcSim);
                    
                    return recentSims.map(sim => (
                      <div className="simulation-item" key={sim.id}>
                        <div className="simulation-info">
                          {sim.type === 'monte_carlo' ? 'Monte Carlo' : 'Basic Simulation'}
                          <small> (Saved: {new Date(sim.created_at).toLocaleDateString()})</small>
                          <small className="override-warning">⚠️ Saving new {sim.type === 'monte_carlo' ? 'Monte Carlo' : 'Basic'} will replace this</small>
                        </div>
                        <div className="simulation-actions">
                          <button
                            onClick={() => handleDeleteSimulation(profile.id, sim.id)}
                            disabled={loading}
                            className="delete-sim-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
              
              <div className="profile-actions">
                <button 
                  onClick={() => handleDownloadFullReport(profile.id)}
                  className="report-btn"
                  disabled={loading || reportLoading[profile.id] || getProfileSimulationCount(profile.id) === 0}
                >
                  {reportLoading[profile.id] ? 'Generating PDF...' : 'Download Full Report (PDF)'}
                </button>
                <button 
                  onClick={() => handleEdit(profile)}
                  disabled={loading}
                  className="edit-btn"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(profile.id)}
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

export default ProfileManagement; 