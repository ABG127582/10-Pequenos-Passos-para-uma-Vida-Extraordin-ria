// tarefas.ts
import DOMPurify from 'dompurify';
import { debounce, trapFocus } from './utils';
import { getTasks, getCategories, addTask, updateTask, deleteTask, openTaskModal, Task, addCategory } from './task-store';

// --- TYPE DEFINITIONS ---
// Re-declare the global window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
        Chart: any;
    }
}

// --- Module-scoped state and elements for the Tarefas page ---
let currentFilter = 'all';
let currentSearch = '';
let currentCategoryFilter = 'all';
let currentPage = 1;
const tasksPerPage = 10;
let currentView = 'checklist'; // 'checklist' or 'table'
let categoryChart: any = null;
let removeFocusTrap: (() => void) | null = null;

const priorityMap: { [key in 'low' | 'medium' | 'high']: string } = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
};

const elements: { [key: string]: HTMLElement | null | any } = {
    container: null,
    checklistViewContainer: null,
    tableViewContainer: null,
    taskListBody: null,
    emptyStateMessage: null,
    addCategoryBtn: null,
    categoriesList: null,
    searchInput: null,
    filterSelect: null,
    checklistViewBtn: null,
    tableViewBtn: null,
    quickTaskInput: null,
    addTaskBtn: null,
    totalCountEl: null,
    completedCountEl: null,
    pendingCountEl: null,
    pageInfoEl: null,
    currentPageEl: null,
    totalPagesEl: null,
    prevPageBtn: null,
    nextPageBtn: null,
    categoryChartCanvas: null,
    chartNoData: null,
};

// --- UI RENDERING (for tarefas.html page) ---
const renderTarefasPage = () => {
    if (!elements.container) return; // Don't render if not on the page

    const allTasks = getTasks();
    const filteredTasks = getFilteredTasks(allTasks);
    updateCounts(allTasks);
    renderCategories();
    updatePagination(filteredTasks);
    
    const paginatedTasks = getPaginatedTasks(filteredTasks);

    if (currentView === 'checklist') {
        renderChecklistView(paginatedTasks);
        elements.checklistViewContainer.style.display = 'flex';
        elements.tableViewContainer.style.display = 'none';
    } else {
        renderTableView(paginatedTasks);
        elements.checklistViewContainer.style.display = 'none';
        elements.tableViewContainer.style.display = 'block';
    }

    elements.emptyStateMessage.style.display = filteredTasks.length === 0 ? 'block' : 'none';
    updateAnalytics(allTasks);
};

const getFilteredTasks = (allTasks: Task[]): Task[] => {
    let filtered = [...allTasks];
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(task => task.category === currentCategoryFilter);
    }
    if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(searchLower) || 
            task.description.toLowerCase().includes(searchLower)
        );
    }
    const today = new Date().toISOString().split('T')[0];
    switch (currentFilter) {
        case 'pending': filtered = filtered.filter(task => !task.completed); break;
        case 'completed': filtered = filtered.filter(task => task.completed); break;
        case 'overdue': filtered = filtered.filter(task => !task.completed && task.dueDate && task.dueDate < today); break;
        case 'high': case 'medium': case 'low': filtered = filtered.filter(task => task.priority === currentFilter); break;
    }
    return filtered.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
};

const getPaginatedTasks = (filteredTasks: Task[]): Task[] => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage);
};

const updateCounts = (allTasks: Task[]) => {
    if (!elements.totalCountEl || !elements.completedCountEl || !elements.pendingCountEl) return;
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    elements.totalCountEl.textContent = total.toString();
    elements.completedCountEl.textContent = completed.toString();
    elements.pendingCountEl.textContent = (total - completed).toString();
};

