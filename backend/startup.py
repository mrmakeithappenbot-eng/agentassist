#!/usr/bin/env python3
"""
AgentAssist Backend Startup Script
Simplified launcher with setup validation
"""

import os
import sys
from pathlib import Path

def check_environment():
    """Validate environment setup"""
    print("🔍 Checking environment...")
    
    # Check .env file
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        print("❌ ERROR: .env file not found!")
        print("   Please copy .env.example to .env and configure it.")
        sys.exit(1)
    
    # Load .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✓ Configuration loaded")
    except ImportError:
        print("❌ ERROR: python-dotenv not installed")
        print("   Run: pip install python-dotenv")
        sys.exit(1)
    
    # Check required env vars
    required_vars = ['SECRET_KEY', 'ENCRYPTION_KEY', 'DATABASE_URL']
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print(f"❌ ERROR: Missing environment variables: {', '.join(missing)}")
        sys.exit(1)
    
    print("✓ Required environment variables set")
    
    return True

def check_database():
    """Initialize database if needed"""
    print("🗄️  Checking database...")
    
    db_url = os.getenv('DATABASE_URL')
    
    if db_url.startswith('sqlite'):
        # SQLite - simple file check
        db_path = db_url.replace('sqlite:///', '')
        if not os.path.exists(db_path):
            print(f"  Creating SQLite database: {db_path}")
            # Database will be created automatically by SQLAlchemy
        print("✓ Database ready (SQLite)")
    else:
        # PostgreSQL or other
        print("✓ Database configured (check connection on startup)")
    
    return True

def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting AgentAssist Backend...\n")
    
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError:
        print("❌ ERROR: uvicorn not installed")
        print("   Run: pip install uvicorn")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 AgentAssist Backend stopped")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        sys.exit(1)

def main():
    """Main startup sequence"""
    print("=" * 60)
    print("AgentAssist Backend - Startup")
    print("=" * 60)
    print()
    
    # Validation checks
    if not check_environment():
        sys.exit(1)
    
    if not check_database():
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("✓ All checks passed!")
    print("=" * 60)
    print()
    print("Server will start at: http://localhost:8000")
    print("API docs available at: http://localhost:8000/docs")
    print()
    print("Press Ctrl+C to stop the server")
    print()
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
