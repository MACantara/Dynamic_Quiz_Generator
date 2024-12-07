from googleapiclient.discovery import build
from config import Config
import os

class SearchService:
    def __init__(self):
        self.service = None
        self.cx = None
        try:
            if not Config.GOOGLE_SEARCH_API_KEY or not Config.GOOGLE_SEARCH_ENGINE_ID:
                print("Warning: Google Search credentials not found in environment")
                return
                
            self.service = build(
                "customsearch", "v1",
                developerKey=Config.GOOGLE_SEARCH_API_KEY
            )
            self.cx = Config.GOOGLE_SEARCH_ENGINE_ID
        except Exception as e:
            print(f"Failed to initialize search service: {e}")

    def search(self, query, num_results=5):
        if not self.service or not self.cx:
            print("Search service not properly initialized")
            return self._get_fallback_results()

        """
        Perform a Google Custom Search and return relevant results
        """
        if not query or not self.cx or not Config.GOOGLE_SEARCH_API_KEY:
            print("Missing required search parameters")
            return []

        try:
            # Sanitize and validate query
            query = query.strip()
            num_results = min(max(1, num_results), 10)  # Limit between 1 and 10

            result = self.service.cse().list(
                q=query,
                cx=self.cx,
                num=num_results
            ).execute()

            search_results = []
            if 'items' in result:
                for item in result['items']:
                    search_results.append({
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'snippet': item.get('snippet', ''),
                        'source': item.get('displayLink', '')
                    })
            return search_results
        except Exception as e:
            print(f"Search error: {str(e)}")
            return []

    def _get_fallback_results(self):
        """Provide fallback results when search fails"""
        return [{
            'title': 'Documentation',
            'link': 'https://docs.python.org',
            'snippet': 'Official Python Documentation',
            'source': 'docs.python.org'
        }]

    def get_relevant_content(self, topic, subtopic=None):
        """
        Get relevant content for a topic and optional subtopic
        """
        query = f"{topic} {subtopic if subtopic else ''}"
        results = self.search(query)
        
        # Format results for prompt context
        context = []
        references = []
        
        for result in results:
            context.append(f"Source: {result['source']}\nURL: {result['link']}\n{result['snippet']}\n")
            references.append({
                'url': result['link'],
                'title': result['title'],
                'source': result['source']
            })
        
        return {
            'context': '\n'.join(context),
            'references': references
        }