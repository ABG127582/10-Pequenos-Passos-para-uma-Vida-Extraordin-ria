// router.ts
// This module handles all client-side routing and page content loading.

import DOMPurify from 'dompurify';
import { ttsReader } from './tts';
import { loadingManager } from './loadingManager';
import { errorHandler } from './errorHandler';
import { performanceMonitor } from './performance';
import { CONFIG } from './constants';

// --- Static HTML Content Imports ---
// Explicit imports ensure Vite bundles these files correctly.
// Using './' relative paths to avoid "Failed to resolve module specifier" errors in the browser.
// @ts-ignore
import inicioHtml from './inicio.html?raw';
// @ts-ignore
import fisicaHtml from './fisica.html?raw';
// @ts-ignore
import mentalHtml from './mental.html?raw';
// @ts-ignore
import financeiraHtml from './financeira.html?raw';
// @ts-ignore
import familiarHtml from './familiar.html?raw';
// @ts-ignore
import profissionalHtml from './profissional.html?raw';
// @ts-ignore
import socialHtml from './social.html?raw';
// @ts-ignore
import espiritualHtml from './espiritual.html?raw';
// @ts-ignore
import preventivaHtml from './preventiva.html?raw';
// @ts-ignore
import tarefasHtml from './tarefas.html?raw';
// @ts-ignore
import alongamentoHtml from './alongamento.html?raw';
// @ts-ignore
import sonoHtml from './sono.html?raw';
// @ts-ignore
import alimentacaoForteHtml from './alimentacao-forte.html?raw';
// @ts-ignore
import leituraGuiaFisicaHtml from './leitura-guia-fisica.html?raw';
// @ts-ignore
import leituraGuiaMentalHtml from './leitura-guia-mental.html?raw';
// @ts-ignore
import leituraGuiaFinanceiraHtml from './leitura-guia-financeira.html?raw';
// @ts-ignore
import leituraGuiaFamiliarHtml from './leitura-guia-familiar.html?raw';
// @ts-ignore
import leituraGuiaEspiritualHtml from './leitura-guia-espiritual.html?raw';
// @ts-ignore
import jejumVerdeHtml from './jejum-verde.html?raw';
// @ts-ignore
import foodGengibreHtml from './food-gengibre.html?raw';
// @ts-ignore
import foodAlhoHtml from './food-alho.html?raw';
// @ts-ignore
import foodBrocolisHtml from './food-brocolis.html?raw';
// @ts-ignore
import foodCouveHtml from './food-couve.html?raw';

// Map of page keys to their HTML content strings
const htmlModules: { [key: string]: string } = {
    'inicio': inicioHtml,
    'fisica': fisicaHtml,
    'mental': mentalHtml,
    'financeira': financeiraHtml,
    'familiar': familiarHtml,
    'profissional': profissionalHtml,
    'social': socialHtml,
    'espiritual': espiritualHtml,
    'preventiva': preventivaHtml,
    'tarefas': tarefasHtml,
    'alongamento': alongamentoHtml,
    'sono': sonoHtml,
    'alimentacao-forte': alimentacaoForteHtml,
    'leitura-guia-fisica': leituraGuiaFisicaHtml,
    'leitura-guia-mental': leituraGuiaMentalHtml,
    'leitura-guia-financeira': leituraGuiaFinanceiraHtml,
    'leitura-guia-familiar': leituraGuiaFamiliarHtml,
    'leitura-guia-espiritual': leituraGuiaEspiritualHtml,
    'jejum-verde': jejumVerdeHtml,
    'food-gengibre': foodGengibreHtml,
    'food-alho': foodAlhoHtml,
    'food-brocolis': foodBrocolisHtml,
    'food-couve': foodCouveHtml,
};

// --- Page Module Dynamic Imports for Lazy Loading ---
// Using relative paths './' to ensure correct resolution.
export const pageModuleImports: { [key: string]: () => Promise<any> } = {
    'inicio': () => import('./inicio'),
    'espiritual': () => import('./espiritual'),
    'preventiva': () => import('./preventiva'),
    'fisica': () => import('./fisica'),
    'mental': () => import('./mental'),
    'financeira': () => import('./financeira'),
    'familiar': () => import('./familiar'),
    'profissional': () => import('./profissional'),
    'social': () => import('./social'),
    'alongamento': () => import('./alongamento'),
    'sono': () => import('./sono'),
    'alimentacao-forte': () => import('./alimentacao-forte'),
    'tarefas': () => import('./tarefas'),
};


