from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from simulator import simulation, monte_carlo_retirement, find_optimal_retirement_year
import os
from dotenv import load_dotenv
# import firebase_admin
# from firebase_admin import credentials, firestore
# from datetime import datetime, timedelta
from report_generator import generate_retirement_report
import io
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Firebase (temporarily disabled for testing)
# try:
#     cred = credentials.Certificate('firebase-service-account.json')
#     firebase_admin.initialize_app(cred)
#     db = firestore.client()
# except Exception as e:
#     print(f"Firebase initialization failed: {e}")
#     db = None

# Patreon configuration
PATREON_CLIENT_ID = os.getenv('PATREON_CLIENT_ID')
PATREON_CLIENT_SECRET = os.getenv('PATREON_CLIENT_SECRET')
PATREON_REDIRECT_URI = os.getenv('PATREON_REDIRECT_URI', 'https://your-frontend-app.onrender.com/patreon-callback')

# User credit/subscription management (simplified for Patreon)
user_credits_storage = {}
client_storage = {}
simulation_storage = {}

def get_user_credits(user_id):
    """Get user's current credits and subscription status"""
    if user_id not in user_credits_storage:
        # Initialize new user with 5 credits for testing
        user_credits_storage[user_id] = {
            'credits': 5,  # Start with 5 credits
            'subscription_status': 'none',
            'unlimited': False,
            'patreon_member': False,
            'patreon_tier': None
        }
    return user_credits_storage[user_id]

def update_user_credits(user_id, credits_to_add=0, subscription_status='none', unlimited=False, patreon_member=False, patreon_tier=None):
    """Update user's credits and subscription status"""
    if user_id not in user_credits_storage:
        user_credits_storage[user_id] = {
            'credits': 0,
            'subscription_status': 'none',
            'unlimited': False,
            'patreon_member': False,
            'patreon_tier': None
        }
    
    if credits_to_add > 0:
        user_credits_storage[user_id]['credits'] += credits_to_add
        print(f"Added {credits_to_add} credits to user {user_id}. New total: {user_credits_storage[user_id]['credits']}")
    
    if subscription_status != 'none':
        user_credits_storage[user_id]['subscription_status'] = subscription_status
        user_credits_storage[user_id]['unlimited'] = unlimited
        print(f"Updated user {user_id} subscription status to {subscription_status}")
    
    if patreon_member is not None:
        user_credits_storage[user_id]['patreon_member'] = patreon_member
        user_credits_storage[user_id]['patreon_tier'] = patreon_tier
        print(f"Updated user {user_id} Patreon status: member={patreon_member}, tier={patreon_tier}")
    
    return True

def can_user_run_simulation(user_id):
    """Check if user can run a simulation"""
    user_data = get_user_credits(user_id)
    
    # Patreon members get unlimited access
    if user_data['patreon_member']:
        return True
    
    # Legacy unlimited/subscription users
    if user_data['unlimited'] or user_data['subscription_status'] == 'active':
        return True
    
    return user_data['credits'] > 0

def deduct_user_credit(user_id):
    """Deduct one credit from user"""
    if user_id not in user_credits_storage:
        return False
    
    user_data = user_credits_storage[user_id]
    
    # Patreon members don't use credits
    if user_data['patreon_member']:
        print(f"User {user_id} is a Patreon member - no credit deduction")
        return True
    
    # Legacy unlimited/subscription users
    if user_data['unlimited'] or user_data['subscription_status'] == 'active':
        print(f"User {user_id} has unlimited/subscription - no credit deduction")
        return True
    
    if user_data['credits'] > 0:
        user_credits_storage[user_id]['credits'] -= 1
        print(f"Deducted credit from user {user_id}. Remaining credits: {user_credits_storage[user_id]['credits']}")
        return True
    
    print(f"User {user_id} has no credits remaining")
    return False

# Client management functions
def get_user_clients(user_id):
    """Get all clients for a user"""
    if user_id not in client_storage:
        client_storage[user_id] = []
    return client_storage[user_id]

def create_client(user_id, client_data):
    """Create a new client for a user"""
    if user_id not in client_storage:
        client_storage[user_id] = []
    
    client_id = f"client_{len(client_storage[user_id]) + 1}_{user_id}"
    client = {
        'id': client_id,
        'name': client_data['name'],
        'age': client_data['age'],
        'date_created': client_data.get('date_created', datetime.now().strftime('%Y-%m-%d')),
        'user_id': user_id,
        'created_at': datetime.now().isoformat()
    }
    
    client_storage[user_id].append(client)
    return client

