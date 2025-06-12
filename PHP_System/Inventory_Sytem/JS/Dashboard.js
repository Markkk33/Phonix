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
            // Redirect to login page upon signout confirmation
            window.location.href = '../HMTL/Login.html';
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
        // Fetch sales data from backend (replace with your actual endpoint and logic)
        fetch('../PHP/SalesChart.php')
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
        // Fetch stock data from backend (replace with your actual endpoint and logic)
        fetch('../PHP/StockChart.php')
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
            window.location.href = '../HMTL/Products.html';
        };
    }
    const addOrderBtn = document.getElementById('add-order-btn');
    if (addOrderBtn) {
        addOrderBtn.onclick = () => {
            window.location.href = '../HMTL/Orders.html';
        };
    }
    const viewLowStockBtn = document.getElementById('view-low-stock-btn');
    if (viewLowStockBtn) {
        viewLowStockBtn.onclick = () => {
            fetch('../PHP/DashboardSummary.php')
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

    // --- Fetch and Render Activity Log ---
    function getRelativeTime(dateString) {
        const now = new Date();
        const then = new Date(dateString);
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
        // You can expand this mapping as needed
        switch (actionType.toLowerCase()) {
            case 'new stock added':
            case 'add':
                return { icon: '+', bg: 'activity-icon-bg-blue' };
            case 'low stock alert':
            case 'low stock':
                return { icon: 'info', bg: 'activity-icon-bg-gray' };
            default:
                return { icon: 'history', bg: 'activity-icon-bg-gray' };
        }
    }

    function renderActivityCard(activity) {
        const { icon, bg } = getActivityIcon(activity.action_type);
        const card = document.createElement('div');
        card.className = 'activity-card custom-activity-card';
        card.innerHTML = `
            <span class="activity-icon-circle ${bg}">
                <span class="material-symbols-outlined activity-icon-symbol">${icon}</span>
            </span>
            <div class="activity-info">
                <div class="activity-title">${activity.action_type}</div>
                <div class="activity-desc">${activity.details ? activity.details : ''}</div>
            </div>
            <div class="activity-time">${getRelativeTime(activity.created_at)}</div>
        `;
        return card;
    }

    function fetchAndRenderActivities() {
        fetch('../PHP/Dashboard.php')
            .then(response => response.json())
            .then(data => {
                const activityList = document.getElementById('dashboard-activity-list');
                const activityListPopup = document.getElementById('dashboard-activity-list-popup');
                if (activityList) activityList.innerHTML = '';
                if (activityListPopup) activityListPopup.innerHTML = '';
                // Limit dashboard preview to 3 activities
                const previewCount = 3;
                data.slice(0, previewCount).forEach(activity => {
                    const card = renderActivityCard(activity);
                    if (activityList) activityList.appendChild(card);
                });
                // Show all activities in the popup
                data.forEach(activity => {
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
    fetch('../PHP/DashboardSummary.php')
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
});