// --- Page Hierarchy for Breadcrumbs and Active State ---
const pageHierarchy: { [key: string]: { parent: string | null; title: string } } = {
    'inicio': { parent: null, title: 'Início' },
    'fisica': { parent: 'inicio', title: 'Saúde Física' },
    'leitura-guia-fisica': { parent: 'fisica', title: 'Guia de Leitura' },
    'alongamento': { parent: 'fisica', title: 'Guia de Alongamento' },
    'alimentacao-forte': { parent: 'fisica', title: 'Guia de Alimentação Forte' },
    'mental': { parent: 'inicio', title: 'Saúde Mental' },
    'leitura-guia-mental': { parent: 'mental', title: 'Guia de Leitura' },
    'sono': { parent: 'mental', title: 'Qualidade do Sono' },
    'pdca-mental-autoregulacao': { parent: 'mental', title: 'Termômetro das Emoções' },
    'pdca-mental-resiliencia': { parent: 'mental', title: 'Desenvolvimento da Resiliência' },
    'pdca-mental-gestao-estresse-ansiedade': { parent: 'mental', title: 'Gestão do Estresse' },
    'pdca-mental-mindfulness': { parent: 'mental', title: 'Atenção Plena' },
    'pdca-mental-organizacao-tarefas': { parent: 'mental', title: 'Organização de Tarefas' },
    'pdca-mental-reducao-distracoes': { parent: 'mental', title: 'Redução de Distrações' },
    'pdca-mental-busca-proposito': { parent: 'mental', title: 'Busca por Propósito' },
    'pdca-mental-autocuidado': { parent: 'mental', title: 'Autocuidado' },
    'pdca-mental-granularidade': { parent: 'mental', title: 'Granularidade Emocional' },
    'pdca-mental-dicotomia': { parent: 'mental', title: 'Dicotomia do Controle' },
    'financeira': { parent: 'inicio', title: 'Saúde Financeira' },
    'leitura-guia-financeira': { parent: 'financeira', title: 'Guia de Leitura' },
    'familiar': { parent: 'inicio', title: 'Saúde Familiar' },
    'leitura-guia-familiar': { parent: 'familiar', title: 'Guia de Leitura' },
    'profissional': { parent: 'inicio', title: 'Saúde Profissional' },
    'social': { parent: 'inicio', title: 'Saúde Social' },
    'espiritual': { parent: 'inicio', title: 'Saúde Espiritual' },
    'leitura-guia-espiritual': { parent: 'espiritual', title: 'Guia de Leitura' },
    'preventiva': { parent: 'inicio', title: 'Saúde Preventiva' },
    'jejum-verde': { parent: 'fisica', title: 'Jejum Verde' },
    'food-gengibre': { parent: 'fisica', title: 'Gengibre' },
    'food-alho': { parent: 'fisica', title: 'Alho' },
    'food-brocolis': { parent: 'fisica', title: 'Brócolis' },
    'food-couveflor': { parent: 'fisica', title: 'Couve-flor' },
    'food-shitake': { parent: 'fisica', title: 'Shitake' },
    'food-lentilha': { parent: 'fisica', title: 'Lentilha' },
    'food-azeite': { parent: 'fisica', title: 'Azeite' },
    'food-morango': { parent: 'fisica', title: 'Morango' },
    'food-laranja': { parent: 'fisica', title: 'Laranja' },
    'food-maca': { parent: 'fisica', title: 'Maçã' },
    'food-cenoura': { parent: 'fisica', title: 'Cenoura' },
    'food-pimenta': { parent: 'fisica', title: 'Pimenta' },
    'food-ovo': { parent: 'fisica', title: 'Ovo' },
    'food-vinagremaca': { parent: 'fisica', title: 'Vinagre de Maçã' },
    'food-whey': { parent: 'fisica', title: 'Whey Protein' },
    'food-creatina': { parent: 'fisica', title: 'Creatina' },
    'food-curcuma': { parent: 'fisica', title: 'Cúrcuma' },
    'food-chaverde': { parent: 'fisica', title: 'Chá Verde' },
    'food-canela': { parent: 'fisica', title: 'Canela' },
    'food-linhaca': { parent: 'fisica', title: 'Linhaça' },
    'food-couve': { parent: 'fisica', title: 'Couve' },
    'food-rucula': { parent: 'fisica', title: 'Rúcula' },
    'food-agriao': { parent: 'fisica', title: 'Agrião' },
    'food-espinafre': { parent: 'fisica', title: 'Espinafre' },
    'food-folhasbeterraba': { parent: 'fisica', title: 'Folhas de Beterraba' },
    'food-almeirao': { parent: 'fisica', title: 'Almeirão' },
    'food-denteleao': { parent: 'fisica', title: 'Dente-de-Leão' },
};

function updateBreadcrumbs(pageKey: string) {
    const nav = document.getElementById('breadcrumb-nav');
    if (!nav) return;

    if (pageKey === 'inicio' || !pageHierarchy[pageKey]) {
        nav.innerHTML = '';
        return;
    }

    const trail: { key: string; title: string }[] = [];
    let currentKey: string | null = pageKey;

    while (currentKey && pageHierarchy[currentKey]) {
        trail.unshift({ key: currentKey, title: pageHierarchy[currentKey].title });
        currentKey = pageHierarchy[currentKey].parent;
    }
    
    const ol = document.createElement('ol');
    trail.forEach((item, index) => {
        const li = document.createElement('li') as HTMLLIElement;
        if (index === trail.length - 1) {
            li.textContent = item.title;
            li.setAttribute('aria-current', 'page');
            li.className = 'breadcrumb-current';
        } else {
            const a = document.createElement('a') as HTMLAnchorElement;
            a.href = `#${item.key}`;
            a.dataset.page = item.key;
            a.textContent = item.title;
            li.appendChild(a);
        }
        ol.appendChild(li);
    });

    nav.innerHTML = '';
    nav.appendChild(ol);
}

