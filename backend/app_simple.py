#!/usr/bin/env python3
"""
Simplified FastAPI app for testing without fastapi_sqlalchemy
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import sqlite3
from datetime import datetime

# Pydantic models
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

app = FastAPI(title="Diet Consultant API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'diet_consultant.db')

def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create other tables as needed
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bmi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            height REAL NOT NULL,
            weight REAL NOT NULL,
            bmi REAL NOT NULL,
            category TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "Diet Consultant API is running!"}

@app.get("/docs")
async def docs():
    return {"message": "API documentation available at /docs"}

@app.post("/api/auth/signup")
async def signup(data: SignupRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM user WHERE email = ?", (data.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password (simple hash for testing - use bcrypt in production)
        hashed_password = data.password  # In production: bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert new user
        cursor.execute(
            "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
            (data.name, data.email, hashed_password)
        )
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return JSONResponse(
            status_code=201,
            content={"success": True, "message": "User registered successfully", "user_id": user_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/api/auth/login")
async def login(data: LoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute("SELECT id, name, password FROM user WHERE email = ?", (data.email,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check password (simple check for testing - use bcrypt in production)
        if user['password'] != data.password:  # In production: bcrypt.checkpw(data.password.encode('utf-8'), user['password'].encode('utf-8'))
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        return JSONResponse(
            status_code=200,
            content={"success": True, "name": user['name'], "id": user['id']}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get("/api/users")
async def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, email, created_at FROM user")
        users = cursor.fetchall()
        conn.close()
        
        return {
            "success": True,
            "users": [
                {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user['email'],
                    "created_at": user['created_at']
                }
                for user in users
            ]
        }
        
    except Exception as e:
        print(f"Get users error: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting simplified FastAPI server...")
    print(f"Database path: {DB_PATH}")
    uvicorn.run(app, host="127.0.0.1", port=8000)
