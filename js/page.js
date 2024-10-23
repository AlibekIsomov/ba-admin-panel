src="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-alpha3/dist/js/adminlte.min.js"

let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;
let currentSearchTerm = '';
let currentSortBy = 'status:asc';
let currentStatusFilter = '';

document.addEventListener('DOMContentLoaded', function() {
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            "closeButton": true,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
    } else {
        console.error('Toastr is not loaded. Notifications will not work.');
    }

    fetchClientsData();
});

function showNotification(message, type = 'success') {
    if (typeof toastr === 'undefined') {
        console.error('Toastr is not loaded. Falling back to alert.');
        alert(type.toUpperCase() + ': ' + message);
        return;
    }

    switch(type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        case 'warning':
            toastr.warning(message);
            break;
        case 'info':
            toastr.info(message);
            break;
    }
}

document.getElementById('sortButton').addEventListener('click', handleSort);
document.getElementById('statusSortSelect').addEventListener('change', handleSortByStatus);
document.getElementById('addClientButton').addEventListener('click', addClient);

function handleSort() {
    currentSortBy = document.getElementById('sortSelect').value;
    currentPage = 1; // Reset to first page when changing sort
    fetchClientsData(currentPage, currentSearchTerm, currentSortBy);
}

function handleSortByStatus() {
    const selectedStatus = document.getElementById('statusSortSelect').value;
    if (selectedStatus) {
        currentSortBy = `status:asc`; // Default sort order for status
        currentStatusFilter = selectedStatus; // Set the status filter
    } else {
        currentSortBy = 'status:desc'; // Default sort order if no status is selected
        currentStatusFilter = ''; // Clear the status filter
    }
    currentPage = 1; // Reset to first page when changing sort
    fetchClientsData(currentPage, currentSearchTerm, currentSortBy, currentStatusFilter);
}

function fetchClientsData(page = currentPage, searchTerm = currentSearchTerm, sortBy = currentSortBy, statusFilter = currentStatusFilter) {
    const url = new URL('http://localhost:8081/clients');
    url.searchParams.append('page', page);
    url.searchParams.append('limit', itemsPerPage);
    url.searchParams.append('sort', sortBy);
    if (searchTerm) {
        url.searchParams.append('search', searchTerm);
    }
    if (statusFilter) {
        url.searchParams.append('status', statusFilter);
    }

    // Debugging: Print the URL and parameters
    console.log("Fetching data with URL:", url.toString());

    authenticatedFetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch clients data');
            }
            return response.json();
        })
        .then(responseData => {
            console.log('API Response:', responseData);
            if (responseData.data) {
                updateTable(responseData.data);
            } else {
                console.error('Invalid API response:', responseData);
            }
            
            if (responseData.total !== undefined) {
                totalPages = Math.max(1, Math.ceil(responseData.total / itemsPerPage));
            } else if (responseData.totalPages !== undefined) {
                totalPages = Math.max(1, responseData.totalPages);
            } else {
                totalPages = responseData.data.length < itemsPerPage ? 1 : currentPage + 1;
            }
            
            currentPage = page;
            updatePagination();
        })
        .catch(error => {
            console.error('Error fetching clients data:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to fetch clients data: ' + error.message);
            } else {
                alert('Failed to fetch clients data: ' + error.message);
            }
        });
}

