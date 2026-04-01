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
    // Code blocks (```...```) — before other transforms
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-md p-3 text-xs my-3 overflow-x-auto"><code>$1</code></pre>')
    // Horizontal rules (--- or ___)
    .replace(/^-{3,}$/gm, '<hr class="my-4 border-border"/>')
    .replace(/^_{3,}$/gm, '<hr class="my-4 border-border"/>')
    // Emoji section headers (lines like "📊 TITLE" or "⚠️ TITLE")
    .replace(/^((?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}])+)\s+(.+)$/gmu,
      '<div class="flex items-center gap-2 mt-5 mb-2"><span class="text-lg">$1</span><span class="font-semibold text-sm">$2</span></div>')
    // Headers (# through ####)
    .replace(/^#### (.+)$/gm, '<h5 class="font-semibold text-sm mt-3 mb-1">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-4 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-5 mb-2">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-lg mt-6 mb-3">$1</h2>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    // Inline code `text`
    .replace(/`([^`]+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
    // Checkmarks (✓ and ✗)
    .replace(/✓/g, '<span class="text-green-600">✓</span>')
    .replace(/✗/g, '<span class="text-red-600">✗</span>')
    // Unordered list items (- item)
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="space-y-1.5 my-2">$1</ul>')
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

/** Strip markdown formatting from text (for displaying in UI elements like task labels) */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')     // *italic* → italic
    .replace(/`(.+?)`/g, '$1')       // `code` → code
    .replace(/^#+\s+/gm, '')         // ## header → header
    .trim()
}
