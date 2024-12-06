from flask import Blueprint, render_template, request, jsonify
from services.quiz_service import QuizService

quiz_bp = Blueprint('quiz', __name__)
quiz_service = QuizService()

@quiz_bp.route('/')
def index():
    return render_template('index.html')

@quiz_bp.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    topic = data.get('topic')
    num_questions = int(data.get('num_questions', 5))
    question_types = data.get('question_types', ['multiple_choice', 'drag_drop', 'fill_blank', 'true_false', 'coding'])
    
    quiz = quiz_service.generate_quiz(topic, num_questions, question_types)
    return jsonify({'quiz': quiz})
