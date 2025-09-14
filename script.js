// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDfJwZNAtT5u9sKdw7R2J7QOcohf2_03Vk",
    authDomain: "souhaibou-4883d.firebaseapp.com",
    projectId: "souhaibou-4883d",
    storageBucket: "souhaibou-4883d.firebasestorage.app",
    messagingSenderId: "703566382245",
    appId: "1:703566382245:web:82e265798635786bb8794c",
    measurementId: "G-SW6XGD9YHY"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let currentUser = null;
let products = [];
let categories = [];
let cart = [];
let favorites = [];
let orders = [];
let adminPassword = "ADMIN123";
let ads = [];
let deliveryOptions = [];
let currentAdIndex = 0;
let adInterval;

// Éléments DOM
const elements = {
    pages: document.querySelectorAll('.page'),
    navItems: document.querySelectorAll('.nav-item'),
    loadingScreen: document.getElementById('loading-screen'),
    connectionStatus: document.getElementById('connection-status'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    adminPasswordContainer: document.getElementById('admin-password-container'),
    adminPasswordInput: document.getElementById('admin-password-input'),
    adminLoginBtn: document.getElementById('admin-login-btn'),
    cartCount: document.getElementById('cart-count'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text')
};

// Initialisation de l'application
function initApp() {
    checkConnection();
    loadData();
    setupEventListeners();
    startCountdown();
    loadAds();
}

// Vérification de la connexion
function checkConnection() {
    const statusElement = elements.connectionStatus;
    
    if (navigator.onLine) {
        statusElement.classList.remove('offline');
    } else {
        statusElement.classList.add('offline');
        showNotification('Pas de connexion Internet', 'error');
    }
    
    window.addEventListener('online', () => {
        statusElement.classList.remove('offline');
        showNotification('Connexion rétablie', 'success');
        loadData();
    });
    
    window.addEventListener('offline', () => {
        statusElement.classList.add('offline');
        showNotification('Pas de connexion Internet', 'error');
    });
}

// Chargement des données
async function loadData() {
    try {
        // Charger les produits depuis Firebase
        const productsSnapshot = await db.collection('products').get();
        products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // CATÉGORIES LOCALES (sans Firebase)
        categories = [
            { id: 'iphone', name: 'iPhone', color: '#1428A0', icon: 'fab fa-apple' },
            { id: 'samsung', name: 'Samsung', color: '#1428A0', icon: 'fas fa-mobile-alt' },
            { id: 'tecno', name: 'Tecno', color: '#0066FF', icon: 'fas fa-mobile-alt' },
            { id: 'autres', name: 'Autres marques', color: '#222222', icon: 'fas fa-mobile-alt' },
            { id: 'ecouteur', name: 'Écouteur', color: '#3A3A3A', icon: 'fas fa-headphones' },
            { id: 'airpods', name: 'AirPods', color: '#F9F9F9', icon: 'fas fa-headphones' },
            { id: 'chargeur', name: 'Chargeur', color: '#FF6600', icon: 'fas fa-bolt' },
            { id: 'powerbank', name: 'Power Bank', color: '#28A745', icon: 'fas fa-battery-full' },
            { id: 'tablette', name: 'Tablette', color: '#1E90FF', icon: 'fas fa-tablet-alt' },
            { id: 'ordinateur', name: 'Ordinateur', color: '#B0B0B0', icon: 'fas fa-laptop' },
            { id: 'box', name: 'Box', color: '#8A2BE2', icon: 'fas fa-tv' },
            { id: 'smartwatch', name: 'Smart Watch', color: '#000000', icon: 'fas fa-clock' }
        ];
        
        // Charger les options de livraison
        const deliverySnapshot = await db.collection('delivery').get();
        deliveryOptions = deliverySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Charger les publicités
        const adsSnapshot = await db.collection('ads').get();
        ads = adsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Charger le mot de passe admin
        const passwordDoc = await db.collection('admin').doc('password').get();
        if (passwordDoc.exists) {
            adminPassword = passwordDoc.data().value;
        }
        
        // Charger le panier et les favoris depuis le stockage local
        loadLocalData();
        
        // Rendre l'application
        renderHomePage();
        renderCategories();
        updateCartCount();
        
        // Masquer l'écran de chargement
        setTimeout(() => {
            elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
        
    } catch (error) {
        console.error('Erreur de chargement des données:', error);
     }
}

// Rendu des catégories
function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.innerHTML = `
            <div class="category-icon" style="background-color: ${category.color}">
                <i class="${category.icon}"></i>
            </div>
            <span>${category.name}</span>
        `;
        
        // Rendre la catégorie cliquable
        categoryElement.addEventListener('click', () => {
            openCategoryPage(category.id);
        });
        
        container.appendChild(categoryElement);
    });
}
// Chargement des données locales
function loadLocalData() {
    const savedCart = localStorage.getItem('cart');
    const savedFavorites = localStorage.getItem('favorites');
    const savedOrders = localStorage.getItem('orders');
    
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }
    
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.getAttribute('data-page');
            navigateTo(pageId);
        });
    });
    
    // Recherche
    elements.searchInput.addEventListener('input', handleSearch);
    elements.searchBtn.addEventListener('click', handleSearch);
    
    // Admin
    elements.searchInput.addEventListener('keyup', (e) => {
        if (e.target.value.toUpperCase() === 'SOUHAIBOU2025') {
            elements.adminPasswordContainer.classList.remove('hidden');
        } else {
            elements.adminPasswordContainer.classList.add('hidden');
        }
    });
    
    elements.adminLoginBtn.addEventListener('click', handleAdminLogin);
    
    // Boutons retour
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo('home-page');
        });
    });
    // Ajoutez ce code dans votre fonction setupEventListeners() ou initApp()
document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Empêche le rechargement de la page
    processOrder(); // Appelle votre fonction de traitement de commande
});
    // Voir plus de catégories
    document.querySelectorAll('.see-more').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            openCategoryPage(category);
        });
    });
}

// Navigation entre les pages
function navigateTo(pageId) {
    // Masquer toutes les pages
    elements.pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    document.getElementById(pageId).classList.add('active');
    
    // Mettre à jour la navigation
    elements.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });
    
    // Rendu spécifique à la page
    if (pageId === 'home-page') {
        renderHomePage();
    } else if (pageId === 'cart-page') {
        renderCartPage();
    } else if (pageId === 'favorites-page') {
        renderFavoritesPage();
    }
}

// Gestion de la recherche
function handleSearch() {
    const query = elements.searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
        renderHomePage();
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    
    renderSearchResults(filteredProducts);
}

// Connexion admin
function handleAdminLogin() {
    const password = elements.adminPasswordInput.value;
    
    if (password === adminPassword) {
        navigateTo('admin-page');
        showNotification('Connexion admin réussie', 'success');
        elements.adminPasswordInput.value = '';
        elements.adminPasswordContainer.classList.add('hidden');
        elements.searchInput.value = '';
    } else {
        showNotification('Mot de passe incorrect', 'error');
    }
}

// Rendu de la page d'accueil
function renderHomePage() {
    renderCarousel();
    renderIphoneProducts();
    renderFlashProducts();
    renderRecommendedProducts();
    renderDynamicCategories();
}

// Rendu du carrousel
function renderCarousel() {
    const carouselInner = document.querySelector('.carousel-inner');
    const carouselDots = document.querySelector('.carousel-dots');
    
    // Nettoyer le carrousel
    carouselInner.innerHTML = '';
    carouselDots.innerHTML = '';
    
    // Images par défaut si aucune publicité n'est configurée
    const defaultImages = [
        'https://i.postimg.cc/8z7WzyyH/iphone-banner.jpg',
        'https://i.postimg.cc/YqRc7z7Z/samsung-banner.jpg',
        'https://i.postimg.cc/VsS2yQ0H/accessories-banner.jpg'
    ];
    
    const imagesToUse = ads.length > 0 ? ads.map(ad => ad.imageUrl) : defaultImages;
    
    // Ajouter les images au carrousel
    imagesToUse.forEach((image, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.innerHTML = `<img src="${image}" alt="Banner ${index + 1}">`;
        carouselInner.appendChild(item);
        
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => showSlide(index));
        carouselDots.appendChild(dot);
    });
    
    // Démarrer le défilement automatique
    startAutoSlide();
}

// Défilement automatique du carrousel
let slideInterval;
let currentSlide = 0;

function startAutoSlide() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % document.querySelectorAll('.carousel-item').length;
        showSlide(currentSlide);
    }, 3000);
}

function showSlide(index) {
    const items = document.querySelectorAll('.carousel-item');
    const dots = document.querySelectorAll('.carousel-dot');
    
    items.forEach(item => item.style.transform = `translateX(-${index * 100}%)`);
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    currentSlide = index;
}

// Rendu des produits iPhone
function renderIphoneProducts() {
    const container = document.getElementById('iphone-products');
    container.innerHTML = '';
    
    const iphoneProducts = products
        .filter(product => product.category === 'iPhone')
        .slice(0, 8);
    
    iphoneProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

// Rendu des produits en vente flash
function renderFlashProducts() {
    const container = document.getElementById('flash-products');
    container.innerHTML = '';
    
    const flashProducts = products
        .filter(product => product.flashSale)
        .slice(0, 8);
    
    flashProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

// Rendu des produits recommandés
function renderRecommendedProducts() {
    const container = document.getElementById('recommended-products');
    container.innerHTML = '';
    
    // Mélanger les produits pour obtenir des recommandations aléatoires
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    const recommendedProducts = shuffledProducts.slice(0, 8);
    
    recommendedProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

// Rendu des catégories dynamiques
function renderDynamicCategories() {
    const container = document.getElementById('dynamic-categories');
    container.innerHTML = '';
    
    // Exclure les catégories déjà affichées
    const excludedCategories = ['iPhone'];
    const categoriesToShow = categories.filter(cat => 
        !excludedCategories.includes(cat.id) && 
        !cat.id.startsWith('price-')
    );
    
    categoriesToShow.forEach(category => {
        const categoryProducts = products.filter(product => 
            product.category.toLowerCase() === category.id.toLowerCase()
        );
        
        if (categoryProducts.length > 0) {
            const section = document.createElement('div');
            section.className = 'category-section';
            
            section.innerHTML = `
                <div class="category-bar" style="background-color: ${category.color}">
                    <div class="bar-content">
                        <div class="bar-title">
                            <i class="${category.icon}"></i>
                            <h2>${category.name.toUpperCase()}</h2>
                            <p>Meilleures offres</p>
                        </div>
                        <a href="#" class="see-more" data-category="${category.id}">Voir plus <i class="fas fa-chevron-right"></i></a>
                    </div>
                </div>
                <div class="products-scroll" id="${category.id}-products"></div>
            `;
            
            container.appendChild(section);
            
            const productsContainer = section.querySelector(`#${category.id}-products`);
            categoryProducts.slice(0, 8).forEach(product => {
                productsContainer.appendChild(createProductCard(product));
            });
            
            // Ajouter l'écouteur d'événement pour "Voir plus"
            section.querySelector('.see-more').addEventListener('click', (e) => {
                e.preventDefault();
                openCategoryPage(category.id);
            });
        }
    });
}

// Création d'une carte produit
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.images[0]}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">
                <span class="current-price">${formatPrice(product.salePrice || product.normalPrice)} FCFA</span>
                ${product.salePrice ? `
                    <span class="original-price">${formatPrice(product.normalPrice)} FCFA</span>
                    <span class="discount-badge">-${calculateDiscount(product.normalPrice, product.salePrice)}%</span>
                ` : ''}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        openProductPage(product);
    });
    
    return card;
}