const renderCategories = () => {
    if (!elements.categoriesList || !elements.addCategoryBtn) return;
    const allCategories = getCategories();
    elements.categoriesList.innerHTML = '';
    elements.categoriesList.appendChild(elements.addCategoryBtn);

    const allTag = document.createElement('button');
    allTag.className = `category-tag ${currentCategoryFilter === 'all' ? 'active' : ''}`;
    allTag.textContent = 'Todas';
    allTag.dataset.category = 'all';
    elements.categoriesList.prepend(allTag);

    allCategories.forEach(cat => {
        const tag = document.createElement('button');
        tag.className = `category-tag ${currentCategoryFilter === cat ? 'active' : ''}`;
        tag.textContent = cat;
        tag.dataset.category = cat;
        elements.categoriesList.appendChild(tag);
    });
};

const updatePagination = (filteredTasks: Task[]) => {
    if (!elements.pageInfoEl || !elements.currentPageEl || !elements.totalPagesEl || !elements.prevPageBtn || !elements.nextPageBtn) return;
    const totalTasks = filteredTasks.length;
    const totalPages = Math.ceil(totalTasks / tasksPerPage) || 1;

    const startItem = totalTasks > 0 ? (currentPage - 1) * tasksPerPage + 1 : 0;
    const endItem = Math.min(currentPage * tasksPerPage, totalTasks);

    elements.pageInfoEl.textContent = `Mostrando ${startItem}-${endItem} de ${totalTasks}`;
    elements.currentPageEl.textContent = currentPage.toString();
    elements.totalPagesEl.textContent = totalPages.toString();

    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage === totalPages;
};

const renderTableView = (tasksToRender: Task[]) => {
    if (!elements.taskListBody) return;
    elements.taskListBody.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    tasksToRender.forEach(task => {
        const row = document.createElement('tr');
        row.className = task.completed ? 'completed' : '';
        row.dataset.taskId = task.id;
        const isOverdue = !task.completed && task.dueDate && task.dueDate < today;
        const dueDateText = task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data';
        const priorityText = priorityMap[task.priority] || 'Média';
        const timeText = task.startTime ? `<span class="item-time"><i class="fas fa-clock"></i> ${task.startTime}</span>` : '';
        row.innerHTML = `
            <td><input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Marcar tarefa como concluída"></td>
            <td>
                <span class="task-title">${DOMPurify.sanitize(task.title)}</span>
                <span class="task-description-preview">${DOMPurify.sanitize(task.description)}</span>
            </td>
            <td style="${isOverdue ? 'color: var(--color-error); font-weight: bold;' : ''}">${dueDateText} ${timeText}</td>
            <td><span class="priority-tag priority-${task.priority}">${priorityText}</span></td>
            <td>${task.category ? `<span class="task-category-badge">${DOMPurify.sanitize(task.category)}</span>` : ''}</td>
            <td class="task-actions-cell">
                <button class="action-btn edit" aria-label="Editar tarefa"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" aria-label="Excluir tarefa"><i class="fas fa-trash"></i></button>
            </td>
        `;
        elements.taskListBody.appendChild(row);
    });
};

