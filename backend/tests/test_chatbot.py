import pytest
import os
import tempfile
import shutil
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app import app

client = TestClient(app)

@pytest.fixture
def temp_upload_dir():
    """Create a temporary directory for test uploads"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
def mock_diebot_modules():
    """Mock DieBot modules to avoid actual LLM calls during testing"""
    with patch('api.chatbot.generate_diet_plan_with_gemini') as mock_gemini, \
         patch('api.chatbot.KnowledgeBaseRetriever') as mock_retriever, \
         patch('api.chatbot.process_pdf_to_faiss') as mock_process_pdf, \
         patch('api.chatbot.extract_and_parse') as mock_ocr:
        
        # Mock Gemini response
        mock_gemini.return_value = "This is a test diet plan response."
        
        # Mock retriever
        mock_retriever_instance = MagicMock()
        mock_retriever_instance.retrieve.return_value = [
            {
                'chunk': 'Test chunk content',
                'source': 'test_document.pdf',
                'score': 0.8
            }
        ]
        mock_retriever.return_value = mock_retriever_instance
        
        # Mock PDF processing
        mock_process_pdf.return_value = None
        
        # Mock OCR
        mock_ocr.return_value = {
            'glucose': [120],
            'bp': ['120/80'],
            'cholesterol': [200]
        }
        
        yield {
            'gemini': mock_gemini,
            'retriever': mock_retriever,
            'process_pdf': mock_process_pdf,
            'ocr': mock_ocr
        }

def test_create_session_without_files(mock_diebot_modules):
    """Test creating a chat session without file uploads"""
    response = client.post(
        "/api/chat/session",
        data={
            "user_name": "Test User",
            "user_age": "30",
            "user_gender": "male",
            "user_contact": "test@example.com",
            "symptoms_summary": "Test symptoms"
        }
    )
    
    assert response.status_code == 202
    data = response.json()
    assert "session_id" in data
    assert data["status"] == "session_created"

def test_create_session_with_files(mock_diebot_modules, temp_upload_dir):
    """Test creating a chat session with file uploads"""
    # Create a test PDF file
    test_pdf_path = os.path.join(temp_upload_dir, "test.pdf")
    with open(test_pdf_path, "w") as f:
        f.write("Test PDF content")
    
    with open(test_pdf_path, "rb") as f:
        response = client.post(
            "/api/chat/session",
            data={
                "user_name": "Test User",
                "user_age": "30",
                "user_gender": "male",
                "user_contact": "test@example.com",
                "symptoms_summary": "Test symptoms"
            },
            files=[("files", ("test.pdf", f, "application/pdf"))]
        )
    
    assert response.status_code == 202
    data = response.json()
    assert "session_id" in data
    assert data["status"] == "ingestion_started"

def test_ingest_status_endpoint(mock_diebot_modules):
    """Test the ingest status endpoint"""
    # First create a session
    response = client.post(
        "/api/chat/session",
        data={"user_name": "Test User"}
    )
    session_id = response.json()["session_id"]
    
    # Check ingest status
    response = client.get(f"/api/chat/session/{session_id}/ingest-status")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "status" in data
    assert data["session_id"] == session_id

def test_send_message_endpoint(mock_diebot_modules):
    """Test sending a message to the chatbot"""
    # First create a session
    response = client.post(
        "/api/chat/session",
        data={"user_name": "Test User"}
    )
    session_id = response.json()["session_id"]
    
    # Send a message
    response = client.post(
        f"/api/chat/{session_id}/message",
        json={
            "message": "What should I eat for breakfast?",
            "chat_history": [],
            "settings": {}
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message_id" in data
    assert "response" in data
    assert "sources" in data
    assert "meta" in data

def test_chat_history_endpoint(mock_diebot_modules):
    """Test retrieving chat history"""
    # First create a session and send a message
    response = client.post(
        "/api/chat/session",
        data={"user_name": "Test User"}
    )
    session_id = response.json()["session_id"]
    
    # Send a message to create history
    client.post(
        f"/api/chat/{session_id}/message",
        json={
            "message": "Test message",
            "chat_history": [],
            "settings": {}
        }
    )
    
    # Get chat history
    response = client.get(f"/api/chat/{session_id}/history")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "chat_history" in data
    assert "user_data" in data

def test_upload_additional_files(mock_diebot_modules, temp_upload_dir):
    """Test uploading additional files to an existing session"""
    # First create a session
    response = client.post(
        "/api/chat/session",
        data={"user_name": "Test User"}
    )
    session_id = response.json()["session_id"]
    
    # Create a test file
    test_file_path = os.path.join(temp_upload_dir, "additional.pdf")
    with open(test_file_path, "w") as f:
        f.write("Additional test content")
    
    # Upload additional file
    with open(test_file_path, "rb") as f:
        response = client.post(
            f"/api/chat/{session_id}/upload",
            files=[("files", ("additional.pdf", f, "application/pdf"))]
        )
    
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "additional_ingestion_started"

def test_feedback_endpoint(mock_diebot_modules):
    """Test submitting feedback"""
    # First create a session
    response = client.post(
        "/api/chat/session",
        data={"user_name": "Test User"}
    )
    session_id = response.json()["session_id"]
    
    # Submit feedback
    response = client.post(
        f"/api/chat/{session_id}/feedback",
        json={"feedback": "Great service!"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

def test_invalid_session_id():
    """Test endpoints with invalid session ID"""
    invalid_session_id = "invalid-uuid"
    
    # Test ingest status
    response = client.get(f"/api/chat/session/{invalid_session_id}/ingest-status")
    assert response.status_code == 404
    
    # Test send message
    response = client.post(
        f"/api/chat/{invalid_session_id}/message",
        json={"message": "Test", "chat_history": [], "settings": {}}
    )
    assert response.status_code == 404
    
    # Test chat history
    response = client.get(f"/api/chat/{invalid_session_id}/history")
    assert response.status_code == 404

def test_file_validation():
    """Test file upload validation"""
    # Create a test file with invalid type
    test_file_path = tempfile.mktemp(suffix=".txt")
    with open(test_file_path, "w") as f:
        f.write("Test content")
    
    try:
        with open(test_file_path, "rb") as f:
            response = client.post(
                "/api/chat/session",
                data={"user_name": "Test User"},
                files=[("files", ("test.txt", f, "text/plain"))]
            )
        
        assert response.status_code == 400
        data = response.json()
        assert "Invalid file" in data["detail"]
    finally:
        os.remove(test_file_path)

def test_missing_required_fields():
    """Test session creation with missing required fields"""
    response = client.post(
        "/api/chat/session",
        data={}  # Missing user_name
    )
    
    assert response.status_code == 422  # Validation error

if __name__ == "__main__":
    pytest.main([__file__])
