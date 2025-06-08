// Define the backend URL (update this if your backend runs on a different domain or port)
const backendUrl = window.location.origin; // Dynamically get the current origin

document.getElementById('forgot-password-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const emailInput = document.getElementById('email');
    const responseMessage = document.getElementById('response-message');

    // Clear previous error message
    responseMessage.textContent = '';

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailInput.value) {
        emailInput.style.border = '2px solid rgba(246, 51, 57, 0.96)'; // Change border to red
        responseMessage.textContent = 'Email address is required.';
        responseMessage.style.color = 'rgba(246, 51, 57, 0.96)';
    } else if (!emailRegex.test(emailInput.value)) {
        emailInput.style.border = '2px solid rgba(246, 51, 57, 0.96)'; // Change border to red
        responseMessage.textContent = 'Please enter a valid email address.';
        responseMessage.style.color = 'rgba(246, 51, 57, 0.96)';
    } else {
        emailInput.style.border = '2px solid green'; // Change border to green for valid input
        responseMessage.textContent = 'Processing...';
        responseMessage.style.color = 'green';

        // Send POST request to the backend
        fetch(`${backendUrl}/forgot_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: emailInput.value })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                responseMessage.textContent = data.error;
                responseMessage.style.color = 'rgba(246, 51, 57, 0.96)';
            } else {
                responseMessage.textContent = data.message;
                responseMessage.style.color = 'green';

                // Create a centered pop-up window dynamically
                const popup = document.createElement('div');
                popup.textContent = 'A password reset link has been sent to your email. Redirecting to login page...';
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

                // Remove the pop-up after 3 seconds and redirect to the login page
                setTimeout(() => {
                    popup.remove();
                    window.location.href = '/login'; // Redirect to the Flask login route
                }, 3000);
            }
        })
        .catch(error => {
            responseMessage.textContent = 'An error occurred. Please try again later.';
            responseMessage.style.color = 'rgba(246, 51, 57, 0.96)';
            console.error('Error:', error);
        });
    }
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