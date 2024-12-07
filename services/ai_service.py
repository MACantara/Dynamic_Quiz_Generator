import json
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

            Please use these sources to ground your response.
            Available references:
            {json.dumps(search_data['references'], indent=2)}

            When including references in your response, use the full reference object 
            with both URL and title. Example format:
            "references": [
                {{"url": "https://example.com", "title": "Example Title", "source": "example.com"}}
            ]

            {prompt}
            """
            
            return self.model.generate_content(enhanced_prompt)
        
        return self.model.generate_content(prompt)
