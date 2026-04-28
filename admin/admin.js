const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/unamoble/tudors_farm_dynamic/main/data';
const ADMIN_PASSWORD = 'tudor-admin-123';

const state = {
  loggedIn: false,
  editorBound: false,
  config: {
    siteTitle: '',
    siteSubtitle: '',
    whatsappNumber: '',
    heroImage: '',
    mapEmbed: '',
    aboutText: ''
  },
  rooms: [],
  gallery: []
};

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showMessage(targetId, text, isError = false) {
  const el = byId(targetId);
  el.textContent = text;
  el.style.color = isError ? '#9f1239' : '#244d2d';
}

function showStatus(text, isError = false) {
  showMessage('app-status', text, isError);
}

function showLoginStatus(text, isError = false) {
  showMessage('login-status', text, isError);
}

async function fetchJson(fileName) {
  const response = await fetch(`${GITHUB_RAW_BASE}/${fileName}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load ${fileName}`);
  }
  return response.json();
}

function configToDom() {
  byId('site-title').value = state.config.siteTitle || '';
  byId('site-subtitle').value = state.config.siteSubtitle || '';
  byId('whatsapp').value = state.config.whatsappNumber || '';
  byId('hero-image').value = state.config.heroImage || '';
  byId('map-embed').value = state.config.mapEmbed || '';
  byId('about-text').value = state.config.aboutText || '';
}

function domToConfig() {
  return {
    siteTitle: byId('site-title').value.trim(),
    siteSubtitle: byId('site-subtitle').value.trim(),
    whatsappNumber: byId('whatsapp').value.trim(),
    heroImage: byId('hero-image').value.trim(),
    mapEmbed: byId('map-embed').value.trim(),
    aboutText: byId('about-text').value.trim()
  };
}

function roomTemplate(room, index) {
  return `
    <div class="item-card" data-room-index="${index}">
      <div class="grid two">
        <div>
          <label>Slug</label>
          <input data-field="slug" value="${escapeHtml(room.slug || '')}" placeholder="room-slug" />
        </div>
        <div>
          <label>Name</label>
          <input data-field="name" value="${escapeHtml(room.name || '')}" placeholder="Room name" />
        </div>
        <div>
          <label>Capacity</label>
          <input data-field="capacity" value="${escapeHtml(room.capacity || '')}" placeholder="2 Guests" />
        </div>
        <div>
          <label>Price</label>
          <input data-field="price" value="${escapeHtml(room.price || '')}" placeholder="From INR 4,500 / night" />
        </div>
        <div style="grid-column: 1 / -1;">
          <label>Image URL</label>
          <input data-field="image" value="${escapeHtml(room.image || '')}" placeholder="https://..." />
        </div>
        <div style="grid-column: 1 / -1;">
          <label>Description</label>
          <textarea data-field="description" placeholder="Short room description">${escapeHtml(room.description || '')}</textarea>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="small-btn warn" data-action="delete-room">Delete Room</button>
      </div>
    </div>
  `;
}

function galleryTemplate(image, index) {
  return `
    <div class="item-card" data-gallery-index="${index}">
      <div class="grid two">
        <div style="grid-column: 1 / -1;">
          <label>Image URL</label>
          <input data-field="url" value="${escapeHtml(image.url || '')}" placeholder="https://..." />
        </div>
        <div style="grid-column: 1 / -1;">
          <label>Alt Text</label>
          <input data-field="alt" value="${escapeHtml(image.alt || '')}" placeholder="Describe the image" />
        </div>
      </div>
      <div class="actions">
        <button type="button" class="small-btn warn" data-action="delete-gallery">Delete Image</button>
      </div>
    </div>
  `;
}

function renderRooms() {
  byId('rooms-list').innerHTML = state.rooms.map(roomTemplate).join('');
}

function renderGallery() {
  byId('gallery-list').innerHTML = state.gallery.map(galleryTemplate).join('');
}

function renderEditors() {
  configToDom();
  renderRooms();
  renderGallery();
}

function collectCardData(selector) {
  return Array.from(document.querySelectorAll(selector)).map((card) => {
    const payload = {};
    card.querySelectorAll('[data-field]').forEach((field) => {
      payload[field.dataset.field] = field.value.trim();
    });
    return payload;
  });
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateConfig(config) {
  const errors = [];
  if (!config.siteTitle) errors.push('Site title is required.');
  if (!config.whatsappNumber) errors.push('WhatsApp number is required.');
  if (config.heroImage && !isValidHttpUrl(config.heroImage)) errors.push('Hero image must be a valid URL.');
  if (config.mapEmbed && !isValidHttpUrl(config.mapEmbed)) errors.push('Map embed must be a valid URL.');
  return errors;
}

function validateRooms(rooms) {
  const errors = [];
  const seenSlugs = new Set();

  rooms.forEach((room, index) => {
    const number = index + 1;
    if (!room.slug) errors.push(`Room ${number}: slug is required.`);
    if (!room.name) errors.push(`Room ${number}: name is required.`);
    if (!room.capacity) errors.push(`Room ${number}: capacity is required.`);
    if (!room.price) errors.push(`Room ${number}: price is required.`);
    if (!room.image) errors.push(`Room ${number}: image URL is required.`);
    if (!room.description) errors.push(`Room ${number}: description is required.`);
    if (room.image && !isValidHttpUrl(room.image)) errors.push(`Room ${number}: image URL must be valid.`);
    if (room.slug) {
      const lower = room.slug.toLowerCase();
      if (seenSlugs.has(lower)) errors.push(`Room ${number}: slug must be unique.`);
      seenSlugs.add(lower);
    }
  });

  return errors;
}

function validateGallery(gallery) {
  const errors = [];
  gallery.forEach((image, index) => {
    const number = index + 1;
    if (!image.url) errors.push(`Gallery item ${number}: image URL is required.`);
    if (!image.alt) errors.push(`Gallery item ${number}: alt text is required.`);
    if (image.url && !isValidHttpUrl(image.url)) errors.push(`Gallery item ${number}: image URL must be valid.`);
  });
  return errors;
}

function savePayload(path, content, message) {
  return fetch('/api/save-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content, message })
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Save failed');
    }
    return data;
  });
}

