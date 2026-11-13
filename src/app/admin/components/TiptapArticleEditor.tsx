'use client';

import React, { useState, useRef } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
  Loader2,
  Check,
  X,
} from 'lucide-react';

interface TiptapArticleEditorProps {
  initialHtml: string;
  onChange: (json: JSONContent, textWordCount: number) => void;
  onUploadImage: (file: File) => Promise<string>;
}

export default function TiptapArticleEditor({
  initialHtml,
  onChange,
  onUploadImage,
}: TiptapArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3, 4],
        },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'blog-inline-link',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: 'Write your story... Use the toolbar above for headings, bold, lists, links, or insert images directly.',
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'tiptap-linkedin-canvas',
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'));
          if (imageFile) {
            event.preventDefault();
            handleImageFile(imageFile);
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                handleImageFile(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText().trim();
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
      onChange(ed.getJSON(), wordCount);
    },
  });

  const handleImageFile = async (file: File) => {
    if (!editor) return;
    setUploadingImage(true);
    try {
      const url = await onUploadImage(file);
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch (err) {
      alert((err as Error).message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const openLinkEditor = () => {
    if (!editor) return;
    const prevUrl = editor.getAttributes('link').href || 'https://';
    setLinkUrl(prevUrl);
    setShowLinkBar(true);
  };

  const applyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url || url === 'https://') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShowLinkBar(false);
  };

  if (!editor) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          color: '#64748B',
          fontSize: '0.9rem',
        }}
      >
        Loading article editor...
      </div>
    );
  }

  const currentHeadingValue = editor.isActive('heading', { level: 3 })
    ? 'h3'
    : editor.isActive('heading', { level: 4 })
      ? 'h4'
      : 'p';

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        overflow: 'visible',
      }}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageFile(f);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />

      {/* Sticky LinkedIn-style Formatting Toolbar */}
      <div
        style={{
          position: 'sticky',
          top: '61px',
          zIndex: 30,
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
        }}
      >
        {/* Style Dropdown */}
        <select
          aria-label="Text style"
          value={currentHeadingValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') editor.chain().focus().setParagraph().run();
            else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
            else if (val === 'h4') editor.chain().focus().toggleHeading({ level: 4 }).run();
          }}
          style={{
            height: '32px',
            padding: '0 10px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginRight: '4px',
            outline: 'none',
          }}
        >
          <option value="p">Normal</option>
          <option value="h3">Heading 3 (TOC)</option>
          <option value="h4">Heading 4</option>
        </select>

        <Divider />

        {/* Inline Marks */}
        <ToolbarBtn
          active={editor.isActive('bold')}
          title="Bold (Cmd/Ctrl + B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('italic')}
          title="Italic (Cmd/Ctrl + I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('underline')}
          title="Underline (Cmd/Ctrl + U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('strike')}
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarBtn>

        <Divider />

        {/* Lists & Blockquote */}
        <ToolbarBtn
          active={editor.isActive('bulletList')}
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('orderedList')}
          title="Numbered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('blockquote')}
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarBtn>
        <ToolbarBtn
          active={false}
          title="Horizontal Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={16} />
        </ToolbarBtn>

        <Divider />

        {/* Link & Image */}
        <ToolbarBtn
          active={editor.isActive('link') || showLinkBar}
          title="Add / Edit Link"
          onClick={openLinkEditor}
        >
          <LinkIcon size={16} />
        </ToolbarBtn>
        {editor.isActive('link') && (
          <ToolbarBtn
            active={false}
            title="Remove Link"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Unlink size={16} />
          </ToolbarBtn>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '32px',
            padding: '0 10px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: uploadingImage ? 'wait' : 'pointer',
            marginLeft: '2px',
          }}
        >
          {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={15} color="#15803D" />}
          {uploadingImage ? 'Uploading...' : 'Insert Image'}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
          <ToolbarBtn
            active={false}
            title="Clear Formatting"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
          >
            <RemoveFormatting size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            active={false}
            disabled={!editor.can().undo()}
            title="Undo (Cmd/Ctrl + Z)"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            active={false}
            disabled={!editor.can().redo()}
            title="Redo (Cmd/Ctrl + Shift + Z)"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={15} />
          </ToolbarBtn>
        </div>
      </div>

      {/* Inline Link Bar */}
      {showLinkBar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#F1F5F9',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <LinkIcon size={15} color="#475569" />
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              } else if (e.key === 'Escape') {
                setShowLinkBar(false);
              }
            }}
            placeholder="https://... or /madhuvana"
            autoFocus
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.86rem',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={applyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#15803D',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Check size={14} /> Apply
          </button>
          <button
            type="button"
            onClick={() => setShowLinkBar(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '6px',
              background: '#E2E8F0',
              color: '#334155',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Continuous Document Canvas */}
      <div style={{ padding: '28px 36px 48px', minHeight: '460px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: '1px', height: '20px', background: '#E2E8F0', margin: '0 4px' }} />;
}

function ToolbarBtn({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? '#DCFCE7' : 'transparent',
        color: active ? '#15803D' : disabled ? '#CBD5E1' : '#334155',
        transition: 'background 0.12s ease, color 0.12s ease',
      }}
    >
      {children}
    </button>
  );
}

