import { useEffect, useRef } from "react";

const TOOLBAR_ACTIONS = [
  { label: "Gras", command: "bold", icon: "𝐁" },
  { label: "Italique", command: "italic", icon: "𝑖" },
  { label: "Souligner", command: "underline", icon: "U" },
  { label: "Liste", command: "insertUnorderedList", icon: "•" },
  { label: "Liste numérotée", command: "insertOrderedList", icon: "1." },
  { label: "Citation", command: "formatBlock", value: "<blockquote>", icon: "❝" },
];

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Commence à écrire ton chapitre...",
  className = "",
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    const element = editorRef.current;
    if (!element) {
      return;
    }

    const safeValue = value || "";
    if (element.innerHTML !== safeValue) {
      element.innerHTML = safeValue;
    }
  }, [value]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const handleCommand = (command, valueArg = null) => (event) => {
    event.preventDefault();
    focusEditor();
    document.execCommand(command, false, valueArg);
    handleInput();
  };

  const handleInput = () => {
    const innerHTML = editorRef.current?.innerHTML ?? "";
    onChange?.(innerHTML);
  };

  const resetFormatting = (event) => {
    event.preventDefault();
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      onChange?.("");
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-purple-100 bg-white/80 p-2 shadow-inner">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.command + (action.value || "")}
            type="button"
            onMouseDown={handleCommand(action.command, action.value)}
            className="rounded-lg border border-purple-100 bg-white px-3 py-1 text-xs font-semibold text-purple-700 transition hover:bg-purple-50"
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={resetFormatting}
          className="ml-auto rounded-lg border border-red-100 bg-white px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
        >
          Effacer
        </button>
      </div>

      <div
        ref={editorRef}
        className="rich-text-editor-content min-h-[200px] rounded-2xl border border-purple-100 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-inner focus-visible:outline-none"
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}
