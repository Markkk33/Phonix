document.querySelector('form').addEventListener('submit', function(event) {
    // Prevent default browser validation
    event.preventDefault();

    // Clear previous error messages and reset borders
    document.querySelectorAll('.error-message').forEach(function(el) {
        el.textContent = '';
    });
    document.querySelectorAll('input').forEach(function(input) {
        input.style.border = '2px solid #ccc'; // Reset border color
    });

    let isValid = true;

    // Validate username
    const username = document.getElementById('username');
    if (username.value.trim() === '') {
        isValid = false;
        username.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        username.insertAdjacentHTML('afterend', '<p class="error-message">Username is required.</p>');
    } else if (username.value.trim().length < 4) {
        isValid = false;
        username.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        username.insertAdjacentHTML('afterend', '<p class="error-message">Username must be at least 4 characters long.</p>');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.value.trim())) {
        isValid = false;
        username.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        username.insertAdjacentHTML('afterend', '<p class="error-message">Username can only contain letters, numbers, and underscores.</p>');
    }

    // Validate email
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value.trim() === '') {
        isValid = false;
        email.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        email.insertAdjacentHTML('afterend', '<p class="error-message">Email is required.</p>');
    } else if (!emailRegex.test(email.value.trim())) {
        isValid = false;
        email.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        email.insertAdjacentHTML('afterend', '<p class="error-message">Please enter a valid email address.</p>');
    }

    // Validate password
    const password = document.getElementById('password');
    if (password.value.trim() === '') {
        isValid = false;
        password.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        password.insertAdjacentHTML('afterend', '<p class="error-message">Password is required.</p>');
    } else if (password.value.trim().length < 6) {
        isValid = false;
        password.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        password.insertAdjacentHTML('afterend', '<p class="error-message">Password must be at least 6 characters long.</p>');
    } else if (!/[A-Z]/.test(password.value.trim()) || !/[a-z]/.test(password.value.trim()) || !/[0-9]/.test(password.value.trim())) {
        isValid = false;
        password.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        password.insertAdjacentHTML('afterend', '<p class="error-message">Password must contain uppercase, lowercase, and a number.</p>');
    }

    // Validate confirm password
    const confirmPassword = document.getElementById('confirm_password');
    if (confirmPassword.value.trim() === '') {
        isValid = false;
        confirmPassword.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        confirmPassword.insertAdjacentHTML('afterend', '<p class="error-message">Please confirm your password.</p>');
    } else if (confirmPassword.value.trim() !== password.value.trim()) {
        isValid = false;
        confirmPassword.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        confirmPassword.insertAdjacentHTML('afterend', '<p class="error-message">Passwords do not match.</p>');
    }

    // If all validations pass, submit the form to the PHP backend
    if (isValid) {
        event.target.submit(); // Actually submit the form
    }
});

// Check for PHP popup message from server
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const popupMsg = urlParams.get('popupMsg');
    const popupSuccess = urlParams.get('popupSuccess');
    if (popupMsg) {
        showPopup(decodeURIComponent(popupMsg), popupSuccess === 'true');
        if (popupSuccess === 'true') {
            setTimeout(() => {
                window.location.href = 'Login.html';
            }, 3000);
        }
    }
    // Floating bubbles background effect
    const bubblesContainer = document.querySelector('.bubbles');
    if (!bubblesContainer) return;
    const bubbleCount = 20;
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        const size = Math.random() * 60 + 20; // 20px to 80px
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${8 + Math.random() * 6}s`;
        bubble.style.animationDelay = `${Math.random() * 8}s`;
        bubblesContainer.appendChild(bubble);
    }
});

function showPopup(message, success) {
    const popup = document.createElement('div');
    popup.textContent = message;
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = success ? '#4CAF50' : '#F63339';
    popup.style.color = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    popup.style.textAlign = 'center';
    popup.style.zIndex = '1000';
    document.body.appendChild(popup);
    setTimeout(() => { popup.remove(); }, 2500);
}