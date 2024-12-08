from flask import Blueprint, render_template, request, jsonify, current_app
from werkzeug.exceptions import GatewayTimeout
import time
from services.quiz_service import QuizService
from services.ai_service import AIService

quiz_bp = Blueprint('quiz', __name__)
quiz_service = QuizService()
ai_service = AIService()

@quiz_bp.route('/')
def index():
    question_types = [
        {'id': 'multipleChoice', 'value': 'multiple_choice', 'label': 'Multiple Choice'},
        {'id': 'dragDrop', 'value': 'drag_drop', 'label': 'Drag and Drop'},
        {'id': 'fillBlank', 'value': 'fill_blank', 'label': 'Fill in the Blank'},
        {'id': 'trueFalse', 'value': 'true_false', 'label': 'True/False'},
        {'id': 'coding', 'value': 'coding', 'label': 'Coding'}
    ]
    return render_template('index.html', question_types=question_types)

@quiz_bp.route('/generate', methods=['POST'])
def generate():
    try:
        start_time = time.time()
        timeout = 25  # Set timeout to 25 seconds

        data = request.get_json()
        topic = data.get('topic')
        num_questions = min(max(int(data.get('num_questions', 5)), 1), 20)
        question_types = data.get('question_types', ['multiple_choice'])

        # Check for timeout during generation
        quiz = quiz_service.generate_quiz(topic, num_questions, question_types)
        
        if time.time() - start_time > timeout:
            raise GatewayTimeout("Quiz generation timed out")

        return jsonify({
            'quiz': quiz,
            'status': 'success'
        })

    except GatewayTimeout as e:
        return jsonify({
            'error': str(e),
            'status': 'timeout'
        }), 504
    except Exception as e:
        current_app.logger.error(f"Quiz generation error: {str(e)}")
        return jsonify({
            'error': "Failed to generate quiz",
            'status': 'error'
        }), 500
