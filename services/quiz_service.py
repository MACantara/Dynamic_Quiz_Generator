import json
from services.ai_service import AIService
from werkzeug.exceptions import GatewayTimeout
import time

class QuizService:
    def __init__(self):
        self.ai_service = AIService()
        self.MAX_QUESTIONS = 20
        self.TIMEOUT = 25  # 25 second timeout

    def _create_prompt(self, topic, num_questions, question_types):
        return f"""Generate a quiz about {topic} containing exactly {num_questions} questions.
        Use only the following question types: {', '.join(question_types)}. Ensure that the number of questions matches the specified number ({num_questions}) without exception.
        
        For each question, include:
        - A detailed explanation of the correct answer
        - At least one reference link to documentation or reliable sources
        - Clear reasoning for why other options are incorrect (for multiple choice questions)
        
        Strictly follow these rules:
        - Challenge users with critical thinking, reading comprehension, and problem-solving.
        - Balance the difficulty of questions to progressively challenge learners while being fair.
        - Do not deviate from the specified formats for each question type.
        - Ensure consistency in the formatting of the JSON output.

        For true/false questions, always use boolean values (true/false) in lowercase for the correct_answer.

        Follow these specific formats for each question type:

        1. For coding questions (drag and drop style):
        - Provide a code scenario with exactly three missing parts
        - Clearly state the scenario, requirements, and instructions
        - Mark the missing parts with exactly five underscores (_____)
        - Create a drag and drop interface where students match code fragments
        - Include three correct code fragments and at least three distractors
        - Use realistic, practical problems aligned with certification-style challenges
        - Include context, requirements, and specific instructions
        - Do not modify the example format provided below
        Example:
        {{
            "type": "coding", 
            "question": "A developer needs to implement a Python function to calculate compound interest. Complete the function by dragging the correct code fragments into the blanks.", 
            "code_template": "def calculate_compound_interest(principal, rate, time):\\n    # Calculate the amount\\n    amount = principal * (1 + _____)**time\\n    \\n    # Calculate interest\\n    interest = _____\\n    return _____", 
            "options": [
                "rate / 100", 
                "amount - principal", 
                "principal", 
                "rate * time", 
                "principal + rate"
            ],
            "descriptions": [
                "Convert rate to decimal", 
                "Calculate interest", 
                "Return the correct value"
            ],
            "correct_answer": ["rate / 100", "amount - principal", "interest"],
            "explanation": "The formula for compound interest is A = P(1 + r/n)^(nt). Here, rate / 100 converts the rate to a decimal, amount - principal gives the interest, and interest is returned.",
            "references": ["https://www.investopedia.com/terms/c/compoundinterest.asp"]
        }}

        2. For drag and drop questions:
        - Format like IT certification exams with matching or ordering tasks
        - Start with a clear scenario or concept to match
        - Include a specific instruction like "Match the following [items] with their [descriptions]:" or "Arrange the following [items] in the correct order:"
        - Provide items on the left and descriptions/slots on the right
        - The options array should contain the draggable items
        - Include options (draggable items) and descriptions (match targets or sequence steps).
        Example for matching:
        {{
            "type": "drag_drop", 
            "question": "Match the following data structures with their common use cases:", 
            "options": ["Array", "Stack", "Queue", "Hash Map"], 
            "descriptions": ["Static data storage", "Last-In-First-Out operations", "First-In-First-Out operations", "Key-value pair storage"], 
            "correct_answer": ["Array", "Stack", "Queue", "Hash Map"],
            "explanation": "Arrays are used for static data storage, Stacks for LIFO operations, Queues for FIFO operations, and Hash Maps for key-value pair storage.",
            "references": ["https://en.wikipedia.org/wiki/Data_structure"]
        }}
        Example for ordering:
        {{
            "type": "drag_drop", 
            "question": "Arrange the following steps of the software development lifecycle in the correct order:", 
            "options": ["Testing", "Implementation", "Design", "Requirements Analysis"], 
            "descriptions": ["Step 1", "Step 2", "Step 3", "Step 4"], 
            "correct_answer": ["Requirements Analysis", "Design", "Implementation", "Testing"],
            "explanation": "The correct order of the software development lifecycle is Requirements Analysis, Design, Implementation, and Testing.",
            "references": ["https://www.tutorialspoint.com/sdlc/sdlc_overview.htm"]
        }}

        3. For fill-in-the-blank questions:
        - Format questions with a clear sentence where one term needs to be filled in
        - Mark the blank spot with exactly five underscores (_____) where the dropdown will appear
        - Include 4-5 plausible options that could fit grammatically in the blank
        - The question should read naturally when any option is selected
        - Do not modify the example format provided below.
        Example:
        {{"type": "fill_blank", 
        "question": "The _____ protocol is used to securely transfer files between a client and server.",
        "options": ["SFTP", "HTTP", "SMTP", "ICMP"],
        "correct_answer": "SFTP",
        "explanation": "SFTP (Secure File Transfer Protocol) is used for secure file transfers, unlike HTTP, SMTP, and ICMP which serve different purposes.",
        "references": ["https://en.wikipedia.org/wiki/SSH_File_Transfer_Protocol"]
        }}

        Ensure the total number of questions equals {num_questions}, and return a valid JSON object with the following structure:
        {{"questions": [
            {{
                "type": "question_type",
                "question": "question_text",
                "options": ["option1", "option2"],
                "descriptions": ["desc1", "desc2"],
                "correct_answer": "answer",
                "explanation": "detailed explanation",
                "references": ["link1", "link2"]
            }}
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
            # Ensure num_questions is within limits
            num_questions = min(max(num_questions, 1), self.MAX_QUESTIONS)
            prompt = self._create_prompt(topic, num_questions, question_types)
            
            # Pass topic for context-aware generation
            response = self.ai_service.generate_content(prompt, topic=topic)
            cleaned_text = self._clean_response(response.text)
            
            # Parse the JSON to validate it
            quiz_data = json.loads(cleaned_text)
            return cleaned_text
        except Exception as e:
            print(f"Error parsing quiz response: {e}")
            print(f"Raw response: {response.text if 'response' in locals() else 'No response generated'}")
            return '{"questions": []}'  # Return empty quiz on error
