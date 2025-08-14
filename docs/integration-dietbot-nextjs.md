# DieBot Integration with Next.js and FastAPI

This document describes the integration of the existing DieBot RAG chatbot into the Next.js + FastAPI web application.

## Overview

The integration replaces the Streamlit UI with a modern Next.js chat interface while preserving all existing DieBot functionality. The chatbot logic remains unchanged - we only create wrapper code that calls the existing functions.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   DieBot        │
│   Frontend      │◄──►│   Backend       │◄──►│   Core Logic    │
│                 │    │                 │    │                 │
│ - Chat UI       │    │ - API Endpoints │    │ - RAG Engine    │
│ - File Upload   │    │ - WebSocket     │    │ - LLM Calls     │
│ - Session Mgmt  │    │ - Background    │    │ - Knowledge     │
│                 │    │   Tasks         │    │   Base          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Features

- **Session Management**: UUID-based session isolation with per-session file storage
- **File Upload**: Support for PDF, PNG, JPG files with size validation (25MB max)
- **Background Processing**: Asynchronous file ingestion using FastAPI background tasks
- **Real-time Chat**: WebSocket-based streaming responses with fallback to HTTP
- **RAG Integration**: Leverages existing DieBot knowledge base and retrieval system
- **Chat History**: Persistent conversation history with source attribution

## File Structure

```
S_FYP/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── chatbot.py          # FastAPI chatbot endpoints
│   ├── DieBot/                 # Existing chatbot (unchanged)
│   │   ├── app.py
│   │   ├── retriever.py
│   │   ├── gemini_llm.py
│   │   ├── knowledge_base.py
│   │   ├── batch_ingest.py
│   │   ├── ocr_parser.py
│   │   └── data/
│   │       ├── uploads/        # Session-specific uploads
│   │       └── sessions/       # Session metadata
│   ├── tests/
│   │   └── test_chatbot.py     # Integration tests
│   └── app.py                  # Updated main FastAPI app
├── pages/
│   └── chat.js                 # Next.js chat interface
└── docs/
    └── integration-dietbot-nextjs.md
```

## API Endpoints

### Session Management

#### POST `/api/chat/session`
Creates a new chat session with optional file uploads.

**Request:**
```http
POST /api/chat/session
Content-Type: multipart/form-data

user_name: "John Doe"
user_age: "30"
user_gender: "male"
user_contact: "john@example.com"
symptoms_summary: "Diabetes type 2, hypertension"
files: [file1.pdf, file2.jpg]
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "ingest_task": "uuid-string",
  "status": "ingestion_started"
}
```

#### GET `/api/chat/session/{session_id}/ingest-status`
Returns the status of file ingestion.

**Response:**
```json
{
  "session_id": "uuid-string",
  "status": "completed",
  "detail": "Successfully processed 2 files",
  "percent": 100
}
```

### Chat Interface

#### POST `/api/chat/{session_id}/message`
Sends a message to the chatbot (non-streaming).

**Request:**
```json
{
  "message": "What should I eat for breakfast?",
  "chat_history": [],
  "settings": {}
}
```

**Response:**
```json
{
  "message_id": "uuid-string",
  "response": "Based on your medical profile...",
  "sources": [
    {
      "source": "diabetes_guidelines.pdf",
      "excerpt": "For patients with diabetes...",
      "score": 0.85
    }
  ],
  "meta": {
    "session_id": "uuid-string",
    "user_data": {...}
  }
}
```

#### WebSocket `/ws/chat/{session_id}`
Real-time streaming chat interface.

**Client → Server:**
```json
{
  "type": "message",
  "message": "What should I eat for breakfast?"
}
```

**Server → Client (streaming):**
```json
{"type": "token", "content": "Based on your"}
{"type": "token", "content": " medical profile..."}
{"type": "done", "message_id": "uuid", "response": "full response", "sources": [...]}
```

### Additional Features

#### POST `/api/chat/{session_id}/upload`
Upload additional files to an existing session.

#### GET `/api/chat/{session_id}/history`
Retrieve conversation history.

#### POST `/api/chat/{session_id}/feedback`
Submit user feedback.

## Frontend Implementation

### Chat Flow

1. **User Details Form**: Collect patient information and optional file uploads
2. **Ingestion Status**: Show progress while processing uploaded documents
3. **Chat Interface**: Real-time conversation with streaming responses

### Key Components

- **File Upload**: Drag-and-drop interface with validation
- **Progress Tracking**: Real-time ingestion status updates
- **WebSocket Connection**: Automatic reconnection and fallback
- **Message Streaming**: Token-by-token response display
- **Source Attribution**: Display relevant document excerpts

## Configuration

### Environment Variables

```bash
# Backend (.env)
GEMINI_API_KEY=your_gemini_api_key
MAX_UPLOAD_SIZE_MB=25
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend (next.config.js)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### File Upload Settings

- **Allowed Types**: PDF, PNG, JPG, JPEG
- **Max Size**: 25MB per file (configurable)
- **Storage**: `backend/DieBot/data/uploads/{session_id}/`

## Running the Application

### Prerequisites

1. Python 3.8+ with required packages
2. Node.js 16+ with npm/yarn
3. Gemini API key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
pip install -r DieBot/requirements.txt

# Set environment variables
export GEMINI_API_KEY=your_api_key

# Run FastAPI server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Testing

```bash
cd backend
pytest tests/test_chatbot.py -v
```

## Security Considerations

- **File Validation**: MIME type and size validation
- **Session Isolation**: UUID-based session separation
- **CORS Configuration**: Restricted to Next.js origins
- **Input Sanitization**: Filename sanitization for safe storage

## Performance Optimizations

- **Background Processing**: File ingestion doesn't block chat
- **Caching**: Session data cached in memory
- **Streaming**: Real-time response streaming
- **Fallback**: HTTP API fallback for WebSocket failures

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if FastAPI server is running on port 8000
   - Verify CORS configuration
   - Check browser console for errors

2. **File Upload Fails**
   - Verify file type and size
   - Check disk space in upload directory
   - Review server logs for errors

3. **LLM Response Errors**
   - Verify Gemini API key is set
   - Check API quota and limits
   - Review DieBot configuration

### Debug Mode

Enable debug logging by setting:
```bash
export LOG_LEVEL=DEBUG
```

## Development Guidelines

### Adding New Features

1. **Backend**: Add endpoints to `backend/api/chatbot.py`
2. **Frontend**: Update `pages/chat.js` with new UI components
3. **Testing**: Add corresponding tests in `backend/tests/test_chatbot.py`

### Code Style

- Follow existing FastAPI and Next.js conventions
- Use type hints in Python code
- Maintain consistent error handling
- Add comprehensive docstrings

### Testing Strategy

- Unit tests for individual functions
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Mock external dependencies (LLM, file system)

## Deployment

### Production Considerations

1. **WebSocket**: Use proper WebSocket proxy (Nginx)
2. **File Storage**: Consider cloud storage for uploads
3. **Background Tasks**: Use Celery or similar for heavy processing
4. **Monitoring**: Add logging and metrics
5. **Security**: Implement proper authentication and authorization

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Future Enhancements

- **Authentication**: User login and session management
- **Multi-language**: Internationalization support
- **Advanced RAG**: Enhanced retrieval and ranking
- **Analytics**: Usage tracking and insights
- **Mobile App**: React Native companion app

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Run tests to verify functionality
4. Create an issue with detailed error information