def update_client(user_id, client_id, client_data):
    """Update an existing client"""
    if user_id not in client_storage:
        return None
    
    for client in client_storage[user_id]:
        if client['id'] == client_id:
            client.update({
                'name': client_data['name'],
                'age': client_data['age'],
                'date_created': client_data.get('date_created', client.get('date_created', ''))
            })
            return client
    return None

def delete_client(user_id, client_id):
    """Delete a client and all associated simulations"""
    if user_id not in client_storage:
        return False
    
    # Remove client
    client_storage[user_id] = [c for c in client_storage[user_id] if c['id'] != client_id]
    
    # Remove associated simulations
    if user_id in simulation_storage:
        simulation_storage[user_id] = [s for s in simulation_storage[user_id] if s['client_id'] != client_id]
    
    return True

def get_client_simulations(user_id, client_id):
    """Get all simulations for a specific client"""
    if user_id not in simulation_storage:
        simulation_storage[user_id] = []
    
    return [s for s in simulation_storage[user_id] if s['client_id'] == client_id]

def can_client_have_more_simulations(user_id, client_id):
    """Check if client can have more simulations (max 5)"""
    simulations = get_client_simulations(user_id, client_id)
    return len(simulations) < 5

def save_simulation(user_id, client_id, simulation_data, simulation_type='basic'):
    """Save a simulation for a client"""
    if user_id not in simulation_storage:
        simulation_storage[user_id] = []
    
    simulation_id = f"sim_{len(simulation_storage[user_id]) + 1}_{user_id}"
    simulation = {
        'id': simulation_id,
        'client_id': client_id,
        'user_id': user_id,
        'type': simulation_type,
        'data': simulation_data,
        'created_at': datetime.now().isoformat(),
        'parameters': simulation_data.get('parameters', {}),
        'results': simulation_data.get('results', {})
    }
    
    simulation_storage[user_id].append(simulation)
    return simulation

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for production monitoring"""
    return jsonify({'status': 'healthy', 'service': 'retirement-simulator-backend'})

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({'message': 'Retirement Simulator API', 'status': 'running'})

@app.route('/api/simulate', methods=['POST'])
def api_simulate():
    data = request.json
    user_id = data.get('user_id')  # Frontend will send this
    
    # Check if user can run simulation
    if user_id and not can_user_run_simulation(user_id):
        return jsonify({'error': 'No credits remaining. Please purchase more credits or subscribe.'}), 402
    
    result = simulation(
        balance=data['balance'],
        apy=data['apy'],
        draw=data['draw'],
        duration=data['duration'],
        curr_exp=data['curr_exp'],
        tax_rate=data['tax_rate'],
        inflation=data['inflation'],
        annual_contrib=data.get('annual_contrib', 0),
        annual_contrib_years=data.get('annual_contrib_years', 0),
        drawdown_start=data.get('drawdown_start', 0)
    )
    
    # Deduct credit if user is logged in
    if user_id:
        deduct_user_credit(user_id)
    
    return jsonify(result)

@app.route('/api/monte-carlo', methods=['POST'])
def api_monte_carlo():
    data = request.json
    user_id = data.get('user_id')
    
    # Check if user can run simulation
    if user_id and not can_user_run_simulation(user_id):
        return jsonify({'error': 'No credits remaining. Please purchase more credits or subscribe.'}), 402
    
    result = monte_carlo_retirement(
        balance=data['balance'],
        draw=data['draw'],
        duration=data['duration'],
        curr_exp=data['curr_exp'],
        tax_rate=data['tax_rate'],
        apy_mean=data['apy_mean'],
        apy_sd=data['apy_sd'],
        inflation_mean=data['inflation_mean'],
        inflation_sd=data['inflation_sd'],
        annual_contrib=data.get('annual_contrib', 0),
        annual_contrib_years=data.get('annual_contrib_years', 0),
        drawdown_start=data.get('drawdown_start', 0),
        simulations=data.get('simulations', 1000)
    )
    
    # Deduct credit if user is logged in
    if user_id:
        deduct_user_credit(user_id)
    
    return jsonify({'success_rates': result.tolist()})

@app.route('/api/user-credits', methods=['GET'])
def get_credits():
    """Get user's current credits and subscription status"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    user_data = get_user_credits(user_id)
    return jsonify(user_data)

