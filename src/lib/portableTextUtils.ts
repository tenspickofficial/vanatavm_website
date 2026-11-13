import type { ContentBlock } from '@/data/blogs';

export interface PortableTextSpan {
  _key: string;
  _type: 'span';
  text: string;
  marks: string[];
}

export interface PortableTextMarkDef {
  _key: string;
  _type: 'link';
  href: string;
}

export interface PortableTextBlock {
  _key: string;
  _type: 'block' | 'image';
  style?: string;
  listItem?: 'bullet' | 'number';
  level?: number;
  markDefs?: PortableTextMarkDef[];
  children?: PortableTextSpan[];
  alt?: string;
  asset?: { _type: 'reference'; _ref: string };
}

/**
 * Parses an HTML string (with <b>, <strong>, <i>, <em>, <u>, <s>, <a href="...">)
 * into Sanity Portable Text spans and markDefs.
 */
export function parseHtmlToSpans(
  html: string,
  keyPrefix: string
): { children: PortableTextSpan[]; markDefs: PortableTextMarkDef[] } {
  const markDefs: PortableTextMarkDef[] = [];
  const children: PortableTextSpan[] = [];

  if (!html) {
    return {
      children: [{ _key: `${keyPrefix}_s0`, _type: 'span', text: '', marks: [] }],
      markDefs: [],
    };
  }

  // Normalize HTML tags and entities
  const normalized = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  const tagRegex = /(<\/?(?:strong|b|em|i|u|s|strike|del|a|span)(?:\s+[^>]*)?>)/gi;
  const parts = normalized.split(tagRegex);

  const activeMarks: string[] = [];
  let linkCounter = 0;
  let spanCounter = 0;

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('<') && part.endsWith('>')) {
      const lower = part.toLowerCase();

      if (lower.startsWith('<strong') || lower.startsWith('<b')) {
        if (!activeMarks.includes('strong')) activeMarks.push('strong');
      } else if (lower.startsWith('</strong') || lower.startsWith('</b')) {
        const idx = activeMarks.indexOf('strong');
        if (idx !== -1) activeMarks.splice(idx, 1);
      } else if (lower.startsWith('<em') || lower.startsWith('<i')) {
        if (!activeMarks.includes('em')) activeMarks.push('em');
      } else if (lower.startsWith('</em') || lower.startsWith('</i')) {
        const idx = activeMarks.indexOf('em');
        if (idx !== -1) activeMarks.splice(idx, 1);
      } else if (lower.startsWith('<u')) {
        if (!activeMarks.includes('underline')) activeMarks.push('underline');
      } else if (lower.startsWith('</u')) {
        const idx = activeMarks.indexOf('underline');
        if (idx !== -1) activeMarks.splice(idx, 1);
      } else if (lower.startsWith('<s') && !lower.startsWith('<span')) {
        if (!activeMarks.includes('strike-through')) activeMarks.push('strike-through');
      } else if (lower.startsWith('</s') && !lower.startsWith('</span')) {
        const idx = activeMarks.indexOf('strike-through');
        if (idx !== -1) activeMarks.splice(idx, 1);
      } else if (lower.startsWith('<strike') || lower.startsWith('<del')) {
        if (!activeMarks.includes('strike-through')) activeMarks.push('strike-through');
      } else if (lower.startsWith('</strike') || lower.startsWith('</del')) {
        const idx = activeMarks.indexOf('strike-through');
        if (idx !== -1) activeMarks.splice(idx, 1);
      } else if (lower.startsWith('<a')) {
        const hrefMatch = part.match(/href\s*=\s*["']([^"']*)["']/i);
        const href = hrefMatch ? hrefMatch[1] : '#';
        const linkKey = `${keyPrefix}_link_${linkCounter++}`;
        markDefs.push({ _key: linkKey, _type: 'link', href });
        activeMarks.push(linkKey);
      } else if (lower.startsWith('</a')) {
        // Pop the last link mark
        for (let i = activeMarks.length - 1; i >= 0; i--) {
          if (activeMarks[i].includes('_link_')) {
            activeMarks.splice(i, 1);
            break;
          }
        }
      }
      continue;
    }

    // Strip any stray tags just in case
    const cleanText = part.replace(/<[^>]*>/g, '');
    if (cleanText.length > 0) {
      children.push({
        _key: `${keyPrefix}_s${spanCounter++}`,
        _type: 'span',
        text: cleanText,
        marks: [...activeMarks],
      });
    }
  }

  if (children.length === 0) {
    children.push({ _key: `${keyPrefix}_s0`, _type: 'span', text: '', marks: [] });
  }

  return { children, markDefs };
}

