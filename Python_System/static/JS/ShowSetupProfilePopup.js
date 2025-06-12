document.addEventListener('DOMContentLoaded', () => {
    const isProfileIncomplete = document.body.dataset.isProfileIncomplete === 'true';

    if (isProfileIncomplete) {
        alert('Please complete your profile to proceed.');
    }
});