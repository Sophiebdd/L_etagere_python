import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";

const INLINE_ACTIONS = [
  {
    label: "Gras",
    icon: "𝐁",
    command: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    label: "Italique",
    icon: "𝑖",
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    label: "Souligner",
    icon: "U",
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
    isActive: (editor) => editor.isActive("underline"),
  },
  {
    label: "Liste à puces",
    icon: "•",
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    label: "Liste numérotée",
    icon: "1.",
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
  {
    label: "Citation",
    icon: "❝",
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive("blockquote"),
  },
];
const ALIGN_ACTIONS = [
  {
    label: "Aligner à gauche",
    icon: "↤",
    command: (editor) => editor.chain().focus().setTextAlign("left").run(),
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
  },
  {
    label: "Centrer",
    icon: "↔",
    command: (editor) => editor.chain().focus().setTextAlign("center").run(),
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
  },
  {
    label: "Aligner à droite",
    icon: "↦",
    command: (editor) => editor.chain().focus().setTextAlign("right").run(),
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
  },
  {
    label: "Justifier",
    icon: "≋",
    command: (editor) => editor.chain().focus().setTextAlign("justify").run(),
    isActive: (editor) => editor.isActive({ textAlign: "justify" }),
  },
];

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32];
const DEFAULT_FONT_SIZE = 12;

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Commence à écrire ton chapitre...",
  className = "",
}) {
  const [fontSizeValue, setFontSizeValue] = useState(DEFAULT_FONT_SIZE);
  const manualFontSizeRef = useRef(null);

  const extractFontSize = useCallback((editorInstance) => {
    const storedMarks = editorInstance.view?.state?.storedMarks || [];
    const storedMark = storedMarks.find((mark) => mark.type.name === "textStyle");
    if (storedMark?.attrs?.fontSize) {
      return parseInt(storedMark.attrs.fontSize, 10);
    }
    const active = FONT_SIZE_OPTIONS.find((size) =>
      editorInstance.isActive("textStyle", { fontSize: `${size}px` }),
    );
    if (active) return active;
    return DEFAULT_FONT_SIZE;
  }, []);

  const syncFontSizeFromEditor = useCallback((editorInstance) => {
    const size = extractFontSize(editorInstance);
    if (manualFontSizeRef.current !== null) {
      if (size === manualFontSizeRef.current) {
        manualFontSizeRef.current = null;
      } else {
        return;
      }
    }
    setFontSizeValue((prev) => (prev === size ? prev : size));
  }, [extractFontSize]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false }),
      Underline,
      TextStyle,
      FontSize.configure({
        types: ["textStyle"],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "editor-body focus:outline-none",
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      onChange?.(editorInstance.getHTML());
      syncFontSizeFromEditor(editorInstance);
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      syncFontSizeFromEditor(editorInstance);
    },
    onCreate: ({ editor: editorInstance }) => {
      syncFontSizeFromEditor(editorInstance);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    const incoming = value || "";
    if (incoming !== currentHTML) {
      editor.commands.setContent(incoming, false);
      syncFontSizeFromEditor(editor);
    }
  }, [value, editor, syncFontSizeFromEditor]);

  const resetContent = () => {
    editor?.commands.clearContent();
    onChange?.("");
  };

  const handleFontSizeChange = (event) => {
    const newSize = Number(event.target.value);
    if (!editor || Number.isNaN(newSize)) return;
    if (newSize === DEFAULT_FONT_SIZE) {
      editor.chain().focus().unsetFontSize().run();
      setFontSizeValue(DEFAULT_FONT_SIZE);
      manualFontSizeRef.current = DEFAULT_FONT_SIZE;
      return;
    }
    editor.chain().focus().setFontSize(`${newSize}px`).run();
    setFontSizeValue(newSize);
    manualFontSizeRef.current = newSize;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-purple-100 bg-white/80 p-2 shadow-inner">
        <div className="flex flex-wrap items-center gap-2">
          {INLINE_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => action.command(editor)}
              disabled={!editor}
              className={`rounded-lg border border-purple-100 bg-white px-3 py-1 text-xs font-semibold transition ${
                editor && action.isActive(editor)
                  ? "text-purple-900"
                  : "text-purple-700 hover:bg-purple-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-pressed={editor ? action.isActive(editor) : false}
              aria-label={action.label}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
          <span className="mx-1 h-6 border-l border-purple-200" aria-hidden />
          {ALIGN_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => action.command(editor)}
              disabled={!editor}
              className={`rounded-lg border border-purple-100 bg-white px-3 py-1 text-xs font-semibold transition ${
                editor && action.isActive(editor)
                  ? "text-purple-900"
                  : "text-purple-700 hover:bg-purple-50"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-pressed={editor ? action.isActive(editor) : false}
              aria-label={action.label}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
          <select
            className="rounded-lg border border-purple-100 bg-white px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm transition focus:border-purple-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={fontSizeValue}
            onChange={handleFontSizeChange}
            disabled={!editor}
          >
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={resetContent}
            disabled={!editor}
            className="rounded-lg border border-red-100 bg-white px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Effacer
          </button>
        </div>
      </div>

      <div className="rich-text-editor-content min-h-[320px] rounded-2xl border border-purple-100 bg-white/80 px-4 py-3 text-[12px] text-gray-700 shadow-inner">
        <EditorContent editor={editor} className="w-full" />
      </div>
    </div>
  );
}
