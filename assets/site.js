export const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/unamoble/tudors_farm_dynamic/main/data';
export const DEFAULT_MAP_EMBED = 'https://maps.google.com/maps?q=Rohini%20Tea%20Garden%2C%20Kurseong&t=&z=13&ie=UTF8&iwloc=&output=embed';

const NAV_ITEMS = [
  { label: 'Home', href: '/index.html', page: 'home' },
  { label: 'Rooms', href: '/rooms.html', page: 'rooms' },
  { label: 'Gallery', href: '/gallery.html', page: 'gallery' },
  { label: 'About', href: '/about.html', page: 'about' },
  { label: 'Contact', href: '/contact.html', page: 'contact' }
];

const FALLBACK_SITE_TITLE = 'Tudor Farm Cottages | Rohini Tea Garden, Kurseong';
const FALLBACK_WHATSAPP_NUMBER = '919999999999';

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function normalizeConfig(config = {}) {
  return {
    siteTitle: config.siteTitle || FALLBACK_SITE_TITLE,
    siteSubtitle: config.siteSubtitle || 'Boutique hillside cottages in Rohini Tea Garden, Kurseong',
    whatsappNumber: config.whatsappNumber || FALLBACK_WHATSAPP_NUMBER,
    heroImage:
      config.heroImage ||
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80',
    mapEmbed: config.mapEmbed || DEFAULT_MAP_EMBED,
    aboutText:
      config.aboutText ||
      'Tudor Farm Cottages is a quiet hillside retreat where tea-garden views, warm hospitality, and slow mornings shape the experience.'
  };
}

export async function loadJson(fileName) {
  const response = await fetch(`${GITHUB_RAW_BASE}/${fileName}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}`);
  }
  return response.json();
}

export async function loadSiteData() {
  const [config, rooms, gallery] = await Promise.all([
    loadJson('config.json'),
    loadJson('rooms.json'),
    loadJson('gallery.json')
  ]);

  return {
    config: normalizeConfig(config),
    rooms: Array.isArray(rooms) ? rooms : [],
    gallery: Array.isArray(gallery) ? gallery : []
  };
}

