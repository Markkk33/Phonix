document.addEventListener('DOMContentLoaded', function () {
    // Instead of using a hardcoded allOrders array, initialize as empty or fetch from backend
    let allOrders = [];
    // You should implement AJAX/fetch to load real orders from your backend here

    const ordersPerPage = 5;
    let currentPage = 1;
    let totalPages = Math.ceil(allOrders.length / ordersPerPage);

    // Removed Edit Order Popup HTML injection (moved to HTML)
    let editingOrderIndex = null;
    let filteredOrders = null;
    let filterOptions = { payment: 'All', status: 'All' };

    // --- Product List for Order Form ---
    let productList = [];
    // Update the fetchProductList function to use the correct Flask route
    async function fetchProductList() {
        try {
            const response = await fetch('/fetch_products'); // Correct Flask route
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();
            productList = data; // Assuming productList is a global variable
        } catch (error) {
            console.error('Error fetching product list:', error);
        }
    }

    // --- Fetch Orders from Backend ---
    function fetchOrders() {
        return fetch('/fetch_orders')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.orders)) {
                    allOrders = data.orders;
                } else {
                    allOrders = [];
                }
                filteredOrders = null;
                renderTable(currentPage);
                updatePagination();
            });
    }

    // Search bar functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applyFiltersAndSearch();
        });
    }

    // Filter dropdowns in header (with label and icon)
    const productsHeaderControls = document.querySelector('.products-header-controls');
    if (productsHeaderControls) {
        // Remove the filter button if it exists
        const filterBtn = productsHeaderControls.querySelector('.add-product-btn');
        if (filterBtn) filterBtn.remove();
        // Create Filter label and icon
        const filterLabel = document.createElement('label');
        filterLabel.style.display = 'flex';
        filterLabel.style.alignItems = 'center';
        filterLabel.style.fontWeight = '600';
        filterLabel.style.marginLeft = '12px';
        filterLabel.innerHTML = `<span class="material-symbols-outlined" style="margin-right:4px;color:#1C2336;">filter_alt</span><span style="color:#1C2336;">Filter:</span>`;
        // Payment dropdown
        const paymentSelect = document.createElement('select');
        paymentSelect.style.marginLeft = '8px';
        paymentSelect.style.background = '#1C2336';
        paymentSelect.style.color = '#fff';
        paymentSelect.style.border = 'none';
        paymentSelect.style.borderRadius = '8px';
        paymentSelect.style.padding = '6px 16px';
        paymentSelect.style.fontWeight = '600';
        paymentSelect.style.fontSize = '15px';
        paymentSelect.style.cursor = 'pointer';
        paymentSelect.style.transition = 'box-shadow 0.3s';
        paymentSelect.onfocus = function() {
            this.style.boxShadow = '0 0 0 2px #96B2DD';
        };
        paymentSelect.onblur = function() {
            this.style.boxShadow = 'none';
        };
        paymentSelect.innerHTML = `
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
        `;
        paymentSelect.value = filterOptions.payment;
        paymentSelect.onchange = function() {
            filterOptions.payment = this.value;
            applyFiltersAndSearch();
        };
        // Status dropdown
        const statusSelect = document.createElement('select');
        statusSelect.style.marginLeft = '8px';
        statusSelect.style.background = '#1C2336';
        statusSelect.style.color = '#fff';
        statusSelect.style.border = 'none';
        statusSelect.style.borderRadius = '8px';
        statusSelect.style.padding = '6px 16px';
        statusSelect.style.fontWeight = '600';
        statusSelect.style.fontSize = '15px';
        statusSelect.style.cursor = 'pointer';
        statusSelect.style.transition = 'box-shadow 0.3s';
        statusSelect.onfocus = function() {
            this.style.boxShadow = '0 0 0 2px #96B2DD';
        };
        statusSelect.onblur = function() {
            this.style.boxShadow = 'none';
        };
        statusSelect.innerHTML = `
            <option value="All">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
        `;
        statusSelect.value = filterOptions.status;
        statusSelect.onchange = function() {
            filterOptions.status = this.value;
            applyFiltersAndSearch();
        };
        filterLabel.appendChild(paymentSelect);
        filterLabel.appendChild(statusSelect);
        productsHeaderControls.appendChild(filterLabel);

    // Add custom style for option hover
    const style = document.createElement('style');
    style.innerHTML = `
        select option:hover {
            background: #297FB0 !important;
            color: #fff !important;
        }
    `;
    document.head.appendChild(style);
    }

    function applyFiltersAndSearch() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        filteredOrders = allOrders.filter(order => {
            // Search
            const matchesSearch =
                order.product.toLowerCase().includes(query) ||
                order.orderId.toLowerCase().includes(query) ||
                order.customer.toLowerCase().includes(query) ||
                order.amount.toLowerCase().includes(query) ||
                order.payment.toLowerCase().includes(query) ||
                order.status.toLowerCase().includes(query);
            // Filter
            const matchesPayment = filterOptions.payment === 'All' || order.payment === filterOptions.payment;
            const matchesStatus = filterOptions.status === 'All' || order.status.trim().toLowerCase() === filterOptions.status.trim().toLowerCase();
            return matchesSearch && matchesPayment && matchesStatus;
        });
        currentPage = 1;
        renderTable(currentPage);
        updatePagination();
    }

    function attachOrderActionListeners() {
      // Delete
      document.querySelectorAll('.action-icon.delete').forEach((btn) => {
        btn.onclick = function () {
          const row = btn.closest('tr');
          if (!row) return;
          const orderIdCell = row.children[2];
          if (!orderIdCell) return;
          const orderId = orderIdCell.textContent;
          // Find the order in allOrders to get the DB id
          const order = allOrders.find(order => order.orderId == orderId);
          if (!order) return;
          const formData = new FormData();
          formData.append('action', 'delete');
          formData.append('id', order.id);
          fetch('/delete_order', {
            method: 'POST',
            body: formData
          })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              fetchOrders();
              showOrderNoticePopup('Order has been deleted.');
            } else {
              showOrderNoticePopup(result.error || 'Failed to delete order.');
            }
          });
        };
      });
      // Edit
      document.querySelectorAll('.action-icon:not(.delete)').forEach((btn, idx) => {
        btn.onclick = function () {
          editingOrderIndex = (currentPage - 1) * ordersPerPage + idx;
          showEditOrderPopup(editingOrderIndex);
        };
      });
    }

    function showEditOrderPopup(idx) {
      const order = allOrders[idx];
      // No dropdown, just show the product as plain text (not editable)
      const productSelect = document.getElementById('edit-order-product');
      if (productSelect) {
        productSelect.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = order.product;
        productSelect.parentNode.replaceChild(span, productSelect);
      }
      document.getElementById('edit-order-product-id').value = order.productId;
      document.getElementById('edit-order-customer').value = order.customer;
      document.getElementById('edit-order-quantity').value = order.quantity;
      document.getElementById('edit-order-amount').value = order.amount;
      document.getElementById('edit-order-payment').value = order.payment;
      document.getElementById('edit-order-status').value = order.status;
      document.getElementById('edit-order-popup').classList.remove('hidden');
      document.getElementById('edit-order-form').onsubmit = function (e) {
        e.preventDefault();
        if (editingOrderIndex === null) return;
        const order = allOrders[editingOrderIndex];
        const id = order.id;
        const productId = parseInt(document.getElementById('edit-order-product-id').value, 10);
        const customer = document.getElementById('edit-order-customer').value;
        const quantity = parseInt(document.getElementById('edit-order-quantity').value, 10);
        const payment = document.getElementById('edit-order-payment').value;
        const status = document.getElementById('edit-order-status').value;

        // Extra validation and debug logging
        if (!id || isNaN(productId) || !customer || isNaN(quantity) || quantity <= 0 || !payment || !status) {
          console.error('Edit order: missing or invalid field', { id, productId, customer, quantity, payment, status });
          showOrderNoticePopup('Please fill out all fields correctly.');
          return;
        }
        // Debug: log outgoing form data
        console.log('Submitting edit order:', { id, product_id: productId, customer, quantity, payment, status });

        const formData = new FormData();
        formData.append('id', id);
        formData.append('product_id', productId);
        formData.append('customer', customer);
        formData.append('quantity', quantity);
        formData.append('payment', payment);
        formData.append('status', status);
        fetch('/edit_order', {
          method: 'POST',
          body: formData
        })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            fetchOrders();
            document.getElementById('edit-order-popup').classList.add('hidden');
            showOrderNoticePopup('Order has been updated.');
          } else {
            showOrderNoticePopup(result.error || 'Failed to update order.');
          }
        });
      };
    }

    document.querySelector('.cancel-edit-order').onclick = function () {
      document.getElementById('edit-order-popup').classList.add('hidden');
    };

    function showOrderNoticePopup(message) {
      const popup = document.createElement('div');
      popup.textContent = message;
      popup.style.position = 'fixed';
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      popup.style.backgroundColor = '#4CAF50';
      popup.style.color = 'white';
      popup.style.padding = '20px 32px';
      popup.style.borderRadius = '10px';
      popup.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
      popup.style.textAlign = 'center';
      popup.style.zIndex = '2000';
      document.body.appendChild(popup);
      setTimeout(() => { popup.remove(); }, 2000);
    }

    // Update renderTable to use filteredOrders if present
    function renderTable(page) {
        const tbody = document.querySelector('.products-table tbody');
        tbody.innerHTML = '';
        const ordersList = filteredOrders !== null ? filteredOrders : allOrders;
        const start = (page - 1) * ordersPerPage;
        const end = start + ordersPerPage;
        const orders = ordersList.slice(start, end);
        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox"></td>
                <td class="product-info"><img src="${order.img}" alt="Product" class="product-img"><div><strong>${order.product}</strong></div></td>
                <td>${order.orderId}</td>
                <td>${order.customer}</td>
                <td>${order.quantity}</td>
                <td>${order.amount}</td>
                <td><span class="${order.payment === 'Paid' ? 'paid' : 'pending'}">${order.payment}</span></td>
                <td><span class="${order.status === 'Delivered' ? 'delivered' : order.status === 'Shipped' ? 'shipped' : 'processing'}">${order.status}</span></td>
                <td><span class="material-symbols-outlined action-icon">open_in_new</span><span class="material-symbols-outlined action-icon delete">delete</span></td>
            `;
            tbody.appendChild(tr);
        });
        // Update footer entity count
        document.querySelector('.products-footer span').textContent = `Showing ${orders.length} Entities`;
        attachOrderActionListeners();
    }

    // Update updatePagination to use filteredOrders
    function updatePagination() {
        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = '';
        const ordersList = filteredOrders !== null ? filteredOrders : allOrders;
        totalPages = Math.ceil(ordersList.length / ordersPerPage) || 1;
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === currentPage) btn.classList.add('active');
            btn.addEventListener('click', function () {
                currentPage = i;
                renderTable(currentPage);
                updatePagination();
            });
            pagination.appendChild(btn);
        }
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&gt;';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable(currentPage);
                updatePagination();
            }
        });
        pagination.appendChild(nextBtn);
    }

    // Signout confirmation popup logic (matches Dashboard)
    const signoutButton = document.querySelector('.signout');
    const signoutPopup = document.getElementById('signout-popup');
    const signoutConfirm = document.querySelector('.signout-confirm');
    const signoutCancel = document.querySelector('.signout-cancel');

    if (signoutButton && signoutPopup) {
        signoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default and stop propagation
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
            window.location.href = '/login';
        });
    }

    // --- Bulk Select Checkbox Logic ---
    const selectAllCheckbox = document.getElementById('select-all');
    function updateRowCheckboxes(checked) {
        document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checked);
    }
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            updateRowCheckboxes(this.checked);
        });
    }

    // Remove Export to CSV button if present
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) exportCsvBtn.remove();

    // --- Sortable Columns ---
    function sortTable(n) {
        const table = document.querySelector('.products-table');
        let switching = true, dir = "asc", switchcount = 0;
        while (switching) {
            switching = false;
            let rows = table.rows;
            for (let i = 1; i < (rows.length - 1); i++) {
                let shouldSwitch = false;
                let x = rows[i].getElementsByTagName("TD")[n-1];
                let y = rows[i + 1].getElementsByTagName("TD")[n-1];
                if (!x || !y) continue;
                let xContent = x.textContent || x.innerText;
                let yContent = y.textContent || y.innerText;
                if (dir === "asc" ? xContent > yContent : xContent < yContent) {
                    shouldSwitch = true;
                    break;
                }
            }
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
                switchcount++;
            } else if (switchcount === 0 && dir === "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
    
    function renderBulkActionsBar() {
        let bar = document.querySelector('.orders-bulk-actions');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'orders-bulk-actions';
            bar.style.margin = '16px 0';
            bar.style.display = 'flex';
            bar.style.gap = '12px';
            bar.style.alignItems = 'center';
            // --- Notice Counter ---
            const counter = document.createElement('span');
            counter.id = 'bulk-selected-counter';
            counter.style.fontWeight = '600';
            counter.style.color = '#297FB0';
            counter.style.fontSize = '15px';
            counter.style.marginRight = '8px';
            bar.appendChild(counter);
            // ---
            const delBtn = document.createElement('button');
            delBtn.id = 'bulk-delete-btn';
            delBtn.className = 'bulk-action-btn';
            delBtn.textContent = 'Delete Selected';
            delBtn.disabled = true;
            bar.appendChild(delBtn);
            const exportBtn = document.createElement('button');
            exportBtn.id = 'bulk-export-btn';
            exportBtn.className = 'bulk-action-btn';
            exportBtn.textContent = 'Export Selected';
            exportBtn.disabled = true;
            bar.appendChild(exportBtn);
            // Insert before .products-footer
            const container = document.querySelector('.products-table-container');
            const footer = document.querySelector('.products-footer');
            if (container && footer) container.insertBefore(bar, footer);
            // Attach delete event
            delBtn.addEventListener('click', function() {
                const checkboxes = document.querySelectorAll('.row-checkbox:checked');
                if (checkboxes.length === 0) return;
                showConfirmPopup('Are you sure you want to delete the selected orders?', function() {
                    const idsToDelete = Array.from(checkboxes).map(cb => {
                        const row = cb.closest('tr');
                        return row && row.children[2] ? row.children[2].textContent : null;
                    }).filter(Boolean);
                    // Find DB ids for selected orders
                    const dbIds = allOrders.filter(order => idsToDelete.includes(order.orderId)).map(order => order.id);
                    // Delete each order via backend
                    Promise.all(dbIds.map(id => {
                        const formData = new FormData();
                        formData.append('action', 'delete');
                        formData.append('id', id);
                        return fetch('/delete_order', {
                          method: 'POST',
                          body: formData
                        }).then(res => res.json());
                      })).then(results => {
                        const allSuccess = results.every(r => r.success);
                        fetchOrders();
                        if (allSuccess) {
                          showOrderNoticePopup('Selected orders have been deleted.');
                        } else {
                          showOrderNoticePopup('Some orders could not be deleted.');
                        }
                      });
                });
            });
            // Attach export event
            exportBtn.addEventListener('click', function() {
                const checkboxes = document.querySelectorAll('.row-checkbox:checked');
                if (checkboxes.length === 0) return;
                let csv = 'Product,Order ID,Client Name,Quantity,Amount,Payment,Status\n';
                checkboxes.forEach(cb => {
                    const row = cb.closest('tr');
                    if (row) {
                        const cells = row.querySelectorAll('td');
                        // cells[1]=product, 2=orderId, 3=client, 4=qty, 5=amt, 6=pay, 7=status
                        csv += [1,2,3,4,5,6,7].map(i => (cells[i] ? cells[i].innerText.replace(/\n/g, ' ').trim() : '')).join(',') + '\n';
                    }
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'selected_orders.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    }

    function showSelectedCountPopup(count) {
        // Remove any existing popup
        const existing = document.getElementById('selected-count-popup');
        if (existing) existing.remove();
        if (count === 0) return;
        const popup = document.createElement('div');
        popup.id = 'selected-count-popup';
        popup.textContent = `${count} orders selected`;
        // Apply new styles
        popup.style.position = 'fixed';
        popup.style.bottom = '32px';
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%) translateY(30px)';
        popup.style.background = 'linear-gradient(90deg, #297FB0 60%, #1C2336 100%)';
        popup.style.color = '#fff';
        popup.style.padding = '12px 32px';
        popup.style.borderRadius = '16px';
        popup.style.boxShadow = '0 4px 24px rgba(41,127,176,0.18)';
        popup.style.fontSize = '18px';
        popup.style.fontWeight = '700';
        popup.style.zIndex = '2001';
        popup.style.display = 'flex';
        popup.style.alignItems = 'center';
        popup.style.gap = '8px';
        popup.style.pointerEvents = 'none';
        popup.style.opacity = '0';
        popup.style.transition = 'opacity 0.3s cubic-bezier(.4,0,.2,1), transform 0.3s cubic-bezier(.4,0,.2,1)';
        document.body.appendChild(popup);
        // Animate in
        setTimeout(() => {
            popup.style.display = 'flex';
            popup.style.opacity = '1';
            popup.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        // Animate out and remove
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(-50%) translateY(30px)';
            setTimeout(() => { popup.remove(); }, 300);
        }, 1500);
    }

    function updateBulkButtons() {
        const checked = document.querySelectorAll('.row-checkbox:checked').length;
        const delBtn = document.getElementById('bulk-delete-btn');
        const exportBtn = document.getElementById('bulk-export-btn');
        if (delBtn) delBtn.disabled = checked === 0;
        if (exportBtn) exportBtn.disabled = checked === 0;
        // Show popup for selected count
        showSelectedCountPopup(checked);
    }

    function highlightSelectedRows() {
        document.querySelectorAll('.products-table tbody tr').forEach((row) => {
            const cb = row.querySelector('.row-checkbox');
            if (cb && cb.checked) {
                row.classList.add('row-selected');
            } else {
                row.classList.remove('row-selected');
            }
        });
    }

    function attachBulkCheckboxListeners() {
        const selectAll = document.getElementById('select-all');
        const checkboxes = document.querySelectorAll('.row-checkbox');
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
                updateBulkButtons();
                highlightSelectedRows();
            });
        }
        checkboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (!cb.checked && selectAll.checked) selectAll.checked = false;
                if (document.querySelectorAll('.row-checkbox:checked').length === checkboxes.length) {
                    selectAll.checked = true;
                }
                updateBulkButtons();
                highlightSelectedRows();
            });
        });
    }

    function showConfirmPopup(message, onConfirm) {
        // Remove any existing confirm popup
        const existing = document.getElementById('custom-confirm-popup');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'custom-confirm-popup';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.18)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '3000';
        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.padding = '32px 40px';
        box.style.borderRadius = '14px';
        box.style.boxShadow = '0 6px 32px rgba(41,127,176,0.18)';
        box.style.textAlign = 'center';
        box.style.minWidth = '340px';
        box.innerHTML = `
            <div style="font-size:1.35rem;font-weight:700;margin-bottom:28px;letter-spacing:0.2px;">${message}</div>
            <div style="display:flex;justify-content:center;gap:16px;">
                <button id="confirm-yes" style="background:#181F2B;color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:1rem;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,0.04);transition:background 0.2s;cursor:pointer;">Yes</button>
                <button id="confirm-no" style="background:#fff;color:#181F2B;padding:12px 32px;border:1.5px solid #C7CED9;border-radius:8px;font-size:1rem;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,0.04);transition:background 0.2s;cursor:pointer;">Cancel</button>
            </div>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        document.getElementById('confirm-yes').onclick = function() {
            overlay.remove();
            onConfirm();
        };
        document.getElementById('confirm-no').onclick = function() {
            overlay.remove();
        };
    }

    // Call after rendering table
    function afterTableRender() {
        attachOrderActionListeners();
        attachBulkCheckboxListeners();
        updateBulkButtons();
        highlightSelectedRows();
    }

    // Patch renderTable to call afterTableRender
    const origRenderTable = renderTable;
    renderTable = function(page) {
        origRenderTable(page);
        renderBulkActionsBar();
        afterTableRender();
    };

    // Initial render
    renderBulkActionsBar();
    afterTableRender();

    // --- Add Order Popup Logic ---
    const addOrderBtn = document.querySelector('.add-order-btn');
    let addOrderPopup = document.getElementById('add-order-popup');
    let addOrderPopupInitialized = false;

    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', async function () {
            await fetchProductList(); // Ensure product list is fetched before showing the popup

            if (!addOrderPopup) {
                addOrderPopup = document.createElement('div');
                addOrderPopup.id = 'add-order-popup';
                addOrderPopup.className = 'popup';
                addOrderPopup.innerHTML = `
                <div class="popup-content">
                    <div class="popup-header"><h3>Add New Order</h3></div>
                    <form id="add-order-form" class="popup-body">
                        <div class="form-group">
                            <label>Product:</label>
                            <select id="add-order-product" required></select>
                        </div>
                        <div class="form-group">
                            <label>Customer Name:</label>
                            <input type="text" id="add-order-customer" required>
                        </div>
                        <div class="form-group">
                            <label>Quantity:</label>
                            <input type="number" id="add-order-quantity" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Amount:</label>
                            <input type="text" id="add-order-amount" required disabled>
                        </div>
                        <div class="form-group">
                            <label>Payment:</label>
                            <select id="add-order-payment">
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Status:</label>
                            <select id="add-order-status">
                                <option value="Delivered">Delivered</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                            </select>
                        </div>
                        <div class="popup-actions">
                            <button type="button" class="cancel-add-order">Cancel</button>
                            <button type="submit" class="save-add-order">Add Order</button>
                        </div>
                    </form>
                </div>`;
                document.body.appendChild(addOrderPopup);
                addOrderPopupInitialized = true;
            }

            // Ensure cancel button logic is attached after popup is appended
            if (addOrderPopup) {
                const cancelBtn = addOrderPopup.querySelector('.cancel-add-order');
                if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
                    cancelBtn.addEventListener('click', function () {
                        addOrderPopup.classList.add('hidden');
                    });
                    cancelBtn.setAttribute('data-listener', 'true');
                }
            }

            // Debugging: Log the fetched product list
            console.log('Fetched product list:', productList);

            // Ensure the dropdown displays product name with storage and color in parentheses
            const productDropdown = document.getElementById('add-order-product');
            if (productList && productList.products) {
                const products = productList.products;
                productDropdown.innerHTML = products.map(p => `
                    <option value="${p.id}">${p.name} (${p.storage}, ${p.color})</option>
                `).join('');
            } else {
                console.error('Product list is not in the expected format:', productList);
            }

            addOrderPopup.classList.remove('hidden');
            document.getElementById('add-order-form').reset();

            // Set up amount calculation
            const productSelect = document.getElementById('add-order-product');
            const quantityInput = document.getElementById('add-order-quantity');
            const amountInput = document.getElementById('add-order-amount');

            function updateAmount() {
                const selected = productList.products.find(p => String(p.id) === productSelect.value);
                const qty = parseInt(quantityInput.value, 10) || 0;
                if (selected && qty > 0) {
                    amountInput.value = `$${(qty * parseFloat(selected.price)).toFixed(2)}`;
                } else {
                    amountInput.value = '';
                }
            }

            productSelect.onchange = updateAmount;
            quantityInput.oninput = updateAmount;
            updateAmount();

            // Cancel button logic
            const cancelBtn = addOrderPopup.querySelector('.cancel-add-order');
            if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
                cancelBtn.addEventListener('click', function () {
                    addOrderPopup.classList.add('hidden');
                });
                cancelBtn.setAttribute('data-listener', 'true');
            }

            // Form submission logic
            const addOrderForm = addOrderPopup.querySelector('#add-order-form');
            if (addOrderForm && !addOrderForm.hasAttribute('data-listener')) {
                addOrderForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const productId = document.getElementById('add-order-product').value;
                    const customer = document.getElementById('add-order-customer').value;
                    const quantity = parseInt(document.getElementById('add-order-quantity').value, 10);
                    const payment = document.getElementById('add-order-payment').value;
                    const status = document.getElementById('add-order-status').value;

                    const formData = new FormData();
                    formData.append('product_id', productId);
                    formData.append('customer', customer);
                    formData.append('quantity', quantity);
                    formData.append('payment', payment);
                    formData.append('status', status);

                    fetch('/add_order', {
                        method: 'POST',
                        body: formData
                    })
                        .then(res => res.json())
                        .then(result => {
                            if (result.success) {
                                fetchOrders();
                                addOrderPopup.classList.add('hidden');
                                showOrderNoticePopup('Order has been added.');
                            } else {
                                showOrderNoticePopup(result.error || 'Failed to add order.');
                            }
                        });
                });
                addOrderForm.setAttribute('data-listener', 'true');
            }

            productSelect.onchange = updateAmount;
            quantityInput.oninput = updateAmount;
            updateAmount();
        });
    }

    // --- Initial Data Load ---
    fetchProductList().then(() => {
        fetchOrders().then(() => {
            applyFiltersAndSearch();
        });
    });

    // Fetch products and populate the dropdown in the Add Product form
    function populateProductDropdown() {
        fetch('/fetch_products') // Adjusted to Python backend route
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const productDropdown = document.getElementById('add-order-product');
                    if (productDropdown) {
                        productDropdown.innerHTML = ''; // Clear existing options
                        data.products.forEach(product => {
                            const option = document.createElement('option');
                            option.value = product.id;
                            option.textContent = product.name;
                            productDropdown.appendChild(option);
                        });
                    }
                } else {
                    console.error('Failed to fetch products:', data.message);
                }
            })
            .catch(err => console.error('Error fetching products:', err));
    }

    // Call the function to populate the dropdown
    populateProductDropdown();
});