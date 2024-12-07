
from googleapiclient.discovery import build
from config import Config

class SearchService:
    def __init__(self):
        self.service = build(
            "customsearch", "v1",
            developerKey=Config.GOOGLE_SEARCH_API_KEY
        )
        self.cx = Config.GOOGLE_SEARCH_ENGINE_ID  # Custom Search Engine ID

    def search(self, query, num_results=5):
        """
        Perform a Google Custom Search and return relevant results
        """
        try:
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
            print(f"Search error: {e}")
            return []

    def get_relevant_content(self, topic, subtopic=None):
        """
        Get relevant content for a topic and optional subtopic
        """
        query = f"{topic} {subtopic if subtopic else ''}"
        results = self.search(query)
        
        # Format results for prompt context
        context = []
        for result in results:
            context.append(f"Source: {result['source']}\nURL: {result['link']}\n{result['snippet']}\n")
        
        return {
            'context': '\n'.join(context),
            'references': [r['link'] for r in results]
        }