// Ouverture de la page produit
function openProductPage(product) {
    navigateTo('product-page');
    
    // Mettre à jour les détails du produit
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-price').textContent = `${formatPrice(product.salePrice || product.normalPrice)} FCFA`;
    
    if (product.salePrice) {
        document.getElementById('product-original-price').textContent = `${formatPrice(product.normalPrice)} FCFA`;
        document.getElementById('product-discount').textContent = `-${calculateDiscount(product.normalPrice, product.salePrice)}%`;
        document.getElementById('product-original-price').classList.remove('hidden');
        document.getElementById('product-discount').classList.remove('hidden');
    } else {
        document.getElementById('product-original-price').classList.add('hidden');
        document.getElementById('product-discount').classList.add('hidden');
    }
    
   document.getElementById('product-delivery').textContent = product.delivery === 'free' ? 'Livraison gratuite' : (product.delivery === 'paid' ? 'Livraison disponible' : 'Information livraison non disponible');
    
    // Afficher le stock si nécessaire
    if (product.stock !== undefined) {
        let stockText = '';
        if (product.stock < 10) {
            stockText = `Seulement ${product.stock} en stock`;
        } else if (product.stock <= 20) {
            stockText = 'En rupture de stock'; 
        }
        // >20: on n'aff e rien
    }
    
    // Caractéristiques
    const specsContainer = document.getElementById('product-specs');
    specsContainer.innerHTML = '';
    
    if (product.specs) {
        Object.entries(product.specs).forEach(([key, value]) => {
            if (value) {
                const specItem = document.createElement('div');
                specItem.className = 'spec-item';
                specItem.innerHTML = `
                    <i class="fas fa-check"></i>
                    <span>${key}: ${value}</span>
                `;
                specsContainer.appendChild(specItem);
            }
        });
    }
    
    // Description
    document.getElementById('product-description').textContent = product.description || 'Aucune description disponible.';
    
    // Images
    const imageCarousel = document.querySelector('.product-image-carousel .carousel-inner');
    const imageDots = document.querySelector('.product-image-carousel .carousel-dots');
    imageCarousel.innerHTML = '';
    imageDots.innerHTML = '';
    
    product.images.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'carousel-item';
        imageItem.innerHTML = `<img src="${image}" alt="${product.name} ${index + 1}">`;
        imageCarousel.appendChild(imageItem);
        
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => showProductImageSlide(index));
        imageDots.appendChild(dot);
        
        // Ouvrir l'image en plein écran au clic
        imageItem.querySelector('img').addEventListener('click', () => {
            openFullscreenImage(image);
        });
    });
    
    // Produits similaires
    const relatedContainer = document.getElementById('related-products');
    relatedContainer.innerHTML = '';
    
    const relatedProducts = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);
    
    relatedProducts.forEach(relatedProduct => {
        relatedContainer.appendChild(createProductCard(relatedProduct));
    });
    
    // Gestion de la quantité
    let quantity = 1;
    const quantityElement = document.querySelector('.quantity');
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    
    const updateQuantity = () => {
        quantityElement.textContent = quantity;
        minusBtn.disabled = quantity <= 1;
    };
    
    minusBtn.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            updateQuantity();
        }
    });
    
    plusBtn.addEventListener('click', () => {
        quantity++;
        updateQuantity();
    });
    
    // Ajout au panier
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => {
        addToCart(product, quantity);
        showNotification('Produit ajouté au panier', 'success');
        quantity = 1;
        updateQuantity();
    });
    
    // Favoris
    const favoriteBtn = document.querySelector('.favorite-btn');
    const isFavorite = favorites.some(fav => fav.id === product.id);
    
    if (isFavorite) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
        favoriteBtn.classList.add('active');
    } else {
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        favoriteBtn.classList.remove('active');
    }
    
    favoriteBtn.addEventListener('click', () => {
        toggleFavorite(product);
        
        if (favorites.some(fav => fav.id === product.id)) {
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
            favoriteBtn.classList.add('active');
            showNotification('Ajouté aux favoris', 'success');
        } else {
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
            favoriteBtn.classList.remove('active');
            showNotification('Retiré des favoris', 'info');
        }
    });
}

// Défilement des images produit
function showProductImageSlide(index) {
    const items = document.querySelectorAll('.product-image-carousel .carousel-item');
    const dots = document.querySelectorAll('.product-image-carousel .carousel-dot');
    
    items.forEach(item => item.style.transform = `translateX(-${index * 100}%)`);
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Ouverture d'image en plein écran
function openFullscreenImage(imageUrl) {
    document.getElementById('fullscreen-image').src = imageUrl;
    document.getElementById('image-modal').classList.remove('hidden');
}

// Ouverture d'une page de catégorie
function openCategoryPage(categoryId) {
    navigateTo('category-page');
    
    const category = categories.find(cat => cat.id === categoryId);
    document.getElementById('category-title').textContent = category.name;
    
    const container = document.getElementById('category-products');
    container.innerHTML = '';
    
    let categoryProducts = [];
    
    if (categoryId.startsWith('price-')) {
        // Filtrage par prix
        const maxPrice = parseInt(categoryId.split('-')[1]) * 1000;
        let minPrice = 0;
        
        switch(categoryId) {
            case 'price-100k':
                minPrice = 70000;
                break;
            case 'price-70k':
                minPrice = 50000;
                break;
            case 'price-50k':
                minPrice = 25000;
                break;
            case 'price-25k':
                minPrice = 0;
                break;
        }
        
        categoryProducts = products.filter(product => {
            const price = product.salePrice || product.normalPrice;
            return price >= minPrice && price <= maxPrice;
        });
    } else {
        // Filtrage par catégorie normale
        categoryProducts = products.filter(product => 
            product.category.toLowerCase() === categoryId.toLowerCase()
        );
    }
    
    categoryProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

// Rendu de la page panier
function renderCartPage() {
    const emptyCart = document.getElementById('empty-cart');
    const cartItems = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const originalTotalElement = document.getElementById('original-total');
    const savingsElement = document.getElementById('savings');
    const totalElement = document.getElementById('total-price');
    
    if (cart.length === 0) {
        emptyCart.classList.remove('hidden');
        cartItems.classList.add('hidden');
        document.querySelector('.cart-summary').classList.add('hidden');
        document.querySelector('.delivery-options').classList.add('hidden');
    } else {
        emptyCart.classList.add('hidden');
        cartItems.classList.remove('hidden');
        document.querySelector('.cart-summary').classList.remove('hidden');
        document.querySelector('.delivery-options').classList.remove('hidden');
        
        // Vider le conteneur d'articles
        cartItems.innerHTML = '';
        
        // Ajouter les articles du panier
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.product.images[0]}" alt="${item.product.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${item.product.name}</h3>
                    <p class="cart-item-price">${formatPrice(item.product.salePrice || item.product.normalPrice)} FCFA x ${item.quantity}</p>
                    <div class="cart-item-actions">
                        <button class="remove-item" data-id="${item.product.id}">Supprimer</button>
                    </div>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
            
            // Gestion de la suppression
            cartItem.querySelector('.remove-item').addEventListener('click', () => {
                removeFromCart(item.product.id);
                renderCartPage();
                showNotification('Produit retiré du panier', 'info');
            });
        });
        
        // Calcul des totaux
        let subtotal = 0;
        let originalTotal = 0;
        
        cart.forEach(item => {
            const price = item.product.salePrice || item.product.normalPrice;
            subtotal += price * item.quantity;
            originalTotal += item.product.normalPrice * item.quantity;
        });
        
        const savings = originalTotal - subtotal;
        const savingsPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
        
        // Mise à jour des éléments
        subtotalElement.textContent = `${formatPrice(subtotal)} FCFA`;
        originalTotalElement.textContent = `${formatPrice(originalTotal)} FCFA`;
        savingsElement.textContent = `${formatPrice(savings)} FCFA (${savingsPercent}%)`;
        totalElement.textContent = `${formatPrice(subtotal)} FCFA`;
        
        // Options de livraison
        const deliverySelect = document.getElementById('delivery-zone');
        deliverySelect.innerHTML = '<option value="pickup">Récupérer par moi-même (Gratuit)</option>';
        
        deliveryOptions.forEach(option => {
            const deliveryOption = document.createElement('option');
            deliveryOption.value = option.id;
            deliveryOption.textContent = `${option.name} - ${formatPrice(option.price)} FCFA`;
            deliverySelect.appendChild(deliveryOption);
        });
        
        // Gestion de la validation de commande
        document.getElementById('checkout-btn').addEventListener('click', () => {
            document.getElementById('checkout-modal').classList.remove('hidden');
        });
    }
    
    // Historique des commandes
    document.getElementById('view-history-btn').addEventListener('click', () => {
        if (orders.length > 0) {
            showOrderHistory();
        } else {
            showNotification('Aucune commande dans l\'historique', 'info');
        }
    });
}

