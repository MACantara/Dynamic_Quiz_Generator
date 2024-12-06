from flask import Flask
from config import Config
from routes.quiz_routes import quiz_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Register blueprints
    app.register_blueprint(quiz_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])