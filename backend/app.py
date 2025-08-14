import os
from fastapi import FastAPI, Request, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from models import User, BMI, DietPlan, MedicalRecord
import bcrypt
import json
import csv
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi_sqlalchemy import DBSessionMiddleware, db as fastapi_db
from pydantic import BaseModel
from typing import List, Optional, Any

# Import chatbot router
from api.chatbot import router as chatbot_router

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure instance folder exists
if not os.path.exists(os.path.join(os.path.dirname(__file__), 'instance')):
    os.makedirs(os.path.join(os.path.dirname(__file__), 'instance'))

# Create exports directory if it doesn't exist
export_dir = os.path.join(os.path.dirname(__file__), 'exports')
if not os.path.exists(export_dir):
    os.makedirs(export_dir)

# Database configuration - use explicit path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'diet_consultant.db')
print(f"Using database at: {db_path}")
app.add_middleware(DBSessionMiddleware, db_url=f'sqlite:///{db_path}')

# Helper functions for CSV export
def export_user_to_csv(user):
    filename = os.path.join(export_dir, 'users.csv')
    file_exists = os.path.isfile(filename)
    with open(filename, 'a', newline='') as csvfile:
        fieldnames = ['id', 'name', 'email', 'created_at']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'created_at': user.created_at.isoformat()
        })
    print(f"Exported user {user.id} to CSV")

def export_bmi_to_csv(bmi):
    filename = os.path.join(export_dir, 'bmi_records.csv')
    file_exists = os.path.isfile(filename)
    with open(filename, 'a', newline='') as csvfile:
        fieldnames = ['id', 'user_id', 'height', 'weight', 'bmi', 'category', 'timestamp']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'id': bmi.id,
            'user_id': bmi.user_id,
            'height': bmi.height,
            'weight': bmi.weight,
            'bmi': bmi.bmi,
            'category': bmi.category,
            'timestamp': bmi.timestamp.isoformat()
        })
    print(f"Exported BMI record {bmi.id} to CSV")

def export_diet_plan_to_csv(plan):
    filename = os.path.join(export_dir, 'diet_plans.csv')
    file_exists = os.path.isfile(filename)
    with open(filename, 'a', newline='') as csvfile:
        fieldnames = ['id', 'user_id', 'bmi', 'plan', 'created_at']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'id': plan.id,
            'user_id': plan.user_id,
            'bmi': plan.bmi,
            'plan': plan.plan,
            'created_at': plan.created_at.isoformat()
        })
    print(f"Exported diet plan {plan.id} to CSV")

def export_medical_record_to_csv(record):
    filename = os.path.join(export_dir, 'medical_records.csv')
    file_exists = os.path.isfile(filename)
    with open(filename, 'a', newline='') as csvfile:
        fieldnames = ['id', 'user_id', 'date', 'bp', 'sugar', 'notes', 'created_at']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            'id': record.id,
            'user_id': record.user_id,
            'date': record.date.isoformat(),
            'bp': record.bp,
            'sugar': record.sugar,
            'notes': record.notes,
            'created_at': record.created_at.isoformat()
        })
    print(f"Exported medical record {record.id} to CSV")

# Helper function to get current user ID (stub)
def get_current_user_id():
    return 1

# Pydantic models
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class BMIRequest(BaseModel):
    height: float
    weight: float

class DietPlanRequest(BaseModel):
    bmi: float

class MedicalRecordRequest(BaseModel):
    date: str
    bloodPressure: str
    bloodSugar: float
    notes: Optional[str] = ""

