const suffixes = {
    Qtd: new Decimal('1e153'),
    NoQg: new Decimal('1e150'),
    OcQg: new Decimal('1e147'),
    SpQg: new Decimal('1e144'),
    SxQg: new Decimal('1e141'),
    QiQg: new Decimal('1e138'),
    QaQg: new Decimal('1e135'),
    TQg: new Decimal('1e132'),
    DQg: new Decimal('1e129'),
    UQg: new Decimal('1e126'),
    Qg: new Decimal('1e123'),
    NoTg: new Decimal('1e120'),
    OcTg: new Decimal('1e117'),
    SpTg: new Decimal('1e114'),
    SxTg: new Decimal('1e111'),
    QiTg: new Decimal('1e108'),
    QaTg: new Decimal('1e105'),
    TTg: new Decimal('1e102'),
    DTg: new Decimal('1e99'),
    UTg: new Decimal('1e96'),
    Tg: new Decimal('1e93'),
    NoVg: new Decimal('1e90'),
    OcVg: new Decimal('1e87'),
    SpVg: new Decimal('1e84'),
    SxVg: new Decimal('1e81'),
    QiVg: new Decimal('1e78'),
    QaVg: new Decimal('1e75'),
    TVg: new Decimal('1e72'),
    DVg: new Decimal('1e69'),
    UVg: new Decimal('1e66'),
    Vg: new Decimal('1e63'),
    NoDc: new Decimal('1e60'),
    OcDc: new Decimal('1e57'),
    SpDc: new Decimal('1e54'),
    SxDc: new Decimal('1e51'),
    QtDc: new Decimal('1e48'),
    QaDc: new Decimal('1e45'),
    TDC: new Decimal('1e42'),
    DuDc: new Decimal('1e39'),
    UDc: new Decimal('1e36'),
    Dc: new Decimal('1e33'),
    No: new Decimal('1e30'),
    Oc: new Decimal('1e27'),
    Sp: new Decimal('1e24'),
    Sx: new Decimal('1e21'),
    Qt: new Decimal('1e18'),
    Qd: new Decimal('1e15'),
    T: new Decimal('1e12'),
    B: new Decimal('1e9'),
    M: new Decimal('1e6'),
    k: new Decimal('1e3'),
    '': new Decimal(1),
};

// Precomputed once instead of Object.keys().filter() on every formatNumber call.
// Object key order is already largest -> smallest, so no sort needed, just drop ''.
const SUFFIX_ENTRIES = Object.entries(suffixes).filter(([key]) => key !== '');

// Case-insensitive suffix lookup built once, instead of scanning Object.keys()
// every time a user types a lowercase/mixed-case suffix.
const SUFFIX_LOOKUP_LOWER = Object.keys(suffixes).reduce((map, key) => {
    if (key !== '') map[key.toLowerCase()] = key;
    return map;
}, {});

function formatNumber(num) {
    const decimal = new Decimal(num);

    if (decimal.lessThan(1000)) {
        return decimal.toFixed(2).replace(/\.?0+$/, '');
    }

    for (const [suffix, value] of SUFFIX_ENTRIES) {
        if (decimal.greaterThanOrEqualTo(value)) {
            return decimal.dividedBy(value).toFixed(2).replace(/\.?0+$/, '') + suffix;
        }
    }

    return decimal.toFixed(2).replace(/\.?0+$/, '');
}

