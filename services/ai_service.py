import json
import google.generativeai as genai
from config import Config
from services.search_service import SearchService

class AIService:
    def __init__(self):
        # Configure primary API key for main AI capabilities
        genai.configure(api_key=Config.PRIMARY_GEMINI_API_KEY)
        self.primary_model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Configure secondary API key for explanation generation
        genai.configure(api_key=Config.SECONDARY_GEMINI_API_KEY)
        self.explanation_model = genai.GenerativeModel('gemini-1.5-flash')
        
        self.search_service = SearchService()

    def generate_content(self, prompt, topic=None, model_type='primary'):
        """
        Generate content using either primary or explanation model
        
        Args:
            prompt (str): The prompt to generate content for
            topic (str, optional): The topic to generate content for
            model_type (str): 'primary' or 'explanation'
        
        Returns:
            Generated content as a string
        """
        try:
            # Select the appropriate model
            model = self.primary_model if model_type == 'primary' else self.explanation_model
            
            # Configure safety settings to minimize blocking
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                }
            ]
            
            # Enhance prompt with topic context if provided
            if topic:
                search_data = self.search_service.get_relevant_content(topic)
                enhanced_prompt = f"""
                Context from research:
                {search_data.get('context', '')}
                
                {prompt}
                """
            else:
                enhanced_prompt = prompt
            
            # Generate content
            response = model.generate_content(
                enhanced_prompt, 
                safety_settings=safety_settings
            )
            
            # Handle different possible response types
            if hasattr(response, 'text'):
                return response.text
            elif isinstance(response, str):
                return response
            else:
                # Try to extract text from the response
                try:
                    return str(response)
                except Exception as e:
                    print(f"Error extracting response text: {e}")
                    return ""
        
        except Exception as e:
            print(f"Error generating content: {e}")
            return ""

    def generate_explanation(self, question, correct_answer, topic):
        """
        Generate a detailed explanation for a specific question
        
        Args:
            question (str): The text of the question
            correct_answer (str): The correct answer to the question
            topic (str): The broader topic of the quiz
        
        Returns:
            A dictionary containing the explanation and references
        """
        try:
            # Fetch relevant content from search service
            search_results = self.search_service.get_relevant_content(topic)
            
            # Construct prompt for explanation generation
            explanation_prompt = f"""Generate a concise, clear explanation for the following question:

Question: {question}
Correct Answer: {correct_answer}

Guidelines:
- Provide a precise explanation in 3-5 sentences
- Focus on why the answer is correct
- Use clear, direct language
- Explain the key concept succinctly
- Avoid unnecessary details

Context from research:
{search_results.get('context', '')}

Additional context:
- Topic: {topic}
- Explain the core concept behind the correct answer"""
            
            # Generate the explanation
            explanation_text = self.generate_content(explanation_prompt, model_type='explanation')
            
            # Prepare references
            references = search_results.get('references', [])
            
            # Fallback if no explanation generated
            if not explanation_text:
                explanation_text = f"The correct answer is '{correct_answer}'. This answer is significant because it highlights a key concept in {topic}."
            
            # Ensure explanation is concise
            explanation_text = ' '.join(explanation_text.split()[:100])
            
            return {
                'explanation': explanation_text,
                'references': references
            }
        
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return {
                'explanation': f"The correct answer relates to key concepts in {topic}.",
                'references': []
            }

    def generate_quiz_explanations(self, quiz_data, topic):
        """
        Generate explanations for an entire quiz
        
        Args:
            quiz_data (list): List of quiz questions
            topic (str): The topic of the quiz
        
        Returns:
            List of questions with added explanations and references
        """
        explained_quiz = []
        
        for question in quiz_data:
            # Generate explanation for each question
            try:
                explanation_data = self.generate_explanation(
                    question['question'], 
                    question['correct_answer'], 
                    topic
                )
                
                # Add explanation and references to the question
                question_with_explanation = question.copy()
                question_with_explanation['explanation'] = explanation_data['explanation']
                question_with_explanation['references'] = explanation_data['references']
                
                explained_quiz.append(question_with_explanation)
            
            except Exception as e:
                print(f"Error processing question explanation: {e}")
                # Add a fallback explanation if generation fails
                fallback_question = question.copy()
                fallback_question['explanation'] = "Unable to generate explanation."
                fallback_question['references'] = []
                explained_quiz.append(fallback_question)
        
        return explained_quiz
