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

function formatNumber(num) {
    const decimal = new Decimal(num);
    
    if (decimal.lessThan(1000)) {
        return decimal.toFixed(2).replace(/\.?0+$/, '');
    }
    
    const suffixKeys = Object.keys(suffixes).filter(k => k !== '');
    
    for (let i = 0; i < suffixKeys.length; i++) {
        const suffix = suffixKeys[i];
        const value = suffixes[suffix];
        
        if (decimal.greaterThanOrEqualTo(value)) {
            const divided = decimal.dividedBy(value);
            return divided.toFixed(2).replace(/\.?0+$/, '') + suffix;
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
            { id: 'emerald_block', name: 'Emerald Block', value: 225},
        ]
    }
};

let currentPage = 'blocks';
let allItems = {};
let openCategories = {};
let selectionMode = 'from';
let selectedFromItem = null;
let selectedToItem = null;

function switchPage(page) {
    currentPage = page;
    
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    
    const titles = {
        blocks: 'Block Library',
        tools: 'Tool Library',
        armor: 'Armor Library',
        currency: 'Currency Library'
    };
    document.getElementById('sidebarTitle').textContent = titles[page];
    
    resetConverter();
    loadCategories();
}

function loadCategories() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';
    allItems = {};
    openCategories = {};
    
    const categories = data[currentPage];
    
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
        
        categories[category].forEach(item => {
            allItems[item.id] = item;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.textContent = item.name;
            itemDiv.setAttribute('data-item-id', item.id);
            itemDiv.setAttribute('data-item-name', item.name.toLowerCase());
            itemDiv.onclick = () => selectItem(item.id);
            itemsList.appendChild(itemDiv);
        });
        
        categoryDiv.appendChild(header);
        categoryDiv.appendChild(itemsList);
        container.appendChild(categoryDiv);
    });
}

function toggleCategory(category) {
    const itemsList = document.getElementById(`items-${category}`);
    const arrow = document.getElementById(`arrow-${category}`);
    const header = arrow.parentElement;
    
    const isOpen = openCategories[category];
    
    if (isOpen) {
        itemsList.classList.remove('open');
        arrow.classList.remove('open');
        header.classList.remove('active');
        openCategories[category] = false;
    } else {
        itemsList.classList.add('open');
        arrow.classList.add('open');
        header.classList.add('active');
        openCategories[category] = true;
    }
}

function setSelectionMode(mode) {
    selectionMode = mode;
    updateUI();
}

function updateUI() {
    const fromContainer = document.getElementById('fromContainer');
    const toContainer = document.getElementById('toContainer');
    const fromHint = document.getElementById('fromHint');
    const toHint = document.getElementById('toHint');
    const convertButton = document.getElementById('convertButton');
    
    fromContainer.classList.remove('active-from');
    toContainer.classList.remove('active-to');
    
    if (selectionMode === 'from') {
        fromContainer.classList.add('active-from');
        fromHint.textContent = '← Click an item in the sidebar';
        toHint.textContent = '';
    } else {
        toContainer.classList.add('active-to');
        toHint.textContent = '← Click an item in the sidebar';
        fromHint.textContent = '';
    }
    
    if (selectedFromItem) {
        fromContainer.classList.add('has-selection');
    }
    if (selectedToItem) {
        toContainer.classList.add('has-selection');
    }
    
    convertButton.disabled = !selectedFromItem || !selectedToItem;
    
    updateItemHighlights();
}

function updateItemHighlights() {
    document.querySelectorAll('.item').forEach(item => {
        item.classList.remove('selected-from', 'selected-to');
        const itemId = item.getAttribute('data-item-id');
        if (itemId === selectedFromItem) {
            item.classList.add('selected-from');
        }
        if (itemId === selectedToItem) {
            item.classList.add('selected-to');
        }
    });
}

