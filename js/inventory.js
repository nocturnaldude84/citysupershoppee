const inventoryEl = document.getElementById('inventory');
const searchEl = document.getElementById('search');
const expandAllEl = document.getElementById('expandAll');
const collapseAllEl = document.getElementById('collapseAll');
const categoryCountEl = document.getElementById('categoryCount');
const itemCountEl = document.getElementById('itemCount');
const emptyEl = document.getElementById('empty');

let categories = [];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function render() {
  const query = searchEl.value.trim().toLowerCase();
  let visibleCategories = 0;
  let visibleItems = 0;

  inventoryEl.querySelectorAll('.category').forEach(section => section.remove());

  // Keep the master JSON in any convenient order, but always present
  // categories alphabetically on the webpage.
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  sortedCategories.forEach(category => {
    const categoryMatch = category.name.toLowerCase().includes(query);
    const items = category.items.filter(item => {
      const text = [item.code, item.name, item.qty, item.mrp, item.brand].join(' ').toLowerCase();
      return !query || categoryMatch || text.includes(query);
    });

    if (!items.length) return;
    visibleCategories++;
    visibleItems += items.length;

    const section = document.createElement('section');
    section.className = 'category';
    section.dataset.category = category.name;
    section.innerHTML = `
      <button class="section-toggle" type="button" aria-expanded="true">
        <span class="chevron" aria-hidden="true">⌄</span>
        <span class="section-title">${escapeHtml(category.name)}</span>
        <span class="count">${items.length} ${items.length === 1 ? 'line' : 'lines'}</span>
      </button>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Item Code</th><th>Item Name</th><th>Qty</th><th>MRP</th><th>Brand</th></tr></thead>
          <tbody>
            ${items.map(item => `<tr>
              <td class="code">${escapeHtml(item.code)}</td>
              <td>${escapeHtml(item.name)}</td>
              <td class="qty">${escapeHtml(item.qty)}</td>
              <td class="mrp">${escapeHtml(item.mrp)}</td>
              <td>${escapeHtml(item.brand)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    section.querySelector('.section-toggle').addEventListener('click', () => {
      const expanded = section.querySelector('.section-toggle').getAttribute('aria-expanded') === 'true';
      setSection(section, !expanded);
    });
    inventoryEl.insertBefore(section, emptyEl);
  });

  categoryCountEl.textContent = visibleCategories;
  itemCountEl.textContent = visibleItems;
  emptyEl.style.display = visibleCategories ? 'none' : 'block';
}

function setSection(section, expanded) {
  section.classList.toggle('collapsed', !expanded);
  const button = section.querySelector('.section-toggle');
  button.setAttribute('aria-expanded', String(expanded));
  section.querySelector('.chevron').textContent = expanded ? '⌄' : '›';
}

function setAll(expanded) {
  inventoryEl.querySelectorAll('.category').forEach(section => setSection(section, expanded));
}

async function loadInventory() {
  try {
    const response = await fetch('inventory.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    categories = data.categories || [];
    render();
  } catch (error) {
    console.error('Unable to load inventory:', error);
    inventoryEl.querySelectorAll('.category').forEach(section => section.remove());
    emptyEl.textContent = 'Unable to load inventory data.';
    emptyEl.style.display = 'block';
  }
}

searchEl.addEventListener('input', render);
expandAllEl.addEventListener('click', () => setAll(true));
collapseAllEl.addEventListener('click', () => setAll(false));
loadInventory();