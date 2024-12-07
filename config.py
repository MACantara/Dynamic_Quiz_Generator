import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5000
    SECRET_KEY = os.getenv('SECRET_KEY')
