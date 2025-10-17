import DOMPurify from 'dompurify';
import { confirmAction } from './utils';
import { STORAGE_KEYS } from './constants';
import { storageService } from './storage';
import { openTaskModal } from './tarefas';
import { createPdcaPageHandler } from './pdcaPage';


// Type definitions
interface Asset {
    id: string;
    name: string;
    purchaseDate: string; // YYYY-MM-DD
}

// Re-declare window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

// --- Module-scoped state ---
let assets: Asset[] = [];
let editingAssetId: string | null = null;

// --- DOM Elements ---
const elements = {
    // Asset Replacement
    assetList: null as HTMLTableSectionElement | null,
    assetForm: null as HTMLFormElement | null,
    assetNameInput: null as HTMLInputElement | null,
    assetPurchaseDateInput: null as HTMLInputElement | null,
    // Asset Modal
    assetModal: null as HTMLElement | null,
    assetModalForm: null as HTMLFormElement | null,
    assetModalCloseBtn: null as HTMLButtonElement | null,
    assetModalCancelBtn: null as HTMLButtonElement | null,
    saveAssetEditBtn: null as HTMLButtonElement | null,
    assetNameEditInput: null as HTMLInputElement | null,
    assetPurchaseDateEditInput: null as HTMLInputElement | null,
};

// --- Use the new PDCA page handler for common functionality ---
const pdcaHandler = createPdcaPageHandler('Financeira', 'page-financeira');


// --- ASSET REPLACEMENT ---
const renderAssets = () => {
    if (!elements.assetList) return;
    elements.assetList.innerHTML = '';

    if (assets.length === 0) {
        elements.assetList.innerHTML = `<tr><td colspan="4" class="empty-list-placeholder">Nenhum item adicionado.</td></tr>`;
        return;
    }

    assets.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

    assets.forEach(asset => {
        const purchaseDate = new Date(asset.purchaseDate + 'T00:00:00');
        const replacementDate = new Date(purchaseDate);
        replacementDate.setFullYear(replacementDate.getFullYear() + 7);

        const row = document.createElement('tr');
        row.dataset.id = asset.id;

        row.innerHTML = `
            <td>${DOMPurify.sanitize(asset.name)}</td>
            <td>${purchaseDate.toLocaleDateString('pt-BR')}</td>
            <td>${replacementDate.toLocaleDateString('pt-BR')}</td>
            <td>
                <div class="item-actions">
                    <button class="action-btn edit" aria-label="Editar item"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" aria-label="Apagar item"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        elements.assetList!.appendChild(row);
    });
};

const handleAddAsset = (e: Event) => {
    e.preventDefault();
    if (!elements.assetNameInput || !elements.assetPurchaseDateInput) return;
    const name = elements.assetNameInput.value.trim();
    const purchaseDate = elements.assetPurchaseDateInput.value;

    if (name && purchaseDate) {
        const newAsset: Asset = { id: Date.now().toString(), name, purchaseDate };
        assets.unshift(newAsset);
        storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
        renderAssets();
        elements.assetForm?.reset();
    } else {
        window.showToast('Por favor, preencha o nome e a data de compra do item.', 'warning');
    }
};

const openAssetModal = (asset: Asset) => {
    if (!elements.assetModal || !elements.assetNameEditInput || !elements.assetPurchaseDateEditInput) return;
    editingAssetId = asset.id;
    elements.assetNameEditInput.value = asset.name;
    elements.assetPurchaseDateEditInput.value = asset.purchaseDate;
    elements.assetModal.style.display = 'flex';
    elements.assetNameEditInput.focus();
};

const closeAssetModal = () => {
    if (!elements.assetModal) return;
    elements.assetModal.style.display = 'none';
    editingAssetId = null;
};

const handleSaveAssetEdit = (e: Event) => {
    e.preventDefault();
    if (!editingAssetId || !elements.assetNameEditInput || !elements.assetPurchaseDateEditInput) return;
    const name = elements.assetNameEditInput.value.trim();
    const purchaseDate = elements.assetPurchaseDateEditInput.value;

    if (name && purchaseDate) {
        const assetIndex = assets.findIndex(a => a.id === editingAssetId);
        if (assetIndex > -1) {
            assets[assetIndex] = { ...assets[assetIndex], name, purchaseDate };
            storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
            renderAssets();
            closeAssetModal();
        }
    } else {
        window.showToast('O nome e a data são obrigatórios.', 'warning');
    }
};

const handleAssetListClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLTableRowElement>('tr[data-id]');
    if (!row || !row.dataset.id) return;
    const assetId = row.dataset.id;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    if (target.closest('.edit')) {
        openAssetModal(asset);
    } else if (target.closest('.delete')) {
        const confirmed = await confirmAction(`Tem certeza que deseja apagar o item "${asset.name}"?`);
        if (confirmed) {
            assets = assets.filter(a => a.id !== assetId);
            storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
            renderAssets();
            window.showToast('Item apagado com sucesso.', 'success');
        }
    }
};


// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    // Run the common setup from the handler
    pdcaHandler.setup();
    
    // Setup specific to this page
    const page = document.getElementById('page-financeira');
    if (!page) return;
    
    elements.assetList = page.querySelector('#asset-replacement-list');
    elements.assetForm = page.querySelector('#add-asset-form');
    elements.assetNameInput = page.querySelector('#asset-name-input');
    elements.assetPurchaseDateInput = page.querySelector('#asset-purchase-date-input');
    
    // Modal elements are global
    elements.assetModal = document.getElementById('asset-modal');
    elements.assetModalForm = document.getElementById('asset-edit-form') as HTMLFormElement;
    elements.assetModalCloseBtn = document.getElementById('asset-modal-close-btn') as HTMLButtonElement;
    elements.assetModalCancelBtn = document.getElementById('asset-modal-cancel-btn') as HTMLButtonElement;
    elements.saveAssetEditBtn = document.getElementById('save-asset-edit-btn') as HTMLButtonElement;
    elements.assetNameEditInput = document.getElementById('asset-name-edit-input') as HTMLInputElement;
    elements.assetPurchaseDateEditInput = document.getElementById('asset-purchase-date-edit-input') as HTMLInputElement;

    // Event Listeners
    elements.assetForm?.addEventListener('submit', handleAddAsset);
    elements.assetList?.addEventListener('click', handleAssetListClick);
    
    // Asset Modal listeners
    elements.assetModalForm?.addEventListener('submit', handleSaveAssetEdit);
    elements.assetModalCloseBtn?.addEventListener('click', closeAssetModal);
    elements.assetModalCancelBtn?.addEventListener('click', closeAssetModal);
    elements.assetModal?.addEventListener('click', (e) => {
        if (e.target === elements.assetModal) closeAssetModal();
    });
}

export function show() {
    // Run the common show from the handler
    pdcaHandler.show();
    
    // Logic specific to this page
    assets = storageService.get<Asset[]>(STORAGE_KEYS.FINANCE_ASSETS) || [];
    renderAssets();
}