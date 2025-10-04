#!/usr/bin/env python3
"""
Test script for payment workflow
Tests the Patreon integration endpoints
"""

import requests
import json

# Configuration
BACKEND_URL = "https://retirement-simulator-backend.onrender.com"
FRONTEND_URL = "https://retirement-sim-frontend.onrender.com"

def test_backend_health():
    """Test if backend is accessible"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def test_payment_info():
    """Test payment info endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/payment-info", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Payment info endpoint working")
            print(f"   Payment system: {data.get('payment_system')}")
            print(f"   Patreon URL: {data.get('patreon_url')}")
            print(f"   Tiers: {len(data.get('tiers', []))}")
            return True
        else:
            print(f"❌ Payment info endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Payment info endpoint error: {e}")
        return False

def test_patreon_auth_url():
    """Test Patreon auth URL endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/patreon/auth-url", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Patreon auth URL endpoint working")
            print(f"   Auth URL: {data.get('auth_url', 'Not found')[:50]}...")
            return True
        else:
            print(f"❌ Patreon auth URL endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Patreon auth URL endpoint error: {e}")
        return False

def test_user_credits():
    """Test user credits endpoint"""
    try:
        # Test with a dummy user ID
        test_user_id = "test_user_123"
        response = requests.get(f"{BACKEND_URL}/api/user-credits?user_id={test_user_id}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ User credits endpoint working")
            print(f"   Credits: {data.get('credits')}")
            print(f"   Patreon member: {data.get('patreon_member')}")
            return True
        else:
            print(f"❌ User credits endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ User credits endpoint error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Payment Workflow")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Payment Info", test_payment_info),
        ("Patreon Auth URL", test_patreon_auth_url),
        ("User Credits", test_user_credits),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Payment workflow is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the issues above.")
    
    print(f"\n🌐 Frontend URL: {FRONTEND_URL}")
    print(f"🔧 Backend URL: {BACKEND_URL}")

if __name__ == "__main__":
    main()
