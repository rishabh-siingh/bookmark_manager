// Simulated bookmark storage
let bookmarks = {
    '/bookmarks': [
        { 
            type: 'folder', 
            name: 'Tech', 
            date: '01/01/2025', 
            contents: [
                { type: 'bookmark', name: 'xAI', url: 'https://xai.ai', tags: ['AI', 'Tech'], favorite: true, date: '28/02/2025' },
                { type: 'bookmark', name: 'GitHub', url: 'https://github.com', tags: ['Coding'], favorite: false, date: '28/02/2025' }
            ]
        },
        { type: 'bookmark', name: 'Google', url: 'https://google.com', tags: ['Search'], favorite: false, date: '27/02/2025' }
    ]
};

let currentPath = '/bookmarks';
let clipboard = null;
let navigationHistory = ['/bookmarks'];

// DOM elements
const folderList = document.getElementById('folder-list');
const currentPathEl = document.getElementById('current-path');
const backBtn = document.getElementById('back');
const addBtn = document.getElementById('add-button');
const modal = document.getElementById('add-modal');
const itemType = document.getElementById('item-type');
const urlInput = document.getElementById('url-input');
const nameInput = document.getElementById('name-input');
const tagsInput = document.getElementById('tags-input');
const favoriteInput = document.getElementById('favorite-input');
const saveItemBtn = document.getElementById('save-item');
const closeModalBtn = document.getElementById('close-modal');

// Render bookmarks
function renderFolderList(items = getCurrentItems()) {
    folderList.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = item.type;
        div.dataset.type = item.type;
        div.dataset.name = item.name;
        div.innerHTML = `
            <div class="${item.type}-icon">${item.type === 'folder' ? '📁' : '🔖'}</div>
            <div class="name">
                ${item.type === 'folder' ? 
                    `${item.name} (${item.contents.length} items)` : 
                    `<a href="${item.url}" target="_blank">${item.name}</a>`
                }
                ${item.favorite ? '⭐' : ''}
            </div>
            <div class="tags">${item.tags?.join(', ') || ''}</div>
            <div class="date">${item.date}</div>
            <div class="menu-btn">⋮</div>
            <div class="actions">
                <button class="open">${item.type === 'folder' ? 'Open' : 'Visit'}</button>
                <button class="rename">Rename</button>
                <button class="delete">Delete</button>
                <button class="copy">Copy</button>
                <button class="cut">Cut</button>
                ${item.type === 'bookmark' ? 
                    `<button class="favorite">${item.favorite ? 'Unfavorite' : 'Favorite'}</button>` : 
                    ''
                }
            </div>
        `;
        folderList.appendChild(div);
    });
    currentPathEl.textContent = currentPath;
    backBtn.classList.toggle('disabled', navigationHistory.length <= 1);
}

// Get current directory items
function getCurrentItems() {
    let pathSegments = currentPath.split('/').filter(p => p);
    let currentItems = bookmarks['/bookmarks'];
    
    for (let i = 1; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const folder = currentItems.find(
            item => item.type === 'folder' && item.name === segment
        );
        if (folder) currentItems = folder.contents;
        else break;
    }
    return currentItems;
}

// Navigation handlers
backBtn.addEventListener('click', () => {
    if (navigationHistory.length > 1) {
        navigationHistory.pop();
        currentPath = navigationHistory[navigationHistory.length - 1];
        renderFolderList();
    }
});

folderList.addEventListener('click', (e) => {
    const target = e.target.closest('.folder, .bookmark');
    if (!target) return;

    const itemName = target.dataset.name;
    const items = getCurrentItems();
    const item = items.find(i => i.name === itemName);

    if (e.target.closest('.actions')) return;

    if (item?.type === 'folder') {
        currentPath += `/${itemName}`;
        navigationHistory.push(currentPath);
        renderFolderList();
    }
});

// Add button functionality
addBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    urlInput.style.display = itemType.value === 'bookmark' ? 'block' : 'none';
});

// Modal handlers
itemType.addEventListener('change', () => {
    urlInput.style.display = itemType.value === 'bookmark' ? 'block' : 'none';
});

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

saveItemBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
    const isBookmark = itemType.value === 'bookmark';

    if (!name || (isBookmark && !url.startsWith('http'))) {
        alert('Please provide valid details');
        return;
    }

    const currentItems = getCurrentItems();
    if (currentItems.some(item => item.name === name)) {
        alert('Name already exists in this folder!');
        return;
    }

    const newItem = {
        type: itemType.value,
        name,
        date: new Date().toLocaleDateString('en-GB'),
        tags,
        favorite: favoriteInput.checked
    };

    if (isBookmark) {
        newItem.url = url;
    } else {
        newItem.contents = [];
    }

    currentItems.push(newItem);
    modal.style.display = 'none';
    nameInput.value = urlInput.value = tagsInput.value = '';
    favoriteInput.checked = false;
    renderFolderList();
});

// Action menu handlers
folderList.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('.menu-btn');
    if (menuBtn) {
        const actions = menuBtn.nextElementSibling;
        actions.style.display = actions.style.display === 'block' ? 'none' : 'block';
        return;
    }

    const actionBtn = e.target.closest('.actions button');
    if (!actionBtn) return;

    const itemDiv = actionBtn.closest('[data-type]');
    const itemName = itemDiv.dataset.name;
    const items = getCurrentItems();
    const item = items.find(i => i.name === itemName);

    switch(actionBtn.className) {
        case 'delete':
            items.splice(items.indexOf(item), 1);
            break;
        case 'rename':
            const newName = prompt('New name:', itemName);
            if (newName && !items.some(i => i.name === newName)) {
                item.name = newName;
            }
            break;
        case 'favorite':
            item.favorite = !item.favorite;
            break;
        case 'open':
            if (item.type === 'bookmark') window.open(item.url);
            break;
    }

    itemDiv.querySelector('.actions').style.display = 'none';
    renderFolderList();
});

// Initial render
renderFolderList();

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed:', err));
    });
}