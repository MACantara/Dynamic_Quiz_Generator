// quizAPI.js - Handles all API calls for quiz generation and submission

const QuizAPI = {
    generateQuiz: function(quizConfig) {
        return $.ajax({
            url: '/generate',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(quizConfig)
        });
    },

    parseQuizData: function(response) {
        try {
            let quizData;
            if (typeof response.quiz === 'string') {
                let cleanJson = response.quiz.trim();
                if (cleanJson.startsWith('```json')) {
                    cleanJson = cleanJson.substring(7);
                }
                if (cleanJson.startsWith('```')) {
                    cleanJson = cleanJson.substring(3);
                }
                if (cleanJson.endsWith('```')) {
                    cleanJson = cleanJson.substring(0, cleanJson.length - 3);
                }
                quizData = JSON.parse(cleanJson.trim());
            } else {
                quizData = response.quiz;
            }
            return quizData;
        } catch (error) {
            console.error('Error parsing quiz data:', error);
            throw new Error('Failed to parse quiz data');
        }
    }
};