const renderChecklistView = (tasksToRender: Task[]) => {
    if (!elements.checklistViewContainer) return;
    const allCategories = getCategories();
    elements.checklistViewContainer.innerHTML = '';
    
    const groupedTasks: { [key: string]: Task[] } = {};
    tasksToRender.forEach(task => {
        const category = task.category || 'Sem Categoria';
        if (!groupedTasks[category]) groupedTasks[category] = [];
        groupedTasks[category].push(task);
    });

    const orderedCategories = ['all', ...allCategories, 'Sem Categoria'].filter(cat => cat !== 'all');
    orderedCategories.forEach(catName => {
        if (groupedTasks[catName] && groupedTasks[catName].length > 0) {
             const groupEl = document.createElement('div');
             groupEl.className = 'checklist-category-group';
             groupEl.innerHTML = `<h3 class="checklist-category-title">${DOMPurify.sanitize(catName)}</h3>`;
             groupedTasks[catName].forEach(task => {
                const itemEl = document.createElement('div');
                const isOverdue = !task.completed && task.dueDate && task.dueDate < new Date().toISOString().split('T')[0];
                itemEl.className = `checklist-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
                itemEl.dataset.taskId = task.id;
                const priorityText = priorityMap[task.priority];
                const priorityDot = `<div class="priority-dot priority-dot-${task.priority}"></div> ${priorityText}`;
                const dueDateText = task.dueDate ? `<i class="fas fa-calendar-alt"></i> ${new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}` : '';
                const timeText = task.startTime ? `<span class="checklist-item-time"><i class="fas fa-clock"></i> ${task.startTime}</span>` : '';
                itemEl.innerHTML = `
                    <div class="checklist-item-main">
                        <input type="checkbox" class="checklist-item-checkbox task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Marcar tarefa como concluída">
                        <div class="checklist-item-content">
                            <div class="checklist-item-summary">
                                <span class="checklist-item-title">${DOMPurify.sanitize(task.title)}</span>
                                <button class="action-btn toggle-details" aria-label="Alternar detalhes" aria-expanded="false"><i class="fas fa-chevron-down"></i></button>
                            </div>
                            <div class="checklist-item-full-details">
                                <div class="details-inner-wrapper">
                                    <p class="checklist-item-description">${task.description ? DOMPurify.sanitize(task.description).replace(/\n/g, '<br>') : '<i>Sem descrição.</i>'}</p>
                                    <div class="checklist-item-meta">
                                        <div class="checklist-item-priority">${priorityDot}</div>
                                        <div class="checklist-item-date">${dueDateText}</div>
                                        ${timeText}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="checklist-item-actions">
                        <button class="action-btn edit" aria-label="Editar tarefa"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" aria-label="Excluir tarefa"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                groupEl.appendChild(itemEl);
            });
            elements.checklistViewContainer.appendChild(groupEl);
        }
    });
};

const updateAnalytics = (allTasks: Task[]) => {
    if (!elements.categoryChartCanvas || !elements.chartNoData) return;
    const Chart = window.Chart;
    if (!Chart) return;
    if (categoryChart) categoryChart.destroy();

    const categoryCounts: { [key: string]: number } = {};
    allTasks.forEach(task => {
        const category = task.category || 'Sem Categoria';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const chartLabels = Object.keys(categoryCounts);
    const chartData = Object.values(categoryCounts);

    if (allTasks.length === 0 || chartLabels.length === 0 || chartData.every(d => d === 0)) {
        elements.categoryChartCanvas.style.display = 'none';
        elements.chartNoData.style.display = 'block';
        return;
    }

    elements.categoryChartCanvas.style.display = 'block';
    elements.chartNoData.style.display = 'none';

    const ctx = elements.categoryChartCanvas.getContext('2d');
    const baseColors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#5a5c69', '#f8f9fc', '#6f42c1', '#fd7e14'];
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartLabels.map((_, i) => baseColors[i % baseColors.length]),
            }],
        },
        options: { maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } } },
    });
};


// --- EVENT HANDLERS (for tarefas.html page) ---

const handleActionClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    const taskEl = target.closest('[data-task-id]') as HTMLElement;
    if (!taskEl) return;

    if (target.closest('.toggle-details')) {
        taskEl.classList.toggle('details-expanded');
        target.closest('.toggle-details')?.setAttribute('aria-expanded', String(taskEl.classList.contains('details-expanded')));
        return;
    }

    const taskId = taskEl.dataset.taskId!;
    const allTasks = getTasks();
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    if (target.closest('.delete')) {
        if (await deleteTask(taskId)) {
            renderTarefasPage();
        }
    } else if (target.closest('.edit')) {
        openTaskModal(task);
    } else if (target.matches('.task-checkbox, .task-checkbox *')) {
        updateTask(taskId, { completed: !task.completed });
    }
};

const handleQuickAdd = () => {
    const title = elements.quickTaskInput!.value.trim();
    if (title) {
        addTask({
            title: title,
            category: currentCategoryFilter !== 'all' ? currentCategoryFilter as Task['category'] : '',
        });
        elements.quickTaskInput!.value = '';
        window.showToast('Tarefa rápida adicionada!', 'success');
    }
};

