// quizUI.js - Handles all UI-related functionality

const QuizUI = {
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
        shuffledOptions.forEach(option => {
            mcOptions.append(`
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" value="${option}">
                    <label class="form-check-label">${option}</label>
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
            dragDropItemsContainer.append(this.createDragItem(option, index));
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
    createDragItem: function(option, index) {
        const dragItem = $('<div>')
            .addClass('drag-item mb-2')
            .attr('data-value', option)
            .attr('data-source', 'container')
            .attr('draggable', 'true');
        
        const itemContent = $('<div>')
            .addClass('d-flex justify-content-between align-items-center')
            .append($('<span>').text(option));
        
        const removeButton = $('<button>')
            .addClass('btn btn-sm btn-outline-danger remove-item')
            .html('<i class="fas fa-times"></i>')
            .on('click', this.handleRemoveItem);
        
        itemContent.append(removeButton);
        dragItem.append(itemContent);
        return dragItem;
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
        ['True', 'False'].forEach(option => {
            tfOptions.append(`
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" value="${option.toLowerCase()}">
                    <label class="form-check-label">${option}</label>
                </div>
            `);
        });
        questionBody.append(tfOptions);
    },

    // Display coding question
    displayCoding: function(question, index, questionBody) {
        const codingContainer = $('<div>').addClass('coding-container');
        let dropZoneCounter = 0;

        // Split code template into lines while preserving indentation
        const codeLines = question.code_template.split('\n');
        
        codeLines.forEach((line, lineIndex) => {
            const codeLine = $('<div>').addClass('code-line');
            
            // Calculate leading spaces for indentation
            const leadingSpaces = line.match(/^\s*/)[0];
            if (leadingSpaces) {
                codeLine.append($('<span>').addClass('code-indent').text(leadingSpaces));
            }

            // Split line by drop zones
            const parts = line.trim().split('_____');
            parts.forEach((part, partIndex) => {
                // Add code part
                codeLine.append($('<span>').addClass('code-block').text(part));
                
                // Add drop zone if not the last part
                if (partIndex < parts.length - 1) {
                    const dropZone = $('<div>')
                        .addClass('drop-zone-item coding-drop-zone')
                        .attr({
                            'data-question': index,
                            'data-index': dropZoneCounter++
                        });
                    codeLine.append(dropZone);
                }
            });
            
            codingContainer.append(codeLine);
        });

        // Create options container with available code snippets
        const codingOptionsContainer = $('<div>')
            .addClass('coding-options-container')
            .attr('data-question', index);

        const shuffledOptions = this.shuffleArray(question.options);
        shuffledOptions.forEach(option => {
            codingOptionsContainer.append(this.createDragItem(option, index));
        });

        questionBody.append(codingContainer, codingOptionsContainer);
    },

    // Display quiz questions
    displayQuiz: function(quiz) {
        const questionsContainer = $('#questions');
        questionsContainer.empty();

        quiz.questions.forEach((question, index) => {
            const questionDiv = $('<div>').addClass('card mb-3');
            const questionBody = $('<div>').addClass('card-body');
            
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

    // Display quiz results
    displayResults: function(answers) {
        // Clear any existing results
        $('#quizContainer').addClass('d-none');
        const resultsContent = $('#resultsContent');
        resultsContent.empty();
        
        let correctCount = 0;
        answers.forEach((answer, index) => {
            const resultDiv = $('<div>').addClass('mb-3');
            const isCorrect = answer.isCorrect;
            
            if (isCorrect) correctCount++;
            
            resultDiv.append(
                $('<div>')
                    .addClass(`alert ${isCorrect ? 'alert-success' : 'alert-danger'}`)
                    .append(
                        $('<strong>').text(`Question ${index + 1}: `),
                        $('<span>').text(isCorrect ? 'Correct!' : 'Incorrect'),
                        $('<div>').text(`Your answer: ${answer.userAnswer}`),
                        $('<div>').text(`Correct answer: ${answer.correctAnswer}`)
                    )
            );
            
            resultsContent.append(resultDiv);
        });
        
        const score = Math.round((correctCount / answers.length) * 100);
        resultsContent.prepend(
            $('<div>')
                .addClass('alert alert-info')
                .html(`<strong>Your Score: ${score}%</strong> (${correctCount} out of ${answers.length} correct)`)
        );
        
        // Show results modal
        const resultsModal = new bootstrap.Modal('#resultsModal');
        resultsModal.show();
    }
};
