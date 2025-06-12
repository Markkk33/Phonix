document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    // Disable default browser validation
    form.setAttribute('novalidate', 'true');

    // Add functionality to toggle password visibility
    const passwordField = form.querySelector('input[name="password"]');
    const togglePasswordIcon = form.querySelector('.toggle-password');

    if (togglePasswordIcon) {
        togglePasswordIcon.style.cursor = 'pointer';
        togglePasswordIcon.addEventListener('click', () => {
            const isPasswordVisible = passwordField.getAttribute('type') === 'text';
            passwordField.setAttribute('type', isPasswordVisible ? 'password' : 'text');
            togglePasswordIcon.textContent = isPasswordVisible ? 'visibility' : 'visibility_off';
        });
    }

    form.addEventListener('submit', (event) => {
        const username = form.querySelector('input[name="username"]');
        const password = form.querySelector('input[name="password"]');
        let isValid = true;

        // Clear previous error messages
        form.querySelectorAll('p.error-message').forEach((error) => error.remove());
        form.querySelectorAll('.input-container').forEach((container) => container.style.border = '');

        // Validate username
        if (username.value.trim() === '') {
            const usernameContainer = username.closest('.input-container');
            usernameContainer.style.border = '2px solid rgba(246, 51, 57, 0.96)';
            usernameContainer.insertAdjacentHTML('afterend', '<p class="error-message" style="color: rgba(246, 51, 57, 0.96); margin-top: 10px; font-size: 12px;">Username is required.</p>');
            isValid = false;
        }

        // Validate password
        if (password.value.trim() === '') {
            const passwordContainer = password.closest('.input-container');
            passwordContainer.style.border = '2px solid rgba(246, 51, 57, 0.96)';
            passwordContainer.insertAdjacentHTML('afterend', '<p class="error-message" style="color: rgba(246, 51, 57, 0.96); margin-top: 10px; font-size: 12px;">Password is required.</p>');
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault(); // Prevent form submission if validation fails
        }
        // If valid, let the form submit to PHP for authentication
    });

    // Show PHP login error popup ONLY if user does not exist or password is incorrect
    const urlParams = new URLSearchParams(window.location.search);
    const popupMsg = urlParams.get('popupMsg');
    const popupSuccess = urlParams.get('popupSuccess');
    if (popupMsg) {
        if (popupMsg.toLowerCase().includes('not found')) {
            showPopup('Account does not exist.', false);
            form.reset(); // Reset all fields if account does not exist
        } else if (popupMsg.toLowerCase().includes('incorrect password')) {
            showPopup('Incorrect password.', false);
            const passwordField = form.querySelector('input[name="password"]');
            passwordField.value = ''; // Clear only the password field
        }
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