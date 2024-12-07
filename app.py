from flask import Flask
from config import Config
from routes.quiz_routes import quiz_bp

app = Flask(__name__)

@app.route('/')
def home():
    return 'Dynamic Quiz Generator'

def create_app():
    app.config.from_object(Config)
    
    # Register blueprints
    app.register_blueprint(quiz_bp)
    
    return app

# Enable debug mode when running locally
if __name__ == '__main__':
    app = create_app()
    app.run(host=app.config['HOST'], port=app.config['PORT'], debug=True)