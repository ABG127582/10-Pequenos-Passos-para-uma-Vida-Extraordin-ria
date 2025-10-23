// router.ts
// This module handles all client-side routing and page content loading.

import { ttsReader } from './tts';
import { loadingManager } from './loadingManager';
import { errorHandler } from './errorHandler';
import { performanceMonitor } from './performance';

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
    'alimentacao-forte': () => import('./alimentacao-forte'),
    'jejum-verde': () => import('./jejum-verde'),
    'planejamento-diario': () => import('./planejamento-diario'),
    'tarefas': () => import('./tarefas'),
    'leitura-guia-fisica': () => import('./leitura-guia-fisica'),
    'leitura-guia-mental': () => import('./leitura-guia-mental'),
    'leitura-guia-financeira': () => import('./leitura-guia-financeira'),
    'leitura-guia-familiar': () => import('./leitura-guia-familiar'),
    'leitura-guia-espiritual': () => import('./leitura-guia-espiritual'),
    // Use extension-less import to allow Vite's resolver to handle TSX compilation
    // FIX: Explicitly import .tsx file to avoid ambiguity with an empty .ts file.
    'termometro-emocional': () => import('./termometro-emocional.tsx'),
    'reflexoes': () => import('./reflexoes'),
    'conquistas': () => import('./conquistas'),
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
    'food-whey': () => import('./food-whey'),
    'food-creatina': () => import('./food-creatina'),
    'food-curcuma': () => import('./food-curcuma'),
    'food-chaverde': () => import('./food-chaverde'),
    'food-canela': () => import('./food-canela'),
    'food-linhaca': () => import('./food-linhaca'),
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

