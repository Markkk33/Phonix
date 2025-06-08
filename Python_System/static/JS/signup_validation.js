document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default browser validation

    // Clear previous error messages and reset borders
    document.querySelectorAll('.error-message').forEach(function(el) {
        el.remove(); // Remove error messages instead of just clearing text
    });
    document.querySelectorAll('input').forEach(function(input) {
        input.style.border = '2px solid #ccc'; // Reset border color
    });

    let isValid = true;

    // Validate username
    const username = document.getElementById('username');
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/; // Alphanumeric and underscores, 3-15 chars
    if (!usernameRegex.test(username.value.trim())) {
        isValid = false;
        username.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        if (!username.nextElementSibling || !username.nextElementSibling.classList.contains('error-message')) {
            username.insertAdjacentHTML('afterend', '<p class="error-message" aria-live="polite">Username must be 3-15 characters long and can only contain letters, numbers, and underscores.</p>');
        }
    }

    // Validate email
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/; // Stricter domain validation
    if (!emailRegex.test(email.value.trim())) {
        isValid = false;
        email.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        if (!email.nextElementSibling || !email.nextElementSibling.classList.contains('error-message')) {
            email.insertAdjacentHTML('afterend', '<p class="error-message" aria-live="polite">Please enter a valid email address.</p>');
        }
    }

    // Validate password
    const password = document.getElementById('password');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/; // At least 6 chars, 1 uppercase, 1 lowercase, 1 number
    if (!passwordRegex.test(password.value.trim())) {
        isValid = false;
        password.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        if (!password.nextElementSibling || !password.nextElementSibling.classList.contains('error-message')) {
            password.insertAdjacentHTML('afterend', '<p class="error-message" aria-live="polite">Password must be at least 6 characters long and include an uppercase letter, a lowercase letter, and a number.</p>');
        }
    }

    // Validate confirm password
    const confirmPassword = document.getElementById('confirm_password');
    if (confirmPassword.value.trim() !== password.value.trim()) {
        isValid = false;
        confirmPassword.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        if (!confirmPassword.nextElementSibling || !confirmPassword.nextElementSibling.classList.contains('error-message')) {
            confirmPassword.insertAdjacentHTML('afterend', '<p class="error-message" aria-live="polite">Password do not match.</p>');
        }
    }

    // If all validations pass, show a success message and then submit the form after a short delay
    if (isValid) {
        // Create a centered pop-up window dynamically
        const popup = document.createElement('div');
        popup.textContent = 'Account successfully created! Redirecting to login page...';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = '#4CAF50';
        popup.style.color = 'white';
        popup.style.padding = '20px';
        popup.style.borderRadius = '10px';
        popup.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
        popup.style.textAlign = 'center';
        popup.style.zIndex = '1000';
        document.body.appendChild(popup);

        // Submit the form after 2 seconds
        setTimeout(() => {
            popup.remove();
            event.target.submit(); // Submit the form to the backend
        }, 2000);
        return;
    }
    // If not valid, prevent form submission
    event.preventDefault();
});

// Floating bubbles background effect
window.addEventListener('DOMContentLoaded', () => {
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