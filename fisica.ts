import { createPdcaPageHandler } from './pdcaPage';

// --- Use the new PDCA page handler for common functionality ---
const pdcaHandler = createPdcaPageHandler('Física', 'page-fisica');

// --- DOM Elements ---
const elements = {
    hydrationInput: null as HTMLInputElement | null,
    hydrationBtn: null as HTMLButtonElement | null,
    hydrationResult: null as HTMLSpanElement | null,
};

const handleHydrationCalculation = () => {
    if (!elements.hydrationInput || !elements.hydrationResult) return;
    const weight = parseFloat(elements.hydrationInput.value);
    if (isNaN(weight) || weight <= 0) {
        elements.hydrationResult.textContent = '0 L';
        return;
    }
    const idealIntake = (weight * 35 / 1000).toFixed(2);
    elements.hydrationResult.textContent = `${idealIntake} L`;
};


// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    // Run the common setup from the handler
    pdcaHandler.setup();

    // Setup specific to this page
    const page = document.getElementById('page-fisica');
    if (!page) return;

    elements.hydrationInput = page.querySelector('#weight-input');
    elements.hydrationBtn = page.querySelector('#calculate-hydration-btn');
    elements.hydrationResult = page.querySelector('#hydration-result');
    
    elements.hydrationBtn?.addEventListener('click', handleHydrationCalculation);
    elements.hydrationInput?.addEventListener('input', handleHydrationCalculation);
}

export function show() {
    // Run the common show from the handler
    pdcaHandler.show();
    
    // Logic specific to this page
    handleHydrationCalculation();
}