# Patreon authentication endpoints
@app.route('/api/patreon/auth-url', methods=['GET'])
def get_patreon_auth_url():
    """Get Patreon OAuth URL for user to authenticate"""
    if not PATREON_CLIENT_ID:
        return jsonify({'error': 'Patreon not configured'}), 500
    
    auth_url = f"https://www.patreon.com/oauth2/authorize?response_type=code&client_id={PATREON_CLIENT_ID}&redirect_uri={PATREON_REDIRECT_URI}&scope=identity%20identity.memberships"
    return jsonify({'auth_url': auth_url})

@app.route('/api/patreon/callback', methods=['POST'])
def patreon_callback():
    """Handle Patreon OAuth callback and check membership status"""
    try:
        data = request.json
        user_id = data.get('user_id')
        auth_code = data.get('code')
        
        if not user_id or not auth_code:
            return jsonify({'error': 'User ID and auth code required'}), 400
        
        if not PATREON_CLIENT_ID or not PATREON_CLIENT_SECRET:
            return jsonify({'error': 'Patreon not configured'}), 500
        
        # Exchange auth code for access token
        import requests
        
        token_response = requests.post('https://www.patreon.com/api/oauth2/token', data={
            'code': auth_code,
            'grant_type': 'authorization_code',
            'client_id': PATREON_CLIENT_ID,
            'client_secret': PATREON_CLIENT_SECRET,
            'redirect_uri': PATREON_REDIRECT_URI
        })
        
        if token_response.status_code != 200:
            return jsonify({'error': 'Failed to get access token'}), 400
        
        token_data = token_response.json()
        access_token = token_data['access_token']
        
        # Get user identity and membership info
        headers = {'Authorization': f'Bearer {access_token}'}
        identity_response = requests.get('https://www.patreon.com/api/oauth2/v2/identity?include=memberships', headers=headers)
        
        if identity_response.status_code != 200:
            return jsonify({'error': 'Failed to get user identity'}), 400
        
        identity_data = identity_response.json()
        
        # Check if user is a patron of your campaign
        # You'll need to replace YOUR_CAMPAIGN_ID with your actual Patreon campaign ID
        YOUR_CAMPAIGN_ID = os.getenv('PATREON_CAMPAIGN_ID')
        
        is_member = False
        tier_name = None
        
        if 'included' in identity_data:
            for item in identity_data['included']:
                if item['type'] == 'member' and item['relationships']['campaign']['data']['id'] == YOUR_CAMPAIGN_ID:
                    is_member = True
                    # Get tier name if available
                    if 'relationships' in item and 'currently_entitled_tiers' in item['relationships']:
                        tier_data = item['relationships']['currently_entitled_tiers']['data']
                        if tier_data:
                            tier_name = tier_data[0]['id']  # You might want to map this to tier names
        
        # Update user's Patreon status
        update_user_credits(user_id, patreon_member=is_member, patreon_tier=tier_name)
        
        return jsonify({
            'success': True,
            'is_member': is_member,
            'tier': tier_name
        })
        
    except Exception as e:
        print(f"Patreon callback error: {e}")
        return jsonify({'error': 'Failed to process Patreon authentication'}), 500

@app.route('/api/patreon/check-membership', methods=['POST'])
def check_patreon_membership():
    """Check if a user is a Patreon member (for periodic checks)"""
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        user_data = get_user_credits(user_id)
        
        return jsonify({
            'is_member': user_data.get('patreon_member', False),
            'tier': user_data.get('patreon_tier'),
            'can_run_simulation': can_user_run_simulation(user_id)
        })
        
    except Exception as e:
        print(f"Check membership error: {e}")
        return jsonify({'error': 'Failed to check membership'}), 500

# Remove old Stripe endpoints and replace with Patreon info
@app.route('/api/payment-info', methods=['GET'])
def get_payment_info():
    """Get payment information for frontend"""
    return jsonify({
        'payment_system': 'patreon',
        'patreon_url': 'https://www.patreon.com/your-campaign',  # Replace with your Patreon URL
        'tiers': [
            {
                'name': 'Basic Supporter',
                'price': '$5/month',
                'benefits': ['Unlimited simulations', 'Basic features']
            },
            {
                'name': 'Premium Supporter', 
                'price': '$10/month',
                'benefits': ['Unlimited simulations', 'Advanced features', 'Priority support']
            }
        ]
    })

# Client management endpoints
@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients for a user"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    clients = get_user_clients(user_id)
    return jsonify(clients)

