import google.generativeai as genai
from config import Config
from services.search_service import SearchService

class AIService:
    def __init__(self):
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.search_service = SearchService()
    
    def generate_content(self, prompt, topic=None):
        if topic:
            # Get relevant search results
            search_data = self.search_service.get_relevant_content(topic)
            
            # Enhance prompt with search context
            enhanced_prompt = f"""
            Based on the following verified information:

            {search_data['context']}

            Please use these sources to ground your response and include relevant references.
            Available reference links:
            {', '.join(search_data['references'])}

            {prompt}
            """
            
            return self.model.generate_content(enhanced_prompt)
        
        return self.model.generate_content(prompt)
