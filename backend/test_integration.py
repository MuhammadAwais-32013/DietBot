#!/usr/bin/env python3
"""
Simple integration test for the DieBot API integration.
Run this script to test the basic functionality.
"""

import requests
import json
import time
import os
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/chat"

def test_health_check():
    """Test if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print("✅ Server is running")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running. Please start the FastAPI server first.")
        return False

def test_create_session():
    """Test creating a chat session"""
    print("\n🧪 Testing session creation...")
    
    data = {
        "user_name": "Test User",
        "user_age": "30",
        "user_gender": "male",
        "user_contact": "test@example.com",
        "symptoms_summary": "Diabetes type 2, hypertension"
    }
    
    try:
        response = requests.post(f"{API_BASE}/session", data=data)
        if response.status_code == 202:
            result = response.json()
            print(f"✅ Session created successfully")
            print(f"   Session ID: {result['session_id']}")
            print(f"   Status: {result['status']}")
            return result['session_id']
        else:
            print(f"❌ Failed to create session: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        return None

def test_ingest_status(session_id):
    """Test checking ingest status"""
    print(f"\n🧪 Testing ingest status for session {session_id}...")
    
    try:
        response = requests.get(f"{API_BASE}/session/{session_id}/ingest-status")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Ingest status retrieved")
            print(f"   Status: {result['status']}")
            print(f"   Detail: {result.get('detail', 'N/A')}")
            return result
        else:
            print(f"❌ Failed to get ingest status: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting ingest status: {e}")
        return None

def test_send_message(session_id):
    """Test sending a message to the chatbot"""
    print(f"\n🧪 Testing message sending for session {session_id}...")
    
    data = {
        "message": "What should I eat for breakfast if I have diabetes?",
        "chat_history": [],
        "settings": {}
    }
    
    try:
        response = requests.post(f"{API_BASE}/{session_id}/message", json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Message sent successfully")
            print(f"   Message ID: {result['message_id']}")
            print(f"   Response: {result['response'][:100]}...")
            print(f"   Sources: {len(result['sources'])} sources found")
            return result
        else:
            print(f"❌ Failed to send message: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return None

def test_chat_history(session_id):
    """Test retrieving chat history"""
    print(f"\n🧪 Testing chat history for session {session_id}...")
    
    try:
        response = requests.get(f"{API_BASE}/{session_id}/history")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Chat history retrieved")
            print(f"   User: {result['user_data']['name']}")
            print(f"   Messages: {len(result['chat_history'])}")
            return result
        else:
            print(f"❌ Failed to get chat history: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting chat history: {e}")
        return None

def test_feedback(session_id):
    """Test submitting feedback"""
    print(f"\n🧪 Testing feedback submission for session {session_id}...")
    
    data = {
        "feedback": "Great service! The AI provided helpful dietary advice."
    }
    
    try:
        response = requests.post(f"{API_BASE}/{session_id}/feedback", json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Feedback submitted successfully")
            print(f"   Message: {result['message']}")
            return result
        else:
            print(f"❌ Failed to submit feedback: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error submitting feedback: {e}")
        return None

def main():
    """Run all integration tests"""
    print("🚀 Starting DieBot API Integration Tests")
    print("=" * 50)
    
    # Check if server is running
    if not test_health_check():
        return
    
    # Test session creation
    session_id = test_create_session()
    if not session_id:
        print("❌ Cannot continue without a valid session")
        return
    
    # Test ingest status
    test_ingest_status(session_id)
    
    # Wait a moment for any background processing
    time.sleep(2)
    
    # Test sending a message
    test_send_message(session_id)
    
    # Test chat history
    test_chat_history(session_id)
    
    # Test feedback
    test_feedback(session_id)
    
    print("\n" + "=" * 50)
    print("🎉 Integration tests completed!")
    print(f"📝 Session ID for manual testing: {session_id}")
    print(f"🌐 API Documentation: {BASE_URL}/docs")
    print(f"💬 Chat Interface: http://localhost:3000/chat")

if __name__ == "__main__":
    main()
