// tarefas.ts
// Re-export core functions for backward compatibility
export { getTasks, getCategories, addTask, updateTask, deleteTask, saveData, loadData } from './task-core';
export { initTasks, openTaskModal } from './tarefas-modal';
export { setupTarefasPage, showTarefasPage } from './tarefas-page';
