// Global state and cached DOM elements
const API_BASE_URL = "http://localhost:8080";
let editingBookId = null;
const submitButton = document.querySelector('#submitButton');
const cancelButton = document.querySelector('#cancelButton');

// Cache form inputs
const titleInput = document.querySelector('#title');
const authorInput = document.querySelector('#author');
const isbnInput = document.querySelector('#isbn');
const priceInput = document.querySelector('#price');
const publishDateInput = document.querySelector('#publishDate');

// Cache form and table elements
const bookForm = document.querySelector('#bookForm');
const bookTbody = document.querySelector('#bookTbody');
const errorBox = document.querySelector('#errorBox');
const successBox = document.querySelector('#successBox');
const errorMessage = document.querySelector('#errorMessage');
const successMessage = document.querySelector('#successMessage');

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', function() {
    loadBooks();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    bookForm.addEventListener('submit', handleFormSubmit);
    cancelButton.addEventListener('click', resetForm);
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    clearErrors();
    
    const bookData = collectFormData();
    
    try {
        if (editingBookId) {
            await updateBook(editingBookId, bookData);
        } else {
            await createBook(bookData);
        }
    } catch (error) {
        console.error('Form submission error:', error);
    }
}

// Create a new book
async function createBook(bookData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });

        if (!response.ok) {
            const errorData = await httpErrorFromResponse(response);
            showError(errorData);
            return;
        }

        showSuccess('등록 완료');
        resetForm();
        loadBooks();
    } catch (error) {
        showError('서버 연결에 실패했습니다.');
        console.error('Create book error:', error);
    }
}

// Delete a book
async function deleteBook(bookId) {
    if (!confirm('정말로 이 도서를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await httpErrorFromResponse(response);
            showError(errorData);
            return;
        }

        showSuccess('삭제 완료');
        loadBooks();
    } catch (error) {
        showError('서버 연결에 실패했습니다.');
        console.error('Delete book error:', error);
    }
}

// Load book data for editing
async function editBook(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`);

        if (!response.ok) {
            const errorData = await httpErrorFromResponse(response);
            showError(errorData);
            return;
        }

        const book = await response.json();
        
        // Fill form with book data
        titleInput.value = book.title || '';
        authorInput.value = book.author || '';
        isbnInput.value = book.isbn || '';
        priceInput.value = book.price || '';
        publishDateInput.value = book.publishDate || '';

        // Update UI for edit mode
        editingBookId = bookId;
        submitButton.textContent = '수정';
        cancelButton.style.display = 'inline-block';
        
        clearErrors();
        
    } catch (error) {
        showError('서버 연결에 실패했습니다.');
        console.error('Edit book error:', error);
    }
}

// Update an existing book
async function updateBook(bookId, bookData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });

        if (!response.ok) {
            const errorData = await httpErrorFromResponse(response);
            showError(errorData);
            return;
        }

        showSuccess('수정 완료');
        resetForm();
        loadBooks();
    } catch (error) {
        showError('서버 연결에 실패했습니다.');
        console.error('Update book error:', error);
    }
}

// Load and display books
async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);

        if (!response.ok) {
            const errorData = await httpErrorFromResponse(response);
            showError(errorData);
            return;
        }

        const books = await response.json();
        renderTable(books);
    } catch (error) {
        showError('서버 연결에 실패했습니다.');
        console.error('Load books error:', error);
    }
}

// Render books table
function renderTable(books) {
    bookTbody.innerHTML = '';

    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.id}</td>
            <td>${book.title || ''}</td>
            <td>${book.author || ''}</td>
            <td>${book.isbn || ''}</td>
            <td>${book.price || ''}</td>
            <td>${book.publishDate || ''}</td>
            <td>
                <button type="button" class="action-btn edit-btn" onclick="editBook(${book.id})">수정</button>
                <button type="button" class="action-btn delete-btn" onclick="deleteBook(${book.id})">삭제</button>
            </td>
        `;
        bookTbody.appendChild(row);
    });
}

// Collect form data
function collectFormData() {
    return {
        title: titleInput.value.trim(),
        author: authorInput.value.trim(),
        isbn: isbnInput.value.trim(),
        price: Number(priceInput.value) || 0,
        publishDate: publishDateInput.value
    };
}

// Reset form to initial state
function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = '등록';
    cancelButton.style.display = 'none';
    clearErrors();
    hideMessages();
}

// Show error messages
function showError(error) {
    hideMessages();
    
    if (typeof error === 'string') {
        errorMessage.textContent = error;
        errorBox.style.display = 'block';
    } else if (error && typeof error === 'object') {
        // Handle field-specific errors
        if (error.errors) {
            let hasFieldErrors = false;
            Object.keys(error.errors).forEach(field => {
                const input = document.querySelector(`#${field}`);
                const helpText = input?.parentElement.querySelector('.form-help');
                
                if (input && helpText) {
                    input.classList.add('is-invalid');
                    helpText.textContent = error.errors[field];
                    hasFieldErrors = true;
                }
            });
            
            if (hasFieldErrors) {
                errorMessage.textContent = '입력을 확인하세요';
                errorBox.style.display = 'block';
            }
        } else if (error.message) {
            errorMessage.textContent = error.message;
            errorBox.style.display = 'block';
        }
    }
}

// Show success message
function showSuccess(message) {
    hideMessages();
    successMessage.textContent = message;
    successBox.style.display = 'block';
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
        successBox.style.display = 'none';
    }, 3000);
}

// Clear validation errors
function clearErrors() {
    const invalidInputs = document.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
    
    const helpTexts = document.querySelectorAll('.form-help');
    helpTexts.forEach(help => {
        help.textContent = '';
    });
}

// Hide all message boxes
function hideMessages() {
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
}

// Extract error from HTTP response
async function httpErrorFromResponse(response) {
    try {
        const errorData = await response.json();
        return errorData;
    } catch (error) {
        return { message: `HTTP ${response.status}: ${response.statusText}` };
    }
}