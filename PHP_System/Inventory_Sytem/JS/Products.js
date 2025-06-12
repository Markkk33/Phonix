document.addEventListener('DOMContentLoaded', function () {
    // Example product data (simulate multiple pages)
    const allProducts = [];

    const productsPerPage = 5;
    let currentPage = 1;
    let totalPages = Math.ceil(allProducts.length / productsPerPage);
    let filteredProducts = null;

    function renderTable(page) {
        const tbody = document.querySelector('.products-table tbody');
        tbody.innerHTML = '';
        const productsList = filteredProducts !== null ? filteredProducts : allProducts;
        const start = (page - 1) * productsPerPage;
        const end = start + productsPerPage;
        const products = productsList.slice(start, end);
        products.forEach((product, idx) => {
            const tr = document.createElement('tr');
            let statusClass = '';
            // Use strict match for status
            if (product.status === 'In stock') statusClass = 'in-stock';
            else if (product.status === 'Low Stock') statusClass = 'low-stock';
            else if (product.status === 'Out of Stock') statusClass = 'out-stock';
            else statusClass = 'low-stock'; 
            tr.innerHTML = `
                <td><input type="checkbox" class="select-product"></td>
                <td class="product-info">
                    <img src="${product.img}" alt="Product" class="product-img">
                    <div>
                        <strong>${product.name}</strong><br>
                        <span class="product-id">ID: ${product.id}</span>
                    </div>
                </td>
                <td>${product.storage}</td>
                <td>${product.color}</td>
                <td>${product.stock}</td>
                <td>${product.price}</td>
                <td><span class="${statusClass}">${product.status}</span></td>
                <td>
                    <span class="material-symbols-outlined action-icon edit-product" data-index="${filteredProducts !== null ? allProducts.indexOf(product) : start + idx}">open_in_new</span>
                    <span class="material-symbols-outlined action-icon delete" data-index="${filteredProducts !== null ? allProducts.indexOf(product) : start + idx}">delete</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.querySelector('.products-footer span').textContent = `Showing ${products.length} Entities`;
        afterTableRender();
    }

    // Custom confirmation popup for delete actions
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

    // Attach listeners for edit and delete
    function attachActionListeners() {
        // Delete
        document.querySelectorAll('.action-icon.delete').forEach(btn => {
            btn.onclick = function () {
                const idx = parseInt(this.getAttribute('data-index'));
                showConfirmPopup('Are you sure you want to delete this product?', function() {
                    const product = allProducts[idx];
                    // Send delete request to backend
                    fetch('/PHP_System/Inventory_Sytem/PHP/Products.php', {
                        method: 'POST',
                        body: (() => {
                            const fd = new FormData();
                            fd.append('delete_id', product.id.replace('#',''));
                            return fd;
                        })()
                    })
                    .then(res => res.json())
                    .then(data => {
                        console.log('Delete response data:', data); // Debug log
                        if (data && (data.success === true || data.success === 'true')) {
                            allProducts.splice(idx, 1);
                            totalPages = Math.ceil(allProducts.length / productsPerPage) || 1;
                            if (currentPage > totalPages) currentPage = totalPages;
                            renderTable(currentPage);
                            updatePagination();
                            showNoticePopup('Product has been deleted.');
                        } else {
                            console.error('Failed to delete product:', data && data.error);
                            showNoticePopup('Failed to delete product.');
                        }
                    })
                    .catch(() => {
                        showNoticePopup('Failed to delete product.');
                    });
                });
            };
        });
        // Edit
        document.querySelectorAll('.action-icon.edit-product').forEach(btn => {
            btn.onclick = function () {
                const idx = parseInt(this.getAttribute('data-index'));
                showEditProductPopup(idx);
            };
        });
    }

    // Edit Product Popup logic
    function showEditProductPopup(idx) {
        editingProductIndex = idx;
        const product = allProducts[idx];
        editProductPopup.classList.remove('hidden');
        editProductForm.reset();
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-storage').value = product.storage;
        document.getElementById('edit-product-stock').value = product.stock;
        document.getElementById('edit-product-price').value = parseFloat(product.price.replace('$',''));
        editProductImagePreview.innerHTML = product.img ? `<img src="${product.img}" alt="Preview" style="max-width:48px;max-height:48px;border-radius:8px;">` : '';
        // Set color input value and preview
        const editColorInput = document.getElementById('edit-product-color');
        if (editColorInput) {
            editColorInput.value = product.color || '';
        }
    }

    // Store the original add product submit handler
    function addProductSubmitHandler(e) {
        e.preventDefault();
        console.log('Add Product form submitted'); // Debug log

        const nameInput = document.getElementById('product-name');
        const storageInput = document.getElementById('product-storage');
        const colorInput = document.getElementById('product-color');
        const stockInput = document.getElementById('product-stock');
        const priceInput = document.getElementById('product-price');

        console.log('Checking if input elements exist:', { nameInput, storageInput, colorInput, stockInput, priceInput }); // Debug log

        if (!nameInput || !storageInput || !colorInput || !stockInput || !priceInput) {
            console.error('One or more input elements are missing'); // Debug log
            return;
        }

        const name = nameInput.value;
        const storage = storageInput.value;
        const color = colorInput.value;
        const stock = parseInt(stockInput.value, 10);
        const price = parseFloat(priceInput.value).toFixed(2);

        let imgSrc = '/Pictures/phonIX.png'; // default image
        if (productImageInput.files && productImageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                imgSrc = evt.target.result;
                console.log('Image loaded, calling addNewProduct'); // Debug log
                addNewProduct(name, storage, color, stock, price, imgSrc);
            };
            reader.readAsDataURL(productImageInput.files[0]);
        } else {
            addNewProduct(name, storage, color, stock, price, imgSrc);
        }
        addProductPopup.classList.add('hidden');
    }

    function updatePagination() {
        const pagination = document.querySelector('.pagination');
        pagination.innerHTML = '';
        const productsList = filteredProducts !== null ? filteredProducts : allProducts;
        totalPages = Math.ceil(productsList.length / productsPerPage) || 1;
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

    // Add Product Popup logic
    const addProductBtn = document.querySelector('.add-product-btn');
    const addProductPopup = document.getElementById('add-product-popup');
    const cancelAddProductBtn = document.querySelector('.cancel-add-product');
    const addProductForm = document.getElementById('add-product-form');
    const productImageInput = document.getElementById('product-image');
    const addProductImagePreview = document.getElementById('add-product-image-preview');

    // Edit Product Popup logic
    const editProductPopup = document.getElementById('edit-product-popup');
    const editProductForm = document.getElementById('edit-product-form');
    const cancelEditProductBtn = document.querySelector('.cancel-edit-product');
    const editProductImageInput = document.getElementById('edit-product-image');
    const editProductImagePreview = document.getElementById('edit-product-image-preview');
    let editingProductIndex = null;

    if (addProductBtn && addProductPopup) {
        addProductBtn.addEventListener('click', function () {
            addProductPopup.classList.remove('hidden');
            addProductForm.reset();
            addProductImagePreview.innerHTML = '';
        });
    }
    if (cancelAddProductBtn && addProductPopup) {
        cancelAddProductBtn.addEventListener('click', function () {
            addProductPopup.classList.add('hidden');
        });
    }
    if (productImageInput) {
        productImageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    addProductImagePreview.innerHTML = `<img src="${evt.target.result}" alt="Preview" style="max-width:48px;max-height:48px;border-radius:8px;">`;
                };
                reader.readAsDataURL(file);
            } else {
                addProductImagePreview.innerHTML = '';
            }
        });
    }
    if (addProductForm) {
        addProductForm.onsubmit = function(e) {
            e.preventDefault();
            console.log('Add Product form submitted'); // Debug log
            const name = document.getElementById('product-name').value;
            const storage = document.getElementById('product-storage').value;
            const color = document.getElementById('product-color').value;
            const stock = parseInt(document.getElementById('product-stock').value, 10);
            const price = parseFloat(document.getElementById('product-price').value).toFixed(2);
            let imgSrc = '/Pictures/phonIX.png'; // default image
            if (productImageInput.files && productImageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    imgSrc = evt.target.result;
                    console.log('Image loaded, calling addNewProduct'); // Debug log
                    addNewProduct(name, storage, color, stock, price, imgSrc);
                };
                reader.readAsDataURL(productImageInput.files[0]);
            } else {
                addNewProduct(name, storage, color, stock, price, imgSrc);
            }
            addProductPopup.classList.add('hidden');
        };
    }
    // Edit Product logic
    if (cancelEditProductBtn && editProductPopup) {
        cancelEditProductBtn.addEventListener('click', function () {
            editProductPopup.classList.add('hidden');
        });
    }
    if (editProductImageInput) {
        editProductImageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    editProductImagePreview.innerHTML = `<img src="${evt.target.result}" alt="Preview" style="max-width:48px;max-height:48px;border-radius:8px;">`;
                };
                reader.readAsDataURL(file);
            } else {
                editProductImagePreview.innerHTML = '';
            }
        });
    }
    if (editProductForm) {
        editProductForm.onsubmit = function(e) {
            e.preventDefault();
            if (editingProductIndex === null) return;
            const product = allProducts[editingProductIndex];
            const name = document.getElementById('edit-product-name').value;
            const storage = document.getElementById('edit-product-storage').value;
            const stock = parseInt(document.getElementById('edit-product-stock').value, 10);
            const price = parseFloat(document.getElementById('edit-product-price').value).toFixed(2);
            // Get color from color input
            const colorInput = document.getElementById('edit-product-color');
            const color = colorInput ? colorInput.value : product.color;
            let imgSrc = product.img;
            const formData = new FormData();
            formData.append('id', product.id.replace('#',''));
            formData.append('name', name);
            formData.append('storage', storage);
            formData.append('color', color);
            formData.append('stock', stock);
            formData.append('price', price);
            // If image changed, use new image, else use old
            if (editProductImageInput.files && editProductImageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    imgSrc = evt.target.result;
                    formData.append('image', imgSrc);
                    sendEditRequest();
                };
                reader.readAsDataURL(editProductImageInput.files[0]);
            } else {
                formData.append('image', imgSrc);
                sendEditRequest();
            }
            function sendEditRequest() {
                fetch('/PHP_System/Inventory_Sytem/PHP/Products.php', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    console.log('Edit response data:', data); // Debug log
                    if (data && (data.success === true || data.success === 'true')) {
                        // Update frontend product
                        product.name = name;
                        product.storage = storage;
                        product.stock = stock;
                        product.price = `$${parseFloat(price).toFixed(2)}`;
                        product.img = imgSrc;
                        product.color = color;
                        // Status logic: 0 = Out of Stock, 1-5 = Low Stock, else In stock
                        product.status = stock === 0 ? 'Out of Stock' : (stock <= 5 ? 'Low Stock' : 'In stock');
                        editProductPopup.classList.add('hidden');
                        renderTable(currentPage);
                        updatePagination();
                        showNoticePopup('Product has been updated.');
                    } else {
                        console.error('Failed to update product:', data && data.error);
                        showNoticePopup('Failed to update product.');
                    }
                })
                .catch(err => {
                    console.error('Error during edit fetch:', err);
                    showNoticePopup('Failed to update product.');
                });
            }
        };
    }

    if (addProductForm) {
        addProductForm.onsubmit = addProductSubmitHandler;
    }
    // Add new product to the table and data
    function addNewProduct(name, storage, color, stock, price, imgSrc) {
        console.log('Sending product data to backend:', { name, storage, color, stock, price, imgSrc }); // Debug log
        const formData = new FormData();
        formData.append('name', name);
        formData.append('storage', storage);
        formData.append('color', color);
        formData.append('stock', stock);
        formData.append('price', price);
        formData.append('image', imgSrc); // base64 or file

        fetch('/PHP_System/Inventory_Sytem/PHP/Products.php', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            console.log('Response received from backend:', res); // Debug log
            return res.json();
        })
        .then(data => {
            console.log('Parsed response data:', data); // Debug log
            if (data && (data.success === true || data.success === 'true')) {
                // Optionally, fetch products again or add to allProducts
                allProducts.unshift({
                    img: imgSrc,
                    name: name,
                    id: `#${data.id || Math.floor(Math.random()*10000)}`,
                    storage: storage,
                    color: color,
                    stock: stock,
                    price: `$${parseFloat(price).toFixed(2)}`,
                    status: stock === 0 ? 'Out of Stock' : (stock <= 5 ? 'Low Stock' : 'In stock')
                });
                currentPage = 1;
                totalPages = Math.ceil(allProducts.length / productsPerPage);
                renderTable(currentPage);
                updatePagination();
                showNoticePopup('Product has been added.');
            } else {
                console.error('Failed to add product:', data && data.error); // Debug log
                showNoticePopup('Failed to add product.');
            }
        })
        .catch(err => {
            console.error('Error during fetch:', err); // Debug log
            showNoticePopup('Failed to add product.');
        });
    }

    // Notice popup function
    function showNoticePopup(message) {
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
        setTimeout(() => {
            popup.remove();
        }, 2000);
    }

    // Search bar logic
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = this.value.trim().toLowerCase();
            if (query === '') {
                filteredProducts = null;
            } else {
                filteredProducts = allProducts.filter(product =>
                    product.name.toLowerCase().includes(query) ||
                    product.storage?.toLowerCase().includes(query) ||
                    product.color?.toLowerCase().includes(query) ||
                    product.id.toLowerCase().includes(query)
                );
            }
            currentPage = 1;
            renderTable(currentPage);
            updatePagination();
        });
    }

    // Bulk Actions Functionality
    const selectAll = document.getElementById('select-all-products');
    const checkboxes = document.querySelectorAll('.select-product');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const bulkExportBtn = document.getElementById('bulk-export-btn');

    function updateBulkButtons() {
        const checked = document.querySelectorAll('.select-product:checked').length;
        if (bulkDeleteBtn) bulkDeleteBtn.disabled = checked === 0;
        if (bulkExportBtn) bulkExportBtn.disabled = checked === 0;
    }

    if (selectAll) {
        selectAll.addEventListener('change', function() {
            checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
            updateBulkButtons();
        });
    }
    checkboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            if (!cb.checked && selectAll.checked) selectAll.checked = false;
            if (document.querySelectorAll('.select-product:checked').length === checkboxes.length) {
                selectAll.checked = true;
            }
            updateBulkButtons();
        });
    });

    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', function() {
            const checkedRows = document.querySelectorAll('.select-product:checked');
            if (checkedRows.length === 0) return;
            showConfirmPopup('Are you sure you want to delete the selected products?', function() {
                // Gather IDs to delete
                const idsToDelete = Array.from(checkedRows).map(cb => {
                    const row = cb.closest('tr');
                    const idCell = row.querySelector('.product-id');
                    return idCell ? idCell.textContent.replace('ID: ','').replace('#','') : null;
                }).filter(Boolean);
                if (idsToDelete.length === 0) return;
                // Send delete requests for all selected IDs
                Promise.all(idsToDelete.map(deleteId =>
                    fetch('/PHP_System/Inventory_Sytem/PHP/Products.php', {
                        method: 'POST',
                        body: (() => {
                            const fd = new FormData();
                            fd.append('delete_id', deleteId);
                            return fd;
                        })()
                    }).then(res => res.json())
                )).then(results => {
                    // Remove from allProducts
                    idsToDelete.forEach(deleteId => {
                        const idx = allProducts.findIndex(p => String(p.id).replace('#','') === String(deleteId));
                        if (idx !== -1) allProducts.splice(idx, 1);
                    });
                    totalPages = Math.ceil(allProducts.length / productsPerPage) || 1;
                    if (currentPage > totalPages) currentPage = totalPages;
                    renderTable(currentPage);
                    updatePagination();
                    showNoticePopup('Product has been deleted.');
                }).catch(() => {
                    showNoticePopup('Failed to delete product.');
                });
                selectAll.checked = false;
                updateBulkButtons();
            });
        });
    }

    if (bulkExportBtn) {
        bulkExportBtn.addEventListener('click', function() {
            const checkedRows = document.querySelectorAll('.select-product:checked');
            if (checkedRows.length === 0) return;
            let csv = 'Product,Category,Stock,Price,Status\n';
            checkedRows.forEach(cb => {
                const row = cb.closest('tr');
                if (row) {
                    const cells = row.querySelectorAll('td');
                    csv += Array.from(cells).slice(1, 6).map(cell => cell.innerText.replace(/\n/g, ' ').trim()).join(',') + '\n';
                }
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'selected_products.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // --- Enhanced Bulk Actions UX ---
    // 1. Highlight selected rows
    function highlightSelectedRows() {
        document.querySelectorAll('.products-table tbody tr').forEach((row) => {
            const cb = row.querySelector('.select-product');
            if (cb && cb.checked) {
                row.classList.add('row-selected');
            } else {
                row.classList.remove('row-selected');
            }
        });
    }

    // 2. Show a floating info bar when products are selected
    let floatingBar = null;
    function showFloatingBar(count) {
        if (!floatingBar) {
            floatingBar = document.createElement('div');
            floatingBar.className = 'floating-bulk-bar';
            floatingBar.innerHTML = `<span id="floating-selected-count"></span> products selected`;
            document.body.appendChild(floatingBar);
        }
        document.getElementById('floating-selected-count').textContent = count;
        // Add smooth fade/slide animation
        if (count > 0) {
            floatingBar.style.display = 'flex';
            floatingBar.style.opacity = '1';
            floatingBar.style.transform = 'translateX(-50%) translateY(0)';
        } else {
            floatingBar.style.opacity = '0';
            floatingBar.style.transform = 'translateX(-50%) translateY(30px)';
            setTimeout(() => {
                if (floatingBar.style.opacity === '0') floatingBar.style.display = 'none';
            }, 300);
        }
    }

    // 3. Update both on selection change
    function updateBulkUX() {
        updateBulkButtons();
        highlightSelectedRows();
        const checked = document.querySelectorAll('.select-product:checked').length;
        showFloatingBar(checked);
        showSelectedCountPopup(checked); // Ensure popup is shown
    }

    // 4. Update listeners to use enhanced UX
    function attachBulkCheckboxListeners() {
        const selectAll = document.getElementById('select-all-products');
        const checkboxes = document.querySelectorAll('.select-product');
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
                updateBulkUX();
            });
        }
        checkboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (!cb.checked && selectAll.checked) selectAll.checked = false;
                if (document.querySelectorAll('.select-product:checked').length === checkboxes.length) {
                    selectAll.checked = true;
                }
                updateBulkUX();
            });
        });
    }

    // Call this after rendering table to re-attach listeners
    function afterTableRender() {
        attachActionListeners();
        attachBulkCheckboxListeners();
        updateBulkUX();
    }

    // 5. Add keyboard accessibility for bulk actions
    document.querySelectorAll('.bulk-action-btn').forEach(btn => {
        btn.addEventListener('keyup', function(e) {
            if ((e.key === 'Enter' || e.key === ' ') && !btn.disabled) {
                btn.click();
            }
        });
    });

    // 6. Add ARIA attributes for accessibility
    document.querySelectorAll('.select-product').forEach(cb => {
        cb.setAttribute('aria-label', 'Select product');
    });
    if (selectAll) selectAll.setAttribute('aria-label', 'Select all products');

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

    // --- Filter dropdowns in header (with label and icon) ---
    const productsHeaderControls = document.querySelector('.products-header-controls');
    if (productsHeaderControls) {
        // Find the add-product-btn
        const addProductBtn = productsHeaderControls.querySelector('.add-product-btn');
        // Create Filter label and icon
        const filterLabel = document.createElement('label');
        filterLabel.style.display = 'flex';
        filterLabel.style.alignItems = 'center';
        filterLabel.style.fontWeight = '600';
        filterLabel.style.marginLeft = '12px';
        filterLabel.innerHTML = `<span class="material-symbols-outlined" style="margin-right:4px;color:#1C2336;">filter_alt</span><span style="color:#1C2336;">Filter:</span>`;
        // Storage dropdown
        const storageSelect = document.createElement('select');
        storageSelect.style.marginLeft = '8px';
        storageSelect.style.background = '#1C2336';
        storageSelect.style.color = '#fff';
        storageSelect.style.border = 'none';
        storageSelect.style.borderRadius = '8px';
        storageSelect.style.padding = '6px 16px';
        storageSelect.style.fontWeight = '600';
        storageSelect.style.fontSize = '15px';
        storageSelect.style.cursor = 'pointer';
        storageSelect.style.transition = 'box-shadow 0.3s';
        storageSelect.onfocus = function() { this.style.boxShadow = '0 0 0 2px #96B2DD'; };
        storageSelect.onblur = function() { this.style.boxShadow = 'none'; };
        storageSelect.innerHTML = `
            <option value="All">All Storage</option>
            <option value="128GB">128GB</option>
            <option value="256GB">256GB</option>
            <option value="512GB">512GB</option>
        `;
        // Color dropdown
        const colorSelect = document.createElement('select');
        colorSelect.style.marginLeft = '8px';
        colorSelect.style.background = '#1C2336';
        colorSelect.style.color = '#fff';
        colorSelect.style.border = 'none';
        colorSelect.style.borderRadius = '8px';
        colorSelect.style.padding = '6px 16px';
        colorSelect.style.fontWeight = '600';
        colorSelect.style.fontSize = '15px';
        colorSelect.style.cursor = 'pointer';
        colorSelect.style.transition = 'box-shadow 0.3s';
        colorSelect.onfocus = function() { this.style.boxShadow = '0 0 0 2px #96B2DD'; };
        colorSelect.onblur = function() { this.style.boxShadow = 'none'; };
        colorSelect.innerHTML = `
            <option value="All">All Colors</option>
            <option value="Blue">Blue</option>
            <option value="Black">Black</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
        `;
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
        statusSelect.onfocus = function() { this.style.boxShadow = '0 0 0 2px #96B2DD'; };
        statusSelect.onblur = function() { this.style.boxShadow = 'none'; };
        statusSelect.innerHTML = `
            <option value="All">All Statuses</option>
            <option value="In stock">In stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Low Stock">Low Stock</option>
        `;
        filterLabel.appendChild(storageSelect);
        filterLabel.appendChild(colorSelect);
        filterLabel.appendChild(statusSelect);
        // Place add-product-btn to the left of filterLabel
        if (addProductBtn) {
            productsHeaderControls.insertBefore(filterLabel, addProductBtn.nextSibling);
            productsHeaderControls.insertBefore(addProductBtn, filterLabel);
        } else {
            productsHeaderControls.appendChild(filterLabel);
        }
        // Add custom style for option hover
        const style = document.createElement('style');
        style.innerHTML = `
            select option:hover {
                background: #297FB0 !important;
                color: #fff !important;
            }
        `;
        document.head.appendChild(style);
        // --- Filtering logic ---
        let filterOptions = { storage: 'All', color: 'All', status: 'All' };
        storageSelect.value = filterOptions.storage;
        colorSelect.value = filterOptions.color;
        statusSelect.value = filterOptions.status;
        storageSelect.onchange = function() {
            filterOptions.storage = this.value;
            applyFiltersAndSearch();
        };
        colorSelect.onchange = function() {
            filterOptions.color = this.value;
            applyFiltersAndSearch();
        };
        statusSelect.onchange = function() {
            filterOptions.status = this.value;
            applyFiltersAndSearch();
        };
        function applyFiltersAndSearch() {
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
            filteredProducts = allProducts.filter(product => {
                const matchesSearch =
                    product.name.toLowerCase().includes(query) ||
                    product.storage?.toLowerCase().includes(query) ||
                    product.color?.toLowerCase().includes(query) ||
                    product.id.toLowerCase().includes(query);
                const matchesStorage = filterOptions.storage === 'All' || product.storage === filterOptions.storage;
                const matchesColor = filterOptions.color === 'All' || product.color === filterOptions.color;
                // Improved status filter logic
                let matchesStatus = false;
                if (filterOptions.status === 'All') {
                    matchesStatus = true;
                } else if (filterOptions.status === 'Low Stock') {
                    // Accept both status string and stock range
                    matchesStatus = (product.status === 'Low Stock') || (product.stock > 0 && product.stock <= 5);
                } else if (filterOptions.status === 'Out of Stock') {
                    matchesStatus = (product.status === 'Out of Stock') || (product.stock === 0);
                } else if (filterOptions.status === 'In stock') {
                    matchesStatus = (product.status === 'In stock') || (product.stock > 5);
                } else {
                    matchesStatus = product.status === filterOptions.status;
                }
                return matchesSearch && matchesStorage && matchesColor && matchesStatus;
            });
            currentPage = 1;
            renderTable(currentPage);
            updatePagination();
        }
        // Patch search input to use new filter
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                applyFiltersAndSearch();
            });
        }
        // Fetch available storage and color options from backend and update filter dropdowns
        function updateFilterDropdowns() {
            fetch('/PHP_System/Inventory_Sytem/PHP/Products.php?options=1')
                .then(res => res.json())
                .then(data => {
                    // Update storage dropdown
                    if (data.storages && Array.isArray(data.storages)) {
                        storageSelect.innerHTML = '<option value="All">All Storage</option>' +
                            data.storages.map(s => `<option value="${s}">${s}</option>`).join('');
                    }
                    // Update color dropdown
                    if (data.colors && Array.isArray(data.colors)) {
                        colorSelect.innerHTML = '<option value="All">All Colors</option>' +
                            data.colors.map(c => `<option value="${c}">${c}</option>`).join('');
                    }
                });
        }
        // Call this after filter dropdowns are created
        updateFilterDropdowns();
    }

    // Fetch products from backend on page load
    fetch('/PHP_System/Inventory_Sytem/PHP/Products.php')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                allProducts.length = 0; // Clear existing
                data.forEach(product => {
                    allProducts.push({
                        img: product.image || '/Pictures/phonIX.png',
                        name: product.name,
                        id: `#${product.id}`,
                        storage: product.storage,
                        color: product.color,
                        stock: parseInt(product.stock, 10),
                        price: `$${parseFloat(product.price).toFixed(2)}`,
                        status: product.status
                    });
                });
                renderTable(currentPage);
                updatePagination();
            }
        });

    // Initial render
    renderTable(currentPage);
    updatePagination();

    // Signout confirmation popup logic (matches Dashboard)
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
            window.location.href = '../HMTL/Login.html';
        });
    }
});