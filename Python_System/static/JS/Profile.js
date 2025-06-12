document.addEventListener('DOMContentLoaded', () => {
    const editProfileButton = document.querySelector('.edit-profile');
    const popup = document.getElementById('profile-picture-popup');
    const cancelButton = document.querySelector('.cancel-button');
    const replaceButton = document.querySelector('.replace-button');
    const profilePicturePreview = document.getElementById('profile-picture-preview');
    const sidebarProfilePicture = document.querySelector('.sidebar .profile-picture img');
    const profilePagePicture = document.querySelector('.profile-header .profile-picture img');
    const saveButton = document.querySelector('.save-profile-picture-button');

    let selectedFile = null; // Variable to store the selected file

    // --- Change Profile Button (edit-profile) opens profile picture popup only ---
    if (editProfileButton && popup) {
        editProfileButton.addEventListener('click', () => {
            // Always update the preview in the popup to the current profile picture
            const profilePic = document.getElementById('profile-picture');
            if (profilePic && profilePicturePreview) {
                profilePicturePreview.src = profilePic.src;
            }
            popup.classList.remove('hidden');
        });
    }

    // Hide popup when Cancel is clicked
    if (cancelButton && popup) {
        cancelButton.addEventListener('click', () => {
            popup.classList.add('hidden');
        });
    }

    // Add event listener for the Close button
    const closeButton = document.querySelector('.close-button');
    if (closeButton && popup) {
        closeButton.addEventListener('click', () => {
            popup.classList.add('hidden');
        });
    }

    // Handle Replace button (upload new profile picture)
    if (replaceButton && profilePicturePreview) {
        replaceButton.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/jpeg, image/png';
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    console.log('Selected file:', file); // Debugging log
                    const fileType = file.type;
                    if (fileType === 'image/jpeg' || fileType === 'image/png') {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const newImageSrc = e.target.result;
                            console.log('Preview image source:', newImageSrc); // Debugging log
                            profilePicturePreview.src = newImageSrc;
                            if (sidebarProfilePicture) sidebarProfilePicture.src = newImageSrc;
                            if (profilePagePicture) profilePagePicture.src = newImageSrc;
                        };
                        reader.readAsDataURL(file);
                        selectedFile = file;
                    } else {
                        alert('Please select a valid image file (JPG or PNG).');
                    }
                }
            });
            fileInput.click();
        });
    }

    // Ensure popup disappears when Save button is pressed
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            if (selectedFile) {
                const formData = new FormData();
                formData.append('profile_picture', selectedFile);
                // Also send all current profile info fields to prevent data loss
                formData.append('firstname', document.getElementById('profile-firstname').textContent.trim());
                formData.append('lastname', document.getElementById('profile-lastname').textContent.trim());
                formData.append('contact', document.getElementById('profile-contact').textContent.trim());
                formData.append('position', document.getElementById('profile-position-detail').textContent.trim());
                formData.append('street', document.getElementById('profile-street').textContent.trim());
                formData.append('city', document.getElementById('profile-city').textContent.trim());
                formData.append('province', document.getElementById('profile-province').textContent.trim());
                // Email is not editable, but send for display
                formData.append('email', document.getElementById('profile-email').textContent.trim());
                fetch('/profile', {
                    method: 'POST',
                    body: formData
                })
                .then(res => {
                    if (res.redirected) {
                        window.location.href = res.url;
                    } else {
                        return res.text();
                    }
                })
                .then(() => {
                    if (popup) popup.classList.add('hidden');
                    // --- Update sidebar and main profile picture live ---
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (sidebarProfilePicture) sidebarProfilePicture.src = e.target.result;
                        if (profilePagePicture) profilePagePicture.src = e.target.result;
                        // Also update the main profile picture element if present
                        const profilePic = document.getElementById('profile-picture');
                        if (profilePic) profilePic.src = e.target.result;
                    };
                    reader.readAsDataURL(selectedFile);
                    // Optionally reload after a short delay to get new data from backend
                    setTimeout(() => window.location.reload(), 800);
                })
                .catch(() => {
                    alert('An error occurred while updating your profile picture.');
                });
            } else {
                alert('Please select a file using the Replace button before saving.');
            }
        });
    }

    // Add event listeners for all edit buttons
    const editButtons = document.querySelectorAll('.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Add functionality to edit specific sections
        });
    });

    // Personal Info Edit Popup
    const personalInfoEditButton = document.querySelector('.personal-info .edit');
    const personalInfoPopup = document.getElementById('personal-info-popup');
    const cancelPersonalInfoButton = document.querySelector('.cancel-personal-info');
    const personalInfoForm = document.getElementById('personal-info-form');

    // --- After personal or address info update, re-check profile completeness and hide notice if complete ---
    function checkProfileCompletenessAndHideNotice() {
        fetch('../PHP/Profile.php')
            .then(response => response.json())
            .then(data => {
                const incomplete = !data.firstname || !data.lastname || !data.contact_number || !data.position || !data.street || !data.city || !data.province;
                const notice = document.getElementById('setup-profile-notice');
                const setupPopup = document.getElementById('setup-profile-popup');
                if (!incomplete) {
                    if (notice) notice.classList.add('hidden');
                    if (setupPopup) setupPopup.classList.add('hidden');
                }
            });
    }

    // --- Combined Edit Button Logic for Personal & Address Info ---
    const editProfileInfoButton = document.querySelector('.edit-profile-info');
    const editProfileInfoPopup = document.getElementById('edit-profile-info-popup');
    const cancelEditProfileInfoButton = document.querySelector('.cancel-edit-profile-info');
    const editProfileInfoForm = document.getElementById('edit-profile-info-form');

    // Show popup and autofill fields with current preview values
    if (editProfileInfoButton && editProfileInfoPopup) {
        editProfileInfoButton.addEventListener('click', () => {
            document.getElementById('edit-firstname').value = document.getElementById('profile-firstname').textContent || '';
            document.getElementById('edit-lastname').value = document.getElementById('profile-lastname').textContent || '';
            document.getElementById('edit-email').value = document.getElementById('profile-email').textContent || '';
            document.getElementById('edit-contact').value = document.getElementById('profile-contact').textContent || '';
            document.getElementById('edit-position').value = document.getElementById('profile-position-detail').textContent || '';
            document.getElementById('edit-street').value = document.getElementById('profile-street').textContent || '';
            document.getElementById('edit-city').value = document.getElementById('profile-city').textContent || '';
            document.getElementById('edit-province').value = document.getElementById('profile-province').textContent || '';
            editProfileInfoPopup.classList.remove('hidden');
        });
    }
    if (cancelEditProfileInfoButton && editProfileInfoPopup) {
        cancelEditProfileInfoButton.addEventListener('click', () => {
            editProfileInfoPopup.classList.add('hidden');
        });
    }
    if (editProfileInfoForm && editProfileInfoPopup) {
        editProfileInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('firstname', document.getElementById('edit-firstname').value.trim());
            formData.append('lastname', document.getElementById('edit-lastname').value.trim());
            formData.append('contact', document.getElementById('edit-contact').value.trim());
            formData.append('position', document.getElementById('edit-position').value.trim());
            formData.append('street', document.getElementById('edit-street').value.trim());
            formData.append('city', document.getElementById('edit-city').value.trim());
            formData.append('province', document.getElementById('edit-province').value.trim());
            formData.append('email', document.getElementById('edit-email').value.trim());
            // Email is not editable, so do not send it
            fetch('/profile', {
                method: 'POST',
                body: formData
            })
            .then(res => {
                if (res.redirected) {
                    window.location.href = res.url;
                } else {
                    return res.text();
                }
            })
            .then(() => {
                editProfileInfoPopup.classList.add('hidden');
                checkProfileCompletenessAndHideNotice();
                window.location.reload();
            })
            .catch(() => {
                alert('An error occurred while updating your profile info.');
            });
        });
    }

    // Address Info Edit Popup
    const addressInfoEditButton = document.querySelector('.address-info .edit');
    const addressInfoPopup = document.getElementById('address-info-popup');
    const cancelAddressInfoButton = document.querySelector('.cancel-address-info');
    const addressInfoForm = document.getElementById('address-info-form');

    // --- Address Info Edit Button ---
    if (addressInfoEditButton && addressInfoPopup) {
        addressInfoEditButton.addEventListener('click', () => {
            addressInfoPopup.classList.remove('hidden');
        });
    }
    if (cancelAddressInfoButton && addressInfoPopup) {
        cancelAddressInfoButton.addEventListener('click', () => {
            addressInfoPopup.classList.add('hidden');
        });
    }
    if (addressInfoForm && addressInfoPopup) {
        addressInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('street', document.getElementById('edit-street').value.trim());
            formData.append('city', document.getElementById('edit-city').value.trim());
            formData.append('province', document.getElementById('edit-province').value.trim());
            formData.append('type', 'address');
            fetch('../PHP/Profile_update.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    addressInfoPopup.classList.add('hidden');
                    checkProfileCompletenessAndHideNotice();
                    window.location.reload();
                } else if (data.error) {
                    alert('Error: ' + data.error);
                }
            })
            .catch(() => {
                alert('An error occurred while updating your address info.');
            });
        });
    }

    // Signout Popup
    const signoutButton = document.querySelector('.signout');
    const signoutPopup = document.getElementById('signout-popup');
    const signoutConfirm = document.querySelector('.signout-confirm');
    const signoutCancel = document.querySelector('.signout-cancel');

    if (signoutButton && signoutPopup) {
        signoutButton.addEventListener('click', () => {
            signoutPopup.classList.remove('hidden');
        });
    }
    if (signoutCancel && signoutPopup) {
        signoutCancel.addEventListener('click', () => {
            signoutPopup.classList.add('hidden');
        });
    }
    if (signoutConfirm) {
        signoutConfirm.addEventListener('click', () => {
            // Redirect to login page upon signout confirmation
            window.location.href = '/login';
        });
    }

    // --- Setup Profile Popup Logic ---
    const setupProfilePopup = document.getElementById('setup-profile-popup');
    const setupProfileForm = document.getElementById('setup-profile-form');
    const setupProfilePictureInput = document.getElementById('setup-profile-picture');
    const setupProfilePicturePreview = document.getElementById('setup-profile-picture-preview');
    const cancelSetupProfileButton = document.querySelector('.cancel-setup-profile');

    // Show image preview when user selects a file
    if (setupProfilePictureInput && setupProfilePicturePreview) {
        setupProfilePictureInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setupProfilePicturePreview.src = e.target.result;
                    // Also update sidebar and main profile picture live
                    if (sidebarProfilePicture) sidebarProfilePicture.src = e.target.result;
                    if (profilePagePicture) profilePagePicture.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Cancel button hides the popup
    if (cancelSetupProfileButton && setupProfilePopup) {
        cancelSetupProfileButton.addEventListener('click', () => {
            setupProfilePopup.classList.add('hidden');
        });
    }

    // Handle form submission
    if (setupProfileForm && setupProfilePopup) {
        console.log("Form submit handler attached");
        setupProfileForm.addEventListener('submit', (e) => {
            console.log("Form submitted");
            e.preventDefault();
            const requiredMsg = document.querySelector('.setup-required-msg');
            if (requiredMsg) requiredMsg.style.display = 'none';

            const formData = new FormData();
            formData.append('firstname', document.getElementById('setup-firstname').value.trim());
            formData.append('lastname', document.getElementById('setup-lastname').value.trim());
            formData.append('email', document.getElementById('setup-email').value.trim());
            formData.append('contact', document.getElementById('setup-contact').value.trim());
            formData.append('position', document.getElementById('setup-position').value.trim());
            formData.append('street', document.getElementById('setup-street').value.trim());
            formData.append('city', document.getElementById('setup-city').value.trim());
            formData.append('province', document.getElementById('setup-province').value.trim());
            const fileInput = document.getElementById('setup-profile-picture');
            if (fileInput && fileInput.files && fileInput.files[0]) {
                formData.append('profile_picture', fileInput.files[0]);
            }

            fetch('/profile', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(() => {
                setupProfilePopup.classList.add('hidden');
                window.location.reload();
            })
            .catch(() => {
                if (requiredMsg) {
                    requiredMsg.textContent = 'An error occurred while saving your profile.';
                    requiredMsg.style.display = 'block';
                } else {
                    alert('An error occurred while saving your profile.');
                }
            });
        });
    }

    // Show setup profile popup if profile is incomplete and auto-fill setup form if data exists
    fetch('/api/profile')
      .then(response => response.json())
      .then(data => {
        if (!data.success) {
          console.error('Failed to fetch profile data:', data.message);
          return;
        }

        const profile = data.profile;
        const incomplete = data.incomplete;

        // Update profile picture previews
        let profilePicPath = '/static/Pictures/blank-profile-picture.png';
        if (profile.profile_picture) {
          // Remove any leading slashes or 'static/' from the DB value
          let cleanPath = profile.profile_picture.replace(/^static[\\/]/, '').replace(/^\/*/, '');
          profilePicPath = '/static/' + cleanPath;
        }
        const profilePic = document.getElementById('profile-picture');
        if (profilePic) profilePic.src = profilePicPath;
        const sidebarPic = document.querySelector('.sidebar .profile-picture img');
        if (sidebarPic) sidebarPic.src = profilePicPath;
        const mainPic = document.querySelector('.profile-header .profile-picture img');
        if (mainPic) mainPic.src = profilePicPath;

        // Update text fields
        const fullname = document.getElementById('profile-fullname');
        if (fullname) {
          fullname.textContent = profile.firstname || '(Not set)';
        }
        const pos = document.getElementById('profile-position');
        if (pos) {
          pos.textContent = profile.position || '(Not set)';
        }
        const fn = document.getElementById('profile-firstname');
        if (fn) {
          fn.textContent = profile.firstname || '(Not set)';
        }
        const ln = document.getElementById('profile-lastname');
        if (ln) {
          ln.textContent = profile.lastname || '(Not set)';
        }
        const em = document.getElementById('profile-email');
        if (em) {
          em.textContent = profile.email || '(Not set)';
        }
        const cn = document.getElementById('profile-contact');
        if (cn) {
          cn.textContent = profile.contact_number || '(Not set)';
        }
        const st = document.getElementById('profile-street');
        if (st) {
          st.textContent = profile.street || '(Not set)';
        }
        const ct = document.getElementById('profile-city');
        if (ct) {
          ct.textContent = profile.city || '(Not set)';
        }
        const pv = document.getElementById('profile-province');
        if (pv) {
          pv.textContent = profile.province || '(Not set)';
        }

        // --- Refactored: Only show custom notice modal, not setup popup automatically ---
        const setupPopup = document.getElementById('setup-profile-popup');
        const noticeModal = document.getElementById('setup-profile-notice');
        const openSetupBtn = noticeModal ? noticeModal.querySelector('.open-setup-profile') : null;

        if (incomplete) {
          // Always hide the setup popup initially
          if (setupPopup) setupPopup.classList.add('hidden');
          // Show the custom notice modal
          if (noticeModal) {
            noticeModal.classList.remove('hidden');
            if (openSetupBtn && setupPopup) {
              openSetupBtn.onclick = () => {
                noticeModal.classList.add('hidden');
                setupPopup.classList.remove('hidden');
              };
            }
          }
        } else {
          // Hide both if profile is complete
          if (setupPopup) setupPopup.classList.add('hidden');
          if (noticeModal) noticeModal.classList.add('hidden');
        }
      });
});