function selectItem(itemId) {
    const item = allItems[itemId];
    
    if (selectionMode === 'from') {
        selectedFromItem = itemId;
        const display = document.getElementById('fromBlockDisplay');
        display.innerHTML = item.name;
        
        if (!selectedToItem) {
            setSelectionMode('to');
        } else {
            updateUI();
        }
    } else {
        selectedToItem = itemId;
        const display = document.getElementById('toBlockDisplay');
        display.innerHTML = item.name;
        
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
    
    // Try to match number followed by suffix
    const match = input.match(/^([\d.]+)\s*([a-zA-Z]*)$/);
    
    if (!match) {
        return null;
    }
    
    const numberPart = match[1];
    const suffixPart = match[2];
    
    try {
        let amount = new Decimal(numberPart);
        
        if (suffixPart && suffixPart !== '') {
            // Find matching suffix (case-sensitive)
            if (suffixes[suffixPart]) {
                amount = amount.times(suffixes[suffixPart]);
            } else {
                // Check if it's a valid suffix but wrong case
                const foundSuffix = Object.keys(suffixes).find(
                    key => key.toLowerCase() === suffixPart.toLowerCase() && key !== ''
                );
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
        // Create a safe evaluation context
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
    
    const amountInput = document.getElementById('amount').value;
    
    const amountDecimal = parseAmountWithSuffix(amountInput);
    
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
    
    // Check if either item has a custom formula
    if (fromItem.formula && toItem.formula) {
        // Both have formulas - apply both
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
        // Only "from" has formula
        const fromFormulaResult = evaluateFormula(fromItem.formula, { amount: amountDecimal });
        if (fromFormulaResult === null) {
            alert('Error in "From" item formula. Check the formula syntax.');
            return;
        }
        toAmount = fromFormulaResult.dividedBy(toItem.value).floor();
    } else if (toItem.formula) {
        // Only "to" has formula
        const fromValue = amountDecimal.times(fromItem.value);
        const toFormulaResult = evaluateFormula(toItem.formula, { amount: fromValue });
        if (toFormulaResult === null) {
            alert('Error in "To" item formula. Check the formula syntax.');
            return;
        }
        toAmount = toFormulaResult.floor();
    } else {
        // No formulas - use standard value-based conversion
        const fromValue = amountDecimal.times(fromItem.value);
        toAmount = fromValue.dividedBy(toItem.value).floor();
    }
    
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    
    resultText.innerHTML = `
        ${formatNumber(amountDecimal)} ${fromItem.name}<br><br>
        ↓<br><br>
        <strong>${formatNumber(toAmount)} ${toItem.name}</strong>
    `;
    
    resultDiv.classList.add('show');
}

function resetConverter() {
    selectedFromItem = null;
    selectedToItem = null;
    selectionMode = 'from';
    
    document.getElementById('fromBlockDisplay').innerHTML = '<span class="block-display-placeholder">Select an item</span>';
    document.getElementById('toBlockDisplay').innerHTML = '<span class="block-display-placeholder">Select an item</span>';
    document.getElementById('result').classList.remove('show');
    document.getElementById('amount').value = '1';
    
    updateUI();
}

document.getElementById('searchBar').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    Object.keys(data[currentPage]).forEach(category => {
        const itemsList = document.getElementById(`items-${category}`);
        const items = itemsList.querySelectorAll('.item');
        let hasVisibleItems = false;
        
        items.forEach(item => {
            const itemName = item.getAttribute('data-item-name');
            if (itemName.includes(searchTerm)) {
                item.style.display = 'block';
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });
        
        if (searchTerm && hasVisibleItems && !openCategories[category]) {
            toggleCategory(category);
        }
    });
});

loadCategories();
updateUI();

// --- Adblock detection and popup ---
// Set to true to always show the adblock popup (useful if you want to request users to disable blockers)
const ADBLOCK_ALWAYS_SHOW = false;

function showAdblockPopup() {
    try {
        const popup = document.getElementById('adblockPopup');
        if (!popup) return;
        popup.setAttribute('aria-hidden', 'false');
        popup.classList.add('show');
    } catch (e) { console.error(e); }
}

function hideAdblockPopup() {
    try {
        const popup = document.getElementById('adblockPopup');
        if (!popup) return;
        popup.setAttribute('aria-hidden', 'true');
        popup.classList.remove('show');
    } catch (e) { console.error(e); }
}

// --- your new fetch-based detector dropped in ---
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
            const a0b = "a0b";
            if (a0b === "a0b") {
                clearInterval(interval);
                clearTimeout(timeout);
                resolve(false);
            }
        }, 100);
    });
};

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

    const isNotUsingAdblocker = resp.every(r => r === false);
    return !isNotUsingAdblocker;
};

// --- replaced detector core here ---
async function detectAdblockAndNotify() {
    try {
        const blocked = await detectedAdblock();

        if (blocked) {
            console.info("Adblock detected via fetch-based detector");
            showAdblockPopup();
        } else {
            console.info("No adblock detected");
            if (ADBLOCK_ALWAYS_SHOW) {
                showAdblockPopup();
            }
        }
    } catch (e) {
        console.error('Adblock detection error', e);
    }
}


// close button
document.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'adblockClose' || e.target.classList.contains('adblock-close'))) {
        hideAdblockPopup();
    }
});

// run it
window.setTimeout(detectAdblockAndNotify, 200);
