import json
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from config import Config
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        logger.info("Initializing AIService")
        self.client = genai.Client(api_key=Config.PRIMARY_GEMINI_API_KEY)
        self.search_tool = Tool(google_search=GoogleSearch())
        
        self.base_config = {
            "temperature": 0.6,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "tools": [self.search_tool],
            "response_modalities": ["TEXT"]
        }
        logger.debug("AIService initialized with gemini-2.0-flash-exp")

    def process_grounding_metadata(self, metadata):
        """Process grounding metadata and return formatted results."""
        result = []
        
        # Process search results
        if metadata.search_entry_point and metadata.search_entry_point.rendered_content:
            logger.debug("Adding search results")
            result.extend([
                "\n--- Search Results ---",
                metadata.search_entry_point.rendered_content
            ])
        
        # Process sources
        if metadata.grounding_chunks:
            logger.debug(f"Processing {len(metadata.grounding_chunks)} grounding chunks")
            result.append("\n--- Sources ---")
            for chunk in metadata.grounding_chunks:
                if chunk.web and chunk.web.uri:
                    title = chunk.web.title or "Web Source"
                    result.append(f"- [{title}]({chunk.web.uri})")
                elif chunk.retrieved_context and chunk.retrieved_context.uri:
                    title = chunk.retrieved_context.title or "Retrieved Context"
                    result.append(f"- [{title}]({chunk.retrieved_context.uri})")
        
        return result

    def generate_content(self, prompt, topic=None):
        """Generate content using Gemini API with built-in search"""
        try:
            enhanced_prompt = f"""
            Topic: {topic if topic else 'General'}
            
            {prompt}
            
            Note: Please use search to find accurate and up-to-date information.
            """

            logger.debug("Generating content with Gemini API")
            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=enhanced_prompt,
                config=GenerateContentConfig(
                    **self.base_config
                )
            )
            
            return self._parse_response(response)
            
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}", exc_info=True)
            return ""

    def _parse_response(self, response):
        """Parse response from Gemini API"""
        try:
            content = ""
            metadata_results = []

            # Extract text content
            if hasattr(response, 'text'):
                content = response.text
            elif isinstance(response, str):
                content = response
            else:
                content = str(response)

            # Process metadata if available
            if hasattr(response, 'metadata'):
                logger.debug("Processing response metadata")
                metadata_results = self.process_grounding_metadata(response.metadata)

            # Combine content with metadata results
            if metadata_results:
                content = f"{content}\n{''.join(metadata_results)}"

            return content
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}", exc_info=True)
            return ""

    def parse_response_parts(self, response):
        """Parse different parts of the response and format them appropriately."""
        logger.debug("Starting to parse response parts")
        result = []
        
        try:
            candidate = response.candidates[0]
            logger.debug("Processing main content parts")
            
            # Process content parts
            for part in candidate.content.parts:
                if part.text:
                    logger.debug("Adding text part")
                    result.append(part.text)
                elif hasattr(part, 'executable_code'):
                    logger.debug("Adding code block")
                    result.append(f'```python\n{part.executable_code.code}\n```')
            
            # Process grounding metadata
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                result.extend(self.process_grounding_metadata(candidate.grounding_metadata))
                
        except Exception as e:
            logger.error(f"Error parsing response parts: {str(e)}", exc_info=True)
            raise
        
        logger.debug("Finished parsing response parts")
        return "\n".join(result)

    def generate_explanation(self, question, correct_answer, topic):
        """Generate a detailed explanation using Gemini's built-in search"""
        try:
            explanation_prompt = f"""Based on accurate information from web search, generate a clear, evidence-based explanation for this question:

Question: {question}
Correct Answer: {correct_answer}
Topic: {topic}

Requirements:
- Search for and cite reliable sources
- Provide a clear, concise explanation (3-4 sentences)
- Reference specific sources when possible
- Focus on why the answer is correct
- Explain core concepts clearly"""
            
            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=explanation_prompt,
                config=GenerateContentConfig(**self.base_config)
            )
            
            # Use parse_response_parts to get formatted explanation with sources
            full_response = self.parse_response_parts(response)
            parts = full_response.split("\n--- ")
            main_explanation = parts[0].strip()
            
            # Extract references from metadata sections
            references = []
            for part in parts[1:]:
                if part.startswith("Sources ---"):
                    for line in part.split("\n"):
                        if line.startswith("- ["):
                            try:
                                title = line[3:line.index("]")]
                                url = line[line.index("(")+1:line.index(")")]
                                references.append({"title": title, "url": url})
                            except ValueError:
                                continue
            
            # Ensure explanation is concise
            main_explanation = ' '.join(main_explanation.split()[:100])
            
            return {
                'explanation': main_explanation or f"The correct answer relates to key concepts in {topic}.",
                'references': references
            }
            
        except Exception as e:
            logger.error(f"Error generating explanation: {str(e)}", exc_info=True)
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
                logger.error(f"Error processing question explanation: {e}", exc_info=True)
                # Add a fallback explanation if generation fails
                fallback_question = question.copy()
                fallback_question['explanation'] = "Unable to generate explanation."
                fallback_question['references'] = []
                explained_quiz.append(fallback_question)
        
        return explained_quiz
