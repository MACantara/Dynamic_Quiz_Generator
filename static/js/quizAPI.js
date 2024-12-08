// quizAPI.js - Handles all API calls for quiz generation and submission

const QuizAPI = {
    generateQuiz: async function(quizConfig) {
        try {
            const response = await $.ajax({
                url: '/generate',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(quizConfig)
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    parseQuizData: function(response) {
        try {
            let quizData;
            
            // Parse the response if it's a string
            if (typeof response === 'string') {
                quizData = JSON.parse(response);
            } else if (response.quiz) {
                // Handle response.quiz
                const rawQuiz = response.quiz;
                if (typeof rawQuiz === 'string') {
                    let cleanJson = rawQuiz.trim();
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
                    quizData = rawQuiz;
                }
            } else {
                throw new Error('Invalid response format');
            }

            // Validate the quiz data structure
            if (!quizData || typeof quizData !== 'object') {
                throw new Error('Quiz data must be an object');
            }

            // Ensure we have a questions array
            if (!quizData.questions) {
                if (Array.isArray(quizData)) {
                    quizData = { questions: quizData };
                } else {
                    throw new Error('Quiz data must contain questions');
                }
            }

            // Validate questions array
            if (!Array.isArray(quizData.questions)) {
                throw new Error('Questions must be an array');
            }

            // Remove any duplicate questions by comparing question text
            const uniqueQuestions = [];
            const seenQuestions = new Set();
            
            quizData.questions.forEach(question => {
                if (!seenQuestions.has(question.question)) {
                    seenQuestions.add(question.question);
                    uniqueQuestions.push(question);
                }
            });

            quizData.questions = uniqueQuestions;
            return quizData;
        } catch (error) {
            console.error('Error parsing quiz data:', error);
            throw new Error('Failed to parse quiz data');
        }
    }
};
