$(document).ready(function() {
    let currentQuiz = null;

    // Utility function to shuffle an array using Fisher-Yates algorithm
    function shuffleArray(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    $('#quizForm').on('submit', function(e) {
        e.preventDefault();
        
        // Get selected question types
        const questionTypes = [];
        $('input[type="checkbox"]:checked').each(function() {
            questionTypes.push($(this).val());
        });

        // Prepare quiz configuration
        const quizConfig = {
            topic: $('#topic').val(),
            num_questions: $('#numQuestions').val(),
            question_types: questionTypes
        };

        // Show loading state
        $('#quizContainer').addClass('d-none');
        $('button[type="submit"]').prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...'
        );

        // Generate quiz
        $.ajax({
            url: '/generate',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(quizConfig),
            success: function(response) {
                try {
                    // Handle the response as a string that needs to be parsed
                    let quizData;
                    if (typeof response.quiz === 'string') {
                        // Clean the response string
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
                    
                    currentQuiz = quizData;
                    displayQuiz(quizData);
                    $('#quizContainer').removeClass('d-none');
                } catch (error) {
                    console.error('Error parsing quiz data:', error);
                    alert('Error generating quiz. Please try again.');
                }
            },
            error: function(error) {
                console.error('Error:', error);
                alert('Error generating quiz. Please try again.');
            },
            complete: function() {
                $('button[type="submit"]').prop('disabled', false).text('Generate Quiz');
            }
        });
    });

    function displayQuiz(quiz) {
        const questionsContainer = $('#questions');
        questionsContainer.empty();

        quiz.questions.forEach((question, index) => {
            const questionDiv = $('<div>').addClass('card mb-3');
            const questionBody = $('<div>').addClass('card-body');
            
            // Add question text only once
            if (question.type === 'drag_drop') {
                questionBody.append($('<p>').addClass('card-text').text(question.question));
            }

            switch (question.type) {
                case 'multiple_choice':
                    // Randomize options
                    const shuffledOptions = shuffleArray(question.options);
                    
                    const mcOptions = $('<div>').addClass('options');
                    shuffledOptions.forEach(option => {
                        mcOptions.append(`
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="q${index}" value="${option}">
                                <label class="form-check-label">${option}</label>
                            </div>
                        `);
                    });
                    questionBody.append(mcOptions);
                    break;

                case 'drag_drop':
                    const dragZone = $('<div>').addClass('drag-zone mb-2');
                    const dropZone = $('<div>').addClass('drop-zone').attr('data-question', index);
                    
                    // Create two-column layout for matching
                    const matchingContainer = $('<div>').addClass('row');
                    
                    // Left column - Draggable items
                    const dragDropLeftCol = $('<div>').addClass('col-md-6');
                    dragDropLeftCol.append($('<div>').addClass('drop-zone-label').text('Available items:'));
                    const dragDropItemsContainer = $('<div>')
                        .addClass('drag-items-container')
                        .attr('data-question', index);
                    
                    // Randomize options for drag and drop
                    const shuffledDragDropOptions = shuffleArray(question.options);
                    
                    shuffledDragDropOptions.forEach(option => {
                        const dragItem = $('<div>')
                            .addClass('drag-item mb-2')
                            .attr('data-value', option)
                            .attr('data-source', 'container')
                            .attr('draggable', 'true');
                        
                        const itemContent = $('<div>')
                            .addClass('d-flex justify-content-between align-items-center')
                            .append($('<span>').text(option));
                        
                        // Only add remove button to source container items
                        const removeButton = $('<button>')
                            .addClass('btn btn-sm btn-outline-danger remove-item')
                            .html('<i class="fas fa-times"></i>')
                            .on('click', function(e) {
                                e.stopPropagation();
                                const item = $(this).closest('.drag-item');
                                const questionId = item.closest('[data-question]').attr('data-question');
                                const sourceContainer = $(`.drag-items-container[data-question="${questionId}"]`);
                                const hiddenItem = sourceContainer.find(`.drag-item[data-value="${item.attr('data-value')}"][data-hidden="true"]`);
                                
                                if (hiddenItem.length) {
                                    hiddenItem.css('display', '').removeAttr('data-hidden');
                                }
                                item.remove();
                            });
                        
                        itemContent.append(removeButton);
                        dragItem.append(itemContent);
                        dragDropItemsContainer.append(dragItem);
                    });
                    dragDropLeftCol.append(dragDropItemsContainer);
                    
                    // Right column - Drop zones
                    const dragDropRightCol = $('<div>').addClass('col-md-6');
                    if (question.descriptions) {
                        // Matching type question
                        question.descriptions.forEach((desc, i) => {
                            const dropContainer = $('<div>').addClass('mb-3');
                            dropContainer.append($('<div>').addClass('drop-zone-label').text(desc));
                            dropContainer
                                .append($('<div>')
                                    .addClass('drop-zone-item')
                                    .attr('data-index', i)
                                    .attr('data-question', index)
                                );
                            dragDropRightCol.append(dropContainer);
                        });
                    } else {
                        // Ordering type question
                        dragDropRightCol.append($('<div>').addClass('drop-zone-label').text('Arrange items in the correct order:'));
                        const orderingZone = $('<div>')
                            .addClass('ordering-zone')
                            .attr('data-question', index);
                        dragDropRightCol.append(orderingZone);
                    }
                    
                    matchingContainer.append(dragDropLeftCol, dragDropRightCol);
                    questionBody.append(matchingContainer);
                    break;

                case 'dropdown':
                    const select = $('<select>').addClass('form-select').attr('name', `q${index}`);
                    select.append($('<option>').val('').text('-- Select your answer --'));
                    question.options.forEach(option => {
                        select.append($('<option>').val(option).text(option));
                    });
                    questionBody.append(select);
                    break;

                case 'true_false':
                    const tfOptions = $('<div>').addClass('options');
                    ['true', 'false'].forEach(option => {
                        tfOptions.append(`
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="q${index}" value="${option}">
                                <label class="form-check-label">${option.charAt(0).toUpperCase() + option.slice(1)}</label>
                            </div>
                        `);
                    });
                    questionBody.append(tfOptions);
                    break;

                case 'coding':
                    // Create a drag and drop style coding question
                    const codingQuestionContainer = $('<div>').addClass('coding-question-container');
                    
                    // Add question description
                    const codingQuestionDescription = $('<div>')
                        .addClass('mb-3 text-muted')
                        .text(question.question);
                    
                    // Create a container for the entire coding challenge
                    const codingChallengeContainer = $('<div>').addClass('row');
                    
                    // Left column - Draggable code fragments
                    const codingLeftCol = $('<div>').addClass('col-md-4');
                    codingLeftCol.append($('<div>').addClass('drop-zone-label').text('Available Code Fragments:'));
                    const codingFragmentsContainer = $('<div>')
                        .addClass('drag-items-container')
                        .attr('data-question', index);
                    
                    // Randomize code fragments
                    const shuffledCodeFragments = shuffleArray(question.options);
                    
                    shuffledCodeFragments.forEach(fragment => {
                        const dragItem = $('<div>')
                            .addClass('drag-item mb-2')
                            .attr('data-value', fragment)
                            .attr('data-source', 'container')
                            .attr('draggable', 'true')
                            .text(fragment);
                        
                        codingFragmentsContainer.append(dragItem);
                    });
                    codingLeftCol.append(codingFragmentsContainer);
                    
                    // Right column - Code template with drop zones
                    const codingRightCol = $('<div>').addClass('col-md-8');
                    codingRightCol.append($('<div>').addClass('drop-zone-label').text('Complete the Code:'));
                    
                    // Parse the code template to create drop zones
                    const codeLines = question.code_template.split('\n');
                    const codeTemplateDisplay = $('<pre>').addClass('code-template');
                    
                    codeLines.forEach((line, lineIndex) => {
                        // Check if line contains a blank
                        const blankMatch = line.match(/___+/);
                        if (blankMatch) {
                            // Create a drop zone for this line
                            const dropZoneWrapper = $('<div>').addClass('code-drop-zone-wrapper');
                            
                            // Part of the line before the blank
                            const beforeBlank = line.substring(0, blankMatch.index);
                            dropZoneWrapper.append($('<span>').text(beforeBlank));
                            
                            // Create drop zone
                            const dropZone = $('<div>')
                                .addClass('drop-zone-item inline-drop-zone')
                                .attr('data-line', lineIndex)
                                .attr('data-question', index)
                                .text('Drag code here');
                            
                            // Part of the line after the blank
                            const afterBlank = line.substring(blankMatch.index + blankMatch[0].length);
                            
                            dropZoneWrapper.append(dropZone);
                            dropZoneWrapper.append($('<span>').text(afterBlank));
                            
                            codeTemplateDisplay.append(dropZoneWrapper);
                        } else {
                            // Regular line without a blank
                            codeTemplateDisplay.append($('<div>').text(line));
                        }
                    });
                    
                    codingRightCol.append(codeTemplateDisplay);
                    
                    // Assemble the coding question
                    codingChallengeContainer.append(codingLeftCol, codingRightCol);
                    
                    // Add everything to the question body
                    questionBody.append(codingQuestionDescription);
                    questionBody.append(codingChallengeContainer);
                    break;

                default:
                    questionBody.append($('<p>').addClass('card-text').text(question.question));
            }

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Set up drag and drop
        setTimeout(setupDragDropListeners, 100);
    }

    function setupDragDropListeners() {
        // Remove any existing drag and drop event listeners to prevent multiple bindings
        $(document).off('dragstart', '.drag-item')
                   .off('dragend', '.drag-item')
                   .off('dragover', '.drop-zone-item, .ordering-zone')
                   .off('drop', '.drop-zone-item, .ordering-zone')
                   .off('click', '.remove-dropped-item');

        // Drag start event
        $(document).on('dragstart', '.drag-item', function(e) {
            // Ensure the drag operation is supported
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            
            // Store the dragged item's data
            const dragData = {
                value: $(this).attr('data-value'),
                questionIndex: $(this).closest('[data-question]').attr('data-question')
            };
            
            // Store data and set drag image
            e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            
            // Visual feedback
            $(this).addClass('dragging');
            
            // Timeout to ensure visual feedback is applied
            setTimeout(() => {
                $(this).css('opacity', '0.5');
            }, 0);
        });

        // Drag end event
        $(document).on('dragend', '.drag-item', function(e) {
            // Reset visual styles
            $(this).removeClass('dragging').css('opacity', '');
            
            // If not dropped successfully, ensure item is visible
            if (e.originalEvent.dataTransfer.dropEffect === 'none') {
                $(this).css('display', '');
            }
        });

        // Drag over event
        $(document).on('dragover', '.drop-zone-item, .ordering-zone', function(e) {
            // Prevent default to allow dropping
            e.preventDefault();
            e.stopPropagation();
            
            // Set the drop effect
            e.originalEvent.dataTransfer.dropEffect = 'move';
            
            // Visual feedback for drop zone
            $(this).addClass('drag-over');
        });

        // Drag leave event
        $(document).on('dragleave', '.drop-zone-item, .ordering-zone', function(e) {
            // Remove drag over styling
            $(this).removeClass('drag-over');
        });

        // Drop event
        $(document).on('drop', '.drop-zone-item, .ordering-zone', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove drag over styling
            $(this).removeClass('drag-over');
            
            // Parse the dragged data
            let dragData;
            try {
                dragData = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
            } catch (error) {
                console.error('Error parsing drag data:', error);
                return;
            }
            
            // Find the original dragged item
            const draggedItem = $(`.drag-item[data-value="${dragData.value}"]`);
            
            // Check if the drop zone is already occupied
            if ($(this).find('.dropped-item').length > 0) {
                return;
            }

            // Ensure the original item is hidden before cloning
            draggedItem.css('display', 'none');
            
            // Create a clone for the drop zone
            const droppedItemClone = draggedItem.clone(true, true)
                .removeClass('dragging')
                .addClass('dropped-item')
                .attr('draggable', 'false')  // Prevent re-dragging
                .css('opacity', '1')
                .css('display', 'flex');
            
            // Remove any existing remove button from the clone
            droppedItemClone.find('.remove-item').remove();
            
            // Add remove button to the clone
            const removeButton = $('<button>')
                .addClass('btn btn-sm btn-outline-danger remove-dropped-item')
                .html('<i class="fas fa-times"></i>')
                .on('click', function() {
                    // Find the original item
                    const originalItem = $(`.drag-item[data-value="${dragData.value}"]`);
                    
                    // Restore the original item
                    originalItem.css('display', '');
                    
                    // Remove the dropped item
                    $(this).closest('.dropped-item').remove();
                });
            
            droppedItemClone.append(removeButton);
            
            // Clear the drop zone and add the new item
            $(this).empty().append(droppedItemClone);
            
            // Hide the original item
            draggedItem.css('display', 'none');
        });
    }

    // Ensure drag and drop is set up when the page is ready
    $(document).ready(function() {
        // Add a global event listener to prevent default drag behavior
        $(document).on('dragstart', function(e) {
            // Ensure only specific elements can be dragged
            if (!$(e.target).hasClass('drag-item')) {
                e.preventDefault();
            }
        });
    });

    function compareAnswers(userAnswer, correctAnswer) {
        if (userAnswer === null || userAnswer === undefined) return false;
        
        // Handle arrays (for drag and drop questions)
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
            return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        }
        
        // Convert both answers to lowercase strings for comparison
        const normalizedUserAnswer = String(userAnswer).toLowerCase();
        const normalizedCorrectAnswer = String(correctAnswer).toLowerCase();
        
        return normalizedUserAnswer === normalizedCorrectAnswer;
    }

    $('#submitQuiz').on('click', function() {
        if (!currentQuiz) return;

        const answers = [];
        currentQuiz.questions.forEach((question, index) => {
            let answer;
            switch (question.type) {
                case 'multiple_choice':
                case 'true_false':
                    answer = $(`input[name="q${index}"]:checked`).val();
                    break;
                case 'drag_drop':
                    if (question.descriptions) {
                        // For matching questions
                        answer = [];
                        $(`.drop-zone-item[data-question="${index}"] .drag-item`).each(function() {
                            answer.push($(this).attr('data-value'));
                        });
                    } else {
                        // For ordering questions
                        answer = [];
                        $(`.ordering-zone[data-question="${index}"] .drag-item`).each(function() {
                            answer.push($(this).attr('data-value'));
                        });
                    }
                    break;
                case 'dropdown':
                    answer = $(`select[name="q${index}"]`).val();
                    break;
                case 'coding':
                    answer = $(`textarea[name="q${index}"]`).val();
                    break;
            }
            answers.push({
                question: question.question,
                userAnswer: answer || [],
                correctAnswer: question.correct_answer,
                isCorrect: compareAnswers(answer, question.correct_answer)
            });
        });

        displayResults(answers);
    });

    function displayResults(answers) {
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const totalQuestions = answers.length;
        const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(1);

        let resultsHtml = `
            <h4>Score: ${correctAnswers}/${totalQuestions} (${percentage}%)</h4>
            <hr>
        `;

        answers.forEach((answer, index) => {
            resultsHtml += `
                <div class="mb-3">
                    <p><strong>Question ${index + 1}:</strong> ${answer.question}</p>
                    <p><strong>Your Answer:</strong> ${Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer || 'Not answered'}</p>
                    <p><strong>Correct Answer:</strong> ${Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : answer.correctAnswer}</p>
                    <p class="text-${answer.isCorrect ? 'success' : 'danger'}">
                        <i class="fas fa-${answer.isCorrect ? 'check' : 'times'}"></i>
                        ${answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </p>
                </div>
                <hr>
            `;
        });

        $('#resultsContent').html(resultsHtml);
        new bootstrap.Modal('#resultsModal').show();
    }
});