# Authentication endpoints
@app.post('/api/auth/signup')
def signup(data: SignupRequest):
    try:
        if not all([data.name, data.email, data.password]):
            return JSONResponse(status_code=400, content={'success': False, 'error': 'Missing required fields'})
        existing_user = fastapi_db.session.query(User).filter_by(email=data.email).first()
        if existing_user:
            return JSONResponse(status_code=400, content={'success': False, 'error': 'Email already registered'})
        hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt())
        new_user = User(
            name=data.name,
            email=data.email,
            password=hashed_password.decode('utf-8')
        )
        fastapi_db.session.add(new_user)
        fastapi_db.session.commit()
        export_user_to_csv(new_user)
        return JSONResponse(status_code=201, content={'success': True, 'message': 'User registered successfully'})
    except Exception as e:
        fastapi_db.session.rollback()
        return JSONResponse(status_code=500, content={'success': False, 'error': f'Server error: {str(e)}'})

@app.post('/api/auth/login')
def login(data: LoginRequest):
    try:
        user = fastapi_db.session.query(User).filter_by(email=data.email).first()
        if not user:
            return JSONResponse(status_code=401, content={'success': False, 'error': 'Invalid email or password'})
        password_valid = bcrypt.checkpw(data.password.encode('utf-8'), user.password.encode('utf-8'))
        if not password_valid:
            return JSONResponse(status_code=401, content={'success': False, 'error': 'Invalid email or password'})
        return JSONResponse(status_code=200, content={'success': True, 'name': user.name})
    except Exception as e:
        return JSONResponse(status_code=500, content={'success': False, 'error': f'Server error: {str(e)}'})

# BMI endpoint
@app.post('/api/bmi')
def calculate_bmi(data: BMIRequest):
    height = float(data.height)
    weight = float(data.weight)
    bmi = weight / ((height / 100) ** 2)
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25:
        category = "Normal Weight"
    elif bmi < 30:
        category = "Overweight"
    else:
        category = "Obese"
    new_bmi = BMI(
        user_id=get_current_user_id(),
        height=height,
        weight=weight,
        bmi=bmi,
        category=category
    )
    fastapi_db.session.add(new_bmi)
    fastapi_db.session.commit()
    export_bmi_to_csv(new_bmi)
    return JSONResponse(status_code=200, content={'success': True, 'bmi': bmi, 'category': category})

# Diet plan endpoints
@app.get('/api/diet-plan')
def get_diet_plan(bmi: float = Query(...)):
    diet_plan = fastapi_db.session.query(DietPlan).filter_by(
        user_id=get_current_user_id(),
        bmi=bmi
    ).order_by(DietPlan.created_at.desc()).first()
    if diet_plan:
        plan_data = json.loads(diet_plan.plan)
        return JSONResponse(status_code=200, content={'success': True, 'dietPlan': plan_data})
    else:
        return generate_diet_plan_handler(bmi)

@app.post('/api/diet-plan')
def regenerate_diet_plan(data: DietPlanRequest):
    bmi = float(data.bmi)
    return generate_diet_plan_handler(bmi)

