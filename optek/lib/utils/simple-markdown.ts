/**
 * lib/utils/simple-markdown.ts
 *
 * Lightweight markdown-to-HTML converter for AI streaming output.
 * Supports: **bold**, *italic*, `code`, - lists, headers, line breaks.
 * No external dependencies.
 */

/**
 * Convert a subset of markdown to safe HTML for rendering in prose containers.
 * Only handles patterns commonly output by LLMs in streaming responses.
 */
export function markdownToHtml(md: string): string {
  return md
    // Escape HTML entities first (prevent XSS)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers (## and ###)
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-4 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-5 mb-2">$1</h3>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    // Inline code `text`
    .replace(/`([^`]+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
    // Unordered list items (- item)
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="space-y-1 my-2">$1</ul>')
    // Numbered list items (1. item)
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Paragraphs: double newline → paragraph break
    .replace(/\n\n/g, '</p><p class="my-2">')
    // Single newline → <br>
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^/, '<p class="my-2">')
    .replace(/$/, '</p>')
    // Clean up empty paragraphs
    .replace(/<p class="my-2"><\/p>/g, '')
}