/**
 * Converts our editor's ContentBlock[] to Sanity Portable Text body[]
 */
export function contentBlocksToPortableText(blocks: ContentBlock[]): PortableTextBlock[] {
  const result: PortableTextBlock[] = [];
  let blockIdx = 0;

  for (const b of blocks) {
    const key = `body_${blockIdx++}`;

    if (b.type === 'img') {
      const imgBlock: PortableTextBlock = {
        _key: key,
        _type: 'image',
        alt: b.alt || 'Article image',
      };
      if (b.assetId) {
        imgBlock.asset = { _type: 'reference', _ref: b.assetId };
      }
      result.push(imgBlock);
      continue;
    }

    if (b.type === 'ul' || b.type === 'ol') {
      const listItem = b.type === 'ul' ? 'bullet' : 'number';
      // Extract <li> items or split by newline
      const liMatches = (b.text || '').match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      const items = liMatches
        ? liMatches.map((li) => li.replace(/<\/?li[^>]*>/gi, '').trim())
        : (b.text || '').split('\n').map((s) => s.trim()).filter(Boolean);

      if (items.length === 0) items.push('');

      for (const itemHtml of items) {
        const itemKey = `body_${blockIdx++}`;
        const { children, markDefs } = parseHtmlToSpans(itemHtml, itemKey);
        result.push({
          _key: itemKey,
          _type: 'block',
          style: 'normal',
          listItem,
          level: 1,
          markDefs,
          children,
        });
      }
      continue;
    }

    const style =
      b.type === 'h3'
        ? 'h3'
        : b.type === 'h4'
          ? 'h4'
          : b.type === 'quote'
            ? 'blockquote'
            : 'normal';

    const { children, markDefs } = parseHtmlToSpans(b.text || '', key);
    result.push({
      _key: key,
      _type: 'block',
      style,
      markDefs,
      children,
    });
  }

  return result;
}

/**
 * Converts Sanity Portable Text body[] back to HTML ContentBlock[] when contentBlocks isn't present
 */
export function portableTextToContentBlocks(body: PortableTextBlock[]): ContentBlock[] {
  if (!Array.isArray(body)) return [];
  const blocks: ContentBlock[] = [];

  for (const item of body) {
    if (item._type === 'image') {
      blocks.push({
        _key: item._key,
        type: 'img',
        alt: item.alt || '',
        assetId: item.asset?._ref || '',
      });
      continue;
    }

    if (item._type === 'block') {
      const markDefMap = new Map<string, string>();
      for (const def of item.markDefs || []) {
        if (def._type === 'link') {
          markDefMap.set(def._key, def.href);
        }
      }

      const htmlText = (item.children || [])
        .map((span) => {
          let text = (span.text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          for (const mark of span.marks || []) {
            if (mark === 'strong') text = `<strong>${text}</strong>`;
            else if (mark === 'em') text = `<em>${text}</em>`;
            else if (mark === 'underline') text = `<u>${text}</u>`;
            else if (mark === 'strike-through') text = `<s>${text}</s>`;
            else if (markDefMap.has(mark)) {
              const href = markDefMap.get(mark) || '#';
              text = `<a href="${href}" class="blog-inline-link">${text}</a>`;
            }
          }
          return text;
        })
        .join('');

      if (item.listItem === 'bullet' || item.listItem === 'number') {
        const listType = item.listItem === 'bullet' ? 'ul' : 'ol';
        const prev = blocks[blocks.length - 1];
        if (prev && prev.type === listType) {
          prev.text = `${prev.text || ''}<li>${htmlText}</li>`;
        } else {
          blocks.push({
            _key: item._key,
            type: listType,
            text: `<li>${htmlText}</li>`,
          });
        }
        continue;
      }

      const blockType: ContentBlock['type'] =
        item.style === 'h3'
          ? 'h3'
          : item.style === 'h4'
            ? 'h4'
            : item.style === 'blockquote'
              ? 'quote'
              : 'p';

      blocks.push({
        _key: item._key,
        type: blockType,
        text: htmlText,
      });
    }
  }

  return blocks;
}