const pageHierarchy: { [key: string]: { parent: string | null; title: string } } = {
    'inicio': { parent: null, title: 'Início' },
    'fisica': { parent: 'inicio', title: 'Saúde Física' },
    'mental': { parent: 'inicio', title: 'Saúde Mental' },
    'financeira': { parent: 'inicio', title: 'Saúde Financeira' },
    'familiar': { parent: 'inicio', title: 'Saúde Familiar' },
    'profissional': { parent: 'inicio', title: 'Saúde Profissional' },
    'social': { parent: 'inicio', title: 'Saúde Social' },
    'espiritual': { parent: 'inicio', title: 'Saúde Espiritual' },
    'preventiva': { parent: 'inicio', title: 'Saúde Preventiva' },
    'leitura-guia-fisica': { parent: 'fisica', title: 'Guia de Leitura (Física)' },
    'alongamento': { parent: 'fisica', title: 'Mobilidade e Alongamento' },
    'alimentacao-forte': { parent: 'fisica', title: 'Guia de Alimentação' },
    'jejum-verde': { parent: 'fisica', title: 'Jejum Verde' },
    'leitura-guia-mental': { parent: 'mental', title: 'Guia de Leitura (Mental)' },
    'sono': { parent: 'mental', title: 'Qualidade do Sono' },
    'termometro-emocional': { parent: 'mental', title: 'Termômetro Emocional' },
    'leitura-guia-financeira': { parent: 'financeira', title: 'Guia de Leitura (Financeira)' },
    'leitura-guia-familiar': { parent: 'familiar', title: 'Guia de Leitura (Familiar)' },
    'leitura-guia-espiritual': { parent: 'espiritual', title: 'Guia de Leitura (Espiritual)' },
    'planejamento-diario': { parent: 'inicio', title: 'Planejamento Diário' },
    'tarefas': { parent: 'inicio', title: 'Caixa de Entrada' },
    'reflexoes': { parent: 'inicio', title: 'Reflexões' },
    'conquistas': { parent: 'inicio', title: 'Minhas Conquistas' },
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
    'food-couve': { parent: 'fisica', title: 'Couve' },
    'food-rucula': { parent: 'fisica', title: 'Rúcula' },
    'food-agriao': { parent: 'fisica', title: 'Agrião' },
    'food-espinafre': { parent: 'fisica', title: 'Espinafre' },
    'food-folhasbeterraba': { parent: 'fisica', title: 'Folhas de Beterraba' },
    'food-almeirao': { parent: 'fisica', title: 'Almeirão' },
    'food-denteleao': { parent: 'fisica', title: 'Dente-de-Leão' },
    'food-whey': { parent: 'fisica', title: 'Whey Protein' },
    'food-creatina': { parent: 'fisica', title: 'Creatina' },
    'food-curcuma': { parent: 'fisica', title: 'Cúrcuma' },
    'food-chaverde': { parent: 'fisica', title: 'Chá Verde' },
    'food-canela': { parent: 'fisica', title: 'Canela' },
    'food-linhaca': { parent: 'fisica', title: 'Linhaça' },
    'pdca-fisica-estresse': { parent: 'fisica', title: 'Gestão de Estresse Físico' },
    'pdca-mental-granularidade': { parent: 'mental', title: 'Granularidade Emocional' },
    'pdca-mental-dicotomia': { parent: 'mental', title: 'Dicotomia do Controle' },
    'pdca-mental-resiliencia': { parent: 'mental', title: 'Desenvolvimento da Resiliência' },
    'pdca-mental-gestao-estresse-ansiedade': { parent: 'mental', title: 'Gestão de Estresse e Ansiedade' },
    'pdca-mental-mindfulness': { parent: 'mental', title: 'Atenção Plena e Meditação' },
    'pdca-mental-organizacao-tarefas': { parent: 'mental', title: 'Organização e Priorização' },
    'pdca-mental-reducao-distracoes': { parent: 'mental', title: 'Redução de Distrações' },
    'pdca-mental-busca-proposito': { parent: 'mental', title: 'Busca por Propósito' },
    'pdca-mental-autocuidado': { parent: 'mental', title: 'Autocuidado e Autocompaixão' },
    'pdca-espiritual-valores': { parent: 'espiritual', title: 'Reflexão sobre Valores' },
    'pdca-espiritual-intencoes': { parent: 'espiritual', title: 'Definir Intenções Diárias' },
    'pdca-espiritual-meditacao': { parent: 'espiritual', title: 'Atenção Plena (Mindfulness)' },
    'pdca-espiritual-gratidao': { parent: 'espiritual', title: 'Prática da Gratidão' },
    'pdca-espiritual-compaixao': { parent: 'espiritual', title: 'Meditação da Bondade Amorosa' },
    'pdca-espiritual-awe': { parent: 'espiritual', title: 'Busca pela Admiração (Awe)' },
    'pdca-espiritual-servico': { parent: 'espiritual', title: 'Servir à Comunidade' },
    'pdca-espiritual-filosofia': { parent: 'espiritual', title: 'Exploração de Filosofias' },
    'pdca-familiar-escuta-ativa': { parent: 'familiar', title: 'Escuta Ativa e Empática' },
    'pdca-familiar-dialogo-aberto': { parent: 'familiar', title: 'Comunicação Não-Violenta' },
    'pdca-familiar-tempo-qualidade': { parent: 'familiar', title: 'Rituais de Tempo de Qualidade' },
    'pdca-familiar-linguagens-amor': { parent: 'familiar', title: '5 Linguagens do Amor' },
    'pdca-financeira-orcamento': { parent: 'financeira', title: 'Criação de Orçamento' },
    'pdca-financeira-reserva': { parent: 'financeira', title: 'Reserva de Emergência' },
    'pdca-financeira-investimentos': { parent: 'financeira', title: 'Introdução a Investimentos' },
    'pdca-profissional-habilidades-tecnicas': { parent: 'profissional', title: 'Estado de Flow' },
    'pdca-profissional-habilidades-comportamentais': { parent: 'profissional', title: 'Mentalidade de Crescimento' },
    'pdca-profissional-avaliacao-desempenho': { parent: 'profissional', title: 'Prevenção de Burnout' },
    'pdca-social-identificar-rede': { parent: 'social', title: 'Mapear Tribo Íntima' },
    'pdca-social-manter-amizades': { parent: 'social', title: 'Nutrir Amizades' },
    'pdca-social-novas-conexoes': { parent: 'social', title: 'Criar Novas Conexões' },
};

const pageModulesCache = new Map<string, any>();
let currentPageKey: string | null = null;

