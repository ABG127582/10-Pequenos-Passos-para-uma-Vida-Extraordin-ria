import { createPdcaPageHandler } from './pdcaPage';
import { ai } from './ai';
import { loadingManager } from './loadingManager';
import { errorHandler } from './errorHandler';
import { Type } from '@google/genai';

// Use the base PDCA handler for task-related functionality
const pdcaHandler = createPdcaPageHandler('Social', 'page-social');

interface SocialResource {
    title: string;
    description: string;
    link: string;
}

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

    const prompt = `Para o desafio social "${topic}", encontre 3 recursos online de alta qualidade (artigos, vídeos do YouTube, ou ferramentas) que possam ajudar.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: 'O título do recurso.' },
                            description: { type: Type.STRING, description: 'Uma breve descrição (1-2 frases) do recurso.' },
                            link: { type: Type.STRING, description: 'O URL completo e clicável do recurso.' },
                        },
                        required: ['title', 'description', 'link'],
                    },
                },
            }
        });

        const resources: SocialResource[] = JSON.parse(response.text);
        
        if (!resources || resources.length === 0) {
            resultsContainer.innerHTML = '<p>Nenhum recurso encontrado. Tente reformular sua busca.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.style.listStyle = 'disc';
        ul.style.paddingLeft = '20px';
        
        resources.forEach(resource => {
            const li = document.createElement('li');
            li.style.marginBottom = '1rem';

            const strong = document.createElement('strong');
            strong.textContent = resource.title;

            const p = document.createElement('p');
            p.style.margin = '0.25rem 0';
            p.textContent = resource.description;

            const a = document.createElement('a');
            a.href = resource.link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = resource.link;

            li.appendChild(strong);
            li.appendChild(p);
            li.appendChild(a);
            ul.appendChild(li);
        });

        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(ul);

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