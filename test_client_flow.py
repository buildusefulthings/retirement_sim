#!/usr/bin/env python3
"""
Test script to verify client creation and simulation flow
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_client_flow():
    """Test the complete client creation and simulation flow"""
    
    # Test user ID (you can change this)
    test_user_id = "test_user_123"
    
    print("🧪 Testing Client Creation and Simulation Flow")
    print("=" * 50)
    
    # 1. Test client creation
    print("\n1. Creating a test client...")
    client_data = {
        "user_id": test_user_id,
        "client_data": {
            "name": "John Doe",
            "age": 45,
            "date_created": "2025-01-15"
        }
    }
    
    response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        client = response.json()
        print(f"✅ Client created: {client['name']} (ID: {client['id']})")
        client_id = client['id']
    else:
        print(f"❌ Failed to create client: {response.text}")
        return
    
    # 2. Test getting clients
    print("\n2. Getting user clients...")
    response = requests.get(f"{BASE_URL}/api/clients?user_id={test_user_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        clients = response.json()
        print(f"✅ Found {len(clients)} clients")
        for client in clients:
            print(f"   - {client['name']} (ID: {client['id']})")
    else:
        print(f"❌ Failed to get clients: {response.text}")
    
    # 3. Test simulation with client
    print("\n3. Running simulation with client...")
    simulation_data = {
        "user_id": test_user_id,
        "client_id": client_id,
        "balance": 1000000,
        "apy": 0.07,
        "draw": 0.04,
        "duration": 30,
        "curr_exp": 50000,
        "tax_rate": 0.22,
        "inflation": 0.025
    }
    
    response = requests.post(f"{BASE_URL}/api/simulate", json=simulation_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Simulation successful! Generated {len(result)} years of data")
    else:
        print(f"❌ Failed to run simulation: {response.text}")
    
    # 4. Test getting client simulations
    print("\n4. Getting client simulations...")
    response = requests.get(f"{BASE_URL}/api/clients/{client_id}/simulations?user_id={test_user_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        simulations = response.json()
        print(f"✅ Found {len(simulations)} simulations for client")
        for sim in simulations:
            print(f"   - {sim['type']} simulation (ID: {sim['id']})")
    else:
        print(f"❌ Failed to get simulations: {response.text}")
    
    # 5. Test report generation
    if response.status_code == 200 and simulations:
        print("\n5. Testing report generation...")
        report_data = {
            "user_id": test_user_id,
            "client_id": client_id,
            "simulation_id": simulations[0]['id']
        }
        
        response = requests.post(f"{BASE_URL}/api/generate-report", json=report_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Report generated successfully!")
            print(f"Content-Type: {response.headers.get('content-type', 'unknown')}")
            print(f"Content-Length: {len(response.content)} bytes")
        else:
            print(f"❌ Failed to generate report: {response.text}")
    
    # 6. Test delete simulation
    if response.status_code == 200 and simulations:
        print("\n6. Testing delete simulation...")
        simulation_id = simulations[0]['id']
        
        response = requests.delete(f"{BASE_URL}/api/clients/{client_id}/simulations/{simulation_id}?user_id={test_user_id}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Simulation deleted successfully!")
            
            # Verify simulation was deleted
            response = requests.get(f"{BASE_URL}/api/clients/{client_id}/simulations?user_id={test_user_id}")
            if response.status_code == 200:
                remaining_simulations = response.json()
                print(f"✅ Verification: {len(remaining_simulations)} simulations remaining")
        else:
            print(f"❌ Failed to delete simulation: {response.text}")
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")

if __name__ == "__main__":
    try:
        test_client_flow()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}") 