const handleCategoryAction = async (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.id === 'add-category-btn') {
        const newCategory = prompt('Digite o nome da nova categoria:');
        if (newCategory) {
            if (addCategory(newCategory)) {
                renderCategories();
                window.showToast('Categoria adicionada!', 'success');
            } else {
                window.showToast('Essa categoria já existe ou é inválida.', 'warning');
            }
        }
    } else if (target.classList.contains('category-tag')) {
        currentCategoryFilter = target.dataset.category || 'all';
        currentPage = 1;
        renderTarefasPage();
    }
};

// --- Page Lifecycle Functions ---

/**
 * Sets up event listeners and state for the dedicated Tasks page (#tarefas).
 */
export function setupTarefasPage() {
    const page = document.getElementById('page-tarefas');
    if (!page) return;

    elements.container = page;
    elements.checklistViewContainer = page.querySelector('#checklist-view-container');
    elements.tableViewContainer = page.querySelector('.table-wrapper');
    elements.taskListBody = page.querySelector('#task-list');
    elements.emptyStateMessage = page.querySelector('#empty-state-message');
    elements.addCategoryBtn = page.querySelector('#add-category-btn');
    elements.categoriesList = page.querySelector('#categories-list');
    elements.searchInput = page.querySelector('#search-input');
    elements.filterSelect = page.querySelector('#filter-select');
    elements.checklistViewBtn = page.querySelector('#checklist-view-btn');
    elements.tableViewBtn = page.querySelector('#table-view-btn');
    elements.quickTaskInput = page.querySelector('#quick-task-input');
    elements.addTaskBtn = page.querySelector('#add-task-btn');
    elements.totalCountEl = page.querySelector('#total-count');
    elements.completedCountEl = page.querySelector('#completed-count');
    elements.pendingCountEl = page.querySelector('#pending-count');
    elements.pageInfoEl = page.querySelector('.page-info');
    elements.currentPageEl = page.querySelector('#current-page');
    elements.totalPagesEl = page.querySelector('#total-pages');
    elements.prevPageBtn = page.querySelector('#prev-page-btn');
    elements.nextPageBtn = page.querySelector('#next-page-btn');
    elements.categoryChartCanvas = page.querySelector('#category-chart');
    elements.chartNoData = page.querySelector('#chart-no-data');

    elements.addTaskBtn?.addEventListener('click', () => openTaskModal());
    elements.quickTaskInput?.addEventListener('keypress', (e: KeyboardEvent) => { if (e.key === 'Enter') handleQuickAdd(); });
    
    elements.checklistViewContainer?.addEventListener('click', handleActionClick);
    elements.taskListBody?.addEventListener('click', handleActionClick);

    const debouncedRender = debounce(() => { currentPage = 1; renderTarefasPage(); }, 300);
    elements.searchInput?.addEventListener('input', () => { currentSearch = elements.searchInput!.value; debouncedRender(); });
    elements.filterSelect?.addEventListener('change', () => { currentFilter = elements.filterSelect!.value; currentPage = 1; renderTarefasPage(); });
    elements.categoriesList?.addEventListener('click', handleCategoryAction);
    
    elements.prevPageBtn?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTarefasPage(); } });
    elements.nextPageBtn?.addEventListener('click', () => { const allTasks = getTasks(); const totalPages = Math.ceil(getFilteredTasks(allTasks).length / tasksPerPage) || 1; if (currentPage < totalPages) { currentPage++; renderTarefasPage(); } });
    
    elements.checklistViewBtn?.addEventListener('click', () => { currentView = 'checklist'; elements.checklistViewBtn?.classList.add('active'); elements.tableViewBtn?.classList.remove('active'); renderTarefasPage(); });
    elements.tableViewBtn?.addEventListener('click', () => { currentView = 'table'; elements.tableViewBtn?.classList.add('active'); elements.checklistViewBtn?.classList.remove('active'); renderTarefasPage(); });

    document.body.addEventListener('datachanged:tasks', () => {
        if (window.location.hash === '#tarefas') {
            renderTarefasPage();
        }
    });
}

/**
 * Renders the content for the dedicated Tasks page when it is shown.
 */
export function showTarefasPage() {
    renderTarefasPage();
}
