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
            window.location.href ='/login';
        });
    }

    // --- Products History Search & Advanced Filter ---
    const productsSearchInput = document.querySelector('.products-history-controls .search-bar input');
    const productsFilter = document.getElementById('products-filter');
    const productsTable = document.querySelectorAll('.history-section-container .products-table')[0];
    if (productsSearchInput && productsFilter && productsTable) {
        productsSearchInput.addEventListener('input', filterProductsTable);
        productsFilter.addEventListener('change', filterProductsTable);
    }
    function filterProductsTable() {
        const search = productsSearchInput.value.toLowerCase();
        const filter = productsFilter.value;
        const rows = productsTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let show = false;
            if (filter === 'all') {
                // Show if any cell matches search
                show = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(search));
            } else if (filter === 'date') {
                // Show if date cell matches search (exact or partial)
                show = cells[0].textContent.toLowerCase().includes(search);
            } else if (filter === 'category') {
                // Show if product name or ID matches search
                let productText = '';
                // If the cell contains a div, get all text inside
                if (cells[2].querySelector('div')) {
                    productText = cells[2].querySelector('div').textContent.toLowerCase();
                } else {
                    productText = cells[2].textContent.toLowerCase();
                }
                show = productText.includes(search);
            } else if (filter === 'storage') {
                // Show if storage column matches search
                show = cells[3].textContent.toLowerCase().includes(search);
            } else if (filter === 'color') {
                // Show if color column matches search
                show = cells[4].textContent.toLowerCase().includes(search);
            } else if (filter === 'user') {
                // Show if user column matches search
                show = cells[5].textContent.toLowerCase().includes(search);
            } else if (filter === 'status') {
                // Show if action (Added/Removed) matches search
                show = cells[1].textContent.toLowerCase().includes(search);
            }
            row.style.display = show ? '' : 'none';
        });
    }

    // --- Orders History Search & Advanced Filter ---
    const ordersSearchInput = document.querySelector('.orders-history-controls .search-bar input');
    const ordersFilter = document.getElementById('orders-filter');
    const ordersTable = document.querySelectorAll('.history-section-container .products-table')[1];
    if (ordersSearchInput && ordersFilter && ordersTable) {
        ordersSearchInput.addEventListener('input', filterOrdersTable);
        ordersFilter.addEventListener('change', filterOrdersTable);
    }
    function filterOrdersTable() {
        const search = ordersSearchInput.value.toLowerCase();
        const filter = ordersFilter.value;
        const rows = ordersTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let show = false;
            if (filter === 'all') {
                show = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(search));
            } else if (filter === 'date') {
                show = cells[0].textContent.toLowerCase().includes(search);
            } else if (filter === 'orderid') {
                show = cells[2].textContent.toLowerCase().includes(search);
            } else if (filter === 'product') {
                show = cells[3].textContent.toLowerCase().includes(search);
            } else if (filter === 'quantity') {
                show = cells[4].textContent.toLowerCase().includes(search);
            } else if (filter === 'client') {
                show = cells[5].textContent.toLowerCase().includes(search);
            } else if (filter === 'user') {
                show = cells[6].textContent.toLowerCase().includes(search);
            } else if (filter === 'status') {
                show = cells[1].textContent.toLowerCase().includes(search);
            }
            row.style.display = show ? '' : 'none';
        });
    }

    // --- Fetch and Render History Data ---
    fetch('/fetch_history')
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            const history = data.history || [];
            // Separate product and order history
            const productRows = [];
            const orderRows = [];
            history.forEach(item => {
                if (item.targetType === 'product') {
                    productRows.push(item);
                } else if (item.targetType === 'order') {
                    orderRows.push(item);
                }
            });
            renderProductHistory(productRows);
            renderOrderHistory(orderRows);
        });

    function parseOrderDetails(details) {
        // Only extract the number for orderId, not the label
        const result = {
            orderId: '', product: '', quantity: '', amount: '', payment: '', status: '', client: ''
        };
        // Order ID (prefer 'order_id:' if present, else fallback to 'order:')
        let orderIdMatch = details.match(/order_id: ([^,]+)/i);
        if (!orderIdMatch) {
            orderIdMatch = details.match(/order: ([^,]+)/i);
        }
        if (orderIdMatch) {
            // Remove any label like 'product_id:' if present in the value
            let idVal = orderIdMatch[1].trim();
            // If the value contains a label, extract only the number part
            const justNum = idVal.match(/\d+/);
            result.orderId = justNum ? justNum[0] : idVal;
        }
        // Product (try to get product name if available, else fallback to product_id)
        const productNameMatch = details.match(/product: ([^,]+)/i);
        if (productNameMatch) {
            result.product = productNameMatch[1].trim();
        } else {
            const productIdMatch = details.match(/product_id: ([^,]+)/i);
            if (productIdMatch) result.product = productIdMatch[1].trim();
        }
        // Customer
        const customerMatch = details.match(/customer: ([^,]+)/i);
        if (customerMatch) result.client = customerMatch[1].trim();
        // Quantity
        const qtyMatch = details.match(/qty: ([^,]+)/i);
        if (qtyMatch) result.quantity = qtyMatch[1].trim();
        // Payment
        const paymentMatch = details.match(/payment: ([^,]+)/i);
        if (paymentMatch) result.payment = paymentMatch[1].trim();
        // Status
        const statusMatch = details.match(/status: ([^,]+)/i);
        if (statusMatch) result.status = statusMatch[1].trim();
        // Amount
        const amountMatch = details.match(/amount: ([^,]+)/i);
        if (amountMatch) result.amount = amountMatch[1].trim();
        return result;
    }

    function renderOrderHistory(rows) {
        orderHistoryRows = rows;
        renderOrderHistoryPage(orderHistoryCurrentPage);
        renderOrderHistoryPagination();
    }
    function renderOrderHistoryPage(page) {
        const table = document.querySelectorAll('.history-section-container .products-table')[1];
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        const start = (page - 1) * orderHistoryPerPage;
        const end = start + orderHistoryPerPage;
        const pageRows = orderHistoryRows.slice(start, end);
        pageRows.forEach(row => {
            const parsed = parseOrderDetails(row.details);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.createdAt}</td>
                <td>${row.actionType}</td>
                <td>${parsed.orderId}</td>
                <td>${parsed.product}</td>
                <td>${parsed.quantity}</td>
                <td>${parsed.amount}</td>
                <td>${parsed.payment}</td>
                <td>${parsed.status}</td>
                <td>${parsed.client}</td>
                <td>Admin</td>
            `;
            tbody.appendChild(tr);
        });
    }
    function renderOrderHistoryPagination() {
        let container = document.getElementById('order-history-pagination');
        if (!container) {
            const table = document.querySelectorAll('.history-section-container .products-table')[1];
            container = document.createElement('div');
            container.id = 'order-history-pagination';
            container.style.display = 'flex';
            container.style.justifyContent = 'flex-end';
            container.style.gap = '8px';
            container.style.margin = '16px 0';
            table.parentNode.appendChild(container);
        }
        container.innerHTML = '';
        const totalPages = Math.ceil(orderHistoryRows.length / orderHistoryPerPage) || 1;
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&lt;';
        prevBtn.disabled = orderHistoryCurrentPage === 1;
        prevBtn.className = 'order-pagination-btn';
        prevBtn.addEventListener('click', function () {
            if (orderHistoryCurrentPage > 1) {
                orderHistoryCurrentPage--;
                renderOrderHistoryPage(orderHistoryCurrentPage);
                renderOrderHistoryPagination();
            }
        });
        container.appendChild(prevBtn);
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'order-pagination-btn';
            if (i === orderHistoryCurrentPage) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', function () {
                orderHistoryCurrentPage = i;
                renderOrderHistoryPage(orderHistoryCurrentPage);
                renderOrderHistoryPagination();
            });
            container.appendChild(btn);
        }
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&gt;';
        nextBtn.disabled = orderHistoryCurrentPage === totalPages;
        nextBtn.className = 'order-pagination-btn';
        nextBtn.addEventListener('click', function () {
            if (orderHistoryCurrentPage < totalPages) {
                orderHistoryCurrentPage++;
                renderOrderHistoryPage(orderHistoryCurrentPage);
                renderOrderHistoryPagination();
            }
        });
        container.appendChild(nextBtn);
    }

    function parseProductDetails(details) {
        // Handle 'Added', 'Edited', and 'Deleted' product formats
        const result = { product: '', storage: '', color: '', price: '', stock: '' };
        if (details.startsWith('Added product:') || details.startsWith('Edited product:')) {
            // Format: Added/Edited product: name, storage, color, stock: X, price: Y
            const parts = details.split(':')[1]?.split(',') || [];
            if (parts.length > 0) result.product = parts[0]?.trim();
            if (parts.length > 1) result.storage = parts[1]?.trim();
            if (parts.length > 2) result.color = parts[2]?.trim();
            const stockMatch = details.match(/stock: ([^,]+)/i);
            if (stockMatch) result.stock = stockMatch[1].trim();
            const priceMatch = details.match(/price: ([^,]+)/i);
            if (priceMatch) result.price = priceMatch[1].trim();
        } else if (details.startsWith('Deleted product:')) {
            // Format: Deleted product: Name: {name}, Storage: {storage}, Color: {color}, Stock: {stock}, Price: {price}
            const nameMatch = details.match(/Name: ([^,]+)/i);
            if (nameMatch) result.product = nameMatch[1].trim();
            const storageMatch = details.match(/Storage: ([^,]+)/i);
            if (storageMatch) result.storage = storageMatch[1].trim();
            const colorMatch = details.match(/Color: ([^,]+)/i);
            if (colorMatch) result.color = colorMatch[1].trim();
            const stockMatch = details.match(/Stock: ([^,]+)/i);
            if (stockMatch) result.stock = stockMatch[1].trim();
            const priceMatch = details.match(/Price: ([^,]+)/i);
            if (priceMatch) result.price = priceMatch[1].trim();
        }
        return result;
    }

    function renderProductHistory(rows) {
        productHistoryRows = rows;
        renderProductHistoryPage(productHistoryCurrentPage);
        renderProductHistoryPagination();
    }
    function renderProductHistoryPage(page) {
        const table = document.querySelectorAll('.history-section-container .products-table')[0];
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        const start = (page - 1) * productHistoryPerPage;
        const end = start + productHistoryPerPage;
        const pageRows = productHistoryRows.slice(start, end);
        pageRows.forEach(row => {
            const parsed = parseProductDetails(row.details);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.createdAt}</td>
                <td>${row.actionType}</td>
                <td>${parsed.product}</td>
                <td>${parsed.storage}</td>
                <td>${parsed.color}</td>
                <td>${parsed.price}</td>
                <td>${parsed.stock}</td>
                <td>${row.user}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    function renderProductHistoryPagination() {
        let container = document.getElementById('product-history-pagination');
        if (!container) {
            const table = document.querySelectorAll('.history-section-container .products-table')[0];
            container = document.createElement('div');
            container.id = 'product-history-pagination';
            container.style.display = 'flex';
            container.style.justifyContent = 'flex-end';
            container.style.gap = '8px';
            container.style.margin = '16px 0';
            table.parentNode.appendChild(container);
        }
        container.innerHTML = '';
        const totalPages = Math.ceil(productHistoryRows.length / productHistoryPerPage) || 1;
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&lt;';
        prevBtn.disabled = productHistoryCurrentPage === 1;
        prevBtn.className = 'product-pagination-btn';
        prevBtn.addEventListener('click', function () {
            if (productHistoryCurrentPage > 1) {
                productHistoryCurrentPage--;
                renderProductHistoryPage(productHistoryCurrentPage);
                renderProductHistoryPagination();
            }
        });
        container.appendChild(prevBtn);
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'product-pagination-btn';
            if (i === productHistoryCurrentPage) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', function () {
                productHistoryCurrentPage = i;
                renderProductHistoryPage(productHistoryCurrentPage);
                renderProductHistoryPagination();
            });
            container.appendChild(btn);
        }
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&gt;';
        nextBtn.disabled = productHistoryCurrentPage === totalPages;
        nextBtn.className = 'product-pagination-btn';
        nextBtn.addEventListener('click', function () {
            if (productHistoryCurrentPage < totalPages) {
                productHistoryCurrentPage++;
                renderProductHistoryPage(productHistoryCurrentPage);
                renderProductHistoryPagination();
            }
        });
        container.appendChild(nextBtn);
    }

    function filterHistoryByDate(startDate, endDate) {
        const rows = document.querySelectorAll('.history-section-container .products-table tbody tr');
        rows.forEach(row => {
            const dateCell = row.querySelector('td:first-child');
            if (!dateCell) return;

            const rowDate = new Date(dateCell.textContent.trim());
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (rowDate >= start && rowDate <= end) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Add event listeners for date filter inputs
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', () => {
            if (startDateInput.value && endDateInput.value) {
                filterHistoryByDate(startDateInput.value, endDateInput.value);
            }
        });

        endDateInput.addEventListener('change', () => {
            if (startDateInput.value && endDateInput.value) {
                filterHistoryByDate(startDateInput.value, endDateInput.value);
            }
        });
    }

    // Add sorting by date functionality
    const sortDateSelect = document.getElementById('sort-date');
    const historyTable = document.querySelector('.history-section-container .products-table');

    if (sortDateSelect && historyTable) {
        sortDateSelect.addEventListener('change', sortHistoryByDate);
    }

    function sortHistoryByDate() {
        const sortOrder = sortDateSelect.value; // 'asc' or 'desc'
        const rows = Array.from(historyTable.querySelectorAll('tbody tr'));

        rows.sort((a, b) => {
            const dateA = parseDate(a.querySelector('td:first-child').textContent.trim());
            const dateB = parseDate(b.querySelector('td:first-child').textContent.trim());

            if (sortOrder === 'asc') {
                return dateA - dateB;
            } else if (sortOrder === 'desc') {
                return dateB - dateA;
            }
        });

        const tbody = historyTable.querySelector('tbody');
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }

    // Connect sorting dropdowns to sorting logic
    const productsSortSelect = document.getElementById('products-sort-order');
    const ordersSortSelect = document.getElementById('orders-sort-order');

    if (productsSortSelect && productsTable) {
        productsSortSelect.addEventListener('change', () => {
            console.log('Sorting products table by:', productsSortSelect.value);
            sortTableByDate(productsTable, productsSortSelect.value);
        });
    }

    if (ordersSortSelect && ordersTable) {
        ordersSortSelect.addEventListener('change', () => {
            console.log('Sorting orders table by:', ordersSortSelect.value);
            sortTableByDate(ordersTable, ordersSortSelect.value);
        });
    }

    function sortTableByDate(table, sortOrder) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));

        rows.sort((a, b) => {
            const dateA = parseDate(a.querySelector('td:first-child').textContent.trim());
            const dateB = parseDate(b.querySelector('td:first-child').textContent.trim());

            console.log('Comparing dates:', dateA, dateB);

            if (sortOrder === 'asc') {
                return dateA - dateB;
            } else if (sortOrder === 'desc') {
                return dateB - dateA;
            }
        });

        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }

    function parseDate(dateString) {
        // Parse MM/DD/YYYY with optional time component
        console.log('Parsing date:', dateString);
        const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2}):(\d{2})(AM|PM))?$/;
        const match = dateString.match(datePattern);
        if (!match) {
            console.error('Invalid date format:', dateString);
            return NaN;
        }
        const [, month, day, year, hour, minute, second, meridian] = match;
        let parsedDate = new Date(year, month - 1, day);

        if (hour && minute && second && meridian) {
            let hours = parseInt(hour, 10);
            if (meridian === 'PM' && hours !== 12) {
                hours += 12;
            } else if (meridian === 'AM' && hours === 12) {
                hours = 0;
            }
            parsedDate.setHours(hours, parseInt(minute, 10), parseInt(second, 10));
        }

        if (isNaN(parsedDate.getTime())) {
            console.error('Invalid date after parsing:', dateString);
            return NaN;
        }
        console.log('Parsed date:', parsedDate);
        return parsedDate;
    }

    // --- Pagination for Product and Order History Tables ---
    let productHistoryRows = [];
    let productHistoryCurrentPage = 1;
    const productHistoryPerPage = 5;
    let orderHistoryRows = [];
    let orderHistoryCurrentPage = 1;
    const orderHistoryPerPage = 5;

    // Render Product History with Pagination
    function renderProductHistory(rows) {
        productHistoryRows = rows;
        renderProductHistoryPage(productHistoryCurrentPage);
        renderProductHistoryPagination();
    }
    function renderProductHistoryPage(page) {
        const table = document.querySelectorAll('.history-section-container .products-table')[0];
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        const start = (page - 1) * productHistoryPerPage;
        const end = start + productHistoryPerPage;
        const pageRows = productHistoryRows.slice(start, end);
        pageRows.forEach(row => {
            const parsed = parseProductDetails(row.details);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.createdAt}</td>
                <td>${row.actionType}</td>
                <td>${parsed.product}</td>
                <td>${parsed.storage}</td>
                <td>${parsed.color}</td>
                <td>${parsed.price}</td>
                <td>${parsed.stock}</td>
                <td>${row.user}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    function renderProductHistoryPagination() {
        let container = document.getElementById('product-history-pagination');
        if (!container) {
            const table = document.querySelectorAll('.history-section-container .products-table')[0];
            container = document.createElement('div');
            container.id = 'product-history-pagination';
            container.style.display = 'flex';
            container.style.justifyContent = 'flex-end';
            container.style.gap = '8px';
            container.style.margin = '16px 0';
            table.parentNode.appendChild(container);
        }
        container.innerHTML = '';
        const totalPages = Math.ceil(productHistoryRows.length / productHistoryPerPage) || 1;
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&lt;';
        prevBtn.disabled = productHistoryCurrentPage === 1;
        prevBtn.className = 'product-pagination-btn';
        prevBtn.addEventListener('click', function () {
            if (productHistoryCurrentPage > 1) {
                productHistoryCurrentPage--;
                renderProductHistoryPage(productHistoryCurrentPage);
                renderProductHistoryPagination();
            }
        });
        container.appendChild(prevBtn);
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'product-pagination-btn';
            if (i === productHistoryCurrentPage) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', function () {
                productHistoryCurrentPage = i;
                renderProductHistoryPage(productHistoryCurrentPage);
                renderProductHistoryPagination();
            });
            container.appendChild(btn);
        }
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&gt;';
        nextBtn.disabled = productHistoryCurrentPage === totalPages;
        nextBtn.className = 'product-pagination-btn';
        nextBtn.addEventListener('click', function () {
            if (productHistoryCurrentPage < totalPages) {
                productHistoryCurrentPage++;
                renderProductHistoryPage(productHistoryCurrentPage);
                renderProductHistoryPagination();
            }
        });
        container.appendChild(nextBtn);
    }

    // Render Order History with Pagination
    function renderOrderHistory(rows) {
        orderHistoryRows = rows;
        renderOrderHistoryPage(orderHistoryCurrentPage);
        renderOrderHistoryPagination();
    }
    function renderOrderHistoryPage(page) {
        const table = document.querySelectorAll('.history-section-container .products-table')[1];
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        const start = (page - 1) * orderHistoryPerPage;
        const end = start + orderHistoryPerPage;
        const pageRows = orderHistoryRows.slice(start, end);
        pageRows.forEach(row => {
            const parsed = parseOrderDetails(row.details);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.createdAt}</td>
                <td>${row.actionType}</td>
                <td>${parsed.orderId}</td>
                <td>${parsed.product}</td>
                <td>${parsed.quantity}</td>
                <td>${parsed.amount}</td>
                <td>${parsed.payment}</td>
                <td>${parsed.status}</td>
                <td>${parsed.client}</td>
                <td>Admin</td>
            `;
            tbody.appendChild(tr);
        });
    }
    function renderOrderHistoryPagination() {
        let container = document.getElementById('order-history-pagination');
        if (!container) {
            const table = document.querySelectorAll('.history-section-container .products-table')[1];
            container = document.createElement('div');
            container.id = 'order-history-pagination';
            container.style.display = 'flex';
            container.style.justifyContent = 'flex-end';
            container.style.gap = '8px';
            container.style.margin = '16px 0';
            table.parentNode.appendChild(container);
        }
        container.innerHTML = '';
        const totalPages = Math.ceil(orderHistoryRows.length / orderHistoryPerPage) || 1;
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&lt;';
        prevBtn.disabled = orderHistoryCurrentPage === 1;
        prevBtn.className = 'order-pagination-btn';
        prevBtn.addEventListener('click', function () {
            if (orderHistoryCurrentPage > 1) {
                orderHistoryCurrentPage--;
                renderOrderHistoryPage(orderHistoryCurrentPage);
                renderOrderHistoryPagination();
            }
        });
        container.appendChild(prevBtn);
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'order-pagination-btn';
            if (i === orderHistoryCurrentPage) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', function () {
                orderHistoryCurrentPage = i;
                renderOrderHistoryPage(orderHistoryCurrentPage);
                renderOrderHistoryPagination();
            });
            container.appendChild(btn);
        }
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&gt;';
        nextBtn.disabled = orderHistoryCurrentPage === totalPages;
        nextBtn.className = 'order-pagination-btn';
        nextBtn.addEventListener('click', function () {
            if (orderHistoryCurrentPage < totalPages) {
                orderHistoryCurrentPage++;
                renderOrderHistoryPage(orderHistoryCurrentPage);
                renderOrderHistoryPagination();
            }
        });
        container.appendChild(nextBtn);
    }

    // --- Pagination Button Styling (for both product and order history) ---
    const style = document.createElement('style');
    style.innerHTML = `
    #product-history-pagination button,
    #order-history-pagination button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid #bdbdbd;
        background: #fff;
        color: #333;
        font-weight: 600;
        font-size: 16px;
        outline: none;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, border 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }
    #product-history-pagination button.active,
    #order-history-pagination button.active {
        background: #3498db;
        color: #fff;
        border: 1px solid #3498db;
    }
    #product-history-pagination button:disabled,
    #order-history-pagination button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    `;
    document.head.appendChild(style);
});
// ...existing code...