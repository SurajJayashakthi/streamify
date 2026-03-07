/**
 * Decodes HTML entities like &#39; into their literal character representations
 */
export function decodeHTML(html: string): string {
    if (typeof window === 'undefined') {
        // Basic fallback for server-side
        return html
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}