// Rendu de la page favoris
function renderFavoritesPage() {
    const emptyFavorites = document.getElementById('empty-favorites');
    const favoritesList = document.getElementById('favorites-list');
    
    if (favorites.length === 0) {
        emptyFavorites.classList.remove('hidden');
        favoritesList.classList.add('hidden');
    } else {
        emptyFavorites.classList.add('hidden');
        favoritesList.classList.remove('hidden');
        
        // Vider la liste
        favoritesList.innerHTML = '';
        
        // Ajouter les favoris
        favorites.forEach(product => {
            favoritesList.appendChild(createProductCard(product));
        });
    }
}

// Ajout au panier
function addToCart(product, quantity = 1) {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            product: product,
            quantity: quantity
        });
    }
    
    // Mettre à jour le stock local
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Retrait du panier
function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Mise à jour du compteur de panier
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    
    if (count > 0) {
        elements.cartCount.textContent = count;
        elements.cartCount.classList.remove('hidden');
    } else {
        elements.cartCount.classList.add('hidden');
    }
}

// Gestion des favoris
function toggleFavorite(product) {
    const index = favorites.findIndex(fav => fav.id === product.id);
    
    if (index === -1) {
        favorites.push(product);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Formatage des prix
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price);
}

// Calcul du pourcentage de réduction
function calculateDiscount(originalPrice, salePrice) {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

// Compte à rebours
function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    let timeLeft = 12 * 60 * 60; // 12 heures en secondes
    
    const updateCountdown = () => {
        if (timeLeft <= 0) {
            timeLeft = 12 * 60 * 60; // Redémarrer à 12 heures
        }
        
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        
        countdownElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        timeLeft--;
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Chargement des publicités
function loadAds() {
    if (ads.length > 0) {
        // Afficher la première publicité après 3 secondes
        setTimeout(() => {
            showAd(0);
        }, 3000);
    }
}

// Affichage d'une publicité
function showAd(index) {
    if (index >= ads.length) return;
    
    document.getElementById('ad-image').src = ads[index].imageUrl;
    document.getElementById('ad-modal').classList.remove('hidden');
    
    currentAdIndex = index;
    
    // Fermeture automatique après 5 secondes
    setTimeout(() => {
        document.getElementById('ad-modal').classList.add('hidden');
        
        // Afficher la publicité suivante après 30 secondes
        setTimeout(() => {
            showAd((currentAdIndex + 1) % ads.length);
        }, 30000);
    }, 5000);
}

// Affichage des notifications
function showNotification(message, type = 'info') {
    elements.notificationText.textContent = message;
    elements.notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initApp);

// Gestion des modales
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    });
});

// Empêcher la fermeture en cliquant à l'intérieur du contenu modal
document.querySelectorAll('.modal-content').forEach(content => {
    content.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// Fermer les modales en cliquant à l'extérieur
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
});











// ==================== FONCTIONNALITÉS ADMIN ====================

// Gestion des vues admin
document.querySelectorAll('.admin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        showAdminView(viewId);
    });
});

// Afficher une vue admin spécifique
function showAdminView(viewId) {
    // Masquer toutes les vues admin
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Afficher la vue demandée
    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }
    
    // Charger les données spécifiques à la vue
    switch(viewId) {
        case 'add-product':
            initAddProductForm();
            break;
        case 'product-list':
            loadProductList();
            break;
        case 'pending-orders':
            loadPendingOrders();
            break;
        case 'completed-orders':
            loadCompletedOrders();
            break;
        case 'rejected-orders':
            loadRejectedOrders();
            break;
        case 'delivery-settings':
            loadDeliverySettings();
            break;
        case 'ads-settings':
            loadAdsSettings();
            break;
    }
}

// Initialisation du formulaire d'ajout de produit
function initAddProductForm() {
    const form = document.getElementById('add-product-form');
    if (form) {
        form.reset();
        
        // Calcul automatique du pourcentage de réduction
        const normalPriceInput = document.getElementById('product-normal-price-input');
        const salePriceInput = document.getElementById('product-sale-price-input');
        const discountInput = document.getElementById('product-discount-input');
        
        const calculateDiscount = () => {
            if (normalPriceInput.value && salePriceInput.value) {
                const normalPrice = parseFloat(normalPriceInput.value);
                const salePrice = parseFloat(salePriceInput.value);
                const discount = Math.round(((normalPrice - salePrice) / normalPrice) * 100);
                discountInput.value = discount;
            }
        };
        
        normalPriceInput.addEventListener('change', calculateDiscount);
        salePriceInput.addEventListener('change', calculateDiscount);
        
        // Prévisualisation de l'image principale
        const mainImageInput = document.getElementById('product-main-image-input');
        const mainImagePreview = document.getElementById('main-image-preview');
        
        mainImageInput.addEventListener('change', () => {
            if (mainImageInput.value) {
                mainImagePreview.innerHTML = `<img src="${mainImageInput.value}" alt="Preview">`;
            } else {
                mainImagePreview.innerHTML = '';
            }
        });
        
        // Ajout d'images supplémentaires
        const addImageBtn = document.getElementById('add-image-btn');
        const additionalImagesContainer = document.getElementById('additional-images-container');
        
        addImageBtn.addEventListener('click', () => {
            const imageGroup = document.createElement('div');
            imageGroup.className = 'image-input-group';
            imageGroup.innerHTML = `
                <input type="url" class="additional-image-input" name="additionalImages" placeholder="https://...">
                <div class="image-preview additional-preview"></div>
            `;
            additionalImagesContainer.appendChild(imageGroup);
            
            // Prévisualisation pour la nouvelle image
            const newInput = imageGroup.querySelector('.additional-image-input');
            const newPreview = imageGroup.querySelector('.additional-preview');
            
            newInput.addEventListener('change', () => {
                if (newInput.value) {
                    newPreview.innerHTML = `<img src="${newInput.value}" alt="Preview">`;
                } else {
                    newPreview.innerHTML = '';
                }
            });
        });
        
        // Soumission du formulaire
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Récupération des données du formulaire
            const formData = new FormData(form);
            const specs = {};
            
            // Extraction des caractéristiques
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('spec-') && value) {
                    const specName = key.replace('spec-', '');
                    specs[specName] = value;
                }
            }
            
            // Extraction des images supplémentaires
            const additionalImages = [];
            document.querySelectorAll('.additional-image-input').forEach(input => {
                if (input.value) additionalImages.push(input.value);
            });
            
            // Construction de l'objet produit
            const product = {
                name: formData.get('name') || '',
                brand: formData.get('brand') || '',
                category: formData.get('category') || '',
                normalPrice: parseFloat(formData.get('normalPrice')) || 0,
                salePrice: parseFloat(formData.get('salePrice')) || 0,
                discount: parseFloat(formData.get('discount')) || 0,
                stock: parseInt(formData.get('stock')) || 0,
                delivery: formData.get('delivery') || 'free',
                flashSale: formData.get('flashSale') === 'on',
                specs: specs,
                description: formData.get('description') || '',
                images: [formData.get('mainImage'), ...additionalImages].filter(img => img)
            };
            
            try {
                // Enregistrement dans Firestore
                await db.collection('products').add(product);
                showNotification('Produit ajouté avec succès', 'success');
                form.reset();
                document.querySelectorAll('.image-preview').forEach(preview => {
                    preview.innerHTML = '';
                });
                // Recharger la liste des produits
                loadProductList();
            } catch (error) {
                console.error('Erreur lors de l\'ajout du produit:', error);
                showNotification('Erreur lors de l\'ajout du produit', 'error');
            }
        });
    }
}

// Chargement de la liste des produits
async function loadProductList() {
    const productListView = document.getElementById('product-list-view');
    if (!productListView) return;
    
    try {
        const snapshot = await db.collection('products').get();
        productListView.innerHTML = '<h3>Liste des produits</h3>';
        
        if (snapshot.empty) {
            productListView.innerHTML += '<p>Aucun produit trouvé.</p>';
            return;
        }
        
        // Grouper les produits par catégorie
        const productsByCategory = {};
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            if (!productsByCategory[product.category]) {
                productsByCategory[product.category] = [];
            }
            productsByCategory[product.category].push(product);
        });
        
        // Afficher les produits par catégorie
        for (const category in productsByCategory) {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            categorySection.innerHTML = `<h4>${category}</h4>`;
            
            const productGrid = document.createElement('div');
            productGrid.className = 'admin-product-grid';
            
            productsByCategory[category].forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'admin-product-card';
                
                // Calcul du stock actuel (initial - vendu)
                // Note: Vous devrez implémenter le suivi des ventes pour calculer le stock vendu
                const currentStock = product.stock; // Pour l'instant, on utilise le stock initial
                
                productCard.innerHTML = `
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div class="admin-product-info">
                        <h5>${product.name}</h5>
                        <p>Marque: ${product.brand}</p>
                        <p>Prix: ${product.salePrice || product.normalPrice} FCFA</p>
                        <p>Stock: ${currentStock}</p>
                        <div class="admin-product-actions">
                            <button class="edit-product" data-id="${product.id}">Modifier</button>
                            <button class="delete-product" data-id="${product.id}">Supprimer</button>
                        </div>
                    </div>
                `;
                
                productGrid.appendChild(productCard);
            });
            
            categorySection.appendChild(productGrid);
            productListView.appendChild(categorySection);
        }
        
        // Ajouter les écouteurs d'événements pour les boutons
        productListView.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                editProduct(productId);
            });
        });
        
        productListView.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                deleteProduct(productId);
            });
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        productListView.innerHTML = '<p>Erreur lors du chargement des produits.</p>';
    }
}