function updateTable(clients) {
    const tableBody = document.getElementById('clientsTableBody');
    tableBody.innerHTML = '';
    clients.forEach(client => {
        const clientType = client.chatID === 0 ? 'Website' : 'Telegram';
        
        // Map status to color, icon, and display name
        const statusMap = {
            active: { color: 'green', icon: '✔️', displayName: 'Aktiv' },
            inactive: { color: 'red', icon: '❌', displayName: 'Disaktiv' },
            pending: { color: 'orange', icon: '⏳', displayName: 'Kutilmoqda' },
            agree: { color: 'blue', icon: '👍', displayName: 'Rozi bolgan' }
        };
        
        const status = statusMap[client.status.toLowerCase()] || { color: 'black', icon: '', displayName: client.status };
        
        const row = `
            <tr>
                <td>${client.ID}</td>
                <td>${client.name}</td>
                <td>${client.phone_number}</td>
                <td>${client.age}</td>
                <td style="color: ${status.color};">${status.icon} ${status.displayName}</td>
                <td>${client.clients_comment}</td>
                <td>${client.source}</td>
                <td>${new Date(client.CreatedAt).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editClient(${client.ID})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.ID})">Delete</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function addClient() {
    const form = `
        <form id="addClientForm">
            <div class="mb-3">
                <label for="name" class="form-label">Ismi</label>
                <input type="text" class="form-control" id="name" required>
            </div>
            <div class="mb-3">
                <label for="phone_number" class="form-label">Phone Number</label>
                <input type="text" class="form-control" id="phone_number" required>
            </div>
            <div class="mb-3">
                <label for="age" class="form-label">Yoshi</label>
                <input type="number" class="form-control" id="age" required>
            </div>
            <div class="mb-3">
                <label for="status" class="form-label">Status</label>
                <select class="form-control" id="status" required>
                    <option value="active">Aktiv</option>
                    <option value="inactive">Disaktiv</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="agree">Rozi</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="clients_comment" class="form-label">Izoh</label>
                <textarea class="form-control" id="clients_comment"></textarea>
            </div>
            <div class="mb-3">
                <label for="source" class="form-label">Manba</label>
                <select class="form-control" id="source" required>
                    <option value="telegram">Telegram</option>
                    <option value="website">Website</option>
                    <option value="telephone">Telefon</option>
                    <option value="instagram">Instagram</option>
                </select>
            </div>
        </form>
    `;

    bootbox.dialog({
        title: 'Add Client',
        message: form,
        buttons: {
            cancel: {
                label: 'Cancel',
                className: 'btn-secondary'
            },
            save: {
                label: 'Save',
                className: 'btn-primary',
                callback: function() {
                    const newClient = {
                        name: document.getElementById('name').value,
                        phone_number: document.getElementById('phone_number').value,
                        age: parseInt(document.getElementById('age').value, 10), // Convert to integer
                        status: document.getElementById('status').value, // Keep as string
                        clients_comment: document.getElementById('clients_comment').value,
                        source: document.getElementById('source').value // Include source
                    };

                    // Send the new client data to the server
                    authenticatedFetch('http://localhost:8081/clients', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newClient)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        showNotification('Client added successfully', 'success');
                        fetchClientsData();
                    })
                    .catch(error => {
                        console.error('Error adding client:', error);
                        showNotification('Failed to add client: ' + error.message, 'error');
                    });
                }
            }
        }
    });
}

function editClient(id) {
    // Fetch the client data
    authenticatedFetch(`http://localhost:8081/clients/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch client data');
            }
            return response.json();
        })
        .then(client => {
            // Create a form with the client data
            const form = `
                <form id="editClientForm">
                    <div class="mb-3">
                        <label for="name" class="form-label">Ismi</label>
                        <input type="text" class="form-control" id="name" value="${client.name}" required>
                    </div>
                    <div class="mb-3">
                        <label for="phone_number" class="form-label">Telfon raqami</label>
                        <input type="text" class="form-control" id="phone_number" value="${client.phone_number}" required>
                    </div>
                    <div class="mb-3">
                        <label for="age" class="form-label">Age</label>
                        <input type="number" class="form-control" id="age" value="${client.age}" required>
                    </div>
                    <div class="mb-3">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-control" id="status" required>
                            <option value="active" ${client.status === 'active' ? 'selected' : ''}>Aktiv</option>
                            <option value="inactive" ${client.status === 'inactive' ? 'selected' : ''}>Disaktiv</option>
                            <option value="pending" ${client.status === 'pending' ? 'selected' : ''}>Kutilmoqda</option>
                            <option value="agree" ${client.status === 'agree' ? 'selected' : ''}>Rozi</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="clients_comment" class="form-label">Izoh</label>
                        <textarea class="form-control" id="clients_comment">${client.clients_comment}</textarea>
                    </div>
                    <div class="mb-3">
                        <label for="source" class="form-label">Source</label>
                        <select class="form-control" id="source" required>
                            <option value="telegram" ${client.source === 'telegram' ? 'selected' : ''}>Telegram</option>
                            <option value="website" ${client.source === 'website' ? 'selected' : ''}>Website</option>
                            <option value="telephone" ${client.source === 'telephone' ? 'selected' : ''}>Telefon</option>
                            <option value="instagram" ${client.source === 'instagram' ? 'selected' : ''}>Instagram</option>
                        </select>
                    </div>
                </form>
            `;

            // Show the form in a modal
            bootbox.dialog({
                title: 'Edit Client',
                message: form,
                buttons: {
                    cancel: {
                        label: 'Cancel',
                        className: 'btn-secondary'
                    },
                    save: {
                        label: 'Save',
                        className: 'btn-primary',
                        callback: function() {
                            const updatedClient = {
                                name: document.getElementById('name').value,
                                phone_number: document.getElementById('phone_number').value,
                                age: parseInt(document.getElementById('age').value, 10), // Convert to integer
                                status: document.getElementById('status').value, // Keep as string
                                clients_comment: document.getElementById('clients_comment').value,
                                source: document.getElementById('source').value // Include source
                            };

                            // Send the updated data to the server
                            authenticatedFetch(`http://localhost:8081/clients/${id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updatedClient)
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.error) {
                                    throw new Error(data.error);
                                }
                                showNotification('Client updated successfully', 'success');
                                fetchClientsData();
                            })
                            .catch(error => {
                                console.error('Error updating client:', error);
                                showNotification('Failed to update client: ' + error.message, 'error');
                            });
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching client data:', error);
            showNotification('Failed to fetch client data: ' + error.message, 'error');
        });
}

function deleteClient(id) {
    bootbox.confirm({
        message: "Are you sure you want to delete this client?",
        buttons: {
            confirm: {
                label: 'Yes',
                className: 'btn-danger'
            },
            cancel: {
                label: 'No',
                className: 'btn-secondary'
            }
        },
        callback: function (result) {
            if (result) {
                authenticatedFetch(`http://localhost:8081/clients/${id}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    showNotification('Client deleted successfully', 'success');
                    fetchClientsData();
                })
                .catch(error => {
                    console.error('Error deleting client:', error);
                    showNotification('Failed to delete client: ' + error.message, 'error');
                });
            }
        }
    });
}

function updatePagination() {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';
    
    const prevButton = createPaginationButton('Oldingi', currentPage > 1, () => changePage(currentPage - 1));
    paginationElement.appendChild(prevButton);

    const pageIndicator = document.createElement('span');
    pageIndicator.innerText = `Page ${currentPage} of ${isNaN(totalPages) ? '?' : totalPages}`;
    pageIndicator.classList.add('mx-2', 'align-self-center');
    paginationElement.appendChild(pageIndicator);

    const nextButton = createPaginationButton('Keyingi', currentPage < totalPages, () => changePage(currentPage + 1));
    paginationElement.appendChild(nextButton);
}

function createPaginationButton(text, isEnabled, onClick) {
    const button = document.createElement('button');
    button.innerText = text;
    button.classList.add('btn', 'btn-outline-primary', 'm-1');
    
    if (!isEnabled) {
        button.disabled = true;
        button.classList.add('disabled');
    } else {
        button.onclick = (e) => {
            e.preventDefault();
            onClick();
        };
    }

    return button;
}

function changePage(newPage) {
    if (newPage >= 1 && newPage <= totalPages) {
        fetchClientsData(newPage, currentSearchTerm, currentSortBy);
    }
}

function handleSearch() {
    currentSearchTerm = document.getElementById('searchInput').value;
    currentPage = 1; // Reset to first page when searching
    fetchClientsData(currentPage, currentSearchTerm, currentSortBy);
}

// Add event listeners for search and sort
document.getElementById('searchInput').addEventListener('input', handleSearch);

// Prevent sidebar from opening on hover when collapsed
$(document).ready(function() {
    $('.main-sidebar').hover(function() {
        if ($('body').hasClass('sidebar-collapse')) {
            $(this).addClass('sidebar-closed sidebar-collapse');
        }
    }, function() {
        if ($('body').hasClass('sidebar-collapse')) {
            $(this).removeClass('sidebar-closed sidebar-collapse');
        }
    });
});