export function buildWhatsAppLink(number, message) {
  const cleanNumber = String(number || FALLBACK_WHATSAPP_NUMBER).replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function formatPhoneDisplay(number) {
  const digits = String(number || FALLBACK_WHATSAPP_NUMBER).replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return `+${digits}`;
}

function formatDateInputValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function parseDateInputValue(value) {
  if (!value) return null;

  const parts = value.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function formatBookingDate(value) {
  const date = parseDateInputValue(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function addDays(value, count) {
  const date = parseDateInputValue(value);
  if (!date) return '';

  date.setDate(date.getDate() + count);
  return formatDateInputValue(date);
}

function initContactForm(config) {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const nameInput = form.querySelector('#contact-name');
  const phoneInput = form.querySelector('#contact-phone');
  const checkInInput = form.querySelector('#contact-check-in');
  const checkOutInput = form.querySelector('#contact-check-out');
  const messageInput = form.querySelector('#contact-message');
  const statusNote = form.querySelector('[data-contact-status]');

  const today = formatDateInputValue(new Date());
  const tomorrow = addDays(today, 1);

  if (checkInInput) {
    checkInInput.min = today;
  }

  if (checkOutInput) {
    checkOutInput.min = tomorrow;
  }

  const syncCheckoutBound = () => {
    if (!checkInInput || !checkOutInput) return;

    const checkInValue = checkInInput.value;
    const checkoutMin = checkInValue ? addDays(checkInValue, 1) : tomorrow;

    if (checkoutMin) {
      checkOutInput.min = checkoutMin;
      if (checkOutInput.value && checkOutInput.value < checkoutMin) {
        checkOutInput.value = '';
      }
    }
  };

  checkInInput?.addEventListener('change', syncCheckoutBound);
  checkOutInput?.addEventListener('change', syncCheckoutBound);
  syncCheckoutBound();

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const bookingLines = [
      'Hi, I want to book a stay at Tudor Farm Cottages.',
      nameInput?.value.trim() ? `Name: ${nameInput.value.trim()}` : null,
      phoneInput?.value.trim() ? `Phone: ${phoneInput.value.trim()}` : null,
      checkInInput?.value ? `Check-in: ${formatBookingDate(checkInInput.value) || checkInInput.value}` : null,
      checkOutInput?.value ? `Check-out: ${formatBookingDate(checkOutInput.value) || checkOutInput.value}` : null,
      messageInput?.value.trim() ? `Message: ${messageInput.value.trim()}` : null
    ].filter(Boolean);

    const whatsappUrl = buildWhatsAppLink(config.whatsappNumber, bookingLines.join('\n'));

    if (statusNote) {
      statusNote.textContent = 'Opening WhatsApp with your booking details.';
    }

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });
}

export function renderSiteChrome({ page, config }) {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  const floatingButton = document.querySelector('[data-floating-whatsapp]');
  const whatsappLink = buildWhatsAppLink(
    config.whatsappNumber,
    'Hi, I want to book a stay at Tudor Farm Cottages'
  );
  const currentYear = new Date().getFullYear();

  if (header) {
    header.classList.add('site-header');
    header.innerHTML = `
      <div class="site-nav" data-open="false">
        <div class="site-nav__bar">
          <a class="site-brand" href="/index.html" aria-label="Tudor Farm Cottages home">
            <span class="site-brand__mark">T</span>
            <span>Tudor Farm Cottages</span>
          </a>

          <nav class="site-nav__links" aria-label="Primary navigation">
            ${NAV_ITEMS.map(
              (item) => `
                <a class="site-nav__link ${item.page === page ? 'is-active' : ''}" href="${item.href}">${item.label}</a>
              `
            ).join('')}
            <a class="site-nav__link site-nav__link--book" href="${whatsappLink}" target="_blank" rel="noopener noreferrer">Book Now</a>
          </nav>

          <button class="site-nav__toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" data-nav-toggle>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M4 7h16"></path>
              <path d="M4 12h16"></path>
              <path d="M4 17h16"></path>
            </svg>
          </button>
        </div>

        <div class="site-nav__panel" data-nav-panel>
          ${NAV_ITEMS.map(
            (item) => `
              <a class="site-nav__link ${item.page === page ? 'is-active' : ''}" href="${item.href}">${item.label}</a>
            `
          ).join('')}
          <a class="site-nav__link site-nav__link--book" href="${whatsappLink}" target="_blank" rel="noopener noreferrer">Book Now</a>
        </div>
      </div>
    `;

    const navShell = header.querySelector('.site-nav');
    const toggleButton = header.querySelector('[data-nav-toggle]');
    const updateHeaderState = () => {
      if (!navShell) return;
      if (window.scrollY > 24) {
        header.classList.add('is-solid');
      } else {
        header.classList.remove('is-solid');
      }
    };

    toggleButton?.addEventListener('click', () => {
      const open = navShell?.dataset.open === 'true';
      if (navShell) navShell.dataset.open = String(!open);
      toggleButton.setAttribute('aria-expanded', String(!open));
      document.body.classList.toggle('menu-open', !open);
    });

    header.addEventListener('click', (event) => {
      const target = event.target.closest('a');
      if (!target || !navShell || navShell.dataset.open !== 'true') return;
      navShell.dataset.open = 'false';
      toggleButton?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });

    window.addEventListener('scroll', updateHeaderState, { passive: true });
    updateHeaderState();
  }

  if (footer) {
    footer.classList.add('site-footer');
    footer.innerHTML = `
      <div class="site-footer__inner">
        <div class="site-footer__top">
          <p class="site-footer__eyebrow">Plan your stay</p>
          <p class="site-footer__intro">Need a room, a map, or a quick booking answer? Use the direct links below and message us anytime.</p>
          <div class="site-footer__chips">
            <span class="site-footer__chip">Direct WhatsApp</span>
            <span class="site-footer__chip">Tea-garden views</span>
            <span class="site-footer__chip">Fast replies</span>
          </div>
        </div>

        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <a class="site-brand" href="/index.html">
              <span class="site-brand__mark">T</span>
              <span>Tudor Farm Cottages</span>
            </a>
            <p class="site-footer__tagline">${escapeHtml(config.siteSubtitle)}</p>
          </div>

          <div class="site-footer__section">
            <h4 class="site-footer__heading">Explore</h4>
            <div class="site-footer__links">
              ${NAV_ITEMS.map((item) => `<a href="${item.href}">${item.label}</a>`).join('')}
            </div>
          </div>

          <div class="site-footer__section">
            <h4 class="site-footer__heading">Connect</h4>
            <div class="site-footer__links">
              <a href="/contact.html">${escapeHtml(formatPhoneDisplay(config.whatsappNumber))}</a>
              <a href="/contact.html#map">Rohini Tea Garden, Kurseong</a>
              <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer">WhatsApp booking</a>
            </div>
          </div>
        </div>
        <div class="site-footer__divider"></div>
        <div class="site-footer__bottom">
          <p class="site-footer__note">© ${currentYear} Tudor Farm Cottages. Premium hillside stays with direct WhatsApp booking.</p>
          <a class="site-footer__back" href="#" aria-label="Back to top">Back to top</a>
        </div>
      </div>
    `;
  }

  if (floatingButton) {
    floatingButton.href = whatsappLink;
    floatingButton.target = '_blank';
    floatingButton.rel = 'noopener noreferrer';
  }

  initContactForm(config);
  initRevealAnimations();
}

export function initRevealAnimations() {
  const targets = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || targets.length === 0) {
    targets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((element) => observer.observe(element));
}

export function roomCardMarkup(room, whatsappNumber, { large = false } = {}) {
  const roomName = escapeHtml(room.name || 'Cottage');
  const description = escapeHtml(room.description || '');
  const price = escapeHtml(room.price || '');
  const capacity = escapeHtml(room.capacity || '');
  const image = escapeHtml(room.image || '');
  const bookingLink = buildWhatsAppLink(whatsappNumber, `Hi, I want to book ${room.name || 'a room'}`);

  if (large) {
    return `
      <article class="card room-card reveal">
        <img class="room-card__media" src="${image}" alt="${roomName}" loading="lazy" />
        <div class="room-card__body">
          <h3 class="room-card__title">${roomName}</h3>
          <div class="room-card__meta">
            <span class="pill">${capacity}</span>
            <span class="pill">Handpicked cottage</span>
          </div>
          <p class="room-card__copy">${description}</p>
          <p class="room-card__price">${price}</p>
          <a class="btn btn--dark" href="${bookingLink}" target="_blank" rel="noopener noreferrer">Book this room</a>
        </div>
      </article>
    `;
  }

  return `
    <article class="feature-card reveal">
      <img class="feature-card__media" src="${image}" alt="${roomName}" loading="lazy" />
      <div class="feature-card__body">
        <div class="feature-card__meta">
          <span class="feature-card__eyebrow">Handpicked stay</span>
          <span class="pill">Tea-garden calm</span>
        </div>
        <h3 class="feature-card__title">${roomName}</h3>
        <p class="feature-card__copy">${description}</p>
        <div class="room-card__meta">
          <span class="pill">${capacity}</span>
          <span class="pill">${price}</span>
        </div>
        <div class="feature-card__actions">
          <a class="btn btn--dark" href="/rooms.html">View rooms</a>
          <a class="btn btn--primary" href="${bookingLink}" target="_blank" rel="noopener noreferrer">Book now</a>
        </div>
      </div>
    </article>
  `;
}

export function renderRoomCards(container, rooms, whatsappNumber, { limit = rooms.length, large = false } = {}) {
  if (!container) return;
  container.innerHTML = rooms.slice(0, limit).map((room) => roomCardMarkup(room, whatsappNumber, { large })).join('');
}

export function galleryTileMarkup(image, { clickable = false, index = 0 } = {}) {
  const alt = escapeHtml(image.alt || 'Gallery image');
  const url = escapeHtml(image.url || '');

  if (clickable) {
    return `
      <button class="gallery-grid__item reveal" type="button" data-gallery-index="${index}" data-gallery-url="${url}" data-gallery-alt="${alt}">
        <img src="${url}" alt="${alt}" loading="lazy" />
        <span class="gallery-grid__caption">${alt}</span>
      </button>
    `;
  }

  return `
    <figure class="gallery-grid__item reveal">
      <img src="${url}" alt="${alt}" loading="lazy" />
      <figcaption class="gallery-grid__caption">${alt}</figcaption>
    </figure>
  `;
}

export function renderGalleryGrid(container, images, { limit = images.length, clickable = false } = {}) {
  if (!container) return;
  container.innerHTML = images
    .slice(0, limit)
    .map((image, index) => galleryTileMarkup(image, { clickable, index }))
    .join('');
}

export function createGalleryModal() {
  const modal = document.querySelector('[data-gallery-modal]');
  const modalImage = modal?.querySelector('[data-gallery-modal-image]');
  const modalTitle = modal?.querySelector('[data-gallery-modal-title]');
  const closeButton = modal?.querySelector('[data-gallery-modal-close]');

  function open(image) {
    if (!modal || !modalImage || !modalTitle) return;
    modalImage.src = image.url;
    modalImage.alt = image.alt;
    modalTitle.textContent = image.alt;
    modal.hidden = false;
    document.body.classList.add('menu-open');
  }

  function close() {
    if (!modal || !modalImage || !modalTitle) return;
    modal.hidden = true;
    modalImage.src = '';
    modalTitle.textContent = '';
    document.body.classList.remove('menu-open');
  }

  closeButton?.addEventListener('click', close);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  return { open, close };
}