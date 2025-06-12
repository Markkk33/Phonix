document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    // Disable default browser validation
    form.setAttribute('novalidate', 'true');

    // Add functionality to toggle password visibility
    const passwordField = form.querySelector('input[name="password"]');
    const togglePasswordIcon = form.querySelector('.toggle-password');

    if (togglePasswordIcon) {
        togglePasswordIcon.style.cursor = 'pointer'; // Set pointer cursor for the eye icon
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

        // Validate username
        if (username.value.trim() === '') {
            const usernameContainer = username.closest('.input-container');
            usernameContainer.style.border = '2px solid rgba(246, 51, 57, 0.96)'; // Add border for error
            usernameContainer.insertAdjacentHTML('afterend', '<p class="error-message" style="color: rgba(246, 51, 57, 0.96); margin-top: 10px; font-size: 12px;">Username is required.</p>');
            isValid = false;
        } else {
            const usernameContainer = username.closest('.input-container');
            usernameContainer.style.border = ''; // Reset border
        }

        // Validate password
        if (password.value.trim() === '') {
            const passwordContainer = password.closest('.input-container');
            passwordContainer.style.border = '2px solid rgba(246, 51, 57, 0.96)'; // Add border for error
            passwordContainer.insertAdjacentHTML('afterend', '<p class="error-message" style="color: rgba(246, 51, 57, 0.96); margin-top: 10px; font-size: 12px;">Password is required.</p>');
            isValid = false;
        } else {
            const passwordContainer = password.closest('.input-container');
            passwordContainer.style.border = ''; // Reset border
        }

        if (!isValid) {
            event.preventDefault(); // Prevent form submission if validation fails
        }
    });
});