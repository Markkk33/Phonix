// This script fetches the current user's profile picture and updates the sidebar and mini-profile on every page (Dashboard, etc.)
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar main profile picture
    const sidebarPic = document.querySelector('.sidebar .profile-picture img');
    // Mini profile picture in dashboard header (if present)
    const miniPic = document.querySelector('.dashboard-profile-shortcut .profile-mini');

    // Only run if at least one profile picture element exists
    if (!sidebarPic && !miniPic) return;

    fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.profile) return;
            let profilePicPath = '/static/Pictures/blank-profile-picture.png';
            if (data.profile.profile_picture) {
                let cleanPath = data.profile.profile_picture.replace(/^static[\\/]/, '').replace(/^\/*/, '');
                profilePicPath = '/static/' + cleanPath;
            }
            // Add cache-busting to always get the latest image
            const cacheBusted = profilePicPath + '?v=' + Date.now();
            if (sidebarPic) sidebarPic.src = cacheBusted;
            if (miniPic) miniPic.src = cacheBusted;
        });
});