function syncConfigFromDom() {
  state.config = domToConfig();
}

async function saveAll() {
  syncConfigFromDom();
  const configErrors = validateConfig(state.config);
  const roomErrors = validateRooms(collectCardData('[data-room-index]'));
  const galleryErrors = validateGallery(collectCardData('[data-gallery-index]'));
  const errors = [...configErrors, ...roomErrors, ...galleryErrors];

  if (errors.length > 0) {
    showStatus(errors[0], true);
    showLoginStatus('Fix validation errors before saving.', true);
    return;
  }

  const rooms = collectCardData('[data-room-index]');
  const gallery = collectCardData('[data-gallery-index]');

  await savePayload('data/config.json', state.config, 'Update site config');
  await savePayload('data/rooms.json', rooms, 'Update rooms data');
  await savePayload('data/gallery.json', gallery, 'Update gallery data');

  state.rooms = rooms;
  state.gallery = gallery;
  showStatus('All changes saved to GitHub.');
}

function bindEditorEvents() {
  if (state.editorBound) {
    return;
  }

  state.editorBound = true;

  byId('add-room-btn').addEventListener('click', () => {
    state.rooms.push({ slug: '', name: '', capacity: '', price: '', image: '', description: '' });
    renderRooms();
  });

  byId('add-gallery-btn').addEventListener('click', () => {
    state.gallery.push({ url: '', alt: '' });
    renderGallery();
  });

  byId('rooms-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="delete-room"]');
    if (!button) return;
    const card = button.closest('[data-room-index]');
    state.rooms.splice(Number(card.dataset.roomIndex), 1);
    renderRooms();
  });

  byId('gallery-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="delete-gallery"]');
    if (!button) return;
    const card = button.closest('[data-gallery-index]');
    state.gallery.splice(Number(card.dataset.galleryIndex), 1);
    renderGallery();
  });

  byId('save-rooms-btn').addEventListener('click', async () => {
    try {
      const rooms = collectCardData('[data-room-index]');
      const errors = validateRooms(rooms);
      if (errors.length > 0) {
        showStatus(errors[0], true);
        return;
      }
      await savePayload('data/rooms.json', rooms, 'Update rooms data');
      state.rooms = rooms;
      showStatus('Rooms saved to GitHub.');
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  byId('save-gallery-btn').addEventListener('click', async () => {
    try {
      const gallery = collectCardData('[data-gallery-index]');
      const errors = validateGallery(gallery);
      if (errors.length > 0) {
        showStatus(errors[0], true);
        return;
      }
      await savePayload('data/gallery.json', gallery, 'Update gallery data');
      state.gallery = gallery;
      showStatus('Gallery saved to GitHub.');
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  byId('save-all-btn').addEventListener('click', async () => {
    try {
      await saveAll();
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  byId('logout-btn').addEventListener('click', () => {
    state.loggedIn = false;
    byId('admin-app').classList.add('hide');
    byId('login-panel').classList.remove('hide');
    byId('admin-password').value = '';
    showLoginStatus('Logged out.');
  });
}

async function loadDashboard() {
  try {
    const [config, rooms, gallery] = await Promise.all([
      fetchJson('config.json'),
      fetchJson('rooms.json'),
      fetchJson('gallery.json')
    ]);

    state.config = {
      siteTitle: config.siteTitle || '',
      siteSubtitle: config.siteSubtitle || '',
      whatsappNumber: config.whatsappNumber || '',
      heroImage: config.heroImage || '',
      mapEmbed: config.mapEmbed || '',
      aboutText: config.aboutText || ''
    };
    state.rooms = rooms;
    state.gallery = gallery;

    renderEditors();
    showStatus('Loaded data from GitHub.');
  } catch (error) {
    renderEditors();
    showStatus(error.message, true);
  }
}

function login() {
  const password = byId('admin-password').value;
  if (password !== ADMIN_PASSWORD) {
    showLoginStatus('Invalid password.', true);
    return;
  }

  state.loggedIn = true;
  showLoginStatus('');
  byId('login-panel').classList.add('hide');
  byId('admin-app').classList.remove('hide');
  loadDashboard();
}

function init() {
  bindEditorEvents();
  byId('login-btn').addEventListener('click', login);
  byId('admin-password').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') login();
  });
}

init();