@app.route('/api/clients', methods=['POST'])
def create_client_endpoint():
    """Create a new client"""
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    client_data = request.json.get('client_data', {})
    if not client_data.get('name') or not client_data.get('age'):
        return jsonify({'error': 'Name and age are required'}), 400
    
    client = create_client(user_id, client_data)
    return jsonify(client), 201

@app.route('/api/clients/<client_id>', methods=['PUT'])
def update_client_endpoint(client_id):
    """Update an existing client"""
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    client_data = request.json.get('client_data', {})
    if not client_data.get('name') or not client_data.get('age'):
        return jsonify({'error': 'Name and age are required'}), 400
    
    client = update_client(user_id, client_id, client_data)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    return jsonify(client)

@app.route('/api/clients/<client_id>', methods=['DELETE'])
def delete_client_endpoint(client_id):
    """Delete a client and all associated simulations"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    success = delete_client(user_id, client_id)
    if not success:
        return jsonify({'error': 'Client not found'}), 404
    
    return jsonify({'message': 'Client deleted successfully'})

@app.route('/api/clients/<client_id>/simulations', methods=['GET'])
def get_client_simulations_endpoint(client_id):
    """Get all simulations for a specific client"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    simulations = get_client_simulations(user_id, client_id)
    return jsonify(simulations)

@app.route('/api/clients/<client_id>/simulations', methods=['POST'])
def save_simulation_to_client_endpoint(client_id):
    """Saves a new simulation to a specific client."""
    data = request.json
    user_id = data.get('user_id')
    simulation_data = data.get('simulation_data')
    simulation_type = data.get('type', 'basic')

    if not user_id or not simulation_data:
        return jsonify({'error': 'User ID and simulation data are required'}), 400
    
    # Check if client can have more simulations
    if not can_client_have_more_simulations(user_id, client_id):
        return jsonify({'error': 'Client has reached the maximum number of simulations (5)'}), 400

    saved_simulation = save_simulation(user_id, client_id, simulation_data, simulation_type)
    
    return jsonify(saved_simulation), 201

@app.route('/api/clients/<client_id>/simulations/<simulation_id>', methods=['DELETE'])
def delete_simulation_endpoint(client_id, simulation_id):
    """Delete a specific simulation for a client"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    # Check if client exists
    clients = get_user_clients(user_id)
    client = next((c for c in clients if c['id'] == client_id), None)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Check if simulation exists and belongs to this client
    simulations = get_client_simulations(user_id, client_id)
    simulation = next((s for s in simulations if s['id'] == simulation_id), None)
    if not simulation:
        return jsonify({'error': 'Simulation not found'}), 404
    
    # Delete the simulation
    if user_id in simulation_storage:
        simulation_storage[user_id] = [s for s in simulation_storage[user_id] if s['id'] != simulation_id]
    
    return jsonify({'message': 'Simulation deleted successfully'})

@app.route('/api/clients/<client_id>/report', methods=['POST'])
def generate_report(client_id):
    """Generate a consolidated PDF report for a client."""
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Get client data
    clients = get_user_clients(user_id)
    client = next((c for c in clients if c['id'] == client_id), None)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Get ALL simulations for the client
    all_simulations = get_client_simulations(user_id, client_id)
    if not all_simulations:
        return jsonify({'error': 'No simulations found for this client to generate a report.'}), 404

    # Filter to only the most recent simulation of each type
    basic_simulations = [s for s in all_simulations if s['type'] == 'basic']
    monte_carlo_simulations = [s for s in all_simulations if s['type'] == 'monte_carlo']
    
    # Get the most recent of each type
    most_recent_simulations = []
    
    if basic_simulations:
        most_recent_basic = max(basic_simulations, key=lambda x: x['created_at'])
        most_recent_simulations.append(most_recent_basic)
    
    if monte_carlo_simulations:
        most_recent_mc = max(monte_carlo_simulations, key=lambda x: x['created_at'])
        most_recent_simulations.append(most_recent_mc)

    try:
        print(f"Generating report for client {client_id} with {len(most_recent_simulations)} most recent simulations")
        
        # Generate PDF report with only the most recent simulations
        pdf_buffer = generate_retirement_report(
            client_data=client,
            simulations=most_recent_simulations
        )
        
        # Return the PDF file
        pdf_buffer.seek(0)
        filename = f'retirement_report_{client["name"].replace(" ", "_")}.pdf'
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"Error generating report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to generate consolidated report: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