function updateActiveNav(pageKey: string) {
    const navLinks = document.querySelectorAll('.sidebar-links a') as NodeListOf<HTMLElement>;
    const navSummaries = document.querySelectorAll('.sidebar-links summary') as NodeListOf<HTMLElement>;

    navLinks.forEach(link => link.classList.remove('active'));
    navSummaries.forEach(summary => summary.classList.remove('active'));

    const activeLink = document.querySelector(`.sidebar-links a[href="#${pageKey}"]`) as HTMLElement | null;
    if (activeLink) {
        activeLink.classList.add('active');
        const parentDetails = activeLink.closest('details');
        if (parentDetails) {
            const parentSummary = parentDetails.querySelector('summary') as HTMLElement | null;
            parentSummary?.classList.add('active');
            if (!parentDetails.open) {
                parentDetails.open = true;
            }
        }
    } else {
        const hierarchy = pageHierarchy[pageKey];
        if (hierarchy && hierarchy.parent) {
            const parentSummary = document.querySelector(`summary[data-page-parent="${hierarchy.parent}"]`) as HTMLElement | null;
            if (parentSummary) {
                parentSummary.classList.add('active');
                const parentDetails = parentSummary.closest('details');
                if (parentDetails && !parentDetails.open) {
                    parentDetails.open = true;
                }
            }
        }
    }
}


export function initRouter(pageModulesMap: typeof pageModuleImports, tts: typeof ttsReader) {
    const loadedJSModules: { [key: string]: any } = {};

    const router = async () => {
        const pageContentWrapper = document.getElementById('page-content-wrapper');
        const operationId = `router-nav-${Date.now()}`;
        
        loadingManager.start(operationId);
        tts.stop();
        const hash = window.location.hash.substring(1) || 'inicio';
    
        let pageToLoad = hash;
        let anchorId: string | null = null;
        
        // --- 1. Resolve which page HTML to load ---
        
        // Check if the page exists in our static map
        let pageHtml = htmlModules[pageToLoad];

        // If not found directly, check hierarchy (e.g., hash is a sub-section anchor)
        if (!pageHtml && pageHierarchy[hash]) {
            const hierarchyEntry = pageHierarchy[hash];
            if (hierarchyEntry && hierarchyEntry.parent) {
                // Try loading parent
                const parentKey = hierarchyEntry.parent;
                if (htmlModules[parentKey]) {
                    pageToLoad = parentKey;
                    anchorId = hash;
                    pageHtml = htmlModules[parentKey];
                }
            }
        }

        // If still not found, default to 'inicio'
        if (!pageHtml) {
            console.warn(`Page ${hash} not found, redirecting to inicio.`);
            pageToLoad = 'inicio';
            pageHtml = htmlModules['inicio'];
        }
    
        const navKeyForStyle = pageToLoad.startsWith('food-') ? 'fisica' : pageToLoad;
        updateBreadcrumbs(hash); // Use original hash for breadcrumbs
        updateActiveNav(navKeyForStyle);
    
        if (!pageContentWrapper) {
            console.error('#page-content-wrapper not found!');
            loadingManager.stop(operationId);
            return;
        }
    
        const loadContent = async () => {
            if (!pageHtml) {
                throw new Error(`Content empty for ${pageToLoad}`);
            }

            pageContentWrapper.innerHTML = DOMPurify.sanitize(pageHtml, { ADD_ATTR: ['target'] });

            // --- 2. Load associated JavaScript module if it exists ---
            if (pageModulesMap[pageToLoad]) {
                const moduleKey = pageToLoad;
                let pageModule = loadedJSModules[moduleKey];
                if (!pageModule) {
                    pageModule = await pageModulesMap[moduleKey]();
                    loadedJSModules[moduleKey] = pageModule;
                }
                
                if (pageModule.setup) {
                    performanceMonitor.measure(`${moduleKey}::setup`, pageModule.setup);
                }
                if (pageModule.show) {
                    performanceMonitor.measure(`${moduleKey}::show`, pageModule.show);
                }
            }
        };

        try {
            await performanceMonitor.measureAsync(`loadPage::${pageToLoad}`, () => 
                errorHandler.wrap(loadContent, 'router.loadContent')
            );
        } catch (error) {
            // Error is handled by errorHandler, show generic error UI
            pageContentWrapper.innerHTML = `<div class="content-section" style="text-align: center;"><h2>Erro ao carregar</h2><p>Não foi possível exibir o conteúdo.</p></div>`;
        } finally {
            if (anchorId) {
                // Wait for DOM update
                setTimeout(() => {
                    const element = document.getElementById(anchorId!);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                pageContentWrapper.scrollTo(0, 0);
            }
            loadingManager.stop(operationId);
        }
    };

    window.addEventListener('hashchange', router);
    window.addEventListener('popstate', router);
    router(); // Initial load
}