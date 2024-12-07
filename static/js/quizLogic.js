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
            this.showErrorMessage("Please answer all questions before submitting.");
            return;
        }

        // Calculate score
        let correctCount = 0;
        const resultsDetails = answers.map((answer, index) => {
            const question = quizData.questions[index];
            const isCorrect = this.compareAnswers(answer.userAnswer, question.correct_answer);
            
            if (isCorrect) correctCount++;
            
            return {
                questionText: question.question,
                userAnswer: answer.userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect: isCorrect,
                explanation: question.explanation || "No explanation available.",
                references: question.references || []
            };
        });

        // Prepare results
        const results = {
            totalQuestions: quizData.questions.length,
            correctAnswers: correctCount,
            score: Math.round((correctCount / quizData.questions.length) * 100),
            details: resultsDetails
        };

        // Display results modal
        this.displayResultsModal(results);
    },

    displayResultsModal: function(results) {
        const modalContent = `
            <div class="quiz-results-container">
                <h2 class="text-center mb-4">Quiz Results</h2>
                <div class="score-summary card mb-4">
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-4">
                                <h5>Total Questions</h5>
                                <span class="badge bg-secondary">${results.totalQuestions}</span>
                            </div>
                            <div class="col-4">
                                <h5>Correct Answers</h5>
                                <span class="badge bg-success">${results.correctAnswers}</span>
                            </div>
                            <div class="col-4">
                                <h5>Score</h5>
                                <span class="badge ${results.score >= 70 ? 'bg-success' : results.score >= 50 ? 'bg-warning' : 'bg-danger'}">${results.score}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="detailed-results">
                    ${results.details.map((detail, index) => `
                        <div class="card mb-3 ${detail.isCorrect ? 'border-success' : 'border-danger'}">
                            <div class="card-header d-flex justify-content-between align-items-center ${detail.isCorrect ? 'bg-success-subtle' : 'bg-danger-subtle'}">
                                <h5 class="mb-0">Question ${index + 1}</h5>
                                <span class="badge ${detail.isCorrect ? 'bg-success' : 'bg-danger'}">
                                    ${detail.isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                            </div>
                            <div class="card-body">
                                <div class="question-section mb-3">
                                    <h6 class="card-title">Question</h6>
                                    <p class="card-text">${detail.questionText}</p>
                                </div>
                                <div class="answer-section mb-3">
                                    <h6 class="card-title">Your Answer</h6>
                                    <p class="card-text ${detail.isCorrect ? 'text-success' : 'text-danger'}">
                                        ${detail.userAnswer}
                                    </p>
                                </div>
                                <div class="correct-answer-section mb-3">
                                    <h6 class="card-title">Correct Answer</h6>
                                    <p class="card-text text-success">
                                        ${detail.correctAnswer}
                                    </p>
                                </div>
                                <div class="explanation-section mb-3">
                                    <h6 class="card-title">Explanation</h6>
                                    <p class="card-text">${detail.explanation}</p>
                                </div>
                                ${detail.references.length > 0 ? `
                                    <div class="references-section">
                                        <h6 class="card-title">References</h6>
                                        <ul class="list-group">
                                            ${detail.references.map(ref => `
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <a href="${ref.url}" target="_blank" class="text-primary">${ref.title}</a>
                                                    <span class="badge bg-info">${ref.source}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-body">
                        ${modalContent}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body and show
        document.body.appendChild(modal);
        $(modal).modal('show');

        // Remove modal when closed
        $(modal).on('hidden.bs.modal', function () {
            document.body.removeChild(modal);
        });
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
                references: question.references
            });
        });
        return answers;
    },

    getUserAnswer: function(question, index) {
        switch (question.type) {
            case 'multiple_choice':
            case 'fill_blank':
            case 'true_false':
                return $(`[name="q${index}"]:checked`).val() || 
                       $(`select[name="q${index}"]`).val();

            case 'drag_drop':
                return question.descriptions ? 
                    this.getMatchingAnswers(index) : 
                    this.getOrderingAnswers(index);

            case 'coding':
                return this.getCodingAnswers(index);

            default:
                return null;
        }
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