def generate_diet_plan_handler(bmi: float):
    if bmi < 18.5:
        plan = {
            'breakfast': [
                'Oatmeal with nuts and fruits',
                'Whole grain toast with avocado and eggs',
                'Protein smoothie with banana and peanut butter'
            ],
            'lunch': [
                'Chicken or tofu wrap with vegetables',
                'Quinoa salad with chickpeas and vegetables',
                'Pasta with meat sauce and side salad'
            ],
            'dinner': [
                'Salmon with sweet potato and vegetables',
                'Lean steak with rice and vegetables',
                'Chicken stir-fry with vegetables and rice'
            ],
            'snacks': [
                'Greek yogurt with honey',
                'Trail mix with nuts and dried fruits',
                'Protein bar',
                'Banana with peanut butter'
            ],
            'tips': [
                'Eat larger portions to gain healthy weight',
                'Focus on protein-rich foods to help build muscle',
                'Include healthy fats like avocados, nuts, and olive oil',
                'Try to eat more frequently throughout the day'
            ]
        }
    elif bmi < 25:
        plan = {
            'breakfast': [
                'Greek yogurt with berries and granola',
                'Whole grain toast with avocado and egg',
                'Oatmeal with fruit and nuts'
            ],
            'lunch': [
                'Grilled chicken salad with mixed greens',
                'Turkey and vegetable wrap',
                'Quinoa bowl with vegetables and lean protein'
            ],
            'dinner': [
                'Baked fish with roasted vegetables',
                'Stir-fried tofu with vegetables and brown rice',
                'Lean meat with sweet potato and broccoli'
            ],
            'snacks': [
                'Apple slices with almond butter',
                'Carrot sticks with hummus',
                'Greek yogurt',
                'Handful of mixed nuts'
            ],
            'tips': [
                'Maintain your balanced diet to stay in the healthy weight range',
                'Stay hydrated with water throughout the day',
                'Include a variety of fruits and vegetables for micronutrients',
                'Moderate portion sizes to maintain your weight'
            ]
        }
    else:
        plan = {
            'breakfast': [
                'Vegetable omelette with whole grain toast',
                'Greek yogurt with berries',
                'Overnight oats with chia seeds and fruit'
            ],
            'lunch': [
                'Large salad with grilled chicken and light dressing',
                'Vegetable soup with a side of lean protein',
                'Lettuce wraps with lean ground turkey'
            ],
            'dinner': [
                'Grilled fish with steamed vegetables',
                'Baked chicken with roasted vegetables',
                'Tofu and vegetable stir-fry with small portion of brown rice'
            ],
            'snacks': [
                'Cucumber slices with hummus',
                'Celery with small amount of nut butter',
                'Small apple',
                'Hard-boiled egg'
            ],
            'tips': [
                'Focus on portion control to reduce calorie intake',
                'Include plenty of vegetables to feel full with fewer calories',
                'Choose lean proteins to support muscle maintenance',
                'Stay hydrated as thirst can sometimes be mistaken for hunger',
                'Reduce processed foods and added sugars'
            ]
        }
    new_plan = DietPlan(
        user_id=get_current_user_id(),
        bmi=bmi,
        plan=json.dumps(plan)
    )
    fastapi_db.session.add(new_plan)
    fastapi_db.session.commit()
    export_diet_plan_to_csv(new_plan)
    return JSONResponse(status_code=200, content={'success': True, 'dietPlan': plan})

# Medical record endpoints
@app.post('/api/records')
def add_medical_record(data: MedicalRecordRequest):
    record_date = datetime.strptime(data.date, '%Y-%m-%d').date()
    new_record = MedicalRecord(
        user_id=get_current_user_id(),
        date=record_date,
        bp=data.bloodPressure,
        sugar=float(data.bloodSugar),
        notes=data.notes or ''
    )
    fastapi_db.session.add(new_record)
    fastapi_db.session.commit()
    export_medical_record_to_csv(new_record)
    return JSONResponse(status_code=201, content={'success': True, 'message': 'Medical record added successfully'})

@app.get('/api/records')
def get_medical_records():
    records = fastapi_db.session.query(MedicalRecord).filter_by(
        user_id=get_current_user_id()
    ).order_by(MedicalRecord.date.desc()).all()
    return JSONResponse(status_code=200, content={'success': True, 'records': [record.to_dict() for record in records]})

# Admin API endpoints
@app.get('/api/admin/users')
def get_users():
    users = fastapi_db.session.query(User).all()
    return JSONResponse(status_code=200, content={'success': True, 'users': [user.to_dict() for user in users]})

@app.get('/api/admin/bmi')
def get_bmi_records(user_id: str = Query('all')):
    if user_id != 'all':
        bmi_records = fastapi_db.session.query(BMI).filter_by(user_id=int(user_id)).order_by(BMI.timestamp.desc()).all()
    else:
        bmi_records = fastapi_db.session.query(BMI).order_by(BMI.timestamp.desc()).all()
    return JSONResponse(status_code=200, content={'success': True, 'bmi_records': [record.to_dict() for record in bmi_records]})

