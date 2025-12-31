import DOMPurify from 'dompurify';
import { confirmAction } from './utils';
import { STORAGE_KEYS } from './constants';
import { storageService } from './storage';

// Type definitions
interface Asset {
    id: string;
    name: string;
    purchaseDate: string;
}

// Re-declare window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
        Chart: any;
    }
}

// --- Module-scoped state ---
let assets: Asset[] = [];
let editingAssetId: string | null = null;
let budgetChart: any = null;

// --- DOM Elements ---
const elements = {
    pageContainer: null as HTMLElement | null,
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
    // Budget Calculator
    incomeInput: null as HTMLInputElement | null,
    calculateBudgetBtn: null as HTMLButtonElement | null,
    budgetBreakdown: null as HTMLElement | null,
};


// --- ASSET REPLACEMENT ---
const renderAssets = () => {
    if (!elements.assetList) return;
    elements.assetList.innerHTML = '';

    if (assets.length === 0) {
        elements.assetList.innerHTML = `<tr><td colspan="4" class="empty-list-placeholder">Nenhum item adicionado.</td></tr>`;
        return;
    }

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
            <td class="item-actions">
                <button class="action-btn edit-asset-btn edit" aria-label="Editar item"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-asset-btn delete" aria-label="Remover item"><i class="fas fa-trash"></i></button>
            </td>
        `;
        elements.assetList!.appendChild(row);
    });
};

const openAssetEditModal = (asset: Asset) => {
    if (!elements.assetModal) return;
    editingAssetId = asset.id;
    elements.assetNameEditInput!.value = asset.name;
    elements.assetPurchaseDateEditInput!.value = asset.purchaseDate;
    elements.assetModal.style.display = 'flex';
};

const closeAssetEditModal = () => {
    if (elements.assetModal) {
        elements.assetModal.style.display = 'none';
        editingAssetId = null;
    }
};

const handleSaveAssetEdit = (e: Event) => {
    e.preventDefault();
    if (!editingAssetId) return;

    const assetIndex = assets.findIndex(a => a.id === editingAssetId);
    if (assetIndex === -1) return;

    const newName = elements.assetNameEditInput!.value.trim();
    const newDate = elements.assetPurchaseDateEditInput!.value;

    if (!newName || !newDate) {
        window.showToast('Nome do item e data são obrigatórios.', 'warning');
        return;
    }

    assets[assetIndex].name = newName;
    assets[assetIndex].purchaseDate = newDate;

    storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
    renderAssets();
    closeAssetEditModal();
    window.showToast('Item atualizado com sucesso!', 'success');
};

const handleAddAsset = (e: Event) => {
    e.preventDefault();
    const name = elements.assetNameInput!.value.trim();
    const purchaseDate = elements.assetPurchaseDateInput!.value;

    if (!name || !purchaseDate) {
        window.showToast('Por favor, preencha o nome e a data de compra do item.', 'warning');
        return;
    }
    
    const newAsset: Asset = {
        id: Date.now().toString(),
        name,
        purchaseDate,
    };
    
    assets.push(newAsset);
    storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
    renderAssets();
    elements.assetForm!.reset();
};

const handleAssetListClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    const row = target.closest('tr');
    if (!row || !row.dataset.id) return;
    const assetId = row.dataset.id;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;


    const editBtn = target.closest('.edit-asset-btn');
    if (editBtn) {
        openAssetEditModal(asset);
        return;
    }

    const deleteBtn = target.closest('.delete-asset-btn');
    if (deleteBtn) {
        const confirmed = await confirmAction(`Tem certeza que deseja remover "${asset.name}" do planejamento?`);
        if (confirmed) {
            assets = assets.filter(a => a.id !== assetId);
            storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
            renderAssets();
            window.showToast('Item removido do planejamento.', 'success');
        }
    }
};

// --- BUDGET CALCULATOR ---
const calculateBudget = () => {
    const income = parseFloat(elements.incomeInput?.value || '0');
    if (!income || income <= 0) {
        window.showToast('Insira uma renda válida.', 'warning');
        return;
    }

    const needs = income * 0.50;
    const wants = income * 0.30;
    const savings = income * 0.20;

    // Update Breakdown Text
    if (elements.budgetBreakdown) {
        elements.budgetBreakdown.style.display = 'block';
        elements.budgetBreakdown.innerHTML = `
            <strong>Necessidades (50%):</strong> R$ ${needs.toFixed(2)}<br>
            <strong>Desejos (30%):</strong> R$ ${wants.toFixed(2)}<br>
            <strong>Poupança/Investimentos (20%):</strong> R$ ${savings.toFixed(2)}
        `;
    }

    // Render Chart
    const ctx = (document.getElementById('budget-distribution-chart') as HTMLCanvasElement).getContext('2d');
    
    if (budgetChart) {
        budgetChart.destroy();
    }

    budgetChart = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Necessidades (50%)', 'Desejos (30%)', 'Poupança (20%)'],
            datasets: [{
                data: [needs, wants, savings],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)', // Warning (Financeira color)
                    'rgba(0, 123, 255, 0.8)',  // Primary
                    'rgba(40, 167, 69, 0.8)'   // Success
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
};


// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    const page = document.getElementById('page-financeira');
    if (!page) return;

    elements.pageContainer = page;
    elements.assetList = page.querySelector('#asset-replacement-list') as HTMLTableSectionElement;
    elements.assetForm = page.querySelector('#add-asset-form') as HTMLFormElement;
    elements.assetNameInput = page.querySelector('#asset-name-input') as HTMLInputElement;
    elements.assetPurchaseDateInput = page.querySelector('#asset-purchase-date-input') as HTMLInputElement;
    
    // Budget Elements
    elements.incomeInput = document.getElementById('monthly-income-input') as HTMLInputElement;
    elements.calculateBudgetBtn = document.getElementById('calculate-budget-btn') as HTMLButtonElement;
    elements.budgetBreakdown = document.getElementById('budget-breakdown');

    // Asset Modal Elements
    elements.assetModal = document.getElementById('asset-modal');
    elements.assetModalForm = document.getElementById('asset-edit-form') as HTMLFormElement;
    elements.assetModalCloseBtn = document.getElementById('asset-modal-close-btn') as HTMLButtonElement;
    elements.assetModalCancelBtn = document.getElementById('asset-modal-cancel-btn') as HTMLButtonElement;
    elements.saveAssetEditBtn = document.getElementById('save-asset-edit-btn') as HTMLButtonElement;
    elements.assetNameEditInput = document.getElementById('asset-name-edit-input') as HTMLInputElement;
    elements.assetPurchaseDateEditInput = document.getElementById('asset-purchase-date-edit-input') as HTMLInputElement;


    elements.assetForm?.addEventListener('submit', handleAddAsset);
    elements.assetList?.addEventListener('click', handleAssetListClick);
    elements.calculateBudgetBtn?.addEventListener('click', calculateBudget);
    
    // Asset Modal Listeners
    elements.assetModalCloseBtn?.addEventListener('click', closeAssetEditModal);
    elements.assetModalCancelBtn?.addEventListener('click', closeAssetEditModal);
    elements.assetModalForm?.addEventListener('submit', handleSaveAssetEdit);
}

export function show() {
    const savedAssets = storageService.get<Asset[]>(STORAGE_KEYS.FINANCE_ASSETS);
    if (savedAssets && savedAssets.length > 0) {
        assets = savedAssets;
    } else {
        assets = [
            { id: 'default-1', name: 'Notebook', purchaseDate: '2014-01-01' },
            { id: 'default-2', name: 'Geladeira', purchaseDate: '2015-01-01' },
            { id: 'default-3', name: 'Cama de casal', purchaseDate: '2015-01-01' },
            { id: 'default-4', name: 'Air fryer', purchaseDate: '2015-01-01' },
            { id: 'default-5', name: 'Lancheira', purchaseDate: '2015-01-01' },
            { id: 'default-6', name: 'Sofá', purchaseDate: '2025-01-01' },
            { id: 'default-7', name: 'Video game (PS2, PS3, PS4)', purchaseDate: '2018-01-01' },
            { id: 'default-8', name: 'Mesa escritório', purchaseDate: '2021-01-01' },
            { id: 'default-9', name: 'Mesas de apoio', purchaseDate: '2022-01-01' },
            { id: 'default-10', name: 'Banquetas vermelhas', purchaseDate: '2022-01-01' },
            { id: 'default-11', name: 'Cama de solteiro', purchaseDate: '2022-01-01' },
            { id: 'default-12', name: 'Fogão', purchaseDate: '2021-01-01' },
            { id: 'default-13', name: 'Televisão', purchaseDate: '2022-01-01' },
        ];
    }
    
    renderAssets();
}
