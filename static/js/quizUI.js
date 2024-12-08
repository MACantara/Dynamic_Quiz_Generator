// quizUI.js - Handles all UI-related functionality

const QuizUI = {
    // Add timer properties
    timer: null,
    timeLimit: 3600, // Default: 1 hour in seconds
    timeRemaining: 0,

    // Utility function to shuffle an array
    shuffleArray: function(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    },

    // Show loading state
    showLoading: function() {
        $('#quizContainer').addClass('d-none');
        $('button[type="submit"]').prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...'
        );
    },

    // Hide loading state
    hideLoading: function() {
        $('button[type="submit"]').prop('disabled', false).text('Generate Quiz');
    },

    // Display multiple choice question
    displayMultipleChoice: function(question, index, questionBody) {
        const shuffledOptions = this.shuffleArray(question.options);
        const mcOptions = $('<div>').addClass('options');
        shuffledOptions.forEach((option, optionIndex) => {
            mcOptions.append(`
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" id="q${index}_${optionIndex}" value="${option}">
                    <label class="form-check-label w-100 cursor-pointer" for="q${index}_${optionIndex}">${option}</label>
                </div>
            `);
        });
        questionBody.append(mcOptions);
    },

    // Display drag and drop question
    displayDragDrop: function(question, index, questionBody) {
        const matchingContainer = $('<div>').addClass('row');
        
        // Left column - Draggable items
        const leftCol = this.createDragDropLeftColumn(question, index);
        
        // Right column - Drop zones
        const rightCol = this.createDragDropRightColumn(question, index);
        
        matchingContainer.append(leftCol, rightCol);
        questionBody.append(matchingContainer);
    },

    // Create left column for drag and drop
    createDragDropLeftColumn: function(question, index) {
        const dragDropLeftCol = $('<div>').addClass('col-md-6');
        dragDropLeftCol.append($('<div>').addClass('drop-zone-label').text('Available items:'));
        
        const dragDropItemsContainer = $('<div>')
            .addClass('drag-items-container')
            .attr('data-question', index);
        
        const shuffledOptions = this.shuffleArray(question.options);
        shuffledOptions.forEach(option => {
            dragDropItemsContainer.append(this.createDragItem(option, index, true));
        });
        
        dragDropLeftCol.append(dragDropItemsContainer);
        return dragDropLeftCol;
    },

    // Create right column for drag and drop
    createDragDropRightColumn: function(question, index) {
        const dragDropRightCol = $('<div>').addClass('col-md-6');
        
        if (question.descriptions) {
            // Matching type question
            question.descriptions.forEach((desc, i) => {
                const dropContainer = $('<div>').addClass('mb-3');
                dropContainer.append($('<div>').addClass('drop-zone-label').text(desc));
                dropContainer.append(
                    $('<div>')
                        .addClass('drop-zone-item')
                        .attr('data-index', i)
                        .attr('data-question', index)
                );
                dragDropRightCol.append(dropContainer);
            });
        } else {
            // Ordering type question
            dragDropRightCol
                .append($('<div>').addClass('drop-zone-label').text('Arrange items in the correct order:'))
                .append(
                    $('<div>')
                        .addClass('ordering-zone')
                        .attr('data-question', index)
                );
        }
        
        return dragDropRightCol;
    },

    // Create a draggable item
    createDragItem: function(option, index, isOriginal = true) {
        const dragItem = $('<div>')
            .addClass('drag-item mb-2')
            .attr('data-value', option)
            .attr('data-source', isOriginal ? 'container' : 'clone')
            .attr('draggable', 'true');
        
        const itemContent = $('<div>')
            .addClass('d-flex justify-content-between align-items-center');

        // Add drag handle
        const dragHandle = $('<div>')
            .addClass('drag-handle me-2')
            .html('<i class="fas fa-grip-vertical"></i>');
        
        itemContent.append(
            dragHandle,
            $('<span>').addClass('flex-grow-1').text(option)
        );
        
        // Only add remove button for cloned items
        if (!isOriginal) {
            const removeButton = $('<button>')
                .addClass('btn btn-sm btn-outline-danger remove-item')
                .html('<i class="fas fa-times"></i>')
                .on('click', this.handleRemoveItem);
            itemContent.append(removeButton);
        }
        
        dragItem.append(itemContent);
        return dragItem;
    },

    // Clone a drag item for drop zones
    cloneDragItem: function(originalItem) {
        const option = originalItem.attr('data-value');
        const questionIndex = originalItem.closest('[data-question]').attr('data-question');
        const clone = this.createDragItem(option, questionIndex, false);
        return clone;
    },

    // Handle remove item click
    handleRemoveItem: function(e) {
        e.stopPropagation();
        const item = $(this).closest('.drag-item');
        const questionId = item.closest('[data-question]').attr('data-question');
        const sourceContainer = $(`.drag-items-container[data-question="${questionId}"]`);
        const hiddenItem = sourceContainer.find(`.drag-item[data-value="${item.attr('data-value')}"][data-hidden="true"]`);
        
        if (hiddenItem.length) {
            hiddenItem.css('display', '').removeAttr('data-hidden');
        }
        item.remove();
    },

    // Display fill in the blank question
    displayFillBlank: function(question, index, questionBody) {
        const fillBlankInput = $('<div>').addClass('fill-blank-container');
        const parts = question.question.split('_____');
        
        parts.forEach((part, i) => {
            fillBlankInput.append(document.createTextNode(part));
            if (i < parts.length - 1) {
                const select = this.createFillBlankSelect(question.options, index);
                fillBlankInput.append(select);
            }
        });
        
        questionBody.append(fillBlankInput);
    },

    // Create select element for fill in the blank
    createFillBlankSelect: function(options, index) {
        return $('<select>')
            .addClass('form-select d-inline-block')
            .css({
                'width': 'auto',
                'min-width': '150px',
                'margin': '0 5px'
            })
            .attr('name', `q${index}`)
            .append($('<option>').val('').text('Select answer...'))
            .append(options.map(option => 
                $('<option>').val(option).text(option)
            ));
    },

    // Display true/false question
    displayTrueFalse: function(question, index, questionBody) {
        const tfOptions = $('<div>').addClass('options');
        ['True', 'False'].forEach((option, optionIndex) => {
            tfOptions.append(`
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" id="q${index}_${optionIndex}" value="${option.toLowerCase()}">
                    <label class="form-check-label w-100 cursor-pointer" for="q${index}_${optionIndex}">${option}</label>
                </div>
            `);
        });
        questionBody.append(tfOptions);
    },

    // Display coding question
    displayCoding: function(question, index, questionBody) {
        const codingContainer = $('<div>').addClass('row');
        
        // Create a closure to maintain dropZoneCounter state
        const createDropZone = (function() {
            let dropZoneCounter = 0;
            return function() {
                return $('<div>')
                    .addClass('drop-zone-item coding-drop-zone')
                    .attr({
                        'data-question': index,
                        'data-index': dropZoneCounter++
                    });
            };
        })();
        
        // Left column - Code snippets
        const leftCol = $('<div>').addClass('col-md-4');
        leftCol.append($('<div>').addClass('drop-zone-label').text('Code Snippets:'));
        
        const dragItemsContainer = $('<div>')
            .addClass('drag-items-container code-snippets')
            .attr('data-question', index);
        
        const shuffledOptions = this.shuffleArray(question.options);
        shuffledOptions.forEach(option => {
            dragItemsContainer.append(this.createDragItem(option, index, true));
        });
        
        leftCol.append(dragItemsContainer);
    
        // Right column - Code display with drop zones
        const rightCol = $('<div>').addClass('col-md-8');
        const codeDisplay = $('<div>').addClass('code-display');
    
        // Process code template
        const codeLines = question.code_template.split('\n');
        codeLines.forEach((line, lineIndex) => {
            const codeLine = $('<div>').addClass('code-line');
            
            // Handle indentation
            const leadingSpaces = line.match(/^\s*/)[0];
            if (leadingSpaces) {
                codeLine.append($('<span>').addClass('code-indent').text(leadingSpaces));
            }
    
            // Split line by drop zones
            const parts = line.trim().split('_____');
            parts.forEach((part, partIndex) => {
                codeLine.append($('<span>').addClass('code-block').text(part));
                
                if (partIndex < parts.length - 1) {
                    codeLine.append(createDropZone());
                }
            });
            
            codeDisplay.append(codeLine);
        });
    
        rightCol.append(codeDisplay);
        codingContainer.append(leftCol, rightCol);
        questionBody.append(codingContainer);
    },

    // Display quiz questions
    displayQuiz: function(quiz) {
        this.setQuizTime();
        // Reset timer
        this.timeRemaining = this.timeLimit;
        this.startTimer();
        
        const questionsContainer = $('#questions');
        questionsContainer.empty();

        quiz.questions.forEach((question, index) => {
            const questionDiv = $('<div>').addClass('card mb-3');
            const questionBody = $('<div>').addClass('card-body');
            
            // Add question number header
            const questionHeader = $('<div>')
                .addClass('d-flex align-items-center mb-3')
                .append(
                    $('<h5>')
                        .addClass('card-title mb-0')
                        .text(`Question ${index + 1}`)
                );
            questionBody.append(questionHeader);
            
            if (question.type !== 'fill_blank') {
                questionBody.append($('<p>').addClass('card-text').text(question.question));
            }

            switch (question.type) {
                case 'multiple_choice':
                    this.displayMultipleChoice(question, index, questionBody);
                    break;
                case 'drag_drop':
                    this.displayDragDrop(question, index, questionBody);
                    break;
                case 'fill_blank':
                    this.displayFillBlank(question, index, questionBody);
                    break;
                case 'true_false':
                    this.displayTrueFalse(question, index, questionBody);
                    break;
                case 'coding':
                    this.displayCoding(question, index, questionBody);
                    break;
            }

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });
    },

    startTimer: function() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        const updateDisplay = () => {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            $('#timerDisplay').text(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );

            // Add warning classes
            const $timer = $('#quizTimer');
            if (this.timeRemaining <= 300) { // 5 minutes
                $timer.removeClass('warning').addClass('danger');
            } else if (this.timeRemaining <= 600) { // 10 minutes
                $timer.removeClass('danger').addClass('warning');
            }
        };

        updateDisplay();
        this.timer = setInterval(() => {
            this.timeRemaining--;
            updateDisplay();

            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                $('#submitQuiz').click(); // Auto-submit when time expires
            }
        }, 1000);
    },

    stopTimer: function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    // Display quiz results
    displayResults: function(answers) {
        this.stopTimer();
        const questionsContainer = $('#questions');
        questionsContainer.empty();
        
        // Add score summary at the top
        const correctCount = answers.filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / answers.length) * 100);
        questionsContainer.prepend(
            $('<div>')
                .addClass('alert alert-info mb-4')
                .html(`
                    <h4 class="alert-heading">Quiz Results</h4>
                    <p class="mb-0">
                        <span class="h2">${score}%</span><br>
                        <span class="text-muted">${correctCount} out of ${answers.length} correct</span>
                    </p>
                `)
        );

        // Display each question with results
        answers.forEach((answer, index) => {
            const questionDiv = $('<div>').addClass('card mb-3');
            const questionBody = $('<div>').addClass('card-body');
            
            // Question header with badge
            const badge = $('<span>')
                .addClass(`badge ${answer.isCorrect ? 'bg-success' : 'bg-danger'} ms-2`)
                .text(answer.isCorrect ? 'Correct' : 'Incorrect');
            
            questionBody.append(
                $('<div>')
                    .addClass('d-flex justify-content-between align-items-center mb-3')
                    .append(
                        $('<h5>').addClass('card-title mb-0').text(`Question ${index + 1}`),
                        badge
                    ),
                $('<p>').addClass('card-text mb-3').text(answer.questionText)
            );

            // Display answer options and results
            this.displayResultAnswers(answer, questionBody);
            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Add restart button
        questionsContainer.append(
            $('<button>')
                .addClass('btn btn-primary mt-3')
                .text('Start New Quiz')
                .on('click', () => {
                    $('#quizForm').trigger('reset');
                    $('#quizContainer').addClass('d-none');
                })
        );
    },

    displayResultAnswers: function(answer, container) {
        const answersSection = $('<div>').addClass('answers-section mb-4');
        
        // Display based on question type
        switch (answer.type) {
            case 'multiple_choice':
            case 'true_false':
                this.displayMCResult(answer, answersSection);
                break;
            case 'fill_blank':
                this.displayFillBlankResult(answer, answersSection);
                break;
            case 'drag_drop':
                this.displayDragDropResult(answer, answersSection);
                break;
            case 'coding':
                this.displayCodingResult(answer, answersSection);
                break;
        }
        
        container.append(answersSection);
    },

    displayMCResult: function(answer, container) {
        const options = answer.type === 'true_false' ? ['True', 'False'] : answer.options;
        
        options.forEach(option => {
            const isUserAnswer = String(answer.userAnswer).toLowerCase() === String(option).toLowerCase();
            const isCorrectAnswer = String(answer.correctAnswer).toLowerCase() === String(option).toLowerCase();
            
            const optionDiv = $('<div>')
                .addClass('form-check mb-2 p-2 rounded')
                .toggleClass('bg-success bg-opacity-10', isCorrectAnswer)
                .toggleClass('border border-2', isUserAnswer)
                .toggleClass('border-success', isUserAnswer && isCorrectAnswer)
                .toggleClass('border-danger', isUserAnswer && !isCorrectAnswer);
            
            optionDiv.append(
                $('<div>').addClass('d-flex align-items-center').append(
                    $('<input>')
                        .addClass('form-check-input me-2')
                        .attr({
                            type: 'radio',
                            disabled: true,
                            checked: isUserAnswer
                        }),
                    $('<label>')
                        .addClass('form-check-label flex-grow-1')
                        .text(option),
                    isUserAnswer && $('<i>')
                        .addClass(`fas fa-${isCorrectAnswer ? 'check text-success' : 'times text-danger'} ms-2`)
                )
            );
            
            container.append(optionDiv);
        });

        // Add explanation immediately after the options
        if (answer.explanation) {
            container.append(
                $('<div>')
                    .addClass('explanation-section mt-3 p-3 bg-light border rounded')
                    .append(
                        $('<h6>').addClass('mb-2').text('Explanation:'),
                        $('<p>').addClass('mb-0').text(answer.explanation)
                    )
            );
        }

        // Add references if available
        if (answer.references && answer.references.length > 0) {
            const refsContainer = $('<div>')
                .addClass('references-section mt-3')
                .append($('<h6>').addClass('mb-2').text('Learn More:'));

            const refsList = $('<ul>').addClass('list-unstyled mb-0');
            answer.references.forEach(ref => {
                if (this.isValidUrl(ref.url)) {
                    refsList.append(
                        $('<li>').append(
                            $('<a>')
                                .attr({
                                    href: ref.url,
                                    target: '_blank',
                                    rel: 'noopener noreferrer'
                                })
                                .addClass('text-decoration-none')
                                .html(`<i class="fas fa-external-link-alt me-1"></i>${ref.title || 'Reference'}`)
                        )
                    );
                }
            });
            
            refsContainer.append(refsList);
            container.append(refsContainer);
        }
    },

    displayFillBlankResult: function(answer, container) {
        const userAnswer = answer.userAnswer || 'No answer provided';
        const correctAnswer = answer.correctAnswer;
        
        container.append(
            $('<div>').addClass('answer-display p-2 rounded mb-2').append(
                $('<div>').addClass('mb-2').html(
                    `<strong>Your answer:</strong> <span class="${answer.isCorrect ? 'text-success' : 'text-danger'}">${userAnswer}</span>`
                ),
                $('<div>').html(`<strong>Correct answer:</strong> <span class="text-success">${correctAnswer}</span>`)
            )
        );
    },

    displayDragDropResult: function(answer, container) {
        const userAnswers = Array.isArray(answer.userAnswer) ? answer.userAnswer : [answer.userAnswer];
        const correctAnswers = Array.isArray(answer.correctAnswer) ? answer.correctAnswer : [answer.correctAnswer];
        
        container.append(
            $('<div>').addClass('answer-display p-2 rounded mb-2').append(
                $('<div>').addClass('mb-2').html('<strong>Your order:</strong>'),
                $('<div>').addClass('mb-3').text(userAnswers.join(' → ')),
                $('<div>').addClass('mb-2').html('<strong>Correct order:</strong>'),
                $('<div>').addClass('text-success').text(correctAnswers.join(' → '))
            )
        );
    },

    displayCodingResult: function(answer, container) {
        // Similar to drag_drop but with code formatting
        const userAnswers = Array.isArray(answer.userAnswer) ? answer.userAnswer : [answer.userAnswer];
        const correctAnswers = Array.isArray(answer.correctAnswer) ? answer.correctAnswer : [answer.correctAnswer];
        
        container.append(
            $('<div>').addClass('answer-display p-2 rounded mb-2').append(
                $('<div>').addClass('mb-2').html('<strong>Your code:</strong>'),
                $('<pre>').addClass('mb-3').text(userAnswers.join('\n')),
                $('<div>').addClass('mb-2').html('<strong>Correct code:</strong>'),
                $('<pre>').addClass('text-success').text(correctAnswers.join('\n'))
            )
        );
    },

    // Display quiz results
    displayResults: function(answers) {
        this.stopTimer();
        const questionsContainer = $('#questions');
        questionsContainer.empty();
        
        // Add score summary at the top
        const correctCount = answers.filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / answers.length) * 100);
        questionsContainer.prepend(
            $('<div>')
                .addClass('alert alert-info mb-4')
                .html(`
                    <h4 class="alert-heading">Quiz Results</h4>
                    <p class="mb-0">
                        <span class="h2">${score}%</span><br>
                        <span class="text-muted">${correctCount} out of ${answers.length} correct</span>
                    </p>
                `)
        );

        // Display each question with results
        answers.forEach((answer, index) => {
            const questionDiv = $('<div>').addClass('card mb-3');
            const questionBody = $('<div>').addClass('card-body');
            
            // Question header with badge
            const badge = $('<span>')
                .addClass(`badge ${answer.isCorrect ? 'bg-success' : 'bg-danger'} ms-2`)
                .text(answer.isCorrect ? 'Correct' : 'Incorrect');
            
            questionBody.append(
                $('<div>')
                    .addClass('d-flex justify-content-between align-items-center mb-3')
                    .append(
                        $('<h5>').addClass('card-title mb-0').text(`Question ${index + 1}`),
                        badge
                    )
            );

            // Question text
            questionBody.append($('<p>').addClass('card-text mb-3').text(answer.questionText));

            // Display answer options based on question type
            this.displayResultAnswers(answer, questionBody);

            // Add explanation in a collapsible section
            if (answer.explanation || (answer.references && answer.references.length)) {
                const explanationId = `explanation-${index}`;
                questionBody.append(
                    $('<div>').addClass('mt-3').append(
                        $('<button>')
                            .addClass('btn btn-outline-secondary btn-sm w-100')
                            .attr({
                                'type': 'button',
                                'data-bs-toggle': 'collapse',
                                'data-bs-target': `#${explanationId}`,
                                'aria-expanded': 'false'
                            })
                            .text('Show Explanation'),
                        $('<div>')
                            .addClass('collapse mt-3')
                            .attr('id', explanationId)
                            .append(this.createExplanationBlock(answer))
                    )
                );
            }

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Add restart button
        questionsContainer.append(
            $('<button>')
                .addClass('btn btn-primary mt-3')
                .text('Start New Quiz')
                .on('click', () => {
                    $('#quizForm').trigger('reset');
                    $('#quizContainer').addClass('d-none');
                })
        );
    },

    displayResultAnswers: function(answer, container) {
        const answerBlock = $('<div>').addClass('answer-options');
        
        switch (answer.type) {
            case 'multiple_choice':
            case 'true_false':
                this.displayMCResult(answer, answerBlock);
                break;
            case 'fill_blank':
                this.displayFillBlankResult(answer, answerBlock);
                break;
            case 'drag_drop':
                this.displayDragDropResult(answer, answerBlock);
                break;
            case 'coding':
                this.displayCodingResult(answer, answerBlock);
                break;
        }
        
        container.append(answerBlock);
    },

    displayMCResult: function(answer, container) {
        const options = answer.type === 'true_false' ? ['True', 'False'] : answer.options;
        
        options.forEach(option => {
            const isUserAnswer = String(answer.userAnswer).toLowerCase() === String(option).toLowerCase();
            const isCorrectAnswer = String(answer.correctAnswer).toLowerCase() === String(option).toLowerCase();
            
            const optionDiv = $('<div>')
                .addClass('form-check mb-2 p-2 rounded')
                .toggleClass('bg-success bg-opacity-10', isCorrectAnswer)
                .toggleClass('border border-2', isUserAnswer)
                .toggleClass('border-success', isUserAnswer && isCorrectAnswer)
                .toggleClass('border-danger', isUserAnswer && !isCorrectAnswer);
            
            optionDiv.append(
                $('<div>').addClass('d-flex align-items-center').append(
                    $('<input>')
                        .addClass('form-check-input me-2')
                        .attr({
                            type: 'radio',
                            disabled: true,
                            checked: isUserAnswer
                        }),
                    $('<label>')
                        .addClass('form-check-label flex-grow-1')
                        .text(option),
                    isUserAnswer && $('<i>')
                        .addClass(`fas fa-${isCorrectAnswer ? 'check text-success' : 'times text-danger'} ms-2`)
                )
            );
            
            container.append(optionDiv);
        });

        // Add explanation immediately after the options
        if (answer.explanation) {
            container.append(
                $('<div>')
                    .addClass('explanation-section mt-3 p-3 bg-light border rounded')
                    .append(
                        $('<h6>').addClass('mb-2').text('Explanation:'),
                        $('<p>').addClass('mb-0').text(answer.explanation)
                    )
            );
        }

        // Add references if available
        if (answer.references && answer.references.length > 0) {
            const refsContainer = $('<div>')
                .addClass('references-section mt-3')
                .append($('<h6>').addClass('mb-2').text('Learn More:'));

            const refsList = $('<ul>').addClass('list-unstyled mb-0');
            answer.references.forEach(ref => {
                if (this.isValidUrl(ref.url)) {
                    refsList.append(
                        $('<li>').append(
                            $('<a>')
                                .attr({
                                    href: ref.url,
                                    target: '_blank',
                                    rel: 'noopener noreferrer'
                                })
                                .addClass('text-decoration-none')
                                .html(`<i class="fas fa-external-link-alt me-1"></i>${ref.title || 'Reference'}`)
                        )
                    );
                }
            });
            
            refsContainer.append(refsList);
            container.append(refsContainer);
        }
    },

    createAnswerHeader: function(index, badge) {
        return $('<div>')
            .addClass('d-flex align-items-center mb-2')
            .append(
                $('<strong>').text(`Question ${index + 1}`),
                badge
            );
    },

    createAnswerDetails: function(answer) {
        return $('<div>').append(
            $('<div>').addClass('question-text mb-2').text(answer.questionText),
            $('<div>').addClass('user-answer').html(`
                <strong>Your answer:</strong> 
                ${Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer || 'No answer provided'}
            `),
            $('<div>').addClass('correct-answer').html(`
                <strong>Correct answer:</strong> 
                ${Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : answer.correctAnswer}
            `)
        );
    },

    createExplanationBlock: function(answer) {
        if (!answer.explanation && (!answer.references || !answer.references.length)) {
            return '';
        }

        const explanationBlock = $('<div>').addClass('explanation-block mt-3');

        if (answer.explanation) {
            explanationBlock.append(
                $('<div>').addClass('explanation-title').text('Explanation:'),
                $('<div>').addClass('explanation-text').text(answer.explanation)
            );
        }

        if (answer.references && answer.references.length > 0) {
            const referencesList = $('<div>').addClass('mt-2');
            referencesList.append($('<div>').addClass('explanation-title').text('Learn more:'));
            
            const linksList = $('<ul>').addClass('references-list');
            answer.references.forEach(ref => {
                if (this.isValidUrl(ref.url)) {
                    const sourceName = this.getSourceName(ref.url);
                    linksList.append(
                        $('<li>').append(
                            $('<a>')
                                .attr({
                                    href: ref.url,
                                    target: '_blank',
                                    rel: 'noopener noreferrer'
                                })
                                .html(`${ref.title || 'Reference'} <small>(${sourceName})</small>`)
                        )
                    );
                }
            });
            
            if (linksList.children().length > 0) {
                referencesList.append(linksList);
                explanationBlock.append(referencesList);
            }
        }

        return explanationBlock;
    },

    isValidUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    getSourceName: function(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname.replace(/^www\./, '');
        } catch {
            return 'source';
        }
    },

    initializeTimer: function() {
        // Show/hide custom time input based on selection
        $('#quizTime').on('change', function() {
            const customTime = $(this).val() === 'custom';
            $('#customTimeInput').toggleClass('d-none', !customTime);
        });
    },

    setQuizTime: function() {
        const selectedTime = $('#quizTime').val();
        if (selectedTime === 'custom') {
            const customMinutes = parseInt($('#customMinutes').val()) || 60;
            this.timeLimit = Math.min(Math.max(customMinutes, 1), 180) * 60;
        } else {
            this.timeLimit = parseInt(selectedTime);
        }
    },
};
