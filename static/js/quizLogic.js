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

            try {
                const response = await QuizAPI.generateQuiz(quizConfig);
                this.currentQuiz = QuizAPI.parseQuizData(response);
                QuizUI.displayQuiz(this.currentQuiz);
                $('#quizContainer').removeClass('d-none');
            } catch (error) {
                console.error('Error:', error);
                alert('Error generating quiz. Please try again.');
            } finally {
                QuizUI.hideLoading();
            }
        });
    },

    // Setup quiz submission
    setupQuizSubmission: function() {
        $('#submitQuiz').on('click', () => {
            if (!this.currentQuiz) return;

            const answers = [];
            this.currentQuiz.questions.forEach((question, index) => {
                let userAnswer;
                let correctAnswer = question.correct_answer;

                switch (question.type) {
                    case 'multiple_choice':
                    case 'fill_blank':
                        userAnswer = $(`[name="q${index}"]:checked`).val() || $(`select[name="q${index}"]`).val();
                        break;

                    case 'drag_drop':
                        if (question.descriptions) {
                            // Matching type question
                            userAnswer = [];
                            $(`.drop-zone-item[data-question="${index}"]`).each(function() {
                                const dragItem = $(this).find('.drag-item');
                                userAnswer.push(dragItem.length ? dragItem.attr('data-value') : null);
                            });
                        } else {
                            // Ordering type question
                            userAnswer = [];
                            $(`.ordering-zone[data-question="${index}"] .drag-item`).each(function() {
                                userAnswer.push($(this).attr('data-value'));
                            });
                        }
                        break;
                }

                answers.push({
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswer,
                    isCorrect: this.compareAnswers(userAnswer, correctAnswer)
                });
            });

            QuizUI.displayResults(answers);
        });
    },

    // Compare user answers with correct answers
    compareAnswers: function(userAnswer, correctAnswer) {
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
            return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        }
        return userAnswer === correctAnswer;
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
