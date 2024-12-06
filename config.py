import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    DEBUG = True
    SECRET_KEY = os.getenv('SECRET_KEY')