// Édition d'un produit
async function editProduct(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) {
            showNotification('Produit non trouvé', 'error');
            return;
        }
        
        const product = doc.data();
        
        // Afficher le formulaire d'édition (similaire au formulaire d'ajout)
        // Vous devrez pré-remplir le formulaire avec les données du produit
        showAdminView('add-product');
        
        // Pré-remplir le formulaire
        document.getElementById('product-name-input').value = product.name || '';
        document.getElementById('product-brand-input').value = product.brand || '';
        document.getElementById('product-category-input').value = product.category || '';
        document.getElementById('product-normal-price-input').value = product.normalPrice || '';
        document.getElementById('product-sale-price-input').value = product.salePrice || '';
        document.getElementById('product-discount-input').value = product.discount || '';
        document.getElementById('product-stock-input').value = product.stock || '';
        document.getElementById('product-delivery-input').value = product.delivery || 'free';
        document.getElementById('product-flash-sale-input').checked = product.flashSale || false;
        document.getElementById('product-description-input').value = product.description || '';
        
        // Pré-remplir les caractéristiques
        if (product.specs) {
            for (const [key, value] of Object.entries(product.specs)) {
                const input = document.querySelector(`input[name="spec-${key}"]`);
                if (input) input.value = value;
            }
        }
        
        // Pré-remplir l'image principale
        if (product.images && product.images.length > 0) {
            document.getElementById('product-main-image-input').value = product.images[0];
            document.getElementById('main-image-preview').innerHTML = `<img src="${product.images[0]}" alt="Preview">`;
        }
        
        // Pré-remplir les images supplémentaires
        const additionalContainer = document.getElementById('additional-images-container');
        additionalContainer.innerHTML = '';
        
        if (product.images && product.images.length > 1) {
            for (let i = 1; i < product.images.length; i++) {
                const imageGroup = document.createElement('div');
                imageGroup.className = 'image-input-group';
                imageGroup.innerHTML = `
                    <input type="url" class="additional-image-input" name="additionalImages" value="${product.images[i]}" placeholder="https://...">
                    <div class="image-preview additional-preview"><img src="${product.images[i]}" alt="Preview"></div>
                `;
                additionalContainer.appendChild(imageGroup);
            }
        }
        
        // Modifier le comportement du formulaire pour la mise à jour
        const form = document.getElementById('add-product-form');
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            // Récupération des données du formulaire (similaire à l'ajout)
            const formData = new FormData(form);
            const specs = {};
            
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('spec-') && value) {
                    const specName = key.replace('spec-', '');
                    specs[specName] = value;
                }
            }
            
            const additionalImages = [];
            document.querySelectorAll('.additional-image-input').forEach(input => {
                if (input.value) additionalImages.push(input.value);
            });
            
            const updatedProduct = {
                name: formData.get('name') || '',
                brand: formData.get('brand') || '',
                category: formData.get('category') || '',
                normalPrice: parseFloat(formData.get('normalPrice')) || 0,
                salePrice: parseFloat(formData.get('salePrice')) || 0,
                discount: parseFloat(formData.get('discount')) || 0,
                stock: parseInt(formData.get('stock')) || 0,
                delivery: formData.get('delivery') || 'free',
                flashSale: formData.get('flashSale') === 'on',
                specs: specs,
                description: formData.get('description') || '',
                images: [formData.get('mainImage'), ...additionalImages].filter(img => img)
            };
            
            try {
                await db.collection('products').doc(productId).update(updatedProduct);
                showNotification('Produit mis à jour avec succès', 'success');
                
                // Restaurer le comportement original du formulaire
                form.onsubmit = originalSubmit;
                
                // Revenir à la liste des produits
                showAdminView('product-list');
                loadProductList();
            } catch (error) {
                console.error('Erreur lors de la mise à jour du produit:', error);
                showNotification('Erreur lors de la mise à jour du produit', 'error');
            }
        };
        
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        showNotification('Erreur lors de la récupération du produit', 'error');
    }
}

// Suppression d'un produit
async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
        await db.collection('products').doc(productId).delete();
        showNotification('Produit supprimé avec succès', 'success');
        loadProductList();
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        showNotification('Erreur lors de la suppression du produit', 'error');
    }
}

// Chargement des commandes en attente
async function loadPendingOrders() {
    const pendingOrdersView = document.getElementById('pending-orders-view');
    if (!pendingOrdersView) return;
    
    try {
        const snapshot = await db.collection('orders')
            .where('status', '==', 'pending')
            .get();
            
        pendingOrdersView.innerHTML = '<h3>Commandes en attente</h3>';
        
        if (snapshot.empty) {
            pendingOrdersView.innerHTML += '<p>Aucune commande en attente.</p>';
            return;
        }
        
        const ordersList = document.createElement('div');
        ordersList.className = 'orders-list';
        
       snapshot.forEach(doc => {
    const order = { id: doc.id, ...doc.data() };
    const orderElement = createOrderElement(order, 'pending');
    ordersList.appendChild(orderElement);
});
        
        pendingOrdersView.appendChild(ordersList);
        
    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        pendingOrdersView.innerHTML = '<p>Erreur lors du chargement des commandes.</p>';
    }
}

