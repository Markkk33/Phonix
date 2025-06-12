document.addEventListener('DOMContentLoaded', () => {
    // Signout Popup for Dashboard
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
            // Redirect to profile/settings page upon signout confirmation
            window.location.href = '/login'; // Flask route
        });
    }

    // View All Activity Popup
    const viewAllBtn = document.querySelector('.view-all');
    const viewAllPopup = document.getElementById('view-all-activity-popup');
    const closeViewAllBtn = document.querySelector('.close-view-all');

    if (viewAllBtn && viewAllPopup) {
        viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            viewAllPopup.classList.remove('hidden');
        });
    }
    if (closeViewAllBtn && viewAllPopup) {
        closeViewAllBtn.addEventListener('click', () => {
            viewAllPopup.classList.add('hidden');
        });
    }

    // --- Chart.js: Sales Chart ---
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        // Fetch sales data from Python backend
        fetch('/sales_chart')
            .then(response => response.json())
            .then(salesData => {
                // Limit to last 6 data points
                const maxPoints = 6;
                const labels = salesData.labels.slice(-maxPoints);
                const datasets = salesData.datasets.map(ds => ({
                    ...ds,
                    data: ds.data.slice(-maxPoints)
                }));
                new Chart(salesCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#23293a',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: '#297FB0',
                                borderWidth: 1,
                                padding: 12,
                                titleFont: { size: 16, weight: 'bold', family: 'Recursive, Arial, Helvetica, sans-serif' },
                                bodyFont: { size: 15, family: 'Recursive, Arial, Helvetica, sans-serif' }
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: '#23293a', font: { size: 15, weight: 'bold', family: 'Recursive, Arial, Helvetica, sans-serif' } }
                            },
                            y: {
                                grid: { color: 'rgba(41,127,176,0.08)' },
                                border: { display: false },
                                ticks: { color: '#297FB0', font: { size: 15, weight: 'bold', family: 'Recursive, Arial, Helvetica, sans-serif' } },
                                beginAtZero: true
                            }
                        }
                    }
                });
            });
    }
    // --- Chart.js: Stock Chart ---
    const stockCtx = document.getElementById('stockChart');
    if (stockCtx) {
        // Fetch stock data from Python backend
        fetch('/stock_chart')
            .then(response => response.json())
            .then(stockData => {
                // Limit to top 6 products by stock (or by your preferred metric)
                const maxProducts = 6;
                // Sort and slice if needed
                const sorted = stockData.labels.map((label, i) => ({
                    label,
                    value: stockData.datasets[0].data[i]
                })).sort((a, b) => b.value - a.value).slice(0, maxProducts);
                const labels = sorted.map(item => item.label);
                const data = sorted.map(item => item.value);
                new Chart(stockCtx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            ...stockData.datasets[0],
                            data: data
                        }]
                    },
                    options: {
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#23293a',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: '#297FB0',
                                borderWidth: 1,
                                padding: 12,
                                titleFont: { size: 16, weight: 'bold', family: 'Recursive, Arial, Helvetica, sans-serif' },
                                bodyFont: { size: 15, family: 'Recursive, Arial, Helvetica, sans-serif' }
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: '#23293a', font: { size: 15, weight: 'bold', family: 'Recursive, Arial, Helvetica, sans-serif' } }
                            },
                            y: {
                                grid: { color: 'rgba(41,127,176,0.08)' },
                                border: { display: false },
                                ticks: { color: '#297FB0', font: { size: 15, weight: 'bold', family: 'Recursive, Arial, Helvetica, sans-serif' } },
                                beginAtZero: true
                            }
                        }
                    }
                });
            });
    }

    // --- Quick Action Buttons ---
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.onclick = () => {
            window.location.href = '/products'; // Flask route
        };
    }
    const addOrderBtn = document.getElementById('add-order-btn');
    if (addOrderBtn) {
        addOrderBtn.onclick = () => {
            window.location.href = '/orders'; // Flask route
        };
    }
    const viewLowStockBtn = document.getElementById('view-low-stock-btn');
    if (viewLowStockBtn) {
        viewLowStockBtn.onclick = () => {
            fetch('/dashboard_summary')
                .then(response => response.json())
                .then(data => {
                    if (data.low_stock > 0) {
                        showDashboardAlert(`There are ${data.low_stock} product(s) with low stock!`);
                    } else {
                        showDashboardAlert('No products are currently low on stock.');
                    }
                })
                .catch(() => {
                    showDashboardAlert('Could not check low stock status.');
                });
        };
    }

    // --- Dashboard Alerts ---
    function showDashboardAlert(message) {
        const alertsDiv = document.getElementById('dashboard-alerts');
        if (!alertsDiv) return;
        const alert = document.createElement('div');
        alert.className = 'dashboard-alert';
        alert.textContent = message;
        alertsDiv.appendChild(alert);
        setTimeout(() => alert.remove(), 4000);
    }

    // --- Example: Show critical alert on load if any stock is zero ---
    // (Removed fake alert)

    // --- Fetch and Render Activity Log (Python backend) ---
    function getRelativeTime(dateString) {
        const now = new Date();
        let then = new Date(dateString);
        // Fallback: try to parse MM/DD/YYYY, HH:MM:SS (if backend sends this format)
        if (isNaN(then.getTime()) && typeof dateString === 'string') {
            // Try MM/DD/YYYY, HH:MM:SS (with or without AM/PM)
            const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2}):(\d{2})(AM|PM)?)?/i);
            if (match) {
                const [, month, day, year, hour, minute, second, meridian] = match;
                then = new Date(year, month - 1, day);
                if (hour && minute && second) {
                    let h = parseInt(hour, 10);
                    if (meridian && meridian.toUpperCase() === 'PM' && h !== 12) h += 12;
                    if (meridian && meridian.toUpperCase() === 'AM' && h === 12) h = 0;
                    then.setHours(h, parseInt(minute, 10), parseInt(second, 10));
                }
            }
        }
        if (isNaN(then.getTime())) return '';
        const diffMs = now - then;
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return 'just now';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
        const diffDay = Math.floor(diffHr / 24);
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    }

    function getActivityIcon(actionType) {
        // Normalize for matching
        const type = actionType.toLowerCase();
        if (type.includes('add') || type.includes('added')) {
            return { icon: 'add', bg: 'activity-icon-bg-blue' };
        } else if (type.includes('edit') || type.includes('edited') || type.includes('update')) {
            return { icon: 'edit', bg: 'activity-icon-bg-yellow' };
        } else if (type.includes('delete') || type.includes('deleted') || type.includes('remove') || type.includes('removed')) {
            return { icon: 'delete', bg: 'activity-icon-bg-red' };
        } else if (type.includes('order')) {
            // Fallback for order actions not matching above
            return { icon: 'shopping_cart', bg: 'activity-icon-bg-green' };
        } else if (type.includes('low stock')) {
            return { icon: 'info', bg: 'activity-icon-bg-gray' };
        } else {
            return { icon: 'history', bg: 'activity-icon-bg-gray' };
        }
    }

    function renderActivityCard(activity) {
        const { icon } = getActivityIcon(activity.actionType || activity.action_type);
        let details = activity.details ? activity.details : '';
        let actionType = activity.actionType || activity.action_type || '';
        const type = actionType.toLowerCase();
        // --- Friendly label logic ---
        let isOrder = type.includes('order');
        let isProduct = type.includes('product');
        let isAdd = type.includes('add') || type.includes('placed');
        let isDelete = type.includes('delete') || type.includes('removed');
        let isEdit = type.includes('edit') || type.includes('update');
        // Priority: Order actions first, then Product actions
        if (isOrder && isAdd) {
            actionType = 'Order Placed';
        } else if (isOrder && isDelete) {
            actionType = 'Order Deleted';
        } else if (isOrder && isEdit) {
            actionType = 'Order Updated';
        } else if (isProduct && isAdd) {
            actionType = 'New Stock Added';
        } else if (isProduct && isDelete) {
            actionType = 'Product Deleted';
        } else if (isProduct && isEdit) {
            actionType = 'Product Updated';
        }
        // --- Details logic ---
        if ((isAdd || isEdit || isDelete) && isProduct && !isOrder) {
            // Product actions: show only product name, prefixed with 'Product: '
            let name = '';
            let match = details.match(/product: ([^,]+)/i);
            if (match) {
                name = match[1].trim();
            } else {
                match = details.match(/Name: ([^,]+)/i);
                if (match) name = match[1].trim();
            }
            // For all product actions (add, edit, delete), always show 'Product: {name}'
            details = name ? `Product: ${name}` : '';
        } else if ((isAdd || isEdit || isDelete) && isOrder) {
            // Order actions: show only order ID and product name
            let orderId = '';
            let product = '';
            let matchOrder = details.match(/order[_ ]?id: ([^,]+)/i);
            if (!matchOrder) matchOrder = details.match(/order: ([^,]+)/i);
            if (matchOrder) orderId = matchOrder[1].trim();
            let matchProduct = details.match(/product: ([^,]+)/i);
            if (matchProduct) product = matchProduct[1].trim();
            // Always show both if available, otherwise blank
            details = (orderId && product) ? `Order ID: ${orderId}, Product: ${product}` : '';
        }
        const card = document.createElement('div');
        card.className = 'activity-card custom-activity-card';
        card.innerHTML = `
            <span class="activity-icon-circle">
                <span class="material-symbols-outlined activity-icon-symbol">${icon}</span>
            </span>
            <div class="activity-info">
                <div class="activity-title">${actionType}</div>
                <div class="activity-desc">${details}</div>
            </div>
            <div class="activity-time">${getRelativeTime(activity.createdAt || activity.created_at)}</div>
        `;
        return card;
    }

    function fetchAndRenderActivities() {
        fetch('/fetch_history')
            .then(response => response.json())
            .then(data => {
                // Python backend returns { success: true, history: [...] }
                if (!data.success) return;
                const history = data.history || [];
                const activityList = document.getElementById('dashboard-activity-list');
                const activityListPopup = document.getElementById('dashboard-activity-list-popup');
                if (activityList) activityList.innerHTML = '';
                if (activityListPopup) activityListPopup.innerHTML = '';
                // Limit dashboard preview to 3 activities
                const previewCount = 3;
                history.slice(0, previewCount).forEach(activity => {
                    const card = renderActivityCard(activity);
                    if (activityList) activityList.appendChild(card);
                });
                // Show all activities in the popup
                history.forEach(activity => {
                    const card = renderActivityCard(activity);
                    if (activityListPopup) activityListPopup.appendChild(card);
                });
            })
            .catch(err => {
                const activityList = document.getElementById('dashboard-activity-list');
                if (activityList) activityList.innerHTML = '<div class="dashboard-alert">Could not load activities.</div>';
            });
    }
    fetchAndRenderActivities();

    // --- Dashboard Summary Cards ---
    fetch('/dashboard_summary')
        .then(response => response.json())
        .then(data => {
            document.getElementById('dashboard-total-products').textContent = data.total_products;
            document.getElementById('dashboard-total-orders').textContent = data.total_orders;
            document.getElementById('dashboard-low-stock').textContent = data.low_stock;
        })
        .catch(() => {
            document.getElementById('dashboard-total-products').textContent = '-';
            document.getElementById('dashboard-total-orders').textContent = '-';
            document.getElementById('dashboard-low-stock').textContent = '-';
        });

    // --- Profile Picture Sync (Sidebar & Dashboard shortcut) ---
    fetch('/api/profile')
      .then(response => response.json())
      .then(data => {
        if (!data.success) return;
        const profile = data.profile;
        let profilePicPath = '/static/Pictures/blank-profile-picture.png';
        if (profile.profile_picture) {
          let cleanPath = profile.profile_picture.replace(/^static[\\/]/, '').replace(/^\/*/, '');
          profilePicPath = '/static/' + cleanPath;
        }
        // Sidebar
        const sidebarPic = document.querySelector('.sidebar .profile-picture img');
        if (sidebarPic) sidebarPic.src = profilePicPath;
        // Dashboard shortcut (if present)
        const dashMiniPic = document.querySelector('.dashboard-profile-shortcut img.profile-mini');
        if (dashMiniPic) dashMiniPic.src = profilePicPath;
      });
});
