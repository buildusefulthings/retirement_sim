from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from simulator import simulation, monte_carlo_retirement, find_optimal_retirement_year
import stripe
import os
from dotenv import load_dotenv
# import firebase_admin
# from firebase_admin import credentials, firestore
# from datetime import datetime, timedelta
from report_generator import generate_retirement_report
import io

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

# Initialize Stripe with environment variable
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# User credit/subscription management (temporarily simplified)
# In-memory storage for testing (will be replaced with Firebase)
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
            'unlimited': False
        }
    return user_credits_storage[user_id]

def update_user_credits(user_id, credits_to_add=0, subscription_status='none', unlimited=False):
    """Update user's credits and subscription status"""
    if user_id not in user_credits_storage:
        user_credits_storage[user_id] = {
            'credits': 0,
            'subscription_status': 'none',
            'unlimited': False
        }
    
    if credits_to_add > 0:
        user_credits_storage[user_id]['credits'] += credits_to_add
        print(f"Added {credits_to_add} credits to user {user_id}. New total: {user_credits_storage[user_id]['credits']}")
    
    if subscription_status != 'none':
        user_credits_storage[user_id]['subscription_status'] = subscription_status
        user_credits_storage[user_id]['unlimited'] = unlimited
        print(f"Updated user {user_id} subscription status to {subscription_status}")
    
    return True

def can_user_run_simulation(user_id):
    """Check if user can run a simulation"""
    user_data = get_user_credits(user_id)
    
    if user_data['unlimited']:
        return True
    
    if user_data['subscription_status'] == 'active':
        return True
    
    return user_data['credits'] > 0

def deduct_user_credit(user_id):
    """Deduct one credit from user"""
    if user_id not in user_credits_storage:
        return False
    
    user_data = user_credits_storage[user_id]
    
    if user_data['unlimited'] or user_data['subscription_status'] == 'active':
        print(f"User {user_id} has unlimited/subscription - no credit deduction")
        return True  # No deduction for unlimited/subscription
    
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
        'date_created': client_data.get('date_created', ''),
        'user_id': user_id,
        'created_at': '2025-06-22'  # For testing, use current date
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
        'created_at': '2025-06-22',  # For testing
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
    client_id = data.get('client_id')  # Optional: if provided, save to client
    
    # Check if user can run simulation
    if user_id and not can_user_run_simulation(user_id):
        return jsonify({'error': 'No credits remaining. Please purchase more credits or subscribe.'}), 402
    
    # If client_id provided, check if client can have more simulations
    if user_id and client_id and not can_client_have_more_simulations(user_id, client_id):
        return jsonify({'error': 'Client has reached maximum number of simulations (5)'}), 400
    
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
    
    # Save simulation to client if client_id provided
    # if user_id and client_id:
    #     simulation_data = {
    #         'parameters': data,
    #         'results': result,
    #         'type': 'basic'
    #     }
    #     save_simulation(user_id, client_id, simulation_data, 'basic')
    
    # Deduct credit if user is logged in
    if user_id:
        deduct_user_credit(user_id)
    
    return jsonify(result)

@app.route('/api/monte-carlo', methods=['POST'])
def api_monte_carlo():
    data = request.json
    user_id = data.get('user_id')
    client_id = data.get('client_id')  # Optional: if provided, save to client
    
    # Check if user can run simulation
    if user_id and not can_user_run_simulation(user_id):
        return jsonify({'error': 'No credits remaining. Please purchase more credits or subscribe.'}), 402
    
    # If client_id provided, check if client can have more simulations
    if user_id and client_id and not can_client_have_more_simulations(user_id, client_id):
        return jsonify({'error': 'Client has reached maximum number of simulations (5)'}), 400
    
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
    
    # Save simulation to client if client_id provided
    # if user_id and client_id:
    #     simulation_data = {
    #         'parameters': data,
    #         'results': {'success_rates': result.tolist()},
    #         'type': 'monte_carlo'
    #     }
    #     save_simulation(user_id, client_id, simulation_data, 'monte_carlo')
    
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

# Stripe payment endpoints
@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        plan_type = data.get('plan_type')
        user_id = data.get('user_id')
        coupon_code = data.get('coupon_code', '').strip()
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Handle coupon code redemption
        if plan_type == 'coupon' or coupon_code:
            if coupon_code.lower() == 'friends&fam':
                # Grant 100 credits for the coupon
                update_user_credits(user_id, credits_to_add=100)
                print(f"Coupon 'friends&fam' redeemed for user {user_id} - 100 credits added")
                return jsonify({
                    'coupon_redeemed': True,
                    'message': 'Coupon applied successfully! 100 credits have been added to your account.'
                })
            else:
                return jsonify({'error': 'Invalid coupon code'}), 400
        
        # Normal payment flow
        if plan_type == 'credits_5':
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': '5 Simulation Credits',
                        },
                        'unit_amount': 500,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/payment-cancelled',
                metadata={'user_id': user_id, 'plan_type': plan_type}
            )
        elif plan_type == 'credits_15':
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': '15 Simulation Credits',
                        },
                        'unit_amount': 1000,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/payment-cancelled',
                metadata={'user_id': user_id, 'plan_type': plan_type}
            )
        elif plan_type == 'unlimited':
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'Unlimited Simulations',
                        },
                        'unit_amount': 2000,
                        'recurring': {
                            'interval': 'month',
                        },
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url='http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/payment-cancelled',
                metadata={'user_id': user_id, 'plan_type': plan_type}
            )
        else:
            return jsonify({'error': 'Invalid plan type'}), 400
            
        return jsonify({'sessionId': session.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/webhook', methods=['POST'])
def webhook():
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, 'whsec_YOUR_WEBHOOK_SECRET'
        )
    except ValueError as e:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.metadata.get('user_id')
        plan_type = session.metadata.get('plan_type')
        
        if user_id and plan_type:
            if plan_type == 'credits_5':
                update_user_credits(user_id, credits_to_add=5)
            elif plan_type == 'credits_15':
                update_user_credits(user_id, credits_to_add=15)
            elif plan_type == 'unlimited':
                update_user_credits(user_id, subscription_status='active', unlimited=True)
            
            print(f"Payment completed for user {user_id}, plan: {plan_type}")
    
    return jsonify({'status': 'success'})

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

    try:
        # Generate PDF report
        pdf_buffer = generate_retirement_report(
            client_data=client,
            simulations=all_simulations
        )
        
        # Return the PDF file
        pdf_buffer.seek(0)
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'retirement_report_{client["name"]}.pdf'
        )
        
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({'error': 'Failed to generate consolidated report'}), 500

if __name__ == '__main__':
    app.run(debug=True)