@app.get('/api/admin/diet-plans')
def get_diet_plans(user_id: str = Query('all')):
    if user_id != 'all':
        diet_plans = fastapi_db.session.query(DietPlan).filter_by(user_id=int(user_id)).order_by(DietPlan.created_at.desc()).all()
    else:
        diet_plans = fastapi_db.session.query(DietPlan).order_by(DietPlan.created_at.desc()).all()
    return JSONResponse(status_code=200, content={'success': True, 'diet_plans': [
        {
            'id': plan.id,
            'user_id': plan.user_id,
            'bmi': plan.bmi,
            'created_at': plan.created_at.isoformat(),
            'plan': json.loads(plan.plan)
        }
        for plan in diet_plans
    ]})

@app.get('/api/admin/medical-records')
def get_all_medical_records(user_id: str = Query('all')):
    if user_id != 'all':
        records = fastapi_db.session.query(MedicalRecord).filter_by(user_id=int(user_id)).order_by(MedicalRecord.date.desc()).all()
    else:
        records = fastapi_db.session.query(MedicalRecord).order_by(MedicalRecord.date.desc()).all()
    return JSONResponse(status_code=200, content={'success': True, 'records': [record.to_dict() for record in records]})

# Include chatbot router
app.include_router(chatbot_router)

# Export data endpoint for admin
@app.get('/api/admin/export-data')
def export_all_data():
    try:
        users_csv = os.path.join(export_dir, f'users_full_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        users = fastapi_db.session.query(User).all()
        with open(users_csv, 'w', newline='') as csvfile:
            fieldnames = ['id', 'name', 'email', 'created_at']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for user in users:
                writer.writerow({
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'created_at': user.created_at.isoformat()
                })
        bmi_csv = os.path.join(export_dir, f'bmi_full_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        records = fastapi_db.session.query(BMI).all()
        with open(bmi_csv, 'w', newline='') as csvfile:
            fieldnames = ['id', 'user_id', 'height', 'weight', 'bmi', 'category', 'timestamp']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for record in records:
                writer.writerow({
                    'id': record.id,
                    'user_id': record.user_id,
                    'height': record.height,
                    'weight': record.weight,
                    'bmi': record.bmi,
                    'category': record.category,
                    'timestamp': record.timestamp.isoformat()
                })
        diet_csv = os.path.join(export_dir, f'diet_plans_full_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        plans = fastapi_db.session.query(DietPlan).all()
        with open(diet_csv, 'w', newline='') as csvfile:
            fieldnames = ['id', 'user_id', 'bmi', 'plan', 'created_at']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for plan in plans:
                writer.writerow({
                    'id': plan.id,
                    'user_id': plan.user_id,
                    'bmi': plan.bmi,
                    'plan': plan.plan,
                    'created_at': plan.created_at.isoformat()
                })
        medical_csv = os.path.join(export_dir, f'medical_records_full_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        records = fastapi_db.session.query(MedicalRecord).all()
        with open(medical_csv, 'w', newline='') as csvfile:
            fieldnames = ['id', 'user_id', 'date', 'bp', 'sugar', 'notes', 'created_at']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for record in records:
                writer.writerow({
                    'id': record.id,
                    'user_id': record.user_id,
                    'date': record.date.isoformat(),
                    'bp': record.bp,
                    'sugar': record.sugar,
                    'notes': record.notes,
                    'created_at': record.created_at.isoformat()
                })
        return JSONResponse(status_code=200, content={
            'success': True,
            'message': 'All data exported successfully',
            'files': {
                'users': os.path.basename(users_csv),
                'bmi_records': os.path.basename(bmi_csv),
                'diet_plans': os.path.basename(diet_csv),
                'medical_records': os.path.basename(medical_csv)
            }
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={'success': False, 'error': f'Error exporting data: {str(e)}'})

# Ensure the SQLite database and tables are created if they do not exist (always runs)
from sqlalchemy import create_engine
from models import Base

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'diet_consultant.db')
engine = create_engine(f"sqlite:///{db_path}")
Base.metadata.create_all(engine) 