function updateNavigationState(pageKey: string) {
    const breadcrumbsNav = document.getElementById('breadcrumb-nav');
    if (breadcrumbsNav) {
        const path: { key: string; title: string }[] = [];
        let current: string | null = pageKey;
        while (current && pageHierarchy[current]) {
            path.unshift({ key: current, title: pageHierarchy[current].title });
            current = pageHierarchy[current].parent;
        }

        const breadcrumbList = document.createElement('ol');
        breadcrumbList.innerHTML = path.map((item, index) => {
            const isLast = index === path.length - 1;
            return isLast
                ? `<li class="breadcrumb-current" aria-current="page">${item.title}</li>`
                : `<li><a href="#${item.key}" data-page="${item.key}">${item.title}</a></li>`;
        }).join('');
        
        breadcrumbsNav.innerHTML = ''; // Clear previous
        breadcrumbsNav.appendChild(breadcrumbList);
    }

    document.querySelectorAll('.sidebar-links [data-page], .sidebar-links [data-page-parent]').forEach(el => {
        const link = el as HTMLElement;
        const linkKey = link.dataset.page || link.dataset.pageParent;
        let isMatch = linkKey === pageKey;
        
        let current: string | null = pageKey;
        while(current && pageHierarchy[current]) {
            if (pageHierarchy[current].parent === linkKey) {
                isMatch = true;
                break;
            }
            current = pageHierarchy[current].parent;
        }

        if (isMatch) {
            link.classList.add('active');
            const parentDetails = link.closest('details');
            if (parentDetails) {
                parentDetails.open = true;
            }
        } else {
            link.classList.remove('active');
        }
    });
}

async function loadPage(pageKey: string, tts: typeof ttsReader) {
    if (!pageKey) pageKey = 'inicio';
    if (pageKey === currentPageKey) return;

    loadingManager.start('router');
    tts.stop();

    const pageContentWrapper = document.getElementById('page-content-wrapper');
    if (!pageContentWrapper) {
        console.error('Fatal: #page-content-wrapper not found in index.html.');
        loadingManager.stop('router');
        return;
    }

    try {
        await performanceMonitor.measureAsync(`load page: ${pageKey}`, async () => {
            const moduleLoader = pageModuleImports[pageKey];
            if (!moduleLoader) {
                throw new Error(`Page module not found for key: ${pageKey}`);
            }
            
            const isReactComponent = pageKey === 'termometro-emocional';

            if (isReactComponent) {
                // Handle React component rendering
                const ReactDOM = await import('react-dom/client');
                const React = await import('react');
                const module = await moduleLoader();
                const Component = module.default;
                
                // Ensure a unique root container for React
                const reactRootId = `react-root-${pageKey}`;
                pageContentWrapper.innerHTML = `<div id="${reactRootId}" data-react-root></div>`;
                const rootElement = document.getElementById(reactRootId);

                if (rootElement) {
                    const root = ReactDOM.createRoot(rootElement);
                    root.render(React.createElement(Component));
                } else {
                    throw new Error(`React root element #${reactRootId} not found after injection.`);
                }
            } else {
                // Handle standard HTML + TS module pages
                const response = await fetch(`${pageKey}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch page content: ${pageKey}.html (Status: ${response.status})`);
                }
                const html = await response.text();
                pageContentWrapper.innerHTML = html;
                
                let module = pageModulesCache.get(pageKey);
                if (!module) {
                    module = await moduleLoader();
                    pageModulesCache.set(pageKey, module);
                    if (module.setup) module.setup();
                    // Keep compatibility with old task page setup
                    if (module.setupTarefasPage) module.setupTarefasPage();
                }
                if (module.show) module.show();
                if (module.showTarefasPage) module.showTarefasPage();
            }
            
            updateNavigationState(pageKey);
            currentPageKey = pageKey;

            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.scrollTop = 0;
        });
    } catch (err) {
        errorHandler.handle(err as Error, `loading page '${pageKey}'`);
        window.location.hash = 'inicio';
    } finally {
        loadingManager.stop('router');
    }
}

export function initRouter(pageModules: { [key: string]: () => Promise<any> }, tts: typeof ttsReader) {
    const handleRouteChange = () => {
        const pageKey = window.location.hash.substring(1) || 'inicio';
        loadPage(pageKey, tts);
    };

    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange(); 
}
