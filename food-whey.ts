// This file is a placeholder for the food-whey page logic.
// It ensures the router can load the page without errors.

export function setup(): void {
    // Page is static, no specific setup needed.
}

export function show(): void {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
}
