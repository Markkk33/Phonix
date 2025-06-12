// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
    // Signout Popup logic (matches Profile.js)
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

    // --- Products History Search & Advanced Filter ---
    const productsSearchInput = document.querySelector('.products-history-controls .search-bar input');
    const productsFilter = document.getElementById('products-filter');
    const productsTable = document.querySelectorAll('.history-section-container .products-table')[0];

    // Debugging: Verify DOM elements
    console.log('Products Search Input:', productsSearchInput);
    console.log('Products Table:', productsTable);

    // Debugging: Log the content of productsTable and its tbody
    console.log('Products Table Content:', productsTable);
    const tbody = productsTable.querySelector('tbody');
    console.log('Tbody Content:', tbody ? tbody.innerHTML : 'No tbody found');

    if (productsSearchInput && productsFilter && productsTable) {
        productsFilter.addEventListener('change', filterAndSortProductsTable);
        document.getElementById('products-sort-order').addEventListener('change', filterAndSortProductsTable);
    }

    // Removed search bar functionality for Products History
    if (productsSearchInput) {
        productsSearchInput.removeEventListener('input', filterAndSortProductsTable);
    }

    // Additional debugging logs for search functionality
    function filterAndSortProductsTable() {
        const search = productsSearchInput.value.toLowerCase();
        const rows = Array.from(productsTable.querySelectorAll('tbody tr'));

        console.log('All Rows:', rows); // Debugging: Log all rows before filtering

        // Reset highlights before filtering
        resetHighlights(rows);

        // Filter rows based on search input
        const filteredRows = rows.filter(row => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).some(cell => {
                const match = cell.textContent.toLowerCase().includes(search);
                if (match) highlightMatches(cell, search);
                return match;
            });
        });

        console.log('Filtered Rows:', filteredRows); // Debugging: Log filtered rows

        // Sort rows by 'date' in ascending or descending order
        const sortOrder = document.getElementById('products-sort-order').value;
        filteredRows.sort((a, b) => {
            const dateA = new Date(a.querySelector('td:nth-child(1)').textContent);
            const dateB = new Date(b.querySelector('td:nth-child(1)').textContent);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        console.log('Sorted Rows:', filteredRows); // Debugging: Log sorted rows

        // Clear table and append filtered and sorted rows
        const tbody = productsTable.querySelector('tbody');
        console.log('Tbody Before Update:', tbody); // Debugging: Log tbody before update
        tbody.innerHTML = '';
        filteredRows.forEach(row => tbody.appendChild(row));
        console.log('Tbody After Update:', tbody); // Debugging: Log tbody after update
    }

    // --- Products History Sort by Date ---
    const productsSortDropdown = document.getElementById('products-sort-order');
    if (productsSortDropdown) {
        productsSortDropdown.addEventListener('change', filterAndSortProductsTable);
    }

    // --- Orders History Search & Advanced Filter ---
    const ordersSearchInput = document.querySelector('.orders-history-controls .search-bar input');
    const ordersFilter = document.getElementById('orders-filter');
    const ordersTable = document.querySelectorAll('.history-section-container .products-table')[1];
    if (ordersSearchInput && ordersFilter && ordersTable) {
        ordersFilter.addEventListener('change', filterOrdersTable);
    }

    // Removed search bar functionality for Orders History
    if (ordersSearchInput) {
        ordersSearchInput.removeEventListener('input', filterOrdersTable);
    }

    // Updated search functionality for Orders History
    function filterOrdersTable() {
        const search = ordersSearchInput.value.toLowerCase();
        const rows = Array.from(ordersTable.querySelectorAll('tbody tr'));

        // Reset highlights before filtering
        resetHighlights(rows);

        // Filter rows based on search input
        const filteredRows = rows.filter(row => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).some(cell => {
                const match = cell.textContent.toLowerCase().includes(search);
                if (match) highlightMatches(cell, search);
                return match;
            });
        });

        // Sort rows by 'date' in ascending or descending order
        const sortOrder = document.getElementById('orders-sort-order').value;
        filteredRows.sort((a, b) => {
            const dateA = new Date(a.querySelector('td:nth-child(1)').textContent);
            const dateB = new Date(b.querySelector('td:nth-child(1)').textContent);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // Clear table and append filtered and sorted rows
        const tbody = ordersTable.querySelector('tbody');
        tbody.innerHTML = '';
        filteredRows.forEach(row => tbody.appendChild(row));
    }

    // --- Orders History Sort by Date ---
    const ordersSortDropdown = document.getElementById('orders-sort-order');
    if (ordersSortDropdown) {
        ordersSortDropdown.addEventListener('change', filterOrdersTable);
    }

    // Fetch and render history data
    fetch('../PHP/History.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched history data:', data); // Debug log
            renderHistoryData(data);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

    function renderHistoryData(data) {
        const productsTableBody = document.querySelector('.products-table tbody');
        const ordersTableBody = document.querySelectorAll('.products-table tbody')[1];

        data.forEach(record => {
            const row = document.createElement('tr');

            // Use created_at or timestamp for date
            const date = new Date(record.created_at || record.timestamp);
            const formattedDate = date.toLocaleString();

            // Parse details JSON
            let details = {};
            try {
                details = JSON.parse(record.details);
            } catch (e) {
                // fallback: show raw details if not JSON
                details = record.details || {};
            }

            if (record.target_type === 'product') {
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${record.action_type}</td>
                    <td>${details.name || 'N/A'}</td>
                    <td>${details.storage || 'N/A'}</td>
                    <td>${details.color || 'N/A'}</td>
                    <td>${details.price !== undefined ? details.price : 'N/A'}</td>
                    <td>${details.stock !== undefined ? details.stock : 'N/A'}</td>
                    <td>${record.user}</td>
                `;
                productsTableBody.appendChild(row);
            } else if (record.target_type === 'order') {
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${record.action_type}</td>
                    <td>${details.order_id || record.target_id || 'N/A'}</td>
                    <td>${details.product_name || details.product || 'N/A'}</td>
                    <td>${details.quantity !== undefined ? details.quantity : 'N/A'}</td>
                    <td>${details.amount !== undefined ? details.amount : 'N/A'}</td>
                    <td>${details.payment || 'N/A'}</td>
                    <td>${details.status || 'N/A'}</td>
                    <td>${details.customer || 'N/A'}</td>
                    <td>${record.user}</td>
                `;
                ordersTableBody.appendChild(row);
            }
        });
        // Apply pagination after all rows are rendered
        if (productsTable) {
            paginateTable(productsTable, 5);
        }
        if (ordersTable) {
            paginateTable(ordersTable, 5);
        }
    }

    // Highlight matching text in search results
    function highlightMatches(cell, search) {
        const regex = new RegExp(`(${search})`, 'gi');
        cell.innerHTML = cell.textContent.replace(regex, '<span class="highlight">$1</span>');
    }

    // Reset all highlights
    function resetHighlights(rows) {
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.innerHTML = cell.textContent; // Reset to original text
            });
        });
    }

    // Add CSS for highlighting
    const style = document.createElement('style');
    style.textContent = `
        .highlight {
            background-color: yellow;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    // Add pagination logic for Products History
    function paginateTable(table, rowsPerPage) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const totalPages = Math.ceil(rows.length / rowsPerPage);
        let currentPage = 1;

        function renderPage(page) {
            const start = (page - 1) * rowsPerPage;
            const end = start + rowsPerPage;
            rows.forEach((row, index) => {
                row.style.display = index >= start && index < end ? '' : 'none';
            });
            updatePaginationControls();
        }

        // Remove old pagination if exists
        let oldPagination = table.parentElement.querySelector('.pagination-controls');
        if (oldPagination) oldPagination.remove();

        // Create pagination controls
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-controls';

        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-btn';
        prevButton.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        });

        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'pagination-page';

        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-btn';
        nextButton.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage(currentPage);
            }
        });

        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(pageIndicator);
        paginationContainer.appendChild(nextButton);
        table.parentElement.appendChild(paginationContainer);

        function updatePaginationControls() {
            pageIndicator.innerHTML = `<span class="pagination-current">${currentPage}</span>`;
            prevButton.style.visibility = currentPage === 1 ? 'hidden' : 'visible';
            nextButton.style.visibility = currentPage === totalPages ? 'hidden' : 'visible';
        }

        renderPage(currentPage);
    }

    // Add CSS for pagination controls (only once)
    if (!document.getElementById('pagination-style')) {
        const paginationStyle = document.createElement('style');
        paginationStyle.id = 'pagination-style';
        paginationStyle.textContent = `
            .pagination-controls {
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: flex-end;
                margin: 16px 0 0 0;
            }
            .pagination-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid #d1d5db;
                background: #fff;
                color: #374151;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s, color 0.2s;
                padding: 0;
                outline: none;
            }
            .pagination-btn:disabled,
            .pagination-btn[style*="hidden"] {
                opacity: 0.5;
                cursor: default;
            }
            .pagination-current {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #3498db;
                color: #fff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                margin: 0 2px;
            }
            .pagination-page {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .material-symbols-outlined {
                font-family: 'Material Symbols Outlined', sans-serif;
                font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                font-size: 22px;
                line-height: 1;
            }
        `;
        document.head.appendChild(paginationStyle);
    }
});
// ...existing code...