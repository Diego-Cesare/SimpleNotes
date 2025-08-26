// ======= Util =======
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const STORAGE_KEY = 'notes.v1';
const nowFmt = () => new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
const shortFmt = ts => new Date(ts).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const openSearchBar = document.getElementById('openSearchBar')


function loadNotes() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { console.error('Erro lendo localStorage', e); return [] }
}
function saveNotes(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ======= Estado =======
let notes = [];
let editingId = null;

// ======= DOM refs =======
const wrap = $('#notes');
const empty = $('#empty');
const openButton = $('#openModal');
const overlay = $('#overlay');
const cancelBtn = $('#cancel');
const saveBtn = $('#save');
const liveStamp = $('#liveStamp');
const inputTitle = $('#title');
const inputText = $('#text');
const search = $('#q');
const exportBtn = $('#export');
const importBtn = $('#import');
const fileInput = $('#file');

// ======= Render =======
function render(list = null) {
    if (list === null) {
        notes = loadNotes();
        list = notes;
    }

    wrap.innerHTML = '';
    if (!list.length) {
        empty.style.display = 'block';
        return;
    } else {
        empty.style.display = 'none';
    }

    const tmpl = $('#cardTmpl');
    list.forEach(n => {
        const node = tmpl.content.firstElementChild.cloneNode(true);
        node.dataset.id = n.id;
        $('.ttl', node).textContent = n.title || '(Sem título)';
        $('.stamp', node).textContent = `${shortFmt(n.createdAt)}${n.updatedAt ? ` • atualizado ${shortFmt(n.updatedAt)}` : ''}`;
        $('.txt', node).textContent = n.text || '';
        wrap.appendChild(node);
    });
}

function openModal(forEdit = false, note = null) {
    overlay.style.display = 'flex';
    liveStamp.textContent = nowFmt();
    if (forEdit && note) {
        editingId = note.id;
        inputTitle.value = note.title || '';
        inputText.value = note.text || '';
    } else {
        editingId = null;
        inputTitle.value = '';
        inputText.value = '';
    }
    setTimeout(() => inputTitle.focus(), 50);
}
function closeModal() { overlay.style.display = 'none' }

// ======= Handlers =======
openButton.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal() });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.style.display === 'flex') closeModal() });

saveBtn.addEventListener('click', () => {
    const title = inputTitle.value.trim();
    const text = inputText.value.trim();
    if (!title && !text) {
        alert('Escreva um título ou texto para salvar.');
        return;
    }
    const ts = Date.now();
    if (editingId) {
        notes = notes.map(n => n.id === editingId ? { ...n, title, text, updatedAt: ts } : n);
    } else {
        notes.unshift({ id: uid(), title, text, createdAt: ts });
    }
    saveNotes(notes);
    render();
    closeModal();
});

// Delegação para editar / excluir
wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const card = e.target.closest('.card');
    const id = card?.dataset.id;
    if (!id) return;
    const note = notes.find(n => n.id === id);
    const act = btn.dataset.act;
    if (act === 'del') {
        if (confirm('Excluir esta nota?')) {
            notes = notes.filter(n => n.id !== id);
            saveNotes(notes); render();
        }
    }
    if (act === 'edit') {
        openModal(true, note);
    }
});

openSearchBar.addEventListener('click', (e) => {
    const searchbar = document.getElementById('searchBar')
    e.preventDefault()
    searchbar.classList.toggle('active')

})

// Busca
search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    const filtered = notes.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.text || '').toLowerCase().includes(q)
    );
    render(filtered);
});


// Sincroniza entre abas
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) { render(); }
});

// Atualiza relógio no cabeçalho do modal
setInterval(() => { if (overlay.style.display === 'flex') liveStamp.textContent = nowFmt() }, 1000);

// Inicializa
render();
