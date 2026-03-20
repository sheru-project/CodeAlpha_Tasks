// API Configuration
const API_BASE_URL = '';

// State Management
let currentUser = null;
let cart = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPage('home');
    updateCartCount();
});

// Navigation
function loadPage(page, params = {}) {
    const content = document.getElementById('main-content');
    
    switch(page) {
        case 'home':
            loadHomePage(content);
            break;
        case 'products':
            loadProductsPage(content, params.category);
            break;
        case 'product':
            loadProductDetailPage(content, params.slug);
            break;
        case 'cart':
            loadCartPage(content);
            break;
        case 'checkout':
            loadCheckoutPage(content);
            break;
        case 'orders':
            loadOrdersPage(content);
            break;
        case 'order':
            loadOrderDetailPage(content, params.orderNumber);
            break;
        case 'login':
            loadLoginPage(content);
            break;
        case 'register':
            loadRegisterPage(content);
            break;
        default:
            loadHomePage(content);
    }
}

// API Calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API call failed');
        }
        
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// Authentication
async function checkAuth() {
    try {
        const user = await apiCall('/api/auth/user/');
        currentUser = user;
        updateAuthUI();
    } catch (error) {
        currentUser = null;
        updateAuthUI();
    }
}

function updateAuthUI() {
    const userMenu = document.getElementById('userMenu');
    const loginMenu = document.getElementById('loginMenu');
    const registerMenu = document.getElementById('registerMenu');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        userMenu.style.display = 'block';
        loginMenu.style.display = 'none';
        registerMenu.style.display = 'none';
        userName.textContent = currentUser.first_name || currentUser.username;
    } else {
        userMenu.style.display = 'none';
        loginMenu.style.display = 'block';
        registerMenu.style.display = 'block';
    }
}

async function login(email, password) {
    try {
        const user = await apiCall('/api/auth/login/', 'POST', { username: email, password });
        currentUser = user;
        updateAuthUI();
        showToast('Login successful!', 'success');
        loadPage('home');
    } catch (error) {
        showToast('Login failed: ' + error.message, 'error');
    }
}

async function register(userData) {
    try {
        const user = await apiCall('/api/auth/register/', 'POST', userData);
        currentUser = user;
        updateAuthUI();
        showToast('Registration successful!', 'success');
        loadPage('home');
    } catch (error) {
        showToast('Registration failed: ' + error.message, 'error');
    }
}

async function logout() {
    try {
        await apiCall('/api/auth/logout/', 'POST');
        currentUser = null;
        updateAuthUI();
        showToast('Logged out successfully', 'success');
        loadPage('home');
    } catch (error) {
        showToast('Logout failed: ' + error.message, 'error');
    }
}

// Cart Functions
async function getCart() {
    try {
        cart = await apiCall('/api/cart/');
        return cart;
    } catch (error) {
        console.error('Failed to get cart:', error);
        return null;
    }
}

async function updateCartCount() {
    const cart = await getCart();
    const count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    document.getElementById('cartCount').textContent = count;
}

async function addToCart(productId, quantity = 1) {
    try {
        await apiCall('/api/cart/add/', 'POST', { product_id: productId, quantity });
        await updateCartCount();
        showToast('Product added to cart!', 'success');
    } catch (error) {
        showToast('Failed to add to cart: ' + error.message, 'error');
    }
}

async function updateCartItem(itemId, quantity) {
    try {
        await apiCall(`/api/cart/update/${itemId}/`, 'PUT', { quantity });
        await updateCartCount();
        loadCartPage(document.getElementById('main-content'));
    } catch (error) {
        showToast('Failed to update cart: ' + error.message, 'error');
    }
}

async function removeFromCart(itemId) {
    try {
        await apiCall(`/api/cart/remove/${itemId}/`, 'DELETE');
        await updateCartCount();
        loadCartPage(document.getElementById('main-content'));
        showToast('Item removed from cart', 'success');
    } catch (error) {
        showToast('Failed to remove item: ' + error.message, 'error');
    }
}

