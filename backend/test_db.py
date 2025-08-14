#!/usr/bin/env python3
"""
Simple database test script to verify connection and models
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

try:
    from models import Base, User
    print("✅ Models imported successfully")
except ImportError as e:
    print(f"❌ Error importing models: {e}")
    sys.exit(1)

def test_database():
    """Test database connection and basic operations"""
    try:
        # Database path
        db_path = os.path.join(os.path.dirname(__file__), 'instance', 'diet_consultant.db')
        print(f"Database path: {db_path}")
        
        # Create engine
        engine = create_engine(f"sqlite:///{db_path}")
        print("✅ Database engine created")
        
        # Create tables
        Base.metadata.create_all(engine)
        print("✅ Database tables created/verified")
        
        # Create session
        Session = sessionmaker(bind=engine)
        session = Session()
        print("✅ Database session created")
        
        # Test query
        users = session.query(User).all()
        print(f"✅ Database query successful. Found {len(users)} users")
        
        # Close session
        session.close()
        print("✅ Database session closed")
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing database connection...")
    success = test_database()
    
    if success:
        print("\n🎉 Database test completed successfully!")
    else:
        print("\n💥 Database test failed!")
        sys.exit(1)
