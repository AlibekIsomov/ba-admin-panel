document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if user is already logged in
    checkAuthStatus();
});

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        if (data.token) {
            // Store the token in localStorage
            localStorage.setItem('auth_token', data.token);
            // Redirect to the admin panel
            window.location.href = 'index.html';
        } else {
            throw new Error('No token received');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert(error.message); // This will show a pop-up with the error message
    });
}

function checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        // If not on login page, redirect to login
        if (!window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
        }
    } else {
        // If on login page and already authenticated, redirect to admin panel
        if (window.location.href.includes('login.html')) {
            window.location.href = 'index.html';
        }
    }
}

// Function to handle logout
function logout() {
    localStorage.removeItem('auth_token');
    window.location.href = 'login.html';
}

// Function to make authenticated requests
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return Promise.reject('Not authenticated');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(url, { ...options, headers })
        .then(response => {
            if (response.status === 401) {
                // If unauthorized, clear token and redirect to login
                localStorage.removeItem('auth_token');
                window.location.href = 'login.html';
                throw new Error('Session expired. Please login again.');
            }
            return response;
        });
}
