import type { JSONContent } from '@tiptap/react';
import type { ContentBlock } from '@/data/blogs';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function serializeInlineNodes(nodes?: JSONContent[]): string {
  if (!nodes || nodes.length === 0) return '';

  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '<br />';
      if (node.type !== 'text') {
        return serializeInlineNodes(node.content);
      }

      let html = escapeHtml(node.text || '');
      for (const mark of node.marks || []) {
        if (mark.type === 'bold') {
          html = `<strong>${html}</strong>`;
        } else if (mark.type === 'italic') {
          html = `<em>${html}</em>`;
        } else if (mark.type === 'underline') {
          html = `<u>${html}</u>`;
        } else if (mark.type === 'strike') {
          html = `<s>${html}</s>`;
        } else if (mark.type === 'link') {
          const href = String(mark.attrs?.href || '#').replace(/"/g, '&quot;');
          html = `<a href="${href}" class="blog-inline-link">${html}</a>`;
        }
      }
      return html;
    })
    .join('');
}

function serializeListItems(listContent?: JSONContent[]): string {
  if (!listContent) return '';
  return listContent
    .filter((item) => item.type === 'listItem')
    .map((item) => {
      const inner = (item.content || [])
        .map((child) => serializeInlineNodes(child.content))
        .join(' ');
      return `<li>${inner}</li>`;
    })
    .join('');
}

/**
 * Converts a Tiptap document JSON AST into structured ContentBlock[]
 * for both frontend rendering and Sanity Portable Text serialization.
 */
export function tiptapJsonToContentBlocks(doc: JSONContent): ContentBlock[] {
  const nodes = doc?.content || [];
  const blocks: ContentBlock[] = [];
  let idx = 0;

  for (const node of nodes) {
    const key = `cb_${Date.now()}_${idx++}`;

    if (node.type === 'heading') {
      const level = Number(node.attrs?.level || 3);
      const html = serializeInlineNodes(node.content);
      if (html.trim()) {
        blocks.push({
          _key: key,
          type: level >= 4 ? 'h4' : 'h3',
          text: html,
        });
      }
      continue;
    }

    if (node.type === 'blockquote') {
      const html = (node.content || [])
        .map((child) => serializeInlineNodes(child.content))
        .filter(Boolean)
        .join('<br />');
      if (html.trim()) {
        blocks.push({
          _key: key,
          type: 'quote',
          text: html,
        });
      }
      continue;
    }

    if (node.type === 'bulletList') {
      const html = serializeListItems(node.content);
      if (html) {
        blocks.push({
          _key: key,
          type: 'ul',
          text: html,
        });
      }
      continue;
    }

    if (node.type === 'orderedList') {
      const html = serializeListItems(node.content);
      if (html) {
        blocks.push({
          _key: key,
          type: 'ol',
          text: html,
        });
      }
      continue;
    }

    if (node.type === 'horizontalRule') {
      blocks.push({ _key: key, type: 'hr' });
      continue;
    }

    if (node.type === 'image') {
      const src = String(node.attrs?.src || '');
      if (src) {
        blocks.push({
          _key: key,
          type: 'img',
          src,
          alt: String(node.attrs?.alt || ''),
        });
      }
      continue;
    }

    if (node.type === 'paragraph') {
      const html = serializeInlineNodes(node.content);
      if (html.trim()) {
        blocks.push({
          _key: key,
          type: 'p',
          text: html,
        });
      }
    }
  }

  return blocks;
}

/**
 * Converts existing ContentBlock[] from Sanity/JSON into continuous HTML for Tiptap.
 */
export function contentBlocksToHtml(blocks?: ContentBlock[]): string {
  if (!blocks || blocks.length === 0) return '<p></p>';

  return blocks
    .map((b) => {
      if (b.type === 'h3') return `<h3>${b.text || ''}</h3>`;
      if (b.type === 'h4') return `<h4>${b.text || ''}</h4>`;
      if (b.type === 'quote') return `<blockquote><p>${b.text || ''}</p></blockquote>`;
      if (b.type === 'ul') {
        const inner = (b.text || '').includes('<li') ? b.text : `<li>${b.text || ''}</li>`;
        return `<ul>${inner}</ul>`;
      }
      if (b.type === 'ol') {
        const inner = (b.text || '').includes('<li') ? b.text : `<li>${b.text || ''}</li>`;
        return `<ol>${inner}</ol>`;
      }
      if (b.type === 'hr') return `<hr />`;
      if (b.type === 'img' && b.src) {
        const alt = (b.alt || '').replace(/"/g, '&quot;');
        const src = b.src.replace(/"/g, '&quot;');
        return `<img src="${src}" alt="${alt}" />`;
      }
      return `<p>${b.text || ''}</p>`;
    })
    .join('');
}

