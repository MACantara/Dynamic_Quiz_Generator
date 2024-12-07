import json
from services.ai_service import AIService

class QuizService:
    def __init__(self):
        self.ai_service = AIService()

    def _create_prompt(self, topic, num_questions, question_types):
        return f"""Generate a quiz about {topic} containing exactly {num_questions} questions.
        Use only the following question types: {', '.join(question_types)}. Ensure that the number of questions matches the specified number ({num_questions}) without exception.

        For true/false questions, always use boolean values (true/false) in lowercase for the correct_answer.

        Follow these specific formats for each question type:

        1. For coding questions (drag and drop style):
        - Provide a complete code scenario with missing parts
        - Mark the missing parts with exactly five underscores (_____)
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
        Example:
        {{"type": "fill_blank", 
        "question": "The _____ protocol is used to securely transfer files between a client and server.",
        "options": ["SFTP", "HTTP", "SMTP", "ICMP"],
        "correct_answer": "SFTP"
        }}

        Ensure the total number of questions equals {num_questions}, and return a valid JSON object (no markdown, no code blocks) with the following structure:
        {{"questions": [
            {{"type": "question_type", "question": "question_text", "options": ["option1", "option2"], "descriptions": ["desc1", "desc2"], "correct_answer": "answer"}}
        ]}}
        """

    def _clean_response(self, text):
        # Clean the response to ensure it's valid JSON
        text = text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        return text.strip()

    def generate_quiz(self, topic, num_questions, question_types):
        try:
            prompt = self._create_prompt(topic, num_questions, question_types)
            response = self.ai_service.generate_content(prompt)
            cleaned_text = self._clean_response(response.text)
            
            # Parse the JSON to validate it
            quiz_data = json.loads(cleaned_text)
            return cleaned_text
        except Exception as e:
            print(f"Error parsing quiz response: {e}")
            print(f"Raw response: {response.text if 'response' in locals() else 'No response generated'}")
            return '{"questions": []}'  # Return empty quiz on error
