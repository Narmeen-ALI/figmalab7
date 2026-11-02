/* LUXE — main.js (fixed)
   Cart (event delegation, saved in localStorage), drawer, search,
   toast, wishlist, mobile menu, newsletter, reveal, active nav */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ───────── DATA ───────── */
  var PRODUCTS = {
    'add-cart-blazer':  { id: 'blazer',  name: 'Classic Blazer',  price: 125, image: 'blazer.png'  },
    'add-cart-dress':   { id: 'dress',   name: 'Summer Dress',    price: 99,  image: 'dress.png'   },
    'add-cart-shirt':   { id: 'shirt',   name: 'Casual Shirt',    price: 59,  image: 'shirt.png'   },
    'add-cart-handbag': { id: 'handbag', name: 'Premium Handbag', price: 159, image: 'handbag.png' }
  };
  var FREE_SHIP = 150;
  var KEY = 'luxe-cart-v2';
  var cart = [];
  var orderPlaced = false;

  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) {
      cart = saved.filter(function (i) { return i && i.id && i.price > 0 && i.qty > 0; });
    }
  } catch (e) { cart = []; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function total() { return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0); }
  function count() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }

  /* ───────── BADGE ───────── */
  var badge = $('#cart-count');
  function updateBadge(bounce) {
    var n = count();
    badge.textContent = n;
    badge.style.display = n === 0 ? 'none' : '';
    if (bounce) {
      badge.style.transform = 'scale(1.5)';
      setTimeout(function () { badge.style.transform = ''; }, 220);
    }
  }

  /* ───────── TOAST ───────── */
  var toast = $('#cart-toast');
  var toastMsg = $('#cart-toast-msg');
  var viewBtn = document.createElement('button');
  viewBtn.type = 'button';
  viewBtn.className = 'toast-view-btn';
  viewBtn.textContent = 'View cart';
  toast.appendChild(viewBtn);
  var toastTimer;

  function showToast(msg, withView) {
    toastMsg.textContent = msg;
    viewBtn.style.display = withView ? '' : 'none';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3200);
  }
  viewBtn.addEventListener('click', function () {
    toast.classList.remove('show');
    openCart();
  });

  /* ───────── CART ACTIONS ───────── */
  function addToCart(btnId) {
    var p = PRODUCTS[btnId];
    if (!p) return;
    var found = cart.filter(function (i) { return i.id === p.id; })[0];
    if (found) found.qty += 1;
    else cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 });
    orderPlaced = false;
    save(); updateBadge(true); renderCart();
    showToast(p.name + ' added to cart', true);
  }
  function removeItem(id) {
    cart = cart.filter(function (i) { return i.id !== id; });
    save(); updateBadge(true); renderCart();
  }
  function changeQty(id, d) {
    var item = cart.filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) return removeItem(id);
    save(); updateBadge(false); renderCart();
  }

  /* ───────── DRAWER ───────── */
  var drawer = document.createElement('div');
  drawer.id = 'cart-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', 'Shopping cart');
  drawer.innerHTML =
    '<div class="cart-backdrop" id="cart-backdrop"></div>' +
    '<div class="cart-panel">' +
      '<div class="cart-header"><h2 class="cart-title">Your Cart</h2>' +
      '<button type="button" class="cart-close-btn" id="cart-close-btn" aria-label="Close cart">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>' +
      '<div class="cart-body" id="cart-body"></div>' +
      '<div class="cart-footer" id="cart-footer"></div>' +
    '</div>';
  document.body.appendChild(drawer);

  function openCart() {
    renderCart();
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#cart-close-btn').focus();
  }
  function closeCart() {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderCart() {
    var body = $('#cart-body'), footer = $('#cart-footer');

    if (orderPlaced) {
      body.innerHTML = '<div class="cart-empty"><p><strong>Thank you for your order!</strong></p>' +
        '<p>This is a demo store, so no payment was taken.</p>' +
        '<button type="button" class="btn btn-primary" data-act="shop">Keep shopping</button></div>';
      footer.innerHTML = '';
      return;
    }
    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty">' +
        '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
        '<p>Your cart is empty</p>' +
        '<button type="button" class="btn btn-primary" data-act="shop">Shop now</button></div>';
      footer.innerHTML = '';
      return;
    }

    body.innerHTML = cart.map(function (i) {
      return '<div class="cart-item">' +
        '<img src="' + i.image + '" alt="' + i.name + '" class="cart-item-img" />' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-top"><span class="cart-item-name">' + i.name + '</span>' +
          '<button type="button" class="cart-item-remove" data-act="remove" data-id="' + i.id + '" aria-label="Remove ' + i.name + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button></div>' +
          '<span class="cart-item-price">$' + i.price + '</span>' +
          '<div class="cart-qty-row">' +
            '<button type="button" class="qty-btn" data-act="qty" data-id="' + i.id + '" data-delta="-1" aria-label="Decrease quantity">−</button>' +
            '<span class="qty-val">' + i.qty + '</span>' +
            '<button type="button" class="qty-btn" data-act="qty" data-id="' + i.id + '" data-delta="1" aria-label="Increase quantity">+</button>' +
            '<span class="cart-item-subtotal">$' + (i.price * i.qty) + '</span>' +
          '</div></div></div>';
    }).join('');

    var t = total(), n = count();
    footer.innerHTML =
      '<div class="cart-summary">' +
        '<div class="cart-summary-row"><span>Subtotal (' + n + ' item' + (n !== 1 ? 's' : '') + ')</span><span>$' + t.toFixed(2) + '</span></div>' +
        '<div class="cart-summary-row cart-summary-shipping"><span>Shipping</span>' +
          (t >= FREE_SHIP ? '<span class="free-ship">Free</span>' : '<span>Calculated at checkout</span>') + '</div>' +
        (t < FREE_SHIP
          ? '<p class="cart-shipping-nudge">Add $' + (FREE_SHIP - t) + ' more for free shipping</p>'
          : '<p class="cart-shipping-nudge free">You qualify for free shipping</p>') +
      '</div>' +
      '<button type="button" class="btn btn-primary checkout-btn" data-act="checkout">Checkout · $' + t.toFixed(2) + '</button>' +
      '<button type="button" class="btn btn-secondary continue-btn" data-act="close">Continue shopping</button>';
  }

  // one listener handles every button inside the drawer
  drawer.addEventListener('click', function (e) {
    if (e.target.id === 'cart-backdrop') return closeCart();
    var b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'cart-close-btn' || b.dataset.act === 'close') return closeCart();
    switch (b.dataset.act) {
      case 'qty':    changeQty(b.dataset.id, parseInt(b.dataset.delta, 10)); break;
      case 'remove': removeItem(b.dataset.id); break;
      case 'shop':
        closeCart();
        var f = $('#featured'); if (f) f.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'checkout':
        cart = []; save(); updateBadge(false);
        orderPlaced = true; renderCart();
        break;
    }
  });

  $('#cart-btn').addEventListener('click', openCart);

  /* ───────── ADD TO CART BUTTONS (delegated) ───────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-cart');
    if (!btn) return;
    e.preventDefault();
    addToCart(btn.id);
    btn.textContent = '✓ Added';
    btn.classList.add('is-added');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = 'Add to Cart';
      btn.classList.remove('is-added');
    }, 1400);
  });
  $$('.btn-cart').forEach(function (b) { b.type = 'button'; });

  /* ───────── WISHLIST ───────── */
  $$('.wishlist-btn').forEach(function (btn) {
    btn.type = 'button';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = btn.classList.toggle('active');
      btn.setAttribute('aria-label', on ? 'Remove from wishlist' : 'Add to wishlist');
      var name = btn.closest('.product-card').querySelector('.product-name').textContent;
      showToast(name + (on ? ' saved to wishlist' : ' removed from wishlist'), false);
    });
  });

  /* ───────── SEARCH ───────── */
  var bar = document.createElement('div');
  bar.className = 'search-bar';
  bar.id = 'search-bar';
  bar.innerHTML = '<div class="search-inner"><label for="search-input" class="visually-hidden">Search products</label>' +
    '<input type="search" id="search-input" placeholder="Search blazer, dress, shirt, handbag…" autocomplete="off" />' +
    '<button type="button" class="search-close" id="search-close" aria-label="Close search">✕</button></div>';
  $('#site-header').appendChild(bar);

  var grid = $('.product-grid');
  var noRes = document.createElement('p');
  noRes.className = 'no-results';
  noRes.textContent = 'No products match your search. Try “blazer” or “dress”.';
  noRes.hidden = true;
  grid.parentNode.insertBefore(noRes, grid.nextSibling);

  function filterProducts(q) {
    q = q.trim().toLowerCase();
    var shown = 0;
    $$('.product-card').forEach(function (c) {
      var hit = !q || c.querySelector('.product-name').textContent.toLowerCase().indexOf(q) !== -1;
      c.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });
    noRes.hidden = shown !== 0;
  }
  function openSearch() {
    bar.classList.add('open');
    $('#search-input').focus();
  }
  function closeSearch() {
    bar.classList.remove('open');
    $('#search-input').value = '';
    filterProducts('');
  }
  $('#search-btn').addEventListener('click', function () {
    bar.classList.contains('open') ? closeSearch() : openSearch();
  });
  $('#search-close').addEventListener('click', closeSearch);
  $('#search-input').addEventListener('input', function (e) {
    filterProducts(e.target.value);
    if (e.target.value.trim()) $('#featured').scrollIntoView({ behavior: 'smooth' });
  });

  /* ───────── ACCOUNT / SALE ───────── */
  $('#account-btn').addEventListener('click', function () {
    showToast('Sign in is coming soon', false);
  });
  var saleLinks = $$('#nav-sale, .mobile-nav-links li:nth-child(2) a');
  saleLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('No sale items right now. Check back soon.', false);
    });
  });
  $$('a[href="#"]').forEach(function (a) {
    if (a.id === 'nav-new' || a.classList.contains('logo') || a.closest('.mobile-nav-links')) {
      a.addEventListener('click', function (e) {
        if (a.closest('.mobile-nav-links') && a.textContent.trim() === 'Sale') return;
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else if (a.id === 'view-all-link') {
      a.addEventListener('click', function (e) { e.preventDefault(); closeSearch(); });
    }
  });

  /* ───────── STICKY NAV SHADOW ───────── */
  var navbar = $('#navbar');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ───────── MOBILE MENU ───────── */
  var menuBtn = $('#menu-btn'), closeBtn = $('#close-btn'), overlay = $('#mobile-overlay');
  function openMenu() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  $$('a', overlay).forEach(function (l) { l.addEventListener('click', closeMenu); });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawer.classList.contains('open')) closeCart();
    if (overlay.classList.contains('open')) closeMenu();
    if (bar.classList.contains('open')) closeSearch();
  });

  /* ───────── NEWSLETTER ───────── */
  var form = $('#newsletter-form'), email = $('#email-input'), ok = $('#success-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      ok.style.color = '#c0392b';
      ok.textContent = 'Please enter a valid email address, like you@example.com.';
      email.focus();
      return;
    }
    ok.style.color = '';
    ok.textContent = "You're on the list. Welcome to LUXE.";
    email.value = '';
    email.disabled = true;
    var sb = $('#subscribe-btn');
    sb.disabled = true;
    sb.textContent = '✓ Subscribed';
  });

  /* ───────── SCROLL REVEAL (never blocks clicks) ───────── */
  var revealEls = $$('.product-card, .benefit-card, .section-heading, .newsletter-copy, .newsletter-form-wrap');
  if ('IntersectionObserver' in window) {
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(function (el) { obs.observe(el); });
    // safety: if anything is still hidden after 2.5s, show it
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('visible'); }); }, 2500);
  }

  /* ───────── ACTIVE NAV ON SCROLL ───────── */
  var map = [
    { id: 'hero', nav: 'nav-new' }, { id: 'featured', nav: 'nav-collections' },
    { id: 'why-us', nav: 'nav-about' }, { id: 'newsletter', nav: 'nav-contact' }
  ];
  if ('IntersectionObserver' in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var m = map.filter(function (s) { return s.id === en.target.id; })[0];
        if (!m) return;
        $$('.nav-link').forEach(function (l) { l.classList.remove('active'); });
        var t = document.getElementById(m.nav); if (t) t.classList.add('active');
      });
    }, { threshold: 0.3 });
    map.forEach(function (s) { var el = document.getElementById(s.id); if (el) navObs.observe(el); });
  }

  /* ───────── HERO PARALLAX (desktop, motion allowed) ───────── */
  var heroImg = $('.editorial-img');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroImg && window.innerWidth > 768 && !reduce) {
    window.addEventListener('scroll', function () {
      if (window.scrollY < 900) heroImg.style.transform = 'translateY(' + (window.scrollY * 0.12) + 'px)';
    }, { passive: true });
  }

  /* init */
  updateBadge(false);
  renderCart();
})();