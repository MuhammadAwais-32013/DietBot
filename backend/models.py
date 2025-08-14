from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bmis = relationship('BMI', backref='user', lazy=True)
    diet_plans = relationship('DietPlan', backref='user', lazy=True)
    medical_records = relationship('MedicalRecord', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class BMI(Base):
    __tablename__ = 'bmi'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'height': self.height,
            'weight': self.weight,
            'bmi': self.bmi,
            'category': self.category,
            'timestamp': self.timestamp.isoformat()
        }

class DietPlan(Base):
    __tablename__ = 'dietplan'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    bmi = Column(Float, nullable=False)
    plan = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bmi': self.bmi,
            'plan': self.plan,
            'created_at': self.created_at.isoformat()
        }

class MedicalRecord(Base):
    __tablename__ = 'medicalrecord'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    date = Column(Date, nullable=False)
    bp = Column(String(20), nullable=False)
    sugar = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat(),
            'bloodPressure': self.bp,
            'bloodSugar': self.sugar,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        } 