from flask import Flask, render_template, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

app = Flask(__name__)

def generate_quiz(topic, num_questions, question_types):
    prompt = f"""Generate a quiz about {topic} with {num_questions} questions.
    Include only the following question types: {', '.join(question_types)}.
    For true/false questions, always use boolean values (true/false) in lowercase for correct_answer.

    Follow these specific formats for each question type:

    1. For coding questions (drag and drop style):
    - Provide a complete code scenario with missing parts
    - Create a drag and drop interface where students match code fragments
    - Focus on certification-style problem-solving
    - Include context, requirements, and specific instructions
    Example:
    {{"type": "coding", 
      "question": "A network engineer needs to implement a secure Python function for user authentication. Complete the function by dragging the correct code fragments into the blanks.", 
      "code_template": "def authenticate_user(username, password):\\n    # Validate username\\n    if not _____:\\n        return False\\n    \\n    # Hash password\\n    hashed_password = _____\\n    \\n    # Check against stored credentials\\n    return _____", 
      "options": [
        "len(username) > 3", 
        "hashlib.sha256(password.encode()).hexdigest()", 
        "stored_credentials.get(username) == hashed_password"
      ],
      "descriptions": [
        "Username length check", 
        "Password hashing", 
        "Credential verification"
      ],
      "correct_answer": ["len(username) > 3", "hashlib.sha256(password.encode()).hexdigest()", "stored_credentials.get(username) == hashed_password"]
    }}

    2. For drag and drop questions:
    - Format like IT certification exams with matching or ordering tasks
    - Start with a clear scenario or concept to match
    - Include a specific instruction like "Match the following [items] with their [descriptions]:" or "Arrange the following [items] in the correct order:"
    - Provide items on the left and descriptions/slots on the right
    - The options array should contain the draggable items
    - Include a descriptions array for matching questions
    Example for matching:
    {{"type": "drag_drop", "question": "Match the following network protocols with their primary functions:", "options": ["HTTPS", "DNS", "DHCP", "SMTP"], "descriptions": ["Secure web browsing", "Domain name resolution", "IP address assignment", "Email transmission"], "correct_answer": ["HTTPS", "DNS", "DHCP", "SMTP"]}}
    Example for ordering:
    {{"type": "drag_drop", "question": "Arrange the following steps of the TCP three-way handshake in the correct order:", "options": ["ACK", "SYN", "SYN-ACK"], "descriptions": ["Step 1", "Step 2", "Step 3"], "correct_answer": ["SYN", "SYN-ACK", "ACK"]}}

    3. For fill-in-the-blank questions:
    - Format questions with a clear sentence where one term needs to be filled in
    - Mark the blank spot with exactly five underscores (_____) where the dropdown will appear
    - Include 4-5 plausible options that could fit grammatically in the blank
    - The question should read naturally when any option is selected
    - Do not repeat the question text or include any additional formatting
    Example:
    {{"type": "fill_blank", 
      "question": "The _____ protocol is used to securely transfer files between a client and server.",
      "options": ["SFTP", "HTTP", "SMTP", "ICMP"],
      "correct_answer": "SFTP"
    }}

    Return a valid JSON object with this exact structure (no markdown, no code blocks):
    {{"questions": [
        {{"type": "question_type", "question": "question_text", "options": ["option1", "option2"], "descriptions": ["desc1", "desc2"], "correct_answer": "answer"}}
    ]}}
    """
    
    response = model.generate_content(prompt)
    try:
        # Clean the response to ensure it's valid JSON
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        
        # Remove any leading/trailing whitespace and newlines
        text = text.strip()
        
        # Parse the JSON to validate it
        import json
        quiz_data = json.loads(text)
        return text
    except Exception as e:
        print(f"Error parsing quiz response: {e}")
        print(f"Raw response: {response.text}")
        return '{"questions": []}'  # Return empty quiz on error

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    topic = data.get('topic')
    num_questions = int(data.get('num_questions', 5))
    question_types = data.get('question_types', ['multiple_choice', 'drag_drop', 'fill_blank', 'true_false', 'coding'])
    
    quiz = generate_quiz(topic, num_questions, question_types)
    return jsonify({'quiz': quiz})

if __name__ == '__main__':
    app.run(debug=True)