// Page Loaders
async function loadHomePage(container) {
    const categories = await apiCall('/api/categories/');
    const products = await apiCall('/api/products/?limit=8');
    
    container.innerHTML = `
        <!-- Hero Section -->
        <div class="hero-section bg-primary text-white py-5 mb-5 rounded-3">
            <div class="container">
                <h1 class="display-4">Welcome to E-Store</h1>
                <p class="lead">Shop the best products at amazing prices!</p>
                <a href="#" class="btn btn-light btn-lg" onclick="loadPage('products')">Shop Now</a>
            </div>
        </div>
        
        <!-- Categories -->
        <h2 class="mb-4">Shop by Category</h2>
        <div class="row mb-5">
            ${categories.map(category => `
                <div class="col-md-3 mb-4">
                    <div class="card category-card" onclick="loadPage('products', {category: ${category.id}})">
                        <img src="${category.image || 'https://via.placeholder.com/300x200'}" class="card-img-top" alt="${category.name}">
                        <div class="card-body">
                            <h5 class="card-title">${category.name}</h5>
                            <p class="card-text">${category.description || 'Explore our collection'}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <!-- Featured Products -->
        <h2 class="mb-4">Featured Products</h2>
        <div class="row">
            ${products.map(product => `
                <div class="col-md-3 mb-4">
                    <div class="card product-card">
                        <img src="${product.image || 'https://via.placeholder.com/300x200'}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-truncate">${product.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="price">$${product.price}</span>
                                <div>
                                    <button class="btn btn-sm btn-outline-primary" onclick="loadPage('product', {slug: '${product.slug}'})">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-primary" onclick="addToCart(${product.id})">
                                        <i class="bi bi-cart-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function loadProductsPage(container, categoryId = null) {
    const url = categoryId ? `/api/products/?category=${categoryId}` : '/api/products/';
    const products = await apiCall(url);
    
    container.innerHTML = `
        <h2 class="mb-4">Products</h2>
        <div class="row">
            ${products.map(product => `
                <div class="col-md-3 mb-4">
                    <div class="card product-card">
                        <img src="${product.image || 'https://via.placeholder.com/300x200'}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-truncate">${product.description}</p>
                            <p class="price">$${product.price}</p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary" onclick="loadPage('product', {slug: '${product.slug}'})">
                                    View Details
                                </button>
                                <button class="btn btn-primary" onclick="addToCart(${product.id})">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function loadProductDetailPage(container, slug) {
    const product = await apiCall(`/api/products/${slug}/`);
    
    container.innerHTML = `
        <div class="row product-details">
            <div class="col-md-6">
                <img src="${product.image || 'https://via.placeholder.com/500x400'}" class="img-fluid rounded" alt="${product.name}">
            </div>
            <div class="col-md-6">
                <h1>${product.name}</h1>
                <p class="text-muted">Category: ${product.category_name}</p>
                <div class="price-section">
                    <h3 class="price">$${product.price}</h3>
                    <p class="text-${product.stock > 0 ? 'success' : 'danger'}">
                        ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </p>
                </div>
                <p class="lead">${product.description}</p>
                
                <div class="mb-4">
                    <label for="quantity" class="form-label">Quantity:</label>
                    <input type="number" id="quantity" class="form-control" value="1" min="1" max="${product.stock}" style="width: 100px;">
                </div>
                
                <div class="mb-4">
                    <button class="btn btn-primary btn-lg" onclick="addToCart(${product.id}, document.getElementById('quantity').value)">
                        <i class="bi bi-cart-plus"></i> Add to Cart
                    </button>
                </div>
                
                <!-- Reviews Section -->
                <h4>Reviews (${product.reviews.length})</h4>
                ${currentUser ? `
                    <div class="mb-4">
                        <h5>Write a Review</h5>
                        <form onsubmit="submitReview(event, ${product.id})">
                            <div class="mb-3">
                                <label class="form-label">Rating</label>
                                <select class="form-control" id="rating" required>
                                    <option value="5">5 - Excellent</option>
                                    <option value="4">4 - Good</option>
                                    <option value="3">3 - Average</option>
                                    <option value="2">2 - Poor</option>
                                    <option value="1">1 - Terrible</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Comment</label>
                                <textarea class="form-control" id="comment" rows="3" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Submit Review</button>
                        </form>
                    </div>
                ` : ''}
                
                <div class="reviews">
                    ${product.reviews.map(review => `
                        <div class="review-card">
                            <div class="review-header">
                                <strong>${review.user_name}</strong>
                                <span class="review-rating">
                                    ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                                </span>
                            </div>
                            <p class="mb-0">${review.comment}</p>
                            <small class="text-muted">${new Date(review.created_at).toLocaleDateString()}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

async function loadCartPage(container) {
    const cart = await getCart();
    
    if (!cart || cart.items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cart-x display-1 text-muted"></i>
                <h3 class="mt-3">Your cart is empty</h3>
                <p class="text-muted">Looks like you haven't added anything to your cart yet.</p>
                <a href="#" class="btn btn-primary" onclick="loadPage('products')">Continue Shopping</a>
            </div>
        `;
        return;
    }
    
    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shipping = 10; // Fixed shipping cost
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;
    
    container.innerHTML = `
        <h2 class="mb-4">Shopping Cart</h2>
        <div class="row">
            <div class="col-md-8">
                ${cart.items.map(item => `
                    <div class="cart-item">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="${item.product.image || 'https://via.placeholder.com/80x80'}" alt="${item.product.name}">
                            </div>
                            <div class="col-md-4">
                                <h5>${item.product.name}</h5>
                                <p class="text-muted">$${item.product.price}</p>
                            </div>
                            <div class="col-md-3">
                                <div class="quantity-control">
                                    <button class="btn btn-sm btn-outline-secondary" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                                    <span class="mx-2">${item.quantity}</span>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <p class="fw-bold">$${(item.product.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div class="col-md-1">
                                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="col-md-4">
                <div class="cart-summary">
                    <h4>Order Summary</h4>
                    <hr>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Shipping:</span>
                        <span>$${shipping.toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Tax (10%):</span>
                        <span>$${tax.toFixed(2)}</span>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between mb-3">
                        <strong>Total:</strong>
                        <strong>$${total.toFixed(2)}</strong>
                    </div>
                    ${currentUser ? `
                        <button class="btn btn-primary w-100" onclick="loadPage('checkout')">
                            Proceed to Checkout
                        </button>
                    ` : `
                        <p class="text-muted text-center">Please login to checkout</p>
                        <button class="btn btn-primary w-100" onclick="loadPage('login')">
                            Login to Checkout
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

async function loadCheckoutPage(container) {
    if (!currentUser) {
        loadPage('login');
        return;
    }
    
    const cart = await getCart();
    
    if (!cart || cart.items.length === 0) {
        loadPage('cart');
        return;
    }
    
    container.innerHTML = `
        <h2 class="mb-4">Checkout</h2>
        <div class="row">
            <div class="col-md-8">
                <form id="checkoutForm" onsubmit="placeOrder(event)">
                    <h4>Shipping Information</h4>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">First Name</label>
                            <input type="text" class="form-control" id="firstName" value="${currentUser.first_name || ''}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Last Name</label>
                            <input type="text" class="form-control" id="lastName" value="${currentUser.last_name || ''}" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" value="${currentUser.email || ''}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Phone</label>
                        <input type="tel" class="form-control" id="phone" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Address</label>
                        <input type="text" class="form-control" id="address" required>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">City</label>
                            <input type="text" class="form-control" id="city" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">State</label>
                            <input type="text" class="form-control" id="state" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">ZIP Code</label>
                            <input type="text" class="form-control" id="zipCode" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Country</label>
                        <input type="text" class="form-control" id="country" value="United States" required>
                    </div>
                    
                    <h4 class="mt-4">Payment Information</h4>
                    <div class="mb-3">
                        <label class="form-label">Card Number</label>
                        <input type="text" class="form-control" id="cardNumber" placeholder="**** **** **** ****" required>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Expiry Month</label>
                            <input type="text" class="form-control" id="expMonth" placeholder="MM" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Expiry Year</label>
                            <input type="text" class="form-control" id="expYear" placeholder="YYYY" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">CVV</label>
                            <input type="text" class="form-control" id="cvv" placeholder="***" required>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-lg w-100">Place Order</button>
                </form>
            </div>
            <div class="col-md-4">
                <div class="cart-summary">
                    <h4>Order Summary</h4>
                    <hr>
                    ${cart.items.map(item => `
                        <div class="d-flex justify-content-between mb-2">
                            <span>${item.product.name} x${item.quantity}</span>
                            <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <hr>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>$${cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Shipping:</span>
                        <span>$10.00</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Tax (10%):</span>
                        <span>$${(cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 0.1).toFixed(2)}</span>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between mb-3">
                        <strong>Total:</strong>
                        <strong>$${(cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 1.1 + 10).toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function placeOrder(event) {
    event.preventDefault();
    
    const orderData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zip_code: document.getElementById('zipCode').value,
        country: document.getElementById('country').value
    };
    
    try {
        const order = await apiCall('/api/orders/create/', 'POST', orderData);
        showToast('Order placed successfully!', 'success');
        loadPage('order', { orderNumber: order.order_number });
    } catch (error) {
        showToast('Failed to place order: ' + error.message, 'error');
    }
}

async function loadOrdersPage(container) {
    if (!currentUser) {
        loadPage('login');
        return;
    }
    
    const orders = await apiCall('/api/orders/');
    
    container.innerHTML = `
        <h2 class="mb-4">My Orders</h2>
        ${orders.length === 0 ? `
            <div class="text-center py-5">
                <i class="bi bi-box display-1 text-muted"></i>
                <h3 class="mt-3">No orders yet</h3>
                <p class="text-muted">Start shopping to place your first order!</p>
                <a href="#" class="btn btn-primary" onclick="loadPage('products')">Shop Now</a>
            </div>
        ` : orders.map(order => `
            <div class="order-card" onclick="loadPage('order', {orderNumber: '${order.order_number}'})" style="cursor: pointer;">
                <div class="order-header">
                    <div>
                        <h5 class="mb-1">Order #${order.order_number}</h5>
                        <small class="text-muted">Placed on ${new Date(order.created_at).toLocaleDateString()}</small>
                    </div>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Total:</strong> $${order.total_amount}</p>
                        <p class="mb-1"><strong>Items:</strong> ${order.items.length}</p>
                    </div>
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Shipping to:</strong> ${order.address}, ${order.city}</p>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadOrderDetailPage(container, orderNumber) {
    if (!currentUser) {
        loadPage('login');
        return;
    }
    
    const order = await apiCall(`/api/orders/${orderNumber}/`);
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Order #${order.order_number}</h2>
            <span class="order-status status-${order.status}">${order.status}</span>
        </div>
        
        <div class="row">
            <div class="col-md-8">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Order Items</h5>
                    </div>
                    <div class="card-body">
                        ${order.items.map(item => `
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h6 class="mb-0">${item.product_name}</h6>
                                    <small class="text-muted">Quantity: ${item.quantity}</small>
                                </div>
                                <span>$${item.price} each</span>
                                <span class="fw-bold">$${item.price * item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Order Summary</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Subtotal:</span>
                            <span>$${order.total_amount}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Shipping:</span>
                            <span>$10.00</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Tax:</span>
                            <span>$${(order.total_amount * 0.1).toFixed(2)}</span>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between mb-3">
                            <strong>Total:</strong>
                            <strong>$${(order.total_amount * 1.1 + 10).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Shipping Information</h5>
                    </div>
                    <div class="card-body">
                        <p class="mb-1"><strong>${order.first_name} ${order.last_name}</strong></p>
                        <p class="mb-1">${order.email}</p>
                        <p class="mb-1">${order.phone}</p>
                        <p class="mb-0">${order.address}</p>
                        <p class="mb-0">${order.city}, ${order.state} ${order.zip_code}</p>
                        <p class="mb-0">${order.country}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadLoginPage(container) {
    container.innerHTML = `
        <div class="auth-form">
            <h2>Login</h2>
            <form onsubmit="handleLogin(event)">
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
            <p class="text-center mt-3">
                Don't have an account? <a href="#" onclick="loadPage('register')">Register</a>
            </p>
        </div>
    `;
}

function loadRegisterPage(container) {
    container.innerHTML = `
        <div class="auth-form">
            <h2>Register</h2>
            <form onsubmit="handleRegister(event)">
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-control" id="firstName">
                </div>
                <div class="mb-3">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-control" id="lastName">
                </div>
                <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" class="form-control" id="confirmPassword" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Register</button>
            </form>
            <p class="text-center mt-3">
                Already have an account? <a href="#" onclick="loadPage('login')">Login</a>
            </p>
        </div>
    `;
}

// Form Handlers
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(username, password);
}

function handleRegister(event) {
    event.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        password: password
    };
    
    register(userData);
}

async function submitReview(event, productId) {
    event.preventDefault();
    
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;
    
    try {
        await apiCall(`/api/reviews/${productId}/`, 'POST', { rating, comment });
        showToast('Review submitted successfully!', 'success');
        // Reload product page to show new review
        const slug = window.location.pathname.split('/').pop();
        loadProductDetailPage(document.getElementById('main-content'), slug);
    } catch (error) {
        showToast('Failed to submit review: ' + error.message, 'error');
    }
}

// Utility Functions
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}