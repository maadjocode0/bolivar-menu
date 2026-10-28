(function () {
  'use strict';

  const BUCKET = 'menu';
  const PHOTO_SIZES = [800, 480];
  const VIEWS = ['view-loading', 'view-setup', 'view-error', 'view-login', 'view-denied', 'view-app'];
  const $ = (id) => document.getElementById(id);

  function showView(id) {
    for (const view of VIEWS) $(view).hidden = view !== id;
  }
  function showError(message) {
    $('error-text').textContent = message;
    showView('view-error');
  }

  if (typeof SUPABASE_URL !== 'string' || !SUPABASE_URL || typeof SUPABASE_KEY !== 'string' || !SUPABASE_KEY) {
    showView('view-setup');
    return;
  }
  if (typeof supabase === 'undefined' || typeof Sortable === 'undefined') {
    showError("Une bibliothèque n'a pas pu se charger (connexion internet ?). Rechargez la page.");
    return;
  }

  const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const STORAGE_PREFIX = SUPABASE_URL.replace(/\/$/, '') + '/storage/v1/object/public/' + BUCKET + '/';

  let categories = [];
  let items = [];
  let settings = null;
  let sortable = null;
  let photoTarget = null;
  let newProductPhoto = null;
  let newCategoryPhoto = null;
  let editingId = null;
  let editPhoto = { file: null, remove: false };
  let reorderingCategory = null;
  let itemSortable = null;
  let previewUrl = null;

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const key in props) {
      if (key === 'attrs') for (const name in props.attrs) node.setAttribute(name, props.attrs[name]);
      else if (key === 'dataset') Object.assign(node.dataset, props.dataset);
      else node[key] = props[key];
    }
    node.append(...children.filter((child) => child !== null && child !== undefined));
    return node;
  }

  const ICONS = {
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3"/></svg>',
  };
  function icon(name) {
    const holder = document.createElement('span');
    holder.innerHTML = ICONS[name];
    return holder.firstElementChild;
  }

  function formatPrice(amount) {
    return Number(amount).toFixed(2) + ' DT';
  }
  function plural(n, word) {
    return n + ' ' + word + (n > 1 ? 's' : '');
  }
  function smallPhoto(url) {
    return url && url.includes('-800.') ? url.replace('-800.', '-480.') : url;
  }
  function parsePrice(text) {
    const value = Number(String(text).trim().replace(',', '.'));
    if (String(text).trim() === '' || !Number.isFinite(value) || value < 0 || value >= 10000) return null;
    return Math.round(value * 100) / 100;
  }

  let toastTimer = null;
  function toast(message, isError) {
    const node = $('toast');
    node.textContent = message;
    node.classList.toggle('is-error', Boolean(isError));
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), isError ? 5000 : 2200);
  }
  function fail(error, what) {
    console.error(what, error);
    toast('Erreur : ' + what + (error && error.message ? ' (' + error.message + ')' : '') + '.', true);
  }

  async function useSession(session) {
    const user = session ? session.user : null;
    $('admin-user').hidden = !user;
    if (!user) {
      showView('view-login');
      return;
    }
    $('admin-email').textContent = user.email || '';
    showView('view-loading');
    const { data, error } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    if (error) {
      showError('Impossible de vérifier vos droits : ' + error.message);
      return;
    }
    if (!data) {
      $('denied-email').textContent = user.email || '';
      showView('view-denied');
      return;
    }
    await loadAll();
  }

  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim();
    const password = form.password.value;
    $('login-error').textContent = '';
    if (!email || !password) {
      $('login-error').textContent = 'Saisissez votre e-mail et votre mot de passe.';
      return;
    }
    button.disabled = true;
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    button.disabled = false;
    form.password.value = '';
    if (error) {
      $('login-error').textContent = 'E-mail ou mot de passe incorrect.';
      form.password.focus();
      return;
    }
    await useSession(data.session);
  });

  $('logout').addEventListener('click', async () => {
    await db.auth.signOut();
    useSession(null);
  });

  async function loadAll() {
    const [cats, rows, info] = await Promise.all([
      db.from('categories').select('*').order('position'),
      db.from('items').select('*').order('position'),
      db.from('settings').select('key, value'),
    ]);
    if (cats.error || rows.error) {
      showError('Impossible de charger la carte : ' + (cats.error || rows.error).message);
      return;
    }
    categories = cats.data;
    items = rows.data;
    if (info.error) console.warn('Settings not loaded:', info.error);
    settings = info.error ? null : Object.fromEntries(info.data.map((row) => [row.key, row.value]));
    showView('view-app');
    renderCategoryFilter();
    renderItems();
    renderCategories();
    renderInfoForm();
  }

  function itemsOf(categoryId) {
    return items.filter((item) => item.category_id === categoryId).sort((a, b) => a.position - b.position);
  }

  function groupsOf(categoryId) {
    const groups = [];
    const byKey = new Map();
    for (const item of itemsOf(categoryId)) {
      const key = (item.group_fr || '') + '|' + item.is_extra;
      if (!byKey.has(key)) {
        const group = { fr: item.group_fr, extra: item.is_extra, items: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      byKey.get(key).items.push(item);
    }
    return groups.sort((a, b) => Number(Boolean(a.fr || a.extra)) - Number(Boolean(b.fr || b.extra)));
  }

  function itemLabel(item) {
    const category = categories.find((row) => row.id === item.category_id);
    return item.name_fr + ' (' + (category ? category.name_fr : item.category_id)
      + (item.group_fr ? ' · ' + item.group_fr : '') + ')';
  }

  function renderCategoryFilter() {
    const select = $('filter-category');
    const current = select.value || 'all';
    select.replaceChildren(
      el('option', { value: 'all' }, 'Toutes les catégories'),
      ...categories.map((category) => el('option', { value: category.id }, category.name_fr)));
    select.value = [...select.options].some((option) => option.value === current) ? current : 'all';
  }

  function thumbButton(url, label, kind, id) {
    return el('button', {
      type: 'button',
      className: 'adm-thumb' + (url ? ' has-photo' : ''),
      attrs: { 'aria-label': label },
      dataset: { photoKind: kind, photoId: id },
    }, url ? el('img', { alt: '', loading: 'lazy', decoding: 'async', src: smallPhoto(url) }) : icon('camera'));
  }

  function itemThumb(item) {
    return thumbButton(item.image_url, (item.image_url ? 'Changer la photo de ' : 'Ajouter une photo à ') + itemLabel(item), 'item', item.id);
  }
  function categoryThumb(category) {
    return thumbButton(category.image_url, 'Changer la photo de la catégorie ' + category.name_fr, 'category', category.id);
  }

  function renderItemRow(item) {
    const label = itemLabel(item);
    return el('li', { className: 'adm-item' + (item.available ? '' : ' is-off'), dataset: { id: item.id } },
      itemThumb(item),
      el('p', { className: 'adm-item-name' }, item.name_fr,
        item.description_fr ? el('small', {}, item.description_fr) : null),
      el('div', { className: 'adm-item-actions' },
        el('button', {
          type: 'button',
          className: 'adm-icon-btn adm-edit',
          title: 'Nom, description et photo',
          attrs: { 'aria-label': 'Modifier ' + label },
          dataset: { editId: item.id },
        }, icon('pencil')),
        el('button', {
          type: 'button',
          className: 'adm-icon-btn adm-delete',
          attrs: { 'aria-label': 'Supprimer ' + label },
          dataset: { deleteId: item.id },
        }, icon('trash'))),
      el('div', { className: 'adm-fields' },
        el('label', { className: 'price-field' },
          el('input', {
            type: 'number', inputMode: 'decimal', min: '0', max: '9999', step: '0.01',
            value: Number(item.price).toFixed(2),
            attrs: { 'aria-label': 'Prix de ' + label + ' en dinars tunisiens' },
            dataset: { priceFor: item.id },
          }),
          'DT'),
        el('label', { className: 'switch' },
          el('input', { type: 'checkbox', checked: item.available, dataset: { availableFor: item.id } }),
          el('span', { className: 'switch-ui', attrs: { 'aria-hidden': 'true' } }),
          el('span', { className: 'switch-text' }, item.available ? 'Disponible' : 'Indisponible'))));
  }

  function renderOrderRow(item, index, total) {
    return el('li', { className: 'adm-order-row', dataset: { id: item.id } },
      el('span', { className: 'drag-handle', attrs: { 'aria-hidden': 'true', title: 'Faire glisser' } }, '⠿'),
      el('p', { className: 'adm-cat-name' }, item.name_fr, el('small', {}, formatPrice(item.price))),
      el('div', { className: 'adm-cat-move' },
        el('button', {
          type: 'button', className: 'move-btn', disabled: index === 0,
          attrs: { 'aria-label': 'Monter ' + itemLabel(item) }, dataset: { itemMove: '-1' },
        }, '↑'),
        el('button', {
          type: 'button', className: 'move-btn', disabled: index === total - 1,
          attrs: { 'aria-label': 'Descendre ' + itemLabel(item) }, dataset: { itemMove: '1' },
        }, '↓')));
  }

  function renderItems() {
    if (itemSortable) {
      itemSortable.destroy();
      itemSortable = null;
    }
    const filter = $('filter-category').value;
    const blocks = categories
      .filter((category) => filter === 'all' || category.id === filter)
      .map((category) => {
        const own = itemsOf(category.id);
        const reordering = reorderingCategory === category.id;
        const children = [
          el('div', { className: 'adm-cat-head' },
            el('h2', { className: 'adm-cat-title' }, category.name_fr, el('small', {}, plural(own.length, 'produit'))),
            own.length > 1 ? el('button', {
              type: 'button',
              className: 'text-btn adm-order-toggle',
              attrs: { 'aria-pressed': String(reordering) },
              dataset: { reorder: category.id },
            }, reordering ? 'Terminé' : "Changer l'ordre") : null),
        ];
        if (own.length === 0) children.push(el('p', { className: 'adm-empty' }, 'Aucun produit dans cette catégorie.'));
        if (reordering) {
          children.push(el('p', { className: 'admin-muted adm-order-hint' },
            "Faites glisser ⠿ ou utilisez les flèches : l'ordre est enregistré tout de suite."));
          children.push(el('ul', { className: 'adm-order', dataset: { orderFor: category.id } },
            ...own.map((item, index) => renderOrderRow(item, index, own.length))));
        } else {
          children.push(...groupsOf(category.id).map((group) => el('div', {},
            group.fr || group.extra
              ? el('h3', { className: 'adm-group-title' }, (group.fr || 'Sans section') + (group.extra ? ' · suppléments' : ''))
              : null,
            el('ul', { className: 'adm-items' }, ...group.items.map(renderItemRow)))));
        }
        return el('section', { className: 'adm-cat-block', attrs: { 'aria-label': category.name_fr } }, ...children);
      });
    $('items-list').replaceChildren(...blocks);
    const orderList = $('items-list').querySelector('.adm-order');
    if (orderList) {
      itemSortable = Sortable.create(orderList, {
        handle: '.drag-handle',
        forceFallback: true,
        fallbackTolerance: 3,
        animation: 150,
        ghostClass: 'is-ghost',
        chosenClass: 'is-chosen',
        onEnd: () => saveItemOrder(orderList.dataset.orderFor),
      });
    }
  }

  function toggleReorder(categoryId) {
    reorderingCategory = reorderingCategory === categoryId ? null : categoryId;
    renderItems();
    const again = $('items-list').querySelector('[data-reorder="' + CSS.escape(categoryId) + '"]');
    if (again) again.focus();
  }

  function moveItem(row, delta) {
    const sibling = delta < 0 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) return;
    if (delta < 0) sibling.before(row);
    else sibling.after(row);
    saveItemOrder(row.parentElement.dataset.orderFor, { id: row.dataset.id, delta });
  }

  async function saveItemOrder(categoryId, focus) {
    const list = $('items-list').querySelector('.adm-order');
    if (!list) return;
    const own = itemsOf(categoryId);
    const ids = [...list.children].map((row) => row.dataset.id);
    if (ids.join('|') === own.map((item) => item.id).join('|')) return;
    const { error } = await db.rpc('reorder_items', { ids });
    if (error) {
      fail(error, "l'ordre des produits n'a pas été enregistré");
      renderItems();
      return;
    }
    const byId = new Map(own.map((item) => [item.id, item]));
    ids.forEach((id, index) => { byId.get(id).position = index + 1; });
    renderItems();
    if (focus) {
      const row = $('items-list').querySelector('.adm-order-row[data-id="' + CSS.escape(focus.id) + '"]');
      const same = row && row.querySelector('[data-item-move="' + focus.delta + '"]');
      const other = row && row.querySelector('[data-item-move="' + -focus.delta + '"]');
      if (same || other) (same && !same.disabled ? same : other).focus();
    }
    toast('Ordre des produits enregistré');
  }

  async function savePrice(id, input) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    const price = parsePrice(input.value);
    if (price === null) {
      toast('Prix invalide : indiquez par exemple 15.50', true);
      input.value = Number(item.price).toFixed(2);
      return;
    }
    if (price === Number(item.price)) {
      input.value = price.toFixed(2);
      return;
    }
    input.disabled = true;
    const { data, error } = await db.from('items').update({ price }).eq('id', id).select('id, price');
    input.disabled = false;
    if (error || !data || !data.length) {
      fail(error, "le prix n'a pas été enregistré");
      input.value = Number(item.price).toFixed(2);
      return;
    }
    item.price = data[0].price;
    input.value = Number(item.price).toFixed(2);
    toast('Prix enregistré : ' + itemLabel(item) + ' — ' + formatPrice(item.price));
  }

  async function saveAvailable(id, checkbox) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    const available = checkbox.checked;
    checkbox.disabled = true;
    const { data, error } = await db.from('items').update({ available }).eq('id', id).select('id, available');
    checkbox.disabled = false;
    checkbox.focus();
    if (error || !data || !data.length) {
      fail(error, "la disponibilité n'a pas été enregistrée");
      checkbox.checked = item.available;
      return;
    }
    item.available = available;
    const row = checkbox.closest('.adm-item');
    row.classList.toggle('is-off', !available);
    row.querySelector('.switch-text').textContent = available ? 'Disponible' : 'Indisponible';
    toast(itemLabel(item) + (available ? ' est disponible' : ' est indisponible'));
  }

  async function deleteItem(id) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    if (!confirm('Supprimer « ' + itemLabel(item) + ' » de la carte ?\nCette action est définitive.')) return;
    const { data, error } = await db.from('items').delete().eq('id', id).select('id');
    if (error || !data || !data.length) {
      fail(error, "le produit n'a pas été supprimé");
      return;
    }
    items = items.filter((row) => row.id !== id);
    await removeStoredPhoto(item.image_url);
    renderItems();
    renderCategories();
    toast('« ' + itemLabel(item) + ' » a été supprimé');
  }

  $('filter-category').addEventListener('change', () => {
    reorderingCategory = null;
    renderItems();
  });

  $('items-list').addEventListener('change', (event) => {
    const target = event.target;
    if (target.dataset.priceFor) savePrice(target.dataset.priceFor, target);
    else if (target.dataset.availableFor) saveAvailable(target.dataset.availableFor, target);
  });
  $('items-list').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.dataset.priceFor) event.target.blur();
  });

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("ce fichier n'est pas une image lisible")); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  async function preparePhotos(file) {
    if (!file.type.startsWith('image/')) throw new Error('choisissez une image (JPEG, PNG, WebP…)');
    const img = await loadImage(file);
    const copies = [];
    for (const width of PHOTO_SIZES) {
      const scale = Math.min(1, width / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let blob = await canvasToBlob(canvas, 'image/webp', 0.8);
      if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', 0.82);
      if (!blob) throw new Error("la photo n'a pas pu être préparée");
      copies.push({ width, blob, ext: blob.type === 'image/webp' ? 'webp' : 'jpg' });
    }
    return copies;
  }

  async function uploadPhotos(folder, id, file) {
    const copies = await preparePhotos(file);
    const base = folder + '/' + id + '-' + Date.now();
    const uploaded = [];
    try {
      for (const copy of copies) {
        const path = base + '-' + copy.width + '.' + copy.ext;
        const { error } = await db.storage.from(BUCKET).upload(path, copy.blob, {
          contentType: copy.blob.type,
          cacheControl: '31536000',
          upsert: false,
        });
        if (error) throw error;
        uploaded.push(path);
      }
    } catch (error) {
      if (uploaded.length) await db.storage.from(BUCKET).remove(uploaded);
      throw error;
    }
    return db.storage.from(BUCKET).getPublicUrl(base + '-800.' + copies[0].ext).data.publicUrl;
  }

  async function removeStoredPhoto(url) {
    if (!url || !url.startsWith(STORAGE_PREFIX)) return;
    const path = decodeURIComponent(url.slice(STORAGE_PREFIX.length));
    const { error } = await db.storage.from(BUCKET).remove([path, path.replace('-800.', '-480.')]);
    if (error) console.warn('Old photo not deleted:', error);
  }

  function choosePhoto(target) {
    photoTarget = target;
    const input = $('photo-input');
    input.value = '';
    input.click();
  }

  $('photo-input').addEventListener('change', () => {
    const file = $('photo-input').files[0];
    const target = photoTarget;
    photoTarget = null;
    if (!file || !target) return;
    if (target.kind === 'new') setNewProductPhoto(file);
    else if (target.kind === 'newCategory') setNewCategoryPhoto(file);
    else if (target.kind === 'edit') setEditPhoto({ file, remove: false });
    else if (target.kind === 'editCategory') setCategoryEditPhoto(file);
    else replacePhoto(target, file);
  });

  async function replacePhoto(target, file) {
    const isItem = target.kind === 'item';
    const rows = isItem ? items : categories;
    const row = rows.find((r) => r.id === target.id);
    if (!row) return;
    target.button.classList.add('is-busy');
    toast('Envoi de la photo…');
    let url;
    try {
      url = await uploadPhotos(isItem ? 'items' : 'categories', row.id, file);
    } catch (error) {
      target.button.classList.remove('is-busy');
      fail(error, "la photo n'a pas été envoyée");
      return;
    }
    const { data, error } = await db.from(isItem ? 'items' : 'categories')
      .update({ image_url: url }).eq('id', row.id).select('id, image_url');
    if (error || !data || !data.length) {
      await removeStoredPhoto(url);
      target.button.classList.remove('is-busy');
      fail(error, "la photo n'a pas été enregistrée");
      return;
    }
    const oldUrl = row.image_url;
    row.image_url = url;
    refreshThumbs(target.kind, row);
    toast('Photo mise à jour : ' + (isItem ? itemLabel(row) : row.name_fr));
    await removeStoredPhoto(oldUrl);
  }

  function refreshThumbs(kind, row) {
    const selector = '.adm-thumb[data-photo-kind="' + kind + '"][data-photo-id="' + CSS.escape(row.id) + '"]';
    for (const old of document.querySelectorAll(selector)) {
      const hadFocus = old === document.activeElement;
      const fresh = kind === 'item' ? itemThumb(row) : categoryThumb(row);
      old.replaceWith(fresh);
      if (hadFocus) fresh.focus();
    }
  }

  function renderCategories() {
    const list = $('categories-list');
    list.replaceChildren(...categories.map((category, index) => {
      const count = itemsOf(category.id).length;
      return el('li', { className: 'adm-cat', dataset: { id: category.id } },
        el('span', { className: 'drag-handle', attrs: { 'aria-hidden': 'true', title: 'Faire glisser' } }, '⠿'),
        categoryThumb(category),
        el('p', { className: 'adm-cat-name' }, category.name_fr,
          el('small', {}, plural(count, 'produit') + (count ? '' : ' · pas encore sur la carte'))),
        el('div', { className: 'adm-cat-actions' },
          el('button', {
            type: 'button',
            className: 'adm-icon-btn adm-edit',
            title: 'Nom et photo',
            attrs: { 'aria-label': 'Modifier la catégorie ' + category.name_fr },
            dataset: { editCategory: category.id },
          }, icon('pencil')),
          el('button', {
            type: 'button',
            className: 'adm-icon-btn adm-delete',
            attrs: { 'aria-label': 'Supprimer la catégorie ' + category.name_fr },
            dataset: { deleteCategory: category.id },
          }, icon('trash'))),
        el('div', { className: 'adm-cat-move' },
          el('button', {
            type: 'button', className: 'move-btn', disabled: index === 0,
            attrs: { 'aria-label': 'Monter ' + category.name_fr }, dataset: { move: '-1' },
          }, '↑'),
          el('button', {
            type: 'button', className: 'move-btn', disabled: index === categories.length - 1,
            attrs: { 'aria-label': 'Descendre ' + category.name_fr }, dataset: { move: '1' },
          }, '↓')));
    }));
    if (!sortable) {
      sortable = Sortable.create(list, {
        handle: '.drag-handle',
        forceFallback: true,
        fallbackTolerance: 3,
        animation: 150,
        ghostClass: 'is-ghost',
        chosenClass: 'is-chosen',
        onEnd: () => saveCategoryOrder(),
      });
    }
  }

  function moveCategory(row, delta) {
    const sibling = delta < 0 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) return;
    if (delta < 0) sibling.before(row);
    else sibling.after(row);
    saveCategoryOrder({ id: row.dataset.id, delta });
  }

  async function saveCategoryOrder(focus) {
    const ids = [...$('categories-list').children].map((row) => row.dataset.id);
    if (ids.join('|') === categories.map((category) => category.id).join('|')) return;
    const { error } = await db.rpc('reorder_categories', { ids });
    if (error) {
      fail(error, "l'ordre n'a pas été enregistré");
      renderCategories();
      return;
    }
    const byId = new Map(categories.map((category) => [category.id, category]));
    categories = ids.map((id, index) => Object.assign(byId.get(id), { position: index + 1 }));
    renderCategories();
    renderCategoryFilter();
    renderItems();
    if (focus) {
      const row = $('categories-list').querySelector('[data-id="' + CSS.escape(focus.id) + '"]');
      const same = row && row.querySelector('[data-move="' + focus.delta + '"]');
      const other = row && row.querySelector('[data-move="' + -focus.delta + '"]');
      (same && !same.disabled ? same : other).focus();
    }
    toast('Ordre des catégories enregistré');
  }

  document.addEventListener('click', (event) => {
    const thumb = event.target.closest('.adm-thumb');
    if (thumb) {
      choosePhoto({ kind: thumb.dataset.photoKind, id: thumb.dataset.photoId, button: thumb });
      return;
    }
    const edit = event.target.closest('[data-edit-id]');
    if (edit) {
      openEditDialog(edit.dataset.editId);
      return;
    }
    const remove = event.target.closest('[data-delete-id]');
    if (remove) {
      deleteItem(remove.dataset.deleteId);
      return;
    }
    const reorder = event.target.closest('[data-reorder]');
    if (reorder) {
      toggleReorder(reorder.dataset.reorder);
      return;
    }
    const itemMove = event.target.closest('[data-item-move]');
    if (itemMove) {
      moveItem(itemMove.closest('.adm-order-row'), Number(itemMove.dataset.itemMove));
      return;
    }
    const editCategory = event.target.closest('[data-edit-category]');
    if (editCategory) {
      openCategoryEditDialog(editCategory.dataset.editCategory);
      return;
    }
    const removeCategory = event.target.closest('[data-delete-category]');
    if (removeCategory) {
      deleteCategory(removeCategory.dataset.deleteCategory);
      return;
    }
    const move = event.target.closest('[data-move]');
    if (move) moveCategory(move.closest('.adm-cat'), Number(move.dataset.move));
  });

  const TABS = [['tab-btn-items', 'tab-items'], ['tab-btn-categories', 'tab-categories'], ['tab-btn-info', 'tab-info']];
  function selectTab(buttonId) {
    for (const [button, panel] of TABS) {
      const on = button === buttonId;
      $(button).setAttribute('aria-selected', String(on));
      $(button).tabIndex = on ? 0 : -1;
      $(panel).hidden = !on;
    }
  }
  for (const [button] of TABS) {
    $(button).addEventListener('click', () => selectTab(button));
    $(button).addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const index = TABS.findIndex(([id]) => id === button);
      const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0];
      selectTab(next);
      $(next).focus();
    });
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  function closeDialog(dialog) {
    if (dialog.dataset.busy) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }
  function setBusy(dialog, busy) {
    if (busy) dialog.dataset.busy = 'true';
    else delete dialog.dataset.busy;
  }
  function sheetError(dialog, node, message) {
    node.textContent = message;
    if (!dialog.open) toast(message, true);
  }
  for (const dialog of document.querySelectorAll('.admin-dialog')) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener('cancel', (event) => {
      if (dialog.dataset.busy) event.preventDefault();
    });
  }

  const EN_ONLY_DESCRIPTION = "Écrivez aussi la description en français : sans elle, la description anglaise n'est pas affichée.";
  for (const button of document.querySelectorAll('[data-close-dialog]')) {
    button.addEventListener('click', () => closeDialog(button.closest('dialog')));
  }

  function showPhotoPreview(prefix, photo) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = photo instanceof Blob ? URL.createObjectURL(photo) : null;
    const src = previewUrl || photo || null;
    const preview = $(prefix + '-photo-preview');
    preview.hidden = !src;
    if (src) preview.src = src;
    else preview.removeAttribute('src');
    const clear = $(prefix + '-photo-clear');
    if (clear) clear.hidden = !src;
    $(prefix + '-photo-btn').textContent = src ? 'Changer la photo' : 'Choisir une photo';
  }

  const productDialog = $('product-dialog');
  const form = $('product-form');

  function setNewProductPhoto(file) {
    newProductPhoto = file;
    showPhotoPreview('product', file);
  }

  function openProductDialog() {
    form.reset();
    setNewProductPhoto(null);
    $('product-error').textContent = '';
    form.category.replaceChildren(...categories.map((category) => el('option', { value: category.id }, category.name_fr)));
    const filter = $('filter-category').value;
    if (filter !== 'all') form.category.value = filter;
    openDialog(productDialog);
    form.category.focus();
  }

  $('add-product').addEventListener('click', openProductDialog);
  $('product-photo-btn').addEventListener('click', () => choosePhoto({ kind: 'new' }));
  $('product-photo-clear').addEventListener('click', () => {
    setNewProductPhoto(null);
    $('product-photo-btn').focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const showFormError = (message, field) => {
      $('product-error').textContent = message;
      if (field) field.focus();
    };

    const categoryId = form.category.value;
    const nameFr = form.nameFr.value.trim();
    const descFr = form.descFr.value.trim();
    const descEn = form.descEn.value.trim();
    const price = parsePrice(form.price.value);
    if (!categoryId) return showFormError('Choisissez une catégorie.', form.category);
    if (!nameFr) return showFormError('Le nom est obligatoire.', form.nameFr);
    if (descEn && !descFr) return showFormError(EN_ONLY_DESCRIPTION, form.descFr);
    if (price === null) return showFormError('Indiquez un prix valide, par exemple 15.50.', form.price);
    showFormError('');

    const saveButton = $('product-save');
    saveButton.disabled = true;
    saveButton.textContent = 'Enregistrement…';
    setBusy(productDialog, true);
    const id = crypto.randomUUID();
    let imageUrl = null;
    try {
      if (newProductPhoto) imageUrl = await uploadPhotos('items', id, newProductPhoto);
      const position = Math.max(0, ...itemsOf(categoryId).map((item) => item.position)) + 1;
      const { data, error } = await db.from('items').insert({
        id,
        category_id: categoryId,
        name_fr: nameFr,
        name_en: form.nameEn.value.trim() || null,
        description_fr: descFr || null,
        description_en: descEn || null,
        price,
        image_url: imageUrl,
        available: form.available.checked,
        featured: false,
        position,
      }).select().single();
      if (error) throw error;
      items.push(data);
      setBusy(productDialog, false);
      closeDialog(productDialog);
      $('filter-category').value = categoryId;
      renderItems();
      renderCategories();
      toast('« ' + itemLabel(data) + ' » a été ajouté à la carte');
    } catch (error) {
      console.error(error);
      if (imageUrl) await removeStoredPhoto(imageUrl);
      sheetError(productDialog, $('product-error'), "Le produit n'a pas été ajouté : " + (error.message || 'erreur inconnue') + '.');
    } finally {
      setBusy(productDialog, false);
      saveButton.disabled = false;
      saveButton.textContent = 'Ajouter';
    }
  });

  const categoryDialog = $('category-dialog');
  const categoryForm = $('category-form');

  function categoryIdFor(name) {
    const base = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/^-+|-+$/g, '') || 'categorie';
    let id = base;
    for (let n = 2; categories.some((category) => category.id === id); n += 1) id = base + '-' + n;
    return id;
  }

  function setNewCategoryPhoto(file) {
    newCategoryPhoto = file;
    showPhotoPreview('category', file);
  }

  function openCategoryDialog() {
    categoryForm.reset();
    setNewCategoryPhoto(null);
    $('category-error').textContent = '';
    openDialog(categoryDialog);
    categoryForm.nameFr.focus();
  }

  $('add-category').addEventListener('click', openCategoryDialog);
  $('category-photo-btn').addEventListener('click', () => choosePhoto({ kind: 'newCategory' }));
  $('category-photo-clear').addEventListener('click', () => {
    setNewCategoryPhoto(null);
    $('category-photo-btn').focus();
  });

  categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const showFormError = (message, field) => {
      $('category-error').textContent = message;
      if (field) field.focus();
    };

    const nameFr = categoryForm.nameFr.value.trim();
    const nameEn = categoryForm.nameEn.value.trim() || null;
    if (!nameFr) return showFormError('Le nom est obligatoire.', categoryForm.nameFr);
    if (categories.some((category) => category.name_fr.toLowerCase() === nameFr.toLowerCase())) {
      return showFormError('Une catégorie porte déjà ce nom.', categoryForm.nameFr);
    }
    if (!newCategoryPhoto) {
      return showFormError('Choisissez une photo pour la catégorie.', $('category-photo-btn'));
    }
    showFormError('');

    const saveButton = $('category-save');
    saveButton.disabled = true;
    saveButton.textContent = 'Enregistrement…';
    setBusy(categoryDialog, true);
    const id = categoryIdFor(nameFr);
    let imageUrl = null;
    try {
      imageUrl = await uploadPhotos('categories', id, newCategoryPhoto);
      const position = Math.max(0, ...categories.map((category) => category.position)) + 1;
      const { data, error } = await db.from('categories')
        .insert({ id, name_fr: nameFr, name_en: nameEn, image_url: imageUrl, position })
        .select().single();
      if (error) throw error;
      categories.push(data);
      setBusy(categoryDialog, false);
      closeDialog(categoryDialog);
      renderCategories();
      renderCategoryFilter();
      renderItems();
      toast('Catégorie « ' + data.name_fr + ' » ajoutée : ajoutez-y des produits');
    } catch (error) {
      console.error(error);
      if (imageUrl) await removeStoredPhoto(imageUrl);
      sheetError(categoryDialog, $('category-error'), "La catégorie n'a pas été ajoutée : " + (error.message || 'erreur inconnue') + '.');
    } finally {
      setBusy(categoryDialog, false);
      saveButton.disabled = false;
      saveButton.textContent = 'Ajouter';
    }
  });

  const categoryEditDialog = $('category-edit-dialog');
  const categoryEditForm = $('category-edit-form');
  let editingCategoryId = null;
  let categoryEditPhoto = null;

  function setCategoryEditPhoto(file) {
    categoryEditPhoto = file;
    const category = categories.find((row) => row.id === editingCategoryId);
    showPhotoPreview('category-edit', file || (category ? smallPhoto(category.image_url) : null));
  }

  function openCategoryEditDialog(id) {
    const category = categories.find((row) => row.id === id);
    if (!category) return;
    editingCategoryId = id;
    $('category-edit-current').textContent = category.name_fr + ' · ' + plural(itemsOf(id).length, 'produit');
    categoryEditForm.nameFr.value = category.name_fr;
    categoryEditForm.nameEn.value = category.name_en || '';
    $('category-edit-error').textContent = '';
    setCategoryEditPhoto(null);
    openDialog(categoryEditDialog);
  }

  $('category-edit-photo-btn').addEventListener('click', () => choosePhoto({ kind: 'editCategory' }));

  categoryEditForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const category = categories.find((row) => row.id === editingCategoryId);
    if (!category) return closeDialog(categoryEditDialog);

    const nameFr = categoryEditForm.nameFr.value.trim();
    const nameEn = categoryEditForm.nameEn.value.trim() || null;
    const refuse = (message, field) => {
      $('category-edit-error').textContent = message;
      field.focus();
    };
    if (!nameFr) return refuse('Le nom est obligatoire.', categoryEditForm.nameFr);
    if (categories.some((row) => row.id !== category.id && row.name_fr.toLowerCase() === nameFr.toLowerCase())) {
      return refuse('Une catégorie porte déjà ce nom.', categoryEditForm.nameFr);
    }
    const changes = {};
    if (nameFr !== category.name_fr) changes.name_fr = nameFr;
    if (nameEn !== (category.name_en || null)) changes.name_en = nameEn;
    if (!categoryEditPhoto && !Object.keys(changes).length) {
      closeDialog(categoryEditDialog);
      toast('Aucune modification');
      return;
    }

    const saveButton = $('category-edit-save');
    saveButton.disabled = true;
    saveButton.textContent = 'Enregistrement…';
    $('category-edit-error').textContent = '';
    setBusy(categoryEditDialog, true);
    let saved = null;
    let newUrl = null;
    try {
      if (categoryEditPhoto) newUrl = changes.image_url = await uploadPhotos('categories', category.id, categoryEditPhoto);
      const { data, error } = await db.from('categories').update(changes).eq('id', category.id)
        .select('id, name_fr, name_en, image_url');
      if (error) throw error;
      if (!data || !data.length) throw new Error('accès refusé');
      saved = data[0];
    } catch (error) {
      console.error(error);
      if (newUrl) await removeStoredPhoto(newUrl);
      sheetError(categoryEditDialog, $('category-edit-error'), "La catégorie n'a pas été modifiée : " + (error.message || 'erreur inconnue') + '.');
      return;
    } finally {
      setBusy(categoryEditDialog, false);
      saveButton.disabled = false;
      saveButton.textContent = 'Enregistrer';
    }

    const oldUrl = category.image_url;
    Object.assign(category, saved);
    closeDialog(categoryEditDialog);
    renderCategories();
    renderCategoryFilter();
    renderItems();
    const again = $('categories-list').querySelector('[data-edit-category="' + CSS.escape(category.id) + '"]');
    if (again) again.focus();
    const what = newUrl && Object.keys(changes).length > 1 ? 'Modifications enregistrées'
      : newUrl ? 'Photo mise à jour' : 'Nom enregistré';
    toast(what + ' : ' + category.name_fr);
    if (newUrl) await removeStoredPhoto(oldUrl);
  });

  async function deleteCategory(id) {
    const category = categories.find((row) => row.id === id);
    if (!category) return;
    const own = itemsOf(id);
    const question = own.length
      ? 'Supprimer la catégorie « ' + category.name_fr + ' » et ' + (own.length > 1 ? 'ses ' : 'son ') + plural(own.length, 'produit') + ' ?'
      : 'Supprimer la catégorie « ' + category.name_fr + ' » ?';
    if (!confirm(question + '\nCette action est définitive.')) return;

    if (own.length) {
      const { data, error } = await db.from('items').delete().eq('category_id', id).select('id, image_url');
      const gone = new Set((data || []).map((row) => row.id));
      items = items.filter((row) => !gone.has(row.id));
      for (const row of data || []) await removeStoredPhoto(row.image_url);
      if (error || gone.size !== own.length) {
        fail(error, "les produits de la catégorie n'ont pas tous été supprimés");
        renderItems();
        renderCategories();
        return;
      }
    }
    const { data, error } = await db.from('categories').delete().eq('id', id).select('id');
    if (error || !data || !data.length) {
      fail(error, "la catégorie n'a pas été supprimée");
      renderItems();
      renderCategories();
      return;
    }
    categories = categories.filter((row) => row.id !== id);
    await removeStoredPhoto(category.image_url);
    renderCategories();
    renderCategoryFilter();
    renderItems();
    $('add-category').focus();
    toast('Catégorie « ' + category.name_fr + ' » supprimée' + (own.length ? ' avec ' + plural(own.length, 'produit') : ''));
  }

  const INFO_KEYS = ['hours_week_open', 'hours_week_close', 'hours_weekend_open', 'hours_weekend_close',
    'wifi_name', 'wifi_password', 'address', 'maps_url', 'phone'];
  const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
  const MAPS_LINK = /^https:\/\/((www\.)?google\.[a-z.]{2,8}\/maps|maps\.google\.[a-z.]{2,8}|maps\.app\.goo\.gl|goo\.gl\/maps)\//i;
  const PHONE = /^\+?[0-9][0-9 .-]{5,18}$/;
  const infoForm = $('info-form');

  function renderInfoForm() {
    $('info-missing').hidden = Boolean(settings);
    infoForm.hidden = !settings;
    if (!settings) return;
    for (const key of INFO_KEYS) infoForm.elements[key].value = settings[key] || '';
    $('info-error').textContent = '';
  }

  infoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = {};
    for (const key of INFO_KEYS) values[key] = infoForm.elements[key].value.trim();
    const refuse = (message, key) => {
      $('info-error').textContent = message;
      infoForm.elements[key].focus();
    };
    for (const days of ['week', 'weekend']) {
      const open = 'hours_' + days + '_open';
      const close = 'hours_' + days + '_close';
      if (Boolean(values[open]) !== Boolean(values[close])) {
        return refuse("Indiquez l'heure d'ouverture et celle de fermeture, ou laissez les deux vides.", values[open] ? close : open);
      }
      if (values[open] && !TIME.test(values[open])) return refuse('Heure invalide : écrivez-la par exemple 07:00.', open);
      if (values[close] && !TIME.test(values[close])) return refuse('Heure invalide : écrivez-la par exemple 23:00.', close);
    }
    if (values.wifi_password && !values.wifi_name) return refuse('Indiquez aussi le nom du réseau Wi-Fi.', 'wifi_name');
    if (values.maps_url && !MAPS_LINK.test(values.maps_url)) {
      return refuse('Collez le lien de partage Google Maps (il commence par https://maps.app.goo.gl/ ou https://www.google.com/maps/).', 'maps_url');
    }
    if (values.phone && !PHONE.test(values.phone)) return refuse('Numéro invalide : écrivez-le par exemple +216 12 345 678.', 'phone');
    $('info-error').textContent = '';

    const changed = INFO_KEYS.filter((key) => values[key] !== (settings[key] || ''));
    if (!changed.length) {
      toast('Aucune modification');
      return;
    }
    const saveButton = $('info-save');
    saveButton.disabled = true;
    saveButton.textContent = 'Enregistrement…';
    const now = new Date().toISOString();
    const { data, error } = await db.from('settings')
      .upsert(changed.map((key) => ({ key, value: values[key], updated_at: now })), { onConflict: 'key' })
      .select('key, value');
    saveButton.disabled = false;
    saveButton.textContent = 'Enregistrer';
    if (error || !data || data.length !== changed.length) {
      fail(error, "les informations n'ont pas été enregistrées");
      return;
    }
    for (const row of data) settings[row.key] = row.value;
    toast('Informations enregistrées : le site les affiche au prochain chargement');
  });

  const editDialog = $('edit-dialog');
  const editForm = $('edit-form');

  function setEditPhoto(change) {
    editPhoto = change;
    const item = items.find((row) => row.id === editingId);
    const saved = item && !change.remove ? smallPhoto(item.image_url) : null;
    showPhotoPreview('edit', change.file || saved);
    $('edit-photo-note').hidden = !(change.remove && item && item.image_url);
  }

  function openEditDialog(id) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    editingId = id;
    const category = categories.find((row) => row.id === item.category_id);
    $('edit-product').textContent = item.name_fr + (category ? ' · ' + category.name_fr : '');
    editForm.category.replaceChildren(...categories.map((row) => el('option', { value: row.id }, row.name_fr)));
    editForm.category.value = item.category_id;
    editForm.nameFr.value = item.name_fr;
    editForm.nameEn.value = item.name_en || '';
    editForm.descFr.value = item.description_fr || '';
    editForm.descEn.value = item.description_en || '';
    $('edit-error').textContent = '';
    setEditPhoto({ file: null, remove: false });
    openDialog(editDialog);
  }

  $('edit-photo-btn').addEventListener('click', () => choosePhoto({ kind: 'edit' }));
  $('edit-photo-clear').addEventListener('click', () => {
    setEditPhoto({ file: null, remove: true });
    $('edit-photo-btn').focus();
  });

  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const item = items.find((row) => row.id === editingId);
    if (!item) return closeDialog(editDialog);

    const changes = {};
    const nameFr = editForm.nameFr.value.trim();
    const nameEn = editForm.nameEn.value.trim() || null;
    const descFr = editForm.descFr.value.trim() || null;
    const descEn = editForm.descEn.value.trim() || null;
    const refuse = (message, field) => {
      $('edit-error').textContent = message;
      field.focus();
    };
    if (!nameFr) return refuse('Le nom est obligatoire.', editForm.nameFr);
    if (descEn && !descFr) return refuse(EN_ONLY_DESCRIPTION, editForm.descFr);
    if (nameFr !== item.name_fr) changes.name_fr = nameFr;
    if (nameEn !== (item.name_en || null)) changes.name_en = nameEn;
    if (descFr !== (item.description_fr || null)) changes.description_fr = descFr;
    if (descEn !== (item.description_en || null)) changes.description_en = descEn;
    if (editPhoto.remove && item.image_url) changes.image_url = null;
    const categoryId = editForm.category.value;
    if (categoryId && categoryId !== item.category_id) {
      changes.category_id = categoryId;
      changes.position = Math.max(0, ...itemsOf(categoryId).map((row) => row.position)) + 1;
    }
    if (!editPhoto.file && !Object.keys(changes).length) {
      closeDialog(editDialog);
      toast('Aucune modification');
      return;
    }

    const saveButton = $('edit-save');
    saveButton.disabled = true;
    saveButton.textContent = 'Enregistrement…';
    $('edit-error').textContent = '';
    setBusy(editDialog, true);
    let saved = null;
    let newUrl = null;
    try {
      if (editPhoto.file) newUrl = changes.image_url = await uploadPhotos('items', item.id, editPhoto.file);
      const { data, error } = await db.from('items').update(changes).eq('id', item.id)
        .select('id, category_id, position, name_fr, name_en, description_fr, description_en, image_url');
      if (error) throw error;
      if (!data || !data.length) throw new Error('accès refusé');
      saved = data[0];
    } catch (error) {
      console.error(error);
      if (newUrl) await removeStoredPhoto(newUrl);
      sheetError(editDialog, $('edit-error'), "Les modifications n'ont pas été enregistrées : " + (error.message || 'erreur inconnue') + '.');
      return;
    } finally {
      setBusy(editDialog, false);
      saveButton.disabled = false;
      saveButton.textContent = 'Enregistrer';
    }

    const oldUrl = item.image_url;
    Object.assign(item, saved);
    closeDialog(editDialog);
    if ('category_id' in changes) {
      if ($('filter-category').value !== 'all') $('filter-category').value = item.category_id;
      renderCategories();
    }
    renderItems();
    const again = $('items-list').querySelector('[data-edit-id="' + CSS.escape(item.id) + '"]');
    if (again) again.focus();
    const kinds = new Set(Object.keys(changes).filter((field) => field !== 'position').map((field) => field.split('_')[0]));
    const what = kinds.size > 1 ? 'Modifications enregistrées'
      : kinds.has('category') ? 'Produit déplacé'
        : kinds.has('name') ? 'Nom enregistré'
          : kinds.has('description') ? 'Description enregistrée'
            : changes.image_url ? 'Photo mise à jour' : 'Photo retirée';
    toast(what + ' : ' + itemLabel(item));
    if ('image_url' in changes) await removeStoredPhoto(oldUrl);
  });

  db.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') useSession(null);
  });

  db.auth.getSession().then(({ data, error }) => {
    if (error) console.warn(error);
    return useSession(data ? data.session : null);
  }).catch((error) => showError('La page n\'a pas pu se charger : ' + error.message));
})();
