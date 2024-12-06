# Dynamic Quiz Generator

A Flask-based web application that generates customized quizzes using Google's Gemini AI. The application can create various types of questions including multiple choice, true/false, and coding-related questions.

## Features

- Dynamic quiz generation based on user-specified topics
- Support for multiple question types:
  - Multiple Choice
  - True/False
  - Coding Questions (drag and drop style)
- Clean and responsive user interface
- Powered by Google's Gemini AI for intelligent question generation

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Dynamic_Quiz_Generator.git
cd Dynamic_Quiz_Generator
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
```

3. Install the required dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your web browser and navigate to `http://localhost:5000`

3. Use the interface to:
   - Select a topic for your quiz
   - Choose the number of questions
   - Select question types
   - Generate and take the quiz

## Project Structure

```
Dynamic_Quiz_Generator/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
├── static/            # Static files (CSS, JS)
│   └── style.css      # Custom styling
└── templates/         # HTML templates
    └── index.html     # Main page template
```

## Dependencies

- Flask (3.0.0): Web framework
- python-dotenv (1.0.0): Environment variable management
- google-generativeai (0.8.3): Google Gemini AI integration

## Getting a Gemini API Key

1. Visit the [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your `.env` file

## Contributing

Feel free to open issues or submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.
