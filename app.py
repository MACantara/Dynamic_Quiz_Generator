from flask import Flask
from config import Config
from routes.quiz_routes import quiz_bp

# Create Flask app instance
app = Flask(__name__)
app.config.from_object(Config)

# Register blueprints
app.register_blueprint(quiz_bp)

# Local development server
if __name__ == '__main__':
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)