// Création d'un élément de commande
function createOrderElement(order, status) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    
    let actionsHTML = '';
    if (status === 'pending') {
       actionsHTML = `
    <button class="validate-order" data-id="${order.id}">Valider</button>
    <button class="reject-order" data-id="${order.id}">Rejeter</button>
`;
    }
    
    orderElement.innerHTML = `
        <div class="order-header">
            <span>Commande #${order.id.substring(0, 8)}</span>
            <span>${new Date(order.date).toLocaleDateString()}</span>
        </div>
        <div class="order-customer">
            <p><strong>Client:</strong> ${order.customerName || 'Non spécifié'}</p>
            <p><strong>Téléphone:</strong> ${order.customerPhone}</p>
            ${order.customerEmail ? `<p><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
            ${order.customerAddress ? `<p><strong>Adresse:</strong> ${order.customerAddress}</p>` : ''}
        </div>
        <div class="order-items">
            <h4>Articles:</h4>
            <ul>
                ${order.items.map(item => `
                    <li>${item.quantity}x ${item.product.name} - ${item.product.salePrice || item.product.normalPrice} FCFA</li>
                `).join('')}
            </ul>
        </div>
        <div class="order-total">
            <p><strong>Total:</strong> ${order.total} FCFA</p>
            ${order.deliveryOption ? `<p><strong>Livraison:</strong> ${order.deliveryOption}</p>` : ''}
        </div>
        <div class="order-actions">
            ${actionsHTML}
        </div>
    `;
    
    // Ajouter les écouteurs d'événements pour les boutons
    if (status === 'pending') {
        orderElement.querySelector('.validate-order').addEventListener('click', () => {
            validateOrder(order.id);
        });
        
        orderElement.querySelector('.reject-order').addEventListener('click', () => {
            rejectOrder(order.id);
        });
    }
    
    return orderElement;
}

async function validateOrder(orderId) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: 'completed',
            processedAt: new Date()
        });
        showNotification('Commande validée avec succès', 'success');
        loadPendingOrders();
    } catch (error) {
        console.error('Erreur lors de la validation de la commande:', error);
        showNotification('Erreur lors de la validation de la commande', 'error');
    }
}

async function rejectOrder(orderId) {
    if (!confirm('Voulez-vous vraiment rejeter cette commande ?')) return;
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: 'rejected',
            processedAt: new Date()
        });
        showNotification('Commande rejetée avec succès', 'success');
        loadPendingOrders();
    } catch (error) {
        console.error('Erreur lors du rejet de la commande:', error);
        showNotification('Erreur lors du rejet de la commande', 'error');
    }
}

// Chargement des commandes validées
async function loadCompletedOrders() {
    const completedOrdersView = document.getElementById('completed-orders-view');
    if (!completedOrdersView) return;
    
    try {
        const snapshot = await db.collection('orders')
            .where('status', '==', 'completed')
            .get();
            
        completedOrdersView.innerHTML = `
            <h3>Commandes validées</h3>
            <div class="admin-actions">
                <button id="download-pdf-btn">Télécharger PDF</button>
                <button id="delete-all-completed-btn">Supprimer tout</button>
            </div>
        `;
        
        if (snapshot.empty) {
            completedOrdersView.innerHTML += '<p>Aucune commande validée.</p>';
            return;
        }
        
        const ordersList = document.createElement('div');
        ordersList.className = 'orders-list';
        
        let totalSales = 0;
        snapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            totalSales += order.total;
            const orderElement = createOrderElement(order, 'completed');
            ordersList.appendChild(orderElement);
        });
        
        completedOrdersView.appendChild(ordersList);
        
        // Afficher le total des ventes
        const totalElement = document.createElement('div');
        totalElement.className = 'total-sales';
        totalElement.innerHTML = `<h4>Total des ventes: ${totalSales} FCFA</h4>`;
        completedOrdersView.appendChild(totalElement);
        
        // Ajouter les écouteurs d'événements pour les boutons
        document.getElementById('download-pdf-btn').addEventListener('click', () => {
            generateOrdersPDF(snapshot.docs, 'completed', totalSales);
        });
        
        document.getElementById('delete-all-completed-btn').addEventListener('click', () => {
            deleteAllOrders('completed');
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des commandes validées:', error);
        completedOrdersView.innerHTML = '<p>Erreur lors du chargement des commandes validées.</p>';
    }
}

// Chargement des commandes rejetées
async function loadRejectedOrders() {
    const rejectedOrdersView = document.getElementById('rejected-orders-view');
    if (!rejectedOrdersView) return;
    
    try {
        const snapshot = await db.collection('orders')
            .where('status', '==', 'rejected')
            .get();
            
        rejectedOrdersView.innerHTML = `
            <h3>Commandes rejetées</h3>
            <div class="admin-actions">
                <button id="download-pdf-rejected-btn">Télécharger PDF</button>
                <button id="delete-all-rejected-btn">Supprimer tout</button>
            </div>
        `;
        
        if (snapshot.empty) {
            rejectedOrdersView.innerHTML += '<p>Aucune commande rejetée.</p>';
            return;
        }
        
        const ordersList = document.createElement('div');
        ordersList.className = 'orders-list';
        
        snapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            const orderElement = createOrderElement(order, 'rejected');
            ordersList.appendChild(orderElement);
        });
        
        rejectedOrdersView.appendChild(ordersList);
        
        // Ajouter les écouteurs d'événements pour les boutons
        document.getElementById('download-pdf-rejected-btn').addEventListener('click', () => {
            generateOrdersPDF(snapshot.docs, 'rejected');
        });
        
        document.getElementById('delete-all-rejected-btn').addEventListener('click', () => {
            deleteAllOrders('rejected');
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des commandes rejetées:', error);
        rejectedOrdersView.innerHTML = '<p>Erreur lors du chargement des commandes rejetées.</p>';
    }
}

// Génération d'un PDF pour les commandes
function generateOrdersPDF(orders, type, totalSales = 0) {
    // Utilisation de jsPDF pour générer le PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Ajouter le logo et le titre
    doc.addImage('https://i.supaimg.com/b4a44dc2-c78a-45ff-a93b-dd14e4249939.jpg', 'JPEG', 10, 10, 30, 30);
    doc.setFontSize(20);
    doc.text('SOUAIBOU TÉLÉCOM', 50, 20);
    doc.setFontSize(12);
    doc.text('Vente tous appareil Apple et accessoires', 50, 30);
    
    // Titre du document
    doc.setFontSize(16);
    doc.text(`Commandes ${type === 'completed' ? 'Validées' : 'Rejetées'}`, 105, 45, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 55, { align: 'center' });
    
    // Ajouter les commandes
    let yPosition = 70;
    orders.forEach((orderDoc, index) => {
        const order = { id: orderDoc.id, ...orderDoc.data() };
        
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`Commande #${order.id.substring(0, 8)}`, 14, yPosition);
        doc.text(`${new Date(order.date).toLocaleDateString()}`, 180, yPosition, { align: 'right' });
        
        yPosition += 7;
        doc.setFontSize(10);
        doc.text(`Client: ${order.customerName || 'Non spécifié'}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Téléphone: ${order.customerPhone}`, 14, yPosition);
        yPosition += 5;
        
        if (order.customerEmail) {
            doc.text(`Email: ${order.customerEmail}`, 14, yPosition);
            yPosition += 5;
        }
        
        if (order.customerAddress) {
            doc.text(`Adresse: ${order.customerAddress}`, 14, yPosition);
            yPosition += 5;
        }
        
        // Articles
        doc.text('Articles:', 14, yPosition);
        yPosition += 5;
        
        order.items.forEach(item => {
            doc.text(`${item.quantity}x ${item.product.name} - ${item.product.salePrice || item.product.normalPrice} FCFA`, 20, yPosition);
            yPosition += 5;
        });
        
        // Total
        doc.setFontSize(11);
        doc.text(`Total: ${order.total} FCFA`, 14, yPosition);
        
        if (order.deliveryOption) {
            yPosition += 5;
            doc.text(`Livraison: ${order.deliveryOption}`, 14, yPosition);
        }
        
        yPosition += 10;
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 15;
    });
    
    // Ajouter le total des ventes pour les commandes validées
    if (type === 'completed' && totalSales > 0) {
        if (yPosition > 220) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`Total des ventes: ${totalSales} FCFA`, 14, yPosition, { align: 'left' });
    }
    
    // Sauvegarder le PDF
    doc.save(`commandes_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    showNotification('PDF généré avec succès', 'success');
}

// Suppression de toutes les commandes
async function deleteAllOrders(type) {
    if (type === 'completed') {
        if (!confirm('Téléchargez d\'abord la liste avant de supprimer. Voulez-vous vraiment supprimer toutes les commandes validées ?')) return;
    }
    
    try {
        const snapshot = await db.collection('orders')
            .where('status', '==', type)
            .get();
            
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        showNotification(`Toutes les commandes ${type === 'completed' ? 'validées' : 'rejetées'} ont été supprimées`, 'success');
        
        // Recharger la vue
        if (type === 'completed') {
            loadCompletedOrders();
        } else {
            loadRejectedOrders();
        }
        
    } catch (error) {
        console.error(`Erreur lors de la suppression des commandes ${type}:`, error);
        showNotification(`Erreur lors de la suppression des commandes ${type}`, 'error');
    }
}

// Chargement des paramètres de livraison
async function loadDeliverySettings() {
    const deliveryView = document.getElementById('delivery-settings-view');
    if (!deliveryView) return;
    
    try {
        const snapshot = await db.collection('delivery').get();
        
        deliveryView.innerHTML = `
            <h3>Options de livraison</h3>
            <div id="delivery-options-list"></div>
            <button id="add-delivery-option-btn">Ajouter une option</button>
            <div id="delivery-form" class="hidden">
                <h4>Nouvelle option de livraison</h4>
                <div class="form-group">
                    <label for="delivery-name">Nom</label>
                    <input type="text" id="delivery-name">
                </div>
                <div class="form-group">
                    <label for="delivery-price">Prix (FCFA)</label>
                    <input type="number" id="delivery-price" min="0">
                </div>
                <button id="save-delivery-option">Enregistrer</button>
                <button id="cancel-delivery-option">Annuler</button>
            </div>
        `;
        
        const deliveryList = document.getElementById('delivery-options-list');
        
        if (snapshot.empty) {
            deliveryList.innerHTML = '<p>Aucune option de livraison configurée.</p>';
        } else {
            snapshot.forEach(doc => {
                const option = { id: doc.id, ...doc.data() };
                const optionElement = document.createElement('div');
                optionElement.className = 'delivery-option-item';
                optionElement.innerHTML = `
                    <span>${option.name} - ${option.price} FCFA</span>
                    <button class="edit-delivery" data-id="${option.id}">Modifier</button>
                    <button class="delete-delivery" data-id="${option.id}">Supprimer</button>
                `;
                deliveryList.appendChild(optionElement);
            });
        }
        
        // Ajouter les écouteurs d'événements
        document.getElementById('add-delivery-option-btn').addEventListener('click', () => {
            document.getElementById('delivery-form').classList.remove('hidden');
        });
        
        document.getElementById('cancel-delivery-option').addEventListener('click', () => {
            document.getElementById('delivery-form').classList.add('hidden');
            document.getElementById('delivery-name').value = '';
            document.getElementById('delivery-price').value = '';
        });
        
        document.getElementById('save-delivery-option').addEventListener('click', async () => {
            const name = document.getElementById('delivery-name').value;
            const price = parseInt(document.getElementById('delivery-price').value);
            
            if (!name || isNaN(price)) {
                showNotification('Veuillez remplir tous les champs', 'error');
                return;
            }
            
            try {
                await db.collection('delivery').add({
                    name: name,
                    price: price
                });
                
                showNotification('Option de livraison ajoutée avec succès', 'success');
                document.getElementById('delivery-form').classList.add('hidden');
                document.getElementById('delivery-name').value = '';
                document.getElementById('delivery-price').value = '';
                
                // Recharger la liste
                loadDeliverySettings();
            } catch (error) {
                console.error('Erreur lors de l\'ajout de l\'option de livraison:', error);
                showNotification('Erreur lors de l\'ajout de l\'option de livraison', 'error');
            }
        });
        
        // Édition et suppression des options
        deliveryList.querySelectorAll('.edit-delivery').forEach(btn => {
            btn.addEventListener('click', async () => {
                const optionId = btn.getAttribute('data-id');
                const optionDoc = await db.collection('delivery').doc(optionId).get();
                
                if (optionDoc.exists) {
                    const option = optionDoc.data();
                    
                    // Afficher le formulaire avec les valeurs actuelles
                    document.getElementById('delivery-name').value = option.name;
                    document.getElementById('delivery-price').value = option.price;
                    document.getElementById('delivery-form').classList.remove('hidden');
                    
                    // Modifier le bouton pour enregistrer les modifications
                    const saveBtn = document.getElementById('save-delivery-option');
                    const originalClick = saveBtn.onclick;
                    
                    saveBtn.onclick = async () => {
                        const newName = document.getElementById('delivery-name').value;
                        const newPrice = parseInt(document.getElementById('delivery-price').value);
                        
                        if (!newName || isNaN(newPrice)) {
                            showNotification('Veuillez remplir tous les champs', 'error');
                            return;
                        }
                        
                        try {
                            await db.collection('delivery').doc(optionId).update({
                                name: newName,
                                price: newPrice
                            });
                            
                            showNotification('Option de livraison modifiée avec succès', 'success');
                            document.getElementById('delivery-form').classList.add('hidden');
                            
                            // Restaurer le comportement original du bouton
                            saveBtn.onclick = originalClick;
                            
                            // Recharger la liste
                            loadDeliverySettings();
                        } catch (error) {
                            console.error('Erreur lors de la modification de l\'option de livraison:', error);
                            showNotification('Erreur lors de la modification de l\'option de livraison', 'error');
                        }
                    };
                }
            });
        });
        
        deliveryList.querySelectorAll('.delete-delivery').forEach(btn => {
            btn.addEventListener('click', async () => {
                const optionId = btn.getAttribute('data-id');
                
                if (confirm('Êtes-vous sûr de vouloir supprimer cette option de livraison ?')) {
                    try {
                        await db.collection('delivery').doc(optionId).delete();
                        showNotification('Option de livraison supprimée avec succès', 'success');
                        loadDeliverySettings();
                    } catch (error) {
                        console.error('Erreur lors de la suppression de l\'option de livraison:', error);
                        showNotification('Erreur lors de la suppression de l\'option de livraison', 'error');
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des options de livraison:', error);
        deliveryView.innerHTML = '<p>Erreur lors du chargement des options de livraison.</p>';
    }
}

// Chargement des paramètres des publicités
async function loadAdsSettings() {
    const adsView = document.getElementById('ads-settings-view');
    if (!adsView) return;
    
    try {
        const snapshot = await db.collection('ads').get();
        
        adsView.innerHTML = `
            <h3>Gestion des publicités</h3>
            <div id="ads-list"></div>
            <button id="add-ad-btn">Ajouter une publicité</button>
            <div id="ad-form" class="hidden">
                <h4>Nouvelle publicité</h4>
                <div class="form-group">
                    <label for="ad-image-url">URL de l'image</label>
                    <input type="url" id="ad-image-url" placeholder="https://...">
                    <div class="image-preview" id="ad-image-preview"></div>
                </div>
                <button id="save-ad">Enregistrer</button>
                <button id="cancel-ad">Annuler</button>
            </div>
        `;
        
        const adsList = document.getElementById('ads-list');
        
        if (snapshot.empty) {
            adsList.innerHTML = '<p>Aucune publicité configurée.</p>';
        } else {
            snapshot.forEach(doc => {
                const ad = { id: doc.id, ...doc.data() };
                const adElement = document.createElement('div');
                adElement.className = 'ad-item';
                adElement.innerHTML = `
                    <img src="${ad.imageUrl}" alt="Publicité">
                    <button class="delete-ad" data-id="${ad.id}">Supprimer</button>
                `;
                adsList.appendChild(adElement);
            });
        }
        
        // Ajouter les écouteurs d'événements
        document.getElementById('add-ad-btn').addEventListener('click', () => {
            document.getElementById('ad-form').classList.remove('hidden');
        });
        
        document.getElementById('cancel-ad').addEventListener('click', () => {
            document.getElementById('ad-form').classList.add('hidden');
            document.getElementById('ad-image-url').value = '';
            document.getElementById('ad-image-preview').innerHTML = '';
        });
        
        // Prévisualisation de l'image
        document.getElementById('ad-image-url').addEventListener('change', function() {
            const preview = document.getElementById('ad-image-preview');
            if (this.value) {
                preview.innerHTML = `<img src="${this.value}" alt="Preview">`;
            } else {
                preview.innerHTML = '';
            }
        });
        
        document.getElementById('save-ad').addEventListener('click', async () => {
            const imageUrl = document.getElementById('ad-image-url').value;
            
            if (!imageUrl) {
                showNotification('Veuillez entrer une URL d\'image', 'error');
                return;
            }
            
            try {
                await db.collection('ads').add({
                    imageUrl: imageUrl
                });
                
                showNotification('Publicité ajoutée avec succès', 'success');
                document.getElementById('ad-form').classList.add('hidden');
                document.getElementById('ad-image-url').value = '';
                document.getElementById('ad-image-preview').innerHTML = '';
                
                // Recharger la liste
                loadAdsSettings();
            } catch (error) {
                console.error('Erreur lors de l\'ajout de la publicité:', error);
                showNotification('Erreur lors de l\'ajout de la publicité', 'error');
            }
        });
        
        // Suppression des publicités
        adsList.querySelectorAll('.delete-ad').forEach(btn => {
            btn.addEventListener('click', async () => {
                const adId = btn.getAttribute('data-id');
                
                if (confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) {
                    try {
                        await db.collection('ads').doc(adId).delete();
                        showNotification('Publicité supprimée avec succès', 'success');
                        loadAdsSettings();
                    } catch (error) {
                        console.error('Erreur lors de la suppression de la publicité:', error);
                        showNotification('Erreur lors de la suppression de la publicité', 'error');
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des publicités:', error);
        adsView.innerHTML = '<p>Erreur lors du chargement des publicités.</p>';
    }
}

// Initialisation de l'admin au chargement de la page
if (window.location.hash === '#admin') {
    // Si on accède à la page avec le hash #admin, afficher direct ard admin
    navigateTo('admin-page');
}



// Ajoutez ces fonctions dans votre fichier JavaScript

// Fonction pour générer un numéro de commande aléatoire
function generateOrderNumber() {
    return Math.floor(300000 + Math.random() * 500000); // Entre 300000 et 800000
}

// Fonction pour afficher la facture
// Fonction pour afficher la facture (MODIFIÉE)
function showFacture(orderData, customerInfo) {
    const factureModal = document.getElementById('facture-modal');
    const orderNumber = generateOrderNumber();
    
    // Remplir les informations de la facture
    document.getElementById('facture-number').textContent = orderNumber;
    document.getElementById('facture-client').textContent = customerInfo.name || 'Non spécifié';
    document.getElementById('facture-phone').textContent = customerInfo.phone;
    document.getElementById('facture-email').textContent = customerInfo.email || 'Non spécifié';
    document.getElementById('facture-address').textContent = customerInfo.address || 'Non spécifié';
    document.getElementById('facture-date').textContent = new Date().toLocaleString('fr-FR');
    
    // Ajouter les articles
    const factureItems = document.getElementById('facture-items');
    factureItems.innerHTML = '';
    
    let total = 0;
    orderData.items.forEach(item => {
        const itemTotal = item.quantity * (item.product.salePrice || item.product.normalPrice);
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'facture-item';
        itemElement.innerHTML = `
            <img src="${item.product.images[0]}" alt="${item.product.name}" class="facture-item-image">
            <div class="facture-item-details">
                <h4 class="facture-item-name">${item.product.name}</h4>
                <p class="facture-item-price">${item.quantity} x ${formatPrice(item.product.salePrice || item.product.normalPrice)} FCFA = ${formatPrice(itemTotal)} FCFA</p>
            </div>
        `;
        factureItems.appendChild(itemElement);
    });
    
    // Afficher le total
    document.getElementById('facture-total').textContent = `Total TTC: ${formatPrice(total)} FCFA`;
    
    // Afficher la modal
    factureModal.classList.remove('hidden');
    setTimeout(() => {
        factureModal.classList.add('show');
    }, 10);
    
    // Gestion du bouton de fermeture
    document.querySelector('.close-facture').onclick = () => {
        factureModal.classList.remove('show');
        setTimeout(() => {
            factureModal.classList.add('hidden');
        }, 300);
    };
    
    // Gestion du téléchargement de la facture (optionnel)
    document.getElementById('download-facture').onclick = () => {
        generateFacturePDF(orderNumber, customerInfo, orderData, total);
    };
    
    // Mettre à jour le numéro de commande dans la base de données
    return orderNumber;
}

// Fonction pour générer un PDF de la facture
function generateFacturePDF(orderNumber, customerInfo, orderData, total) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Logo et en-tête
    doc.addImage('https://i.supaimg.com/b4a44dc2-c78a-45ff-a93b-dd14e4249939.jpg', 'JPEG', 14, 10, 30, 30);
    doc.setFontSize(20);
    doc.setTextColor(20, 40, 160); // #1428A0
    doc.text('SOUHAIBOU TÉLÉCOM', 50, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Vente tous appareil Apple et accessoires', 50, 27);
    
    // Numéro de commande
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Commande N°: ${orderNumber}`, 14, 50);
    
    // Informations client
    doc.setFontSize(12);
    doc.text(`Client: ${customerInfo.name || 'Non spécifié'}`, 14, 60);
    doc.text(`Téléphone: ${customerInfo.phone}`, 14, 67);
    
    if (customerInfo.email) {
        doc.text(`Email: ${customerInfo.email}`, 14, 74);
    }
    
    if (customerInfo.address) {
        doc.text(`Adresse: ${customerInfo.address}`, 14, customerInfo.email ? 81 : 74);
    }
    
    // Date
    const dateY = customerInfo.address ? 88 : (customerInfo.email ? 81 : 74);
    doc.text(`Date et heure: ${new Date().toLocaleString('fr-FR')}`, 14, dateY);
    
    // Ligne séparatrice
    doc.line(14, dateY + 5, 196, dateY + 5);
    
    // Articles
    let yPosition = dateY + 15;
    doc.setFontSize(12);
    doc.setTextColor(20, 40, 160);
    doc.text('Articles commandés:', 14, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    orderData.items.forEach(item => {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        const itemName = item.product.name.length > 40 ? item.product.name.substring(0, 37) + '...' : item.product.name;
        const itemPrice = item.quantity * (item.product.salePrice || item.product.normalPrice);
        
        doc.text(`${item.quantity}x ${itemName}`, 20, yPosition);
        doc.text(`${formatPrice(itemPrice)} FCFA`, 180, yPosition, { align: 'right' });
        
        yPosition += 7;
    });
    
    // Ligne séparatrice avant les totaux
    yPosition += 5;
    doc.line(14, yPosition, 196, yPosition);
    yPosition += 10;
    
    // Calculer les totaux
    const subtotal = orderData.items.reduce((sum, item) => {
        return sum + (item.quantity * (item.product.salePrice || item.product.normalPrice));
    }, 0);
    
    const deliveryCost = orderData.deliveryCost || 0;
    const totalAmount = subtotal + deliveryCost;
    
    // Afficher les totaux
    doc.setFontSize(12);
    doc.text(`Sous-total: ${formatPrice(subtotal)} FCFA`, 14, yPosition);
    yPosition += 8;
    
    doc.text(`Frais de livraison: ${deliveryCost > 0 ? formatPrice(deliveryCost) + ' FCFA' : 'Gratuit'}`, 14, yPosition);
    yPosition += 8;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: ${formatPrice(totalAmount)} FCFA`, 14, yPosition);
    
    // Pied de page
    yPosition += 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Merci pour votre confiance!', 105, yPosition, { align: 'center' });
    yPosition += 6;
    doc.text('Service Client: +221 77 123 45 67', 105, yPosition, { align: 'center' });
    
    // Sauvegarder le PDF
    doc.save(`facture_${orderNumber}.pdf`);
}

// Modifiez la fonction de validation de commande
async function validateOrder(orderId) {
    try {
        // Récupérer les détails de la commande
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            showNotification('Commande non trouvée', 'error');
            return;
        }
        
        const order = orderDoc.data();
        
        // Générer et afficher la facture
        const orderNumber = showFacture(order, {
            name: order.customerName,
            phone: order.customerPhone,
            email: order.customerEmail,
            address: order.customerAddress
        });
        
        // Mettre à jour le statut de la commande avec le numéro de facture
        await db.collection('orders').doc(orderId).update({
            status: 'completed',
            processedAt: new Date(),
            orderNumber: orderNumber // Ajouter le numéro de commande
        });
        
        showNotification('Commande validée avec succès', 'success');
        
        // Recharger la liste des commandes en attente
        setTimeout(() => {
            loadPendingOrders();
        }, 1000);
        
    } catch (error) {
        console.error('Erreur lors de la validation de la commande:', error);
        showNotification('Erreur lors de la validation de la commande', 'error');
    }
}

// Fonction pour traiter la commande et afficher la facture
function processOrder() {
    // Récupérer les valeurs du formulaire
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerAddress = document.getElementById('customer-address').value;
    const deliverySelect = document.getElementById('delivery-zone');
    const deliveryOption = deliverySelect.value;
    
    // Valider le numéro de téléphone (obligatoire)
    if (!customerPhone) {
        showNotification('Le numéro de téléphone est obligatoire', 'error');
        return;
    }
    
    // Valider que le panier n'est pas vide
    if (cart.length === 0) {
        showNotification('Votre panier est vide', 'error');
        return;
    }
    
    // Calculer les totaux du panier
    let subtotal = 0;
    let originalTotal = 0;
    
    cart.forEach(item => {
        const price = item.product.salePrice || item.product.normalPrice;
        subtotal += price * item.quantity;
        originalTotal += item.product.normalPrice * item.quantity;
    });
    
    // Calculer les frais de livraison
   // Calculer les frais de livraison
let deliveryCost = 0;
let deliveryName = "Récupération sur place";

// Vérifier si l'option de livraison est valide et n'est pas "pickup"
if (deliveryOption && deliveryOption !== "pickup") {
    const selectedDelivery = deliveryOptions.find(option => option.id === deliveryOption);
    if (selectedDelivery) {
        deliveryCost = selectedDelivery.price;
        deliveryName = selectedDelivery.name;
    } else {
        // Si l'option n'est pas trouvée, utiliser la valeur brute
        deliveryCost = parseInt(deliveryOption) || 0;
        deliveryName = "Livraison";
    }
}
    
    // Calculer le total final
    const total = subtotal + deliveryCost;
    const savings = originalTotal - subtotal;
    
    // Générer un numéro de commande
    const orderNumber = 'CMD-' + Math.floor(100000 + Math.random() * 900000);
    
    // Remplir la facture avec les informations
    document.getElementById('facture-number').textContent = orderNumber;
    document.getElementById('facture-client').textContent = customerName || 'Non spécifié';
    document.getElementById('facture-phone').textContent = customerPhone;
    document.getElementById('facture-email').textContent = customerEmail || 'Non spécifié';
    document.getElementById('facture-address').textContent = customerAddress || 'Non spécifié';
    document.getElementById('facture-date').textContent = new Date().toLocaleString('fr-FR');
    
    // Ajouter les articles du panier à la facture
    const factureItems = document.getElementById('facture-items');
    factureItems.innerHTML = '';
    
    cart.forEach(item => {
        const price = item.product.salePrice || item.product.normalPrice;
        const itemTotal = price * item.quantity;
        const originalItemTotal = item.product.normalPrice * item.quantity;
        const itemSavings = originalItemTotal - itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'facture-item';
        itemElement.innerHTML = `
            <img src="${item.product.images[0]}" alt="${item.product.name}" class="facture-item-image">
            <div class="facture-item-details">
                <h4 class="facture-item-name">${item.product.name}</h4>
                <p class="facture-item-price">${formatPrice(price)} FCFA x ${item.quantity}</p>
                <p class="facture-item-total">${formatPrice(itemTotal)} FCFA</p>
                ${itemSavings > 0 ? `<p class="facture-item-savings">Économie: ${formatPrice(itemSavings)} FCFA</p>` : ''}
            </div>
        `;
        factureItems.appendChild(itemElement);
    });
    
    // Afficher le récapitulatif des prix (version simplifiée)
   // Afficher le récapitulatif des prix (version simplifiée)
const factureTotal = document.getElementById('facture-total');
factureTotal.innerHTML = `
    <div class="facture-summary">
        <div class="summary-row">
            <span>Sous-total (${cart.reduce((acc, item) => acc + item.quantity, 0)} articles):</span>
            <span>${formatPrice(subtotal)} FCFA</span>
        </div>
        ${savings > 0 ? `
        <div class="summary-row discount">
            <span>Économies:</span>
            <span>-${formatPrice(savings)} FCFA</span>
        </div>
        ` : ''}
        <div class="summary-row">
            <span>Frais de livraison (${deliveryName}):</span>
            <span>${deliveryCost > 0 ? formatPrice(deliveryCost) + ' FCFA' : 'Gratuit'}</span>
        </div>
        <div class="summary-row total">
            <span><strong>Total:</strong></span>
            <span><strong>${formatPrice(total)} FCFA</strong></span>
        </div>
    </div>
    <div class="payment-info">
        <p>Mode de paiement: Paiement à la livraison</p>
    </div>
`;
    
    // Fermer le modal de commande
    document.getElementById('checkout-modal').classList.add('hidden');
    
    // Afficher le modal de facture
    document.getElementById('facture-modal').classList.remove('hidden');
    
    // Sauvegarder la commande
    saveOrder(orderNumber, customerName, customerPhone, customerEmail, customerAddress, deliveryName, deliveryCost, total, subtotal);
}

// Fonction pour sauvegarder la commande
function saveOrder(orderNumber, name, phone, email, address, deliveryOption, deliveryCost, total, subtotal) {
    const order = {
        id: orderNumber,
        date: new Date(),
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        customerAddress: address,
        items: JSON.parse(JSON.stringify(cart)), // Copie profonde du panier
        deliveryOption: deliveryOption,
        deliveryCost: deliveryCost,
        subtotal: subtotal,
        total: total,
        status: 'pending'
    };
    
    // Ajouter à l'historique local
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Envoyer à Firebase (si en ligne)
    if (navigator.onLine) {
        try {
            db.collection('orders').add(order);
            showNotification('Commande enregistrée avec succès!', 'success');
        } catch (error) {
            console.error('Erreur enregistrement Firebase:', error);
            showNotification('Commande enregistrée localement', 'info');
        }
    } else {
        showNotification('Commande enregistrée localement (hors ligne)', 'info');
    }
    
    // Vider le panier
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}



// ==================== GESTION DE LA FACTURE ====================

// Écouter la soumission du formulaire de commande
document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Empêche le rechargement de la page
    processOrder(); // Traite la commande
});

// Fonction pour traiter la commande et afficher la facture
function processOrder() {
    // Récupérer les valeurs du formulaire
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerAddress = document.getElementById('customer-address').value;
    
    // Valider le numéro de téléphone (obligatoire)
    if (!customerPhone) {
        showNotification('Le numéro de téléphone est obligatoire', 'error');
        return;
    }
    
    // Générer un numéro de commande
    const orderNumber = 'CMD-' + Math.floor(100000 + Math.random() * 900000);
    
    // Remplir la facture avec les informations
    document.getElementById('facture-number').textContent = orderNumber;
    document.getElementById('facture-client').textContent = customerName || 'Non spécifié';
    document.getElementById('facture-phone').textContent = customerPhone;
    document.getElementById('facture-email').textContent = customerEmail || 'Non spécifié';
    document.getElementById('facture-address').textContent = customerAddress || 'Non spécifié';
    document.getElementById('facture-date').textContent = new Date().toLocaleString('fr-FR');
    
    // Ajouter les articles du panier à la facture
    const factureItems = document.getElementById('facture-items');
    factureItems.innerHTML = '';
    
    let total = 0;
    cart.forEach(item => {
        const price = item.product.salePrice || item.product.normalPrice;
        const itemTotal = price * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'facture-item';
        itemElement.innerHTML = `
            <img src="${item.product.images[0]}" alt="${item.product.name}" class="facture-item-image">
            <div class="facture-item-details">
                <h4 class="facture-item-name">${item.product.name}</h4>
                <p class="facture-item-price">${formatPrice(price)} FCFA x ${item.quantity} = ${formatPrice(itemTotal)} FCFA</p>
            </div>
        `;
        factureItems.appendChild(itemElement);
    });
    
    // Afficher le total
    document.getElementById('facture-total').innerHTML = `
        <p><strong>Total: ${formatPrice(total)} FCFA</strong></p>
    `;
    
    // Fermer le modal de commande
    document.getElementById('checkout-modal').classList.add('hidden');
    
    // Afficher le modal de facture
    document.getElementById('facture-modal').classList.remove('hidden');
    
    // Sauvegarder la commande
    saveOrder(orderNumber, customerName, customerPhone, customerEmail, customerAddress, total);
}

// Fonction pour sauvegarder la commande
function saveOrder(orderNumber, name, phone, email, address, total) {
    const order = {
        id: orderNumber,
        date: new Date(),
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        customerAddress: address,
        items: cart,
        total: total,
        status: 'pending'
    };
    
    // Ajouter à l'historique local
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Envoyer à Firebase (si en ligne)
    if (navigator.onLine) {
        try {
            db.collection('orders').add(order);
        } catch (error) {
            console.error('Erreur enregistrement Firebase:', error);
        }
    }
    
    // Vider le panier
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Télécharger la facture
document.getElementById('download-facture').addEventListener('click', function() {
    // Utiliser html2canvas pour capturer la facture
    html2canvas(document.querySelector('.facture-content')).then(canvas => {
        const link = document.createElement('a');
        link.download = `facture-${document.getElementById('facture-number').textContent}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

// Fermer la facture
document.querySelector('.close-facture').addEventListener('click', function() {
    document.getElementById('facture-modal').classList.add('hidden');
    navigateTo('home-page');
});


// ==================== GESTION COMPLÈTE DE LA FACTURE ====================

// Écouter la soumission du formulaire de commande
document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Empêche le rechargement de la page
    processOrder(); // Traite la commande
});

