// router.ts
// This module handles all client-side routing and page content loading.

import DOMPurify from 'dompurify';
import { ttsReader } from './tts';
import { loadingManager } from './loadingManager';
import { errorHandler } from './errorHandler';
import { performanceMonitor } from './performance';
import { CONFIG } from './constants';

// --- Page Module Dynamic Imports for Lazy Loading ---
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
    'reflexoes-diarias': () => import('./reflexoes-diarias'),
    'alimentacao-forte': () => import('./alimentacao-forte'),
    'jejum-verde': () => import('./jejum-verde'),
    'planejamento-diario': () => import('./planejamento-diario'),
    'tarefas': () => import('./tarefas'),
    'leitura-guia-fisica': () => import('./leitura-guia-fisica'),
    'leitura-guia-mental': () => import('./leitura-guia-mental'),
    'leitura-guia-financeira': () => import('./leitura-guia-financeira'),
    'leitura-guia-familiar': () => import('./leitura-guia-familiar'),
    'leitura-guia-espiritual': () => import('./leitura-guia-espiritual'),
    'termometro-emocional': () => import('./termometro-emocional'),
    'food-gengibre': () => import('./food-gengibre'),
    'food-alho': () => import('./food-alho'),
    'food-brocolis': () => import('./food-brocolis'),
    'food-couveflor': () => import('./food-couveflor'),
    'food-shitake': () => import('./food-shitake'),
    'food-lentilha': () => import('./food-lentilha'),
    'food-azeite': () => import('./food-azeite'),
    'food-morango': () => import('./food-morango'),
    'food-laranja': () => import('./food-laranja'),
    'food-maca': () => import('./food-maca'),
    'food-cenoura': () => import('./food-cenoura'),
    'food-pimenta': () => import('./food-pimenta'),
    'food-ovo': () => import('./food-ovo'),
    'food-vinagremaca': () => import('./food-vinagremaca'),
    'food-couve': () => import('./food-couve'),
    'food-rucula': () => import('./food-rucula'),
    'food-agriao': () => import('./food-agriao'),
    'food-espinafre': () => import('./food-espinafre'),
    'food-folhasbeterraba': () => import('./food-folhasbeterraba'),
    'food-almeirao': () => import('./food-almeirao'),
    'food-denteleao': () => import('./food-denteleao'),
    'pdca-fisica-estresse': () => import('./pdca-fisica-estresse'),
    'pdca-mental-granularidade': () => import('./pdca-mental-granularidade'),
    'pdca-mental-dicotomia': () => import('./pdca-mental-dicotomia'),
    'pdca-mental-resiliencia': () => import('./pdca-mental-resiliencia'),
    'pdca-mental-gestao-estresse-ansiedade': () => import('./pdca-mental-gestao-estresse-ansiedade'),
    'pdca-mental-mindfulness': () => import('./pdca-mental-mindfulness'),
    'pdca-mental-organizacao-tarefas': () => import('./pdca-mental-organizacao-tarefas'),
    'pdca-mental-reducao-distracoes': () => import('./pdca-mental-reducao-distracoes'),
    'pdca-mental-busca-proposito': () => import('./pdca-mental-busca-proposito'),
    'pdca-mental-autocuidado': () => import('./pdca-mental-autocuidado'),
    'pdca-espiritual-valores': () => import('./pdca-espiritual-valores'),
    'pdca-espiritual-intencoes': () => import('./pdca-espiritual-intencoes'),
    'pdca-espiritual-meditacao': () => import('./pdca-espiritual-meditacao'),
    'pdca-espiritual-gratidao': () => import('./pdca-espiritual-gratidao'),
    'pdca-espiritual-compaixao': () => import('./pdca-espiritual-compaixao'),
    'pdca-espiritual-awe': () => import('./pdca-espiritual-awe'),
    'pdca-espiritual-servico': () => import('./pdca-espiritual-servico'),
    'pdca-espiritual-filosofia': () => import('./pdca-espiritual-filosofia'),
    'pdca-familiar-escuta-ativa': () => import('./pdca-familiar-escuta-ativa'),
    'pdca-familiar-dialogo-aberto': () => import('./pdca-familiar-dialogo-aberto'),
    'pdca-familiar-tempo-qualidade': () => import('./pdca-familiar-tempo-qualidade'),
    'pdca-familiar-linguagens-amor': () => import('./pdca-familiar-linguagens-amor'),
    'pdca-financeira-orcamento': () => import('./pdca-financeira-orcamento'),
    'pdca-financeira-reserva': () => import('./pdca-financeira-reserva'),
    'pdca-financeira-investimentos': () => import('./pdca-financeira-investimentos'),
    'pdca-profissional-habilidades-tecnicas': () => import('./pdca-profissional-habilidades-tecnicas'),
    'pdca-profissional-habilidades-comportamentais': () => import('./pdca-profissional-habilidades-comportamentais'),
    'pdca-profissional-avaliacao-desempenho': () => import('./pdca-profissional-avaliacao-desempenho'),
    'pdca-social-identificar-rede': () => import('./pdca-social-identificar-rede'),
    'pdca-social-manter-amizades': () => import('./pdca-social-manter-amizades'),
    'pdca-social-novas-conexoes': () => import('./pdca-social-novas-conexoes'),
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
    'termometro-emocional': { parent: 'mental', title: 'Termômetro Emocional' },
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
    'planejamento-diario': { parent: 'inicio', title: 'Planejamento Diário' },
    'tarefas': { parent: 'inicio', title: 'Tarefas' },
    'reflexoes-diarias': { parent: 'inicio', title: 'Reflexões Diárias' },
    'jejum-verde': { parent: 'fisica', title: 'Jejum Verde' },
    'pdca-fisica-estresse': { parent: 'fisica', title: 'Gerenciamento do Estresse Físico' },
    'pdca-espiritual-valores': { parent: 'espiritual', title: 'Reflexão sobre Valores Pessoais' },
    'pdca-espiritual-intencoes': { parent: 'espiritual', title: 'Definir Claras Intenções Diárias' },
    'pdca-espiritual-meditacao': { parent: 'espiritual', title: 'Atenção Plena (Mindfulness)' },
    'pdca-espiritual-gratidao': { parent: 'espiritual', title: 'Prática da Gratidão' },
    'pdca-espiritual-compaixao': { parent: 'espiritual', title: 'Meditação da Bondade Amorosa' },
    'pdca-espiritual-awe': { parent: 'espiritual', title: 'Busca pela Admiração (Awe)' },
    'pdca-espiritual-servico': { parent: 'espiritual', title: 'Servir à Comunidade' },
    'pdca-espiritual-filosofia': { parent: 'espiritual', title: 'Exploração de Crenças e Filosofias' },
    'pdca-familiar-escuta-ativa': { parent: 'familiar', title: 'Praticar Escuta Ativa e Empática' },
    'pdca-familiar-dialogo-aberto': { parent: 'familiar', title: 'Comunicação Não-Violenta (CNV)' },
    'pdca-familiar-tempo-qualidade': { parent: 'familiar', title: 'Criar Rituais de Tempo de Qualidade' },
    'pdca-familiar-linguagens-amor': { parent: 'familiar', title: 'Praticar as 5 Linguagens do Amor' },
    'pdca-financeira-orcamento': { parent: 'financeira', title: 'Criação de Orçamento (Regra 50-15-35)' },
    'pdca-financeira-reserva': { parent: 'financeira', title: 'Criação de Reserva de Emergência' },
    'pdca-financeira-investimentos': { parent: 'financeira', title: 'Introdução a Investimentos' },
    'pdca-profissional-habilidades-tecnicas': { parent: 'profissional', title: 'Atingindo o Estado de Flow' },
    'pdca-profissional-habilidades-comportamentais': { parent: 'profissional', title: 'Mentalidade de Crescimento (Growth Mindset)' },
    'pdca-profissional-avaliacao-desempenho': { parent: 'profissional', title: 'Gerenciamento de Estresse e Burnout' },
    'pdca-social-identificar-rede': { parent: 'social', title: 'Mapear sua Tribo Íntima' },
    'pdca-social-manter-amizades': { parent: 'social', title: 'Nutrir Amizades Deliberadamente' },
    'pdca-social-novas-conexoes': { parent: 'social', title: 'Realizar a Primeira Micro-Interação' },
    'food-gengibre': { parent: 'fisica', title: 'Gengibre' },
    'food-alho': { parent: 'fisica', title: 'Alho' },
    'food-brocolis': { parent: 'fisica', title: 'Brócolis' },
    'food-couveflor': { parent: 'fisica', title: 'Couve-flor' },
    'food-shitake': { parent: 'fisica', title: 'Shitake' },
    'food-lentilha': { parent: 'fisica', title: 'Lentilha' },
    'food-azeite': { parent: 'fisica', title: 'Azeite Extra Virgem' },
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

