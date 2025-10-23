// alongamento.ts
// Contains logic for the "Mobilidade e Alongamento" page.

export function setup(): void {
    // Page is static, no specific setup is needed.
}

export function show(): void {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
}