// Fonction pour traiter la commande et afficher la facture
function processOrder() {
    // Récupérer les valeurs du formulaire
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerAddress = document.getElementById('customer-address').value;
    const deliverySelect = document.getElementById('delivery-zone');
    const deliveryOption = deliverySelect.options[deliverySelect.selectedIndex].text;
    const deliveryCost = deliverySelect.value === 'pickup' ? 0 : 
                        parseInt(deliverySelect.value.split('-')[1]) || 0;
    
    // Valider le numéro de téléphone (obligatoire)
    if (!customerPhone) {
        showNotification('Le numéro de téléphone est obligatoire', 'error');
        return;
    }
    
    // Valider que le panier n'est pas vide
    if (cart.length === 0) {
        showNotification('Votre panier est vide', 'error');
        return;
    }
    
    // Calculer les totaux du panier
    let subtotal = 0;
    let originalTotal = 0;
    
    cart.forEach(item => {
        const price = item.product.salePrice || item.product.normalPrice;
        subtotal += price * item.quantity;
        originalTotal += item.product.normalPrice * item.quantity;
    });
    
    // Calculer le total final
    const total = subtotal + deliveryCost;
    const savings = originalTotal - subtotal;
    
    // Générer un numéro de commande
    const orderNumber = 'CMD-' + Math.floor(100000 + Math.random() * 900000);
    
    // Remplir la facture avec les informations
    document.getElementById('facture-number').textContent = orderNumber;
    document.getElementById('facture-client').textContent = customerName || 'Non spécifié';
    document.getElementById('facture-phone').textContent = customerPhone;
    document.getElementById('facture-email').textContent = customerEmail || 'Non spécifié';
    document.getElementById('facture-address').textContent = customerAddress || 'Non spécifié';
    document.getElementById('facture-date').textContent = new Date().toLocaleString('fr-FR');
    
    // Ajouter les articles du panier à la facture
    const factureItems = document.getElementById('facture-items');
    factureItems.innerHTML = '';
    
    cart.forEach(item => {
        const price = item.product.salePrice || item.product.normalPrice;
        const itemTotal = price * item.quantity;
        const originalItemTotal = item.product.normalPrice * item.quantity;
        const itemSavings = originalItemTotal - itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'facture-item';
        itemElement.innerHTML = `
            <img src="${item.product.images[0]}" alt="${item.product.name}" class="facture-item-image">
            <div class="facture-item-details">
                <h4 class="facture-item-name">${item.product.name}</h4>
                <p class="facture-item-price">${formatPrice(price)} FCFA x ${item.quantity}</p>
                <p class="facture-item-total">${formatPrice(itemTotal)} FCFA</p>
                ${itemSavings > 0 ? `<p class="facture-item-savings">Économie: ${formatPrice(itemSavings)} FCFA</p>` : ''}
            </div>
        `;
        factureItems.appendChild(itemElement);
    });
    
    // Afficher le récapitulatif des prix
    const factureTotal = document.getElementById('facture-total');
    factureTotal.innerHTML = `
        <div class="facture-summary">
            <div class="summary-row">
                <span>Sous-total (${cart.reduce((acc, item) => acc + item.quantity, 0)} articles):</span>
                <span>${formatPrice(subtotal)} FCFA</span>
            </div>
            ${savings > 0 ? `
            <div class="summary-row discount">
                <span>Économies:</span>
                <span>-${formatPrice(savings)} FCFA</span>
            </div>
            ` : ''}
            <div class="summary-row">
                <span>Frais de livraison (${deliveryOption.split(' - ')[0]}):</span>
                <span>${deliveryCost > 0 ? formatPrice(deliveryCost) + ' FCFA' : 'Gratuit'}</span>
            </div>
            <div class="summary-row total">
                <span><strong>Total:</strong></span>
                <span><strong>${formatPrice(total)} FCFA</strong></span>
            </div>
        </div>
        <div class="payment-info">
            <p>Mode de paiement: Paiement à la livraison</p>
        </div>
    `;
    
    // Fermer le modal de commande
    document.getElementById('checkout-modal').classList.add('hidden');
    
    // Afficher le modal de facture
    document.getElementById('facture-modal').classList.remove('hidden');
    
    // Sauvegarder la commande
    saveOrder(orderNumber, customerName, customerPhone, customerEmail, customerAddress, deliveryOption, deliveryCost, total, subtotal);
}

