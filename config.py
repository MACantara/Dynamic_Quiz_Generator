import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    PRIMARY_GEMINI_API_KEY = os.getenv('PRIMARY_GEMINI_API_KEY')
    SECONDARY_GEMINI_API_KEY = os.getenv('SECONDARY_GEMINI_API_KEY')
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5000
    SECRET_KEY = os.getenv('SECRET_KEY')
    GOOGLE_SEARCH_API_KEY = os.getenv('GOOGLE_SEARCH_API_KEY')
    GOOGLE_SEARCH_ENGINE_ID = os.getenv('GOOGLE_SEARCH_ENGINE_ID')
