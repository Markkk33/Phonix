document.getElementById('forgot-password-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const emailInput = document.getElementById('email');
    const responseMessage = document.getElementById('response-message');

    // Clear previous error message
    responseMessage.textContent = '';
    emailInput.style.border = '2px solid #ccc';

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput.value) {
        emailInput.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        responseMessage.textContent = 'Email address is required.';
        responseMessage.style.color = 'rgba(246, 51, 57, 0.96)';
        return;
    } else if (!emailRegex.test(emailInput.value)) {
        emailInput.style.border = '2px solid rgba(246, 51, 57, 0.96)';
        responseMessage.textContent = 'Please enter a valid email address.';
        responseMessage.style.color = 'rgba(246, 51, 57, 0.96)';
        return;
    }

    // If valid, submit the form to PHP for processing via AJAX
    fetch('../PHP/Forgot_Password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=' + encodeURIComponent(emailInput.value)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success popup and redirect
            showPopup(data.message, true);
            setTimeout(() => {
                window.location.href = 'Login.html';
            }, 3000);
        } else {
            // Show error popup
            showPopup(data.message, false);
        }
    })
    .catch(() => {
        showPopup('An error occurred. Please try again.', false);
    });
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