// Example with custom formula:
// { id: 'custom_item', name: 'Custom Item', value: 10, formula: 'amount * 2.5' }
// Else:
// { id: "something", name: "idk ", value: 1}
const data = {
    blocks: {
        overworld: [
            { id: 'dirt', name: 'Dirt', value: 1 },
        ],
        "farmers peak": [
            { id: 'farmers_peak_block', name: 'Farmers Peak Block', value: 1, formula: 'amount * 2.5' },
        ],
    },
    tools: {
        wooden: [
            { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', value: 3 },
        ]
    },
    armor: {
        leather: [
            { id: 'leather_helmet', name: 'Leather Helmet', value: 5 },
        ],
    },
    currency: {
        basic: [
            { id: 'emerald', name: 'Emerald', value: 25 },
        ],
        blocks: [
            { id: 'emerald_block', name: 'Emerald Block', value: 225 },
        ]
    }
};

const PAGE_TAB_INDEX = { blocks: 0, tools: 1, armor: 2, currency: 3 };
const PAGE_TITLES = {
    blocks: 'Block Library',
    tools: 'Tool Library',
    armor: 'Armor Library',
    currency: 'Currency Library'
};

// Cache every element we touch repeatedly instead of calling
// document.getElementById() over and over on every interaction.
const dom = {};

let currentPage = 'blocks';
let allItems = {};
let openCategories = {};
let selectionMode = 'from';
let selectedFromItem = null;
let selectedToItem = null;

// DOM refs kept directly so highlighting the from/to selection is O(1)
// instead of re-querying and looping over every .item element.
let selectedFromEl = null;
let selectedToEl = null;

// category -> { itemsListEl, arrowEl, headerEl, itemEls: [{el, name}] }
// built once per loadCategories() call, reused by search/toggle instead of
// re-querying the DOM on every keystroke/click.
let categoryIndex = {};

function switchPage(page) {
    currentPage = page;

    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = tabs[PAGE_TAB_INDEX[page]];
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    dom.sidebarTitle.textContent = PAGE_TITLES[page];

    resetConverter();
    loadCategories();
}

function loadCategories() {
    dom.categoriesContainer.innerHTML = '';
    allItems = {};
    openCategories = {};
    categoryIndex = {};

    const categories = data[currentPage];
    const fragment = document.createDocumentFragment();

    Object.keys(categories).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
            <span class="arrow-icon" id="arrow-${category}">▶</span>
        `;
        header.onclick = () => toggleCategory(category);

        const itemsList = document.createElement('div');
        itemsList.className = 'items-list';
        itemsList.id = `items-${category}`;

        const itemEls = [];

        categories[category].forEach(item => {
            allItems[item.id] = item;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.textContent = item.name;
            itemDiv.setAttribute('data-item-id', item.id);
            itemDiv.onclick = () => selectItem(item.id, itemDiv);
            itemsList.appendChild(itemDiv);

            itemEls.push({ el: itemDiv, name: item.name.toLowerCase() });
        });

        categoryDiv.appendChild(header);
        categoryDiv.appendChild(itemsList);
        fragment.appendChild(categoryDiv);

        categoryIndex[category] = {
            itemsListEl: itemsList,
            arrowEl: header.querySelector('.arrow-icon'),
            headerEl: header,
            itemEls
        };
    });

    // Single reflow instead of one appendChild per category.
    dom.categoriesContainer.appendChild(fragment);
}

function toggleCategory(category) {
    const entry = categoryIndex[category];
    if (!entry) return;

    const isOpen = openCategories[category];

    entry.itemsListEl.classList.toggle('open', !isOpen);
    entry.arrowEl.classList.toggle('open', !isOpen);
    entry.headerEl.classList.toggle('active', !isOpen);
    openCategories[category] = !isOpen;
}

function setSelectionMode(mode) {
    selectionMode = mode;
    updateUI();
}

function updateUI() {
    dom.fromContainer.classList.remove('active-from');
    dom.toContainer.classList.remove('active-to');

    if (selectionMode === 'from') {
        dom.fromContainer.classList.add('active-from');
        dom.fromHint.textContent = '← Click an item in the sidebar';
        dom.toHint.textContent = '';
    } else {
        dom.toContainer.classList.add('active-to');
        dom.toHint.textContent = '← Click an item in the sidebar';
        dom.fromHint.textContent = '';
    }

    dom.fromContainer.classList.toggle('has-selection', !!selectedFromItem);
    dom.toContainer.classList.toggle('has-selection', !!selectedToItem);

    dom.convertButton.disabled = !selectedFromItem || !selectedToItem;
}

// itemEl is passed straight from the click handler (loadCategories already
// has the reference), so this never needs to query the DOM for it.
function selectItem(itemId, itemEl) {
    const item = allItems[itemId];

    if (selectionMode === 'from') {
        if (selectedFromEl) selectedFromEl.classList.remove('selected-from');
        selectedFromItem = itemId;
        selectedFromEl = itemEl;
        itemEl.classList.add('selected-from');
        dom.fromBlockDisplay.innerHTML = item.name;

        if (!selectedToItem) {
            setSelectionMode('to');
        } else {
            updateUI();
        }
    } else {
        if (selectedToEl) selectedToEl.classList.remove('selected-to');
        selectedToItem = itemId;
        selectedToEl = itemEl;
        itemEl.classList.add('selected-to');
        dom.toBlockDisplay.innerHTML = item.name;

        if (!selectedFromItem) {
            setSelectionMode('from');
        } else {
            updateUI();
        }
    }
}

function parseAmountWithSuffix(input) {
    if (!input || input === '') {
        return null;
    }

    input = input.trim();

    const match = input.match(/^([\d.]+)\s*([a-zA-Z]*)$/);

    if (!match) {
        return null;
    }

    const numberPart = match[1];
    const suffixPart = match[2];

    try {
        let amount = new Decimal(numberPart);

        if (suffixPart) {
            if (suffixes[suffixPart]) {
                amount = amount.times(suffixes[suffixPart]);
            } else {
                const foundSuffix = SUFFIX_LOOKUP_LOWER[suffixPart.toLowerCase()];
                if (foundSuffix) {
                    amount = amount.times(suffixes[foundSuffix]);
                } else {
                    return null; // Invalid suffix
                }
            }
        }

        return amount;
    } catch (e) {
        return null;
    }
}

function evaluateFormula(formula, variables) {
    try {
        const func = new Function(...Object.keys(variables), `return ${formula}`);
        const result = func(...Object.values(variables));
        return new Decimal(result);
    } catch (e) {
        console.error('Formula error:', e);
        return null;
    }
}

function convertItems() {
    if (!selectedFromItem || !selectedToItem) {
        return;
    }

    const amountDecimal = parseAmountWithSuffix(dom.amount.value);

    if (!amountDecimal) {
        alert('Please enter a valid amount! Examples: 100, 5M, 2.5B, 10Qt');
        return;
    }

    if (amountDecimal.lessThanOrEqualTo(0)) {
        alert('Please enter a positive amount!');
        return;
    }

    const fromItem = allItems[selectedFromItem];
    const toItem = allItems[selectedToItem];

    let toAmount;

    if (fromItem.formula && toItem.formula) {
        const fromFormulaResult = evaluateFormula(fromItem.formula, { amount: amountDecimal });
        if (fromFormulaResult === null) {
            alert('Error in "From" item formula. Check the formula syntax.');
            return;
        }
        const toFormulaResult = evaluateFormula(toItem.formula, { amount: fromFormulaResult });
        if (toFormulaResult === null) {
            alert('Error in "To" item formula. Check the formula syntax.');
            return;
        }
        toAmount = toFormulaResult.floor();
    } else if (fromItem.formula) {
        const fromFormulaResult = evaluateFormula(fromItem.formula, { amount: amountDecimal });
        if (fromFormulaResult === null) {
            alert('Error in "From" item formula. Check the formula syntax.');
            return;
        }
        toAmount = fromFormulaResult.dividedBy(toItem.value).floor();
    } else if (toItem.formula) {
        const fromValue = amountDecimal.times(fromItem.value);
        const toFormulaResult = evaluateFormula(toItem.formula, { amount: fromValue });
        if (toFormulaResult === null) {
            alert('Error in "To" item formula. Check the formula syntax.');
            return;
        }
        toAmount = toFormulaResult.floor();
    } else {
        const fromValue = amountDecimal.times(fromItem.value);
        toAmount = fromValue.dividedBy(toItem.value).floor();
    }

    dom.resultText.innerHTML = `
        ${formatNumber(amountDecimal)} ${fromItem.name}<br><br>
        ↓<br><br>
        <strong>${formatNumber(toAmount)} ${toItem.name}</strong>
    `;

    dom.result.classList.add('show');
}

function resetConverter() {
    selectedFromItem = null;
    selectedToItem = null;
    selectionMode = 'from';

    if (selectedFromEl) selectedFromEl.classList.remove('selected-from');
    if (selectedToEl) selectedToEl.classList.remove('selected-to');
    selectedFromEl = null;
    selectedToEl = null;

    dom.fromBlockDisplay.innerHTML = '<span class="block-display-placeholder">Select an item</span>';
    dom.toBlockDisplay.innerHTML = '<span class="block-display-placeholder">Select an item</span>';
    dom.result.classList.remove('show');
    dom.amount.value = '1';

    updateUI();
}

// Small debounce so search filtering doesn't run on every single keystroke
// (matters once the item lists get long).
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    Object.keys(categoryIndex).forEach(category => {
        const entry = categoryIndex[category];
        let hasVisibleItems = false;

        entry.itemEls.forEach(({ el, name }) => {
            const matches = name.includes(searchTerm);
            el.style.display = matches ? 'block' : 'none';
            if (matches) hasVisibleItems = true;
        });

        if (searchTerm && hasVisibleItems && !openCategories[category]) {
            toggleCategory(category);
        }
    });
}

// --- Adblock detection and popup ---
const ADBLOCK_ALWAYS_SHOW = false;

function showAdblockPopup() {
    if (!dom.adblockPopup) {
        console.warn('showAdblockPopup: #adblockPopup element not found in DOM.');
        return;
    }
    dom.adblockPopup.setAttribute('aria-hidden', 'false');
    dom.adblockPopup.classList.add('show');
}

function hideAdblockPopup() {
    if (!dom.adblockPopup) return;
    dom.adblockPopup.setAttribute('aria-hidden', 'true');
    dom.adblockPopup.classList.remove('show');
}

const outbrainErrorCheck = async () => {
    try { await fetch("https://widgets.outbrain.com/outbrain.js"); return false; }
    catch { return true; }
};

const adligatureErrorCheck = async () => {
    try { await fetch("https://adligature.com/", { mode: "no-cors" }); return false; }
    catch { return true; }
};

const quantserveErrorCheck = async () => {
    try { await fetch("https://secure.quantserve.com/quant.js", { mode: "no-cors" }); return false; }
    catch { return true; }
};

const adligatureCssErrorCheck = async () => {
    try { await fetch("https://cdn.adligature.com/work.ink/prod/rules.css", { mode: "no-cors" }); return false; }
    catch { return true; }
};

const srvtrackErrorCheck = async () => {
    try { await fetch("https://srvtrck.com/assets/css/LineIcons.css", { mode: "no-cors" }); return false; }
    catch { return true; }
};

const yieldkitCheck = async () => {
    try {
        await fetch("https://js.srvtrck.com/v1/js?api_key=40710abb89ad9e06874a667b2bc7dee7&site_id=1f10f78243674fcdba586e526cb8ef08", { mode: "no-cors" });
        return false;
    } catch {
        return true;
    }
};

const setIntervalCheck = () => {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(true), 2000);
        const interval = setInterval(() => {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve(false);
        }, 100);
    });
};

// All checks fire in parallel via Promise.all already — that part was fine.
const detectedAdblock = async () => {
    const resp = await Promise.all([
        outbrainErrorCheck(),
        adligatureErrorCheck(),
        quantserveErrorCheck(),
        adligatureCssErrorCheck(),
        srvtrackErrorCheck(),
        setIntervalCheck(),
        yieldkitCheck()
    ]);

    console.info('Adblock detection checks results:', resp);
    return resp.some(r => r === true);
};

async function detectAdblockAndNotify() {
    try {
        const blocked = await detectedAdblock();
        console.info('Adblock detected?', blocked);

        if (blocked) {
            console.info("Adblock detected via fetch-based detector");
            showAdblockPopup();
        } else if (ADBLOCK_ALWAYS_SHOW) {
            showAdblockPopup();
        }
    } catch (e) {
        console.error('Adblock detection error', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Populate the DOM cache once, up front.
    [
        'sidebarTitle', 'categoriesContainer', 'searchBar',
        'fromContainer', 'toContainer', 'fromHint', 'toHint',
        'fromBlockDisplay', 'toBlockDisplay', 'convertButton',
        'amount', 'result', 'resultText', 'adblockPopup', 'adblockClose'
    ].forEach(id => { dom[id] = document.getElementById(id); });

    dom.searchBar.addEventListener('input', debounce(handleSearch, 120));

    document.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'adblockClose' || e.target.classList.contains('adblock-close'))) {
            hideAdblockPopup();
        }
    });

    try {
        loadCategories();
        updateUI();
    } catch (e) {
        console.error('Initialization error', e);
    }

    setTimeout(detectAdblockAndNotify, 200);
});