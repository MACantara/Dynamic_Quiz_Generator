from flask import Blueprint, render_template, request, jsonify
from services.quiz_service import QuizService

quiz_bp = Blueprint('quiz', __name__)
quiz_service = QuizService()

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
    data = request.get_json()
    topic = data.get('topic')
    num_questions = min(max(int(data.get('num_questions', 5)), 1), 20)  # Limit between 1 and 20
    question_types = data.get('question_types', ['multiple_choice', 'drag_drop', 'fill_blank', 'true_false', 'coding'])
    
    quiz = quiz_service.generate_quiz(topic, num_questions, question_types)
    return jsonify({'quiz': quiz})