// --- Intelligent Caching for Page HTML ---
interface CacheEntry {
    content: string;
    timestamp: number;
}
class PageCache {
    private cache = new Map<string, CacheEntry>();
    private readonly MAX_SIZE = CONFIG.MAX_CACHE_SIZE;
    private readonly TTL = CONFIG.CACHE_TTL;

    set(key: string, content: string) {
        if (this.cache.size >= this.MAX_SIZE) {
            this.evictOldest();
        }
        this.cache.set(key, { content, timestamp: Date.now() });
    }

    get(key: string): string | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.content;
    }

    private evictOldest() {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;
        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}
const pageCache = new PageCache();

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
    const pageContentWrapper = document.getElementById('page-content-wrapper');
    const loadedJSModules: { [key: string]: any } = {};

    const router = async () => {
        const operationId = `router-nav-${Date.now()}`;
        loadingManager.start(operationId);
        tts.stop();
        const hash = window.location.hash.substring(1) || 'inicio';
    
        let pageToLoad = 'inicio';
        let anchorId: string | null = null;
        
        if (pageModulesMap[hash] || pageHierarchy[hash]) {
            // Check if it's a sub-page that should load a parent's module
            const hierarchyEntry = pageHierarchy[hash];
            if (hierarchyEntry && pageModulesMap[hierarchyEntry.parent as string] && !pageModulesMap[hash]) {
                pageToLoad = hierarchyEntry.parent as string;
                anchorId = hash;
            } else {
                pageToLoad = hash;
            }
        } else {
            console.warn(`Hash "${hash}" not found. Defaulting to inicio.`);
            pageToLoad = 'inicio';
        }
    
        const navKeyForStyle = pageToLoad.startsWith('food-') ? 'fisica' : pageToLoad;
        updateBreadcrumbs(hash);
        updateActiveNav(navKeyForStyle);
    
        if (!pageContentWrapper) {
            console.error('#page-content-wrapper not found!');
            loadingManager.stop(operationId);
            return;
        }
    
        pageContentWrapper.innerHTML = '<p style="text-align:center; padding: 40px;">Carregando...</p>';
    
        const loadContent = async () => {
            let pageHtml = pageCache.get(pageToLoad);
            if (!pageHtml) {
                const response = await fetch(`${pageToLoad}.html`);
                if (!response.ok) throw new Error(`Page not found: ${pageToLoad}.html`);
                pageHtml = await response.text();
                pageCache.set(pageToLoad, pageHtml);
            }
            pageContentWrapper.innerHTML = DOMPurify.sanitize(pageHtml, { ADD_ATTR: ['target'] });

            const moduleKey = pageModulesMap[pageToLoad] ? pageToLoad : pageHierarchy[pageToLoad]?.parent;

            if (moduleKey && pageModulesMap[moduleKey]) {
                let pageModule = loadedJSModules[moduleKey];
                if (!pageModule) {
                    pageModule = await pageModulesMap[moduleKey]();
                    loadedJSModules[moduleKey] = pageModule;
                    
                    // Handle renamed setup for 'tarefas' module
                    if (moduleKey === 'tarefas' && pageModule.setupTarefasPage) {
                         performanceMonitor.measure(`${moduleKey}::setupTarefasPage`, pageModule.setupTarefasPage);
                    } else if (pageModule.setup) {
                        performanceMonitor.measure(`${moduleKey}::setup`, pageModule.setup);
                    }
                }
                
                 // Handle renamed show for 'tarefas' module
                if (moduleKey === 'tarefas' && pageModule.showTarefasPage) {
                    performanceMonitor.measure(`${moduleKey}::showTarefasPage`, pageModule.showTarefasPage);
                } else if (pageModule.show) {
                    performanceMonitor.measure(`${moduleKey}::show`, pageModule.show);
                }
            }
        };

        try {
            await performanceMonitor.measureAsync(`loadPage::${pageToLoad}`, () => 
                errorHandler.wrap(loadContent, 'router.loadContent')
            );
        } catch (error) {
            // Error is already handled by errorHandler, just update UI
            pageContentWrapper.innerHTML = `<div class="content-section" style="text-align: center;"><h2>Página não encontrada</h2><p>Ocorreu um erro ao carregar o conteúdo.</p></div>`;
            updateBreadcrumbs('inicio');
            updateActiveNav('inicio');
        } finally {
            if (anchorId) {
                const element = document.getElementById(anchorId);
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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