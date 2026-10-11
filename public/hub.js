const root = document.getElementById('bakhy');
const categories = ['all', 'apps', 'games', 'tools', 'lab'];
const cards = [...root.querySelectorAll('.draft-project')];
const filters = [...root.querySelectorAll('.category-button')];
const result = root.querySelector('#category-result');
const gallery = root.querySelector('#draft-work');
const lab = root.querySelector('#draft-lab');
const dialog = document.getElementById('concept-dialog');
const title = document.getElementById('concept-title');
const description = document.getElementById('concept-description');
const concepts = {
  'Pixel Lab': 'An image toolkit for converting, resizing and compressing images in your browser.',
  'Color Riot': 'A palette workspace for exploring colors and keeping the combinations you like.',
  'Grid Run': 'A small browser arcade game with quick rounds and sharp turns.',
  'Focus Room': 'A personal workspace combining a focus timer, tasks and fewer distractions.',
};
function readCategory() {
  const value = new URL(location.href).searchParams.get('category');
  return categories.includes(value) ? value : 'all';
}
function render(category) {
  let count = 0;
  for (const card of cards) {
    const show = category === 'all' || card.dataset.kind === category;
    card.hidden = !show;
    if (show) count++;
  }
  gallery.hidden = category === 'lab';
  lab.hidden = category !== 'lab';
  for (const button of filters) {
    const active = button.dataset.filter === category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  result.textContent = category === 'lab' ? 'LAB / EXPERIMENTS' : `${category.toUpperCase()} / ${count} CONCEPT${count === 1 ? '' : 'S'}`;
}
root.querySelector('.category-nav').hidden = false;
root.querySelector('#draft-status-text').textContent = 'APPS / GAMES / TOOLS / EXPERIMENTS';
for (const button of filters) {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    const url = new URL(location.href);
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    history.pushState(null, '', url);
    render(category);
  });
}
for (const button of root.querySelectorAll('.preview-button')) {
  button.hidden = false;
  button.addEventListener('click', () => {
    const name = button.dataset.preview;
    title.textContent = name;
    description.textContent = concepts[name];
    dialog.showModal();
  });
}
document.getElementById('concept-close').addEventListener('click', () => dialog.close());
window.addEventListener('popstate', () => render(readCategory()));
render(readCategory());
