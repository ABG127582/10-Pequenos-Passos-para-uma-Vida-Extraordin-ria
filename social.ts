import DOMPurify from 'dompurify';
import { createPdcaPageHandler } from './pdcaPage';
import { ai } from './ai';
import { loadingManager } from './loadingManager';

// Re-declare window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

// --- Use the new PDCA page handler for common functionality ---
const pdcaHandler = createPdcaPageHandler('Social', 'page-social');

// --- DOM Elements for this specific page ---
let pageElements = {
    generateResourcesBtn: null as HTMLButtonElement | null,
    topicInput: null as HTMLInputElement | null,
    resultsContainer: null as HTMLElement | null,
};

async function handleGenerateResources() {
    if (!pageElements.topicInput || !pageElements.resultsContainer || !pageElements.generateResourcesBtn) return;

    const topic = pageElements.topicInput.value.trim();
    if (!topic) {
        window.showToast('Por favor, descreva o desafio que você está enfrentando.', 'warning');
        return;
    }

    loadingManager.start('gemini-social-search');
    pageElements.generateResourcesBtn.classList.add('loading');
    pageElements.resultsContainer.innerHTML = '<p>Buscando recursos...</p>';

    try {
        const prompt = `Encontre recursos online úteis (artigos, guias, comunidades online) em português para uma pessoa que está lidando com o seguinte desafio social: "${topic}".`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        if (groundingChunks && groundingChunks.length > 0) {
            let html = `<h4>Recursos Encontrados:</h4>`;
            const uniqueResults: { [key: string]: { title: string, uri: string } } = {};
            
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web && chunk.web.uri && chunk.web.title) {
                    uniqueResults[chunk.web.uri] = { title: chunk.web.title, uri: chunk.web.uri };
                }
            });

            html += Object.values(uniqueResults).map(result => `
                <div class="resource-item">
                    <a href="${result.uri}" target="_blank" rel="noopener noreferrer">${DOMPurify.sanitize(result.title)}</a>
                    <p>${new URL(result.uri).hostname}</p>
                </div>
            `).join('');

            pageElements.resultsContainer.innerHTML = html;
        } else {
            pageElements.resultsContainer.innerHTML = '<p>Não foram encontrados recursos específicos. Tente refinar sua busca.</p>';
        }

    } catch (error) {
        console.error("Error generating social resources:", error);
        pageElements.resultsContainer.innerHTML = '<p>Ocorreu um erro ao buscar os recursos. Tente novamente mais tarde.</p>';
        window.showToast('Erro ao contatar a IA.', 'error');
    } finally {
        loadingManager.stop('gemini-social-search');
        pageElements.generateResourcesBtn.classList.remove('loading');
    }
}


// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    // Run the common setup from the handler
    pdcaHandler.setup();

    // Setup specific to this page
    const page = document.getElementById('page-social');
    if (!page) return;
    
    pageElements.generateResourcesBtn = page.querySelector('#generate-social-resources-btn');
    pageElements.topicInput = page.querySelector('#social-topic-input');
    pageElements.resultsContainer = page.querySelector('#social-resources-results');

    pageElements.generateResourcesBtn?.addEventListener('click', handleGenerateResources);
}

export function show() {
    // Run the common show from the handler
    pdcaHandler.show();

    // Clear previous results on show
    if (pageElements.resultsContainer) {
        pageElements.resultsContainer.innerHTML = '';
    }
    if(pageElements.topicInput) {
        pageElements.topicInput.value = '';
    }
}
