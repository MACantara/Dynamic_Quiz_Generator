// quizLogic.js - Handles quiz logic and answer processing

const QuizLogic = {
    currentQuiz: null,

    // Initialize quiz event listeners
    init: function() {
        this.setupFormSubmission();
        this.setupQuizSubmission();
        this.setupDragDropListeners();
    },

    // Setup form submission
    setupFormSubmission: function() {
        $('#quizForm').on('submit', async (e) => {
            e.preventDefault();
            
            const questionTypes = [];
            $('input[type="checkbox"]:checked').each(function() {
                questionTypes.push($(this).val());
            });

            const quizConfig = {
                topic: $('#topic').val(),
                num_questions: $('#numQuestions').val(),
                question_types: questionTypes
            };

            QuizUI.showLoading();
            $('#loadingMessage').text('Searching for relevant information...');

            try {
                const response = await QuizAPI.generateQuiz(quizConfig);
                $('#loadingMessage').text('Generating quiz questions...');
                this.currentQuiz = QuizAPI.parseQuizData(response);
                QuizUI.displayQuiz(this.currentQuiz);
                $('#quizContainer').removeClass('d-none');
            } catch (error) {
                console.error('Error:', error);
                alert('Error generating quiz. Please try again.');
            } finally {
                QuizUI.hideLoading();
                $('#loadingMessage').text('');
            }
        });
    },

    // Setup quiz submission
    setupQuizSubmission: function() {
        // Remove any existing click event listeners
        $('#submitQuiz').off('click');
        
        $('#submitQuiz').on('click', () => {
            if (!this.currentQuiz) return;

            const timeSpent = QuizUI.timeLimit - QuizUI.timeRemaining;

            // Use gatherAnswers to collect all answers
            const answers = this.gatherAnswers();

            this.submitQuiz(answers);
            
            console.log(`Time spent: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`);
        });
    },

    submitQuiz: function(answers) {
        const quizData = this.currentQuiz;
        
        // Validate answers
        if (answers.length !== quizData.questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        // Calculate results with enhanced explanation handling
        const resultsDetails = answers.map((answer, index) => {
            const question = quizData.questions[index];
            const isCorrect = this.compareAnswers(answer.userAnswer, question.correct_answer);
            
            return {
                questionText: question.question,
                userAnswer: answer.userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect: isCorrect,
                explanation: question.explanation.text || "No explanation available.",
                references: question.explanation.references || [],
                searchResults: question.searchResults || "",
                type: question.type,
                options: question.options || [],
                descriptions: question.descriptions || []
            };
        });

        QuizUI.displayResults(resultsDetails);
    },

    gatherAnswers: function() {
        const answers = [];
        const seenQuestions = new Set();

        this.currentQuiz.questions.forEach((question, index) => {
            // Prevent duplicate questions
            if (seenQuestions.has(question.question)) return;
            seenQuestions.add(question.question);

            const userAnswer = this.getUserAnswer(question, index);
            answers.push({
                questionText: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect: this.compareAnswers(userAnswer, question.correct_answer),
                type: question.type,
                explanation: question.explanation,
                references: question.references || [],
                metadata: question.metadata || {}
            });
        });
        return answers;
    },

    getUserAnswer: function(question, index) {
        let userAnswer;
        
        switch (question.type) {
            case 'multiple_choice':
            case 'true_false':
                userAnswer = $(`[name="q${index}"]:checked`).val();
                break;
                
            case 'fill_blank':
                userAnswer = $(`select[name="q${index}"]`).val();
                break;

            case 'drag_drop':
                userAnswer = question.descriptions ? 
                    this.getMatchingAnswers(index) : 
                    this.getOrderingAnswers(index);
                break;

            case 'coding':
                userAnswer = this.getCodingAnswers(index);
                break;
        }

        // Add metadata about the answer
        return {
            value: userAnswer,
            timestamp: new Date().toISOString(),
            questionType: question.type
        };
    },

    getMatchingAnswers: function(index) {
        const answers = [];
        $(`.drop-zone-item[data-question="${index}"]`).each(function() {
            const dragItem = $(this).find('.drag-item');
            answers.push(dragItem.length ? dragItem.attr('data-value') : null);
        });
        return answers;
    },

    getOrderingAnswers: function(index) {
        const answers = [];
        $(`.ordering-zone[data-question="${index}"] .drag-item`).each(function() {
            answers.push($(this).attr('data-value'));
        });
        return answers;
    },

    getCodingAnswers: function(index) {
        const answers = [];
        $(`.coding-drop-zone[data-question="${index}"]`).each(function() {
            const dragItem = $(this).find('.drag-item');
            answers.push(dragItem.length ? dragItem.attr('data-value') : null);
        });
        return answers;
    },

    // Compare user answers with correct answers
    compareAnswers: function(userAnswer, correctAnswer) {
        console.log('Comparing Answers:', {
            userAnswer: userAnswer, 
            correctAnswer: correctAnswer
        });

        // Handle true/false questions
        if (typeof correctAnswer === 'string' && 
            (correctAnswer.toLowerCase() === 'true' || correctAnswer.toLowerCase() === 'false')) {
            const normalizedUser = String(userAnswer).toLowerCase() === 'true';
            const normalizedCorrect = String(correctAnswer).toLowerCase() === 'true';
            return normalizedUser === normalizedCorrect;
        }

        // Handle arrays (for drag_drop and coding questions)
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
            if (userAnswer.length !== correctAnswer.length) return false;
            return userAnswer.every((val, idx) => val === correctAnswer[idx]);
        }

        // Handle other question types
        return String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
    },

    // Setup drag and drop functionality
    setupDragDropListeners: function() {
        $(document).on({
            dragstart: function(e) {
                e.originalEvent.dataTransfer.setData('text/plain', '');
                $(this).addClass('dragging');
            },
            dragend: function() {
                $(this).removeClass('dragging');
            }
        }, '.drag-item');

        $(document).on({
            dragover: function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).addClass('drag-over');
            },
            dragleave: function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('drag-over');
            },
            drop: function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dropZone = $(this);
                dropZone.removeClass('drag-over');
                
                const draggedItem = $('.dragging');
                if (!draggedItem.length) return;
                
                const questionId = dropZone.attr('data-question');
                const sourceContainer = $(`.drag-items-container[data-question="${questionId}"]`);
                
                // Handle item placement
                if (dropZone.hasClass('drop-zone-item') || dropZone.hasClass('ordering-zone')) {
                    const existingItem = dropZone.find('.drag-item');
                    if (existingItem.length) {
                        const value = existingItem.attr('data-value');
                        sourceContainer.find(`.drag-item[data-value="${value}"][data-hidden="true"]`)
                            .css('display', '')
                            .removeAttr('data-hidden');
                        existingItem.remove();
                    }
                    
                    const newItem = draggedItem.clone();
                    newItem.removeClass('dragging');
                    dropZone.append(newItem);
                    
                    if (draggedItem.attr('data-source') === 'container') {
                        draggedItem.css('display', 'none').attr('data-hidden', 'true');
                    } else {
                        draggedItem.remove();
                    }
                }
            }
        }, '.drop-zone-item, .ordering-zone');
    }
};
