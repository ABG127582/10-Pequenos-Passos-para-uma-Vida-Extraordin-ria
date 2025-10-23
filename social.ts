import { createPdcaPageHandler } from './pdcaPage';
import { ai } from './ai';
import { loadingManager } from './loadingManager';
import { errorHandler } from './errorHandler';
import DOMPurify from 'dompurify';

// Use the base PDCA handler for task-related functionality
const pdcaHandler = createPdcaPageHandler('Social', 'page-social');

async function handleGenerateResources() {
    const page = document.getElementById('page-social');
    if (!page) return;

    const generateBtn = page.querySelector('#generate-social-resources-btn') as HTMLButtonElement;
    const topicInput = page.querySelector('#social-topic-input') as HTMLInputElement;
    const resultsContainer = page.querySelector('#social-resources-results') as HTMLElement;

    const topic = topicInput.value.trim();
    if (!topic) {
        window.showToast('Por favor, descreva o desafio social que você está enfrentando.', 'info');
        return;
    }

    loadingManager.start('social-ai');
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    resultsContainer.innerHTML = '<p>Buscando recursos... <i class="fas fa-spinner fa-spin"></i></p>';

    const prompt = `Para o desafio social "${topic}", encontre 3 recursos online de alta qualidade (artigos, vídeos do YouTube, ou ferramentas) que possam ajudar. Para cada recurso, forneça o título, uma breve descrição (1-2 frases), e o link. Formate a resposta como uma lista HTML (<ul> e <li>) com links clicáveis.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const htmlResult = response.text;
        // Basic Markdown to HTML
        let sanitizedHtml = DOMPurify.sanitize(htmlResult
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\* (.*?)(?=\n\*|\n\n|$)/g, '<li>$1</li>')
            .replace(/(\r\n|\n|\r)/gm, "<br>")
            .replace(/<br>\s*<br>/g, '')
            .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
            .replace(/<\/ul><br><ul>/g, '')
        );
        resultsContainer.innerHTML = sanitizedHtml;
    } catch (err) {
        errorHandler.handle(err as Error, 'generating social resources');
        resultsContainer.innerHTML = '<p style="color: var(--color-error);">Ocorreu um erro ao buscar os recursos. Tente novamente.</p>';
    } finally {
        loadingManager.stop('social-ai');
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }
}

export function setup() {
    // Run the base PDCA setup for tasks
    pdcaHandler.setup();
    
    // Add specific setup for this page's AI feature
    const page = document.getElementById('page-social');
    page?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('#generate-social-resources-btn')) {
            handleGenerateResources();
        }
    });
}

export function show() {
    // Run the base PDCA show to render tasks
    pdcaHandler.show();
    
    // Additional logic for this page on show
    const page = document.getElementById('page-social');
    if (page) {
        const topicInput = page.querySelector('#social-topic-input') as HTMLInputElement;
        const resultsContainer = page.querySelector('#social-resources-results') as HTMLElement;
        if (topicInput) topicInput.value = '';
        if (resultsContainer) resultsContainer.innerHTML = '';
    }
}