// Fonction pour sauvegarder la commande
function saveOrder(orderNumber, name, phone, email, address, deliveryOption, deliveryCost, total, subtotal) {
    const order = {
        id: orderNumber,
        date: new Date(),
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        customerAddress: address,
        items: JSON.parse(JSON.stringify(cart)), // Copie profonde du panier
        deliveryOption: deliveryOption,
        deliveryCost: deliveryCost,
        subtotal: subtotal,
        total: total,
        status: 'pending'
    };
    
    // Ajouter à l'historique local
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Envoyer à Firebase (si en ligne)
    if (navigator.onLine) {
        try {
            db.collection('orders').add(order);
            showNotification('Commande enregistrée avec succès!', 'success');
        } catch (error) {
            console.error('Erreur enregistrement Firebase:', error);
            showNotification('Commande enregistrée localement', 'info');
        }
    } else {
        showNotification('Commande enregistrée localement (hors ligne)', 'info');
    }
    
    // Vider le panier
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Télécharger la facture
document.getElementById('download-facture').addEventListener('click', function() {
    // Utiliser html2canvas pour capturer la facture
    html2canvas(document.querySelector('.facture-content')).then(canvas => {
        const link = document.createElement('a');
        link.download = `facture-${document.getElementById('facture-number').textContent}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

// Fermer la facture
document.querySelector('.close-facture').addEventListener('click', function() {
    document.getElementById('facture-modal').classList.add('hidden');
    navigateTo('home-page');
});

// Fermer la facture en cliquant à l'extérieur
document.getElementById('facture-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
        navigateTo('home-page');
    }
}); 




// Fonction pour afficher la facture
function showFacture(orderData) {
    const modal = document.getElementById('facture-modal');
    const factureNumber = document.getElementById('facture-number');
    const factureClient = document.getElementById('facture-client');
    const facturePhone = document.getElementById('facture-phone');
    const factureEmail = document.getElementById('facture-email');
    const factureAddress = document.getElementById('facture-address');
    const factureDate = document.getElementById('facture-date');
    const factureItems = document.getElementById('facture-items');
    const factureSubtotal = document.getElementById('facture-subtotal');
    const factureDelivery = document.getElementById('facture-delivery');
    const factureSavings = document.getElementById('facture-savings');
    const factureTotal = document.getElementById('facture-total');
    
    // Générer numéro de commande ST + timestamp
    const orderNumber = 'ST' + Date.now().toString().slice(-6);
    factureNumber.textContent = orderNumber;
    
    // Remplir les informations client
    factureClient.textContent = orderData.name || 'Non spécifié';
    facturePhone.textContent = orderData.phone || 'Non spécifié';
    factureEmail.textContent = orderData.email || 'Non spécifié';
    factureAddress.textContent = orderData.address || 'Non spécifié';
    
    // Date et heure actuelles
    const now = new Date();
    factureDate.textContent = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');
    
    // Vider les articles précédents
    factureItems.innerHTML = '';
    
    let subtotal = 0;
    let totalSavings = 0;
    let deliveryCost = orderData.deliveryCost || 0;
    
    // Ajouter les articles
    orderData.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const originalTotal = item.originalPrice * item.quantity;
        const itemSavings = originalTotal - itemTotal;
        
        subtotal += itemTotal;
        totalSavings += itemSavings;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'facture-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="facture-item-image">
            <div class="facture-item-details">
                <div class="facture-item-name">${item.name}</div>
                <div class="facture-item-price">${item.price.toLocaleString()} FCFA x ${item.quantity}</div>
                ${item.originalPrice > item.price ? 
                    `<div class="facture-item-price" style="text-decoration: line-through; color: #999;">
                        ${item.originalPrice.toLocaleString()} FCFA
                    </div>` : ''
                }
            </div>
            <div class="facture-item-total">
                <div class="facture-item-amount">${itemTotal.toLocaleString()} FCFA</div>
                ${itemSavings > 0 ? 
                    `<div class="facture-item-savings">-${itemSavings.toLocaleString()} FCFA</div>` : ''
                }
            </div>
        `;
        factureItems.appendChild(itemElement);
    });
    
    // Calculer les totaux
    const total = subtotal + deliveryCost;
    
    // Afficher les totaux
    factureSubtotal.textContent = subtotal.toLocaleString() + ' FCFA';
    factureDelivery.textContent = deliveryCost.toLocaleString() + ' FCFA';
    factureSavings.textContent = totalSavings > 0 ? '-' + totalSavings.toLocaleString() + ' FCFA' : '0 FCFA';
    factureTotal.textContent = total.toLocaleString() + ' FCFA';
    
    // Afficher la modal
    modal.classList.remove('hidden');
    
    // Empêcher le défilement de la page background
    document.body.style.overflow = 'hidden';
}

// Fonction pour générer le PDF
function generatePDF(orderData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Styles
    const primaryColor = '#1428A0';
    const secondaryColor = '#666';
    
    // En-tête
    doc.setFillColor(20, 40, 160);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('SOUHAIBOU TÉLÉCOM', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Excellence en Électronique & Accessoires', 105, 25, { align: 'center' });
    
    // Numéro de facture
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Facture N°: ST${Date.now().toString().slice(-6)}`, 15, 35);
    
    // Informations client
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('INFORMATIONS CLIENT', 15, 50);
    doc.setDrawColor(20, 40, 160);
    doc.line(15, 52, 80, 52);
    
    doc.setFontSize(10);
    doc.text(`Client: ${orderData.name || 'Non spécifié'}`, 15, 60);
    doc.text(`Téléphone: ${orderData.phone || 'Non spécifié'}`, 15, 65);
    doc.text(`Email: ${orderData.email || 'Non spécifié'}`, 15, 70);
    doc.text(`Adresse: ${orderData.address || 'Non spécifié'}`, 15, 75);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 15, 80);
    
    // Articles
    let yPosition = 90;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('ARTICLES COMMANDÉS', 15, yPosition);
    doc.line(15, yPosition + 2, 80, yPosition + 2);
    yPosition += 10;
    
    doc.setFontSize(10);
    orderData.items.forEach((item, index) => {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        const itemTotal = item.price * item.quantity;
        doc.text(`${item.name}`, 15, yPosition);
        doc.text(`${item.quantity} x ${item.price.toLocaleString()} FCFA`, 150, yPosition);
        doc.text(`${itemTotal.toLocaleString()} FCFA`, 180, yPosition);
        yPosition += 5;
    });
    
    // Totaux
    yPosition += 10;
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = orderData.deliveryCost || 0;
    const total = subtotal + deliveryCost;
    
    doc.setFontSize(10);
    doc.text(`Sous-total: ${subtotal.toLocaleString()} FCFA`, 150, yPosition);
    yPosition += 5;
    doc.text(`Livraison: ${deliveryCost.toLocaleString()} FCFA`, 150, yPosition);
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: ${total.toLocaleString()} FCFA`, 150, yPosition);
    
    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text('Merci pour votre confiance !', 105, 280, { align: 'center' });
    doc.text('Service Client: +221 77 123 45 67', 105, 285, { align: 'center' });
    
    // Sauvegarder le PDF
    doc.save(`facture-ST${Date.now().toString().slice(-6)}.pdf`);
}

// Événements
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('download-facture');
    const closeBtn = document.querySelector('.close-facture');
    const modal = document.getElementById('facture-modal');
    
    downloadBtn.addEventListener('click', function() {
        // Récupérer les données de la commande actuelle
        const orderData = getCurrentOrderData();
        generatePDF(orderData);
    });
    
    closeBtn.addEventListener('click', function() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
});

// Fonction pour récupérer les données de commande actuelles
function getCurrentOrderData() {
    // Implémentez cette fonction selon votre structure de données
    return {
        name: document.getElementById('facture-client').textContent,
        phone: document.getElementById('facture-phone').textContent,
        email: document.getElementById('facture-email').textContent,
        address: document.getElementById('facture-address').textContent,
        items: [], // Remplir avec les articles du panier
        deliveryCost: 0 // Remplir avec le coût de livraison
    };
}
