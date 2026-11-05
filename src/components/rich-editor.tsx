"use client";

import { useRef, useState } from "react";
import { cn } from "./ui";

/** Escape HTML first so the preview can never inject markup. */
function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(text: string) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
}

/** Small, safe markdown renderer: paragraphs, lists, quotes, code blocks, bold, italic, code and links. */
export function renderMarkdown(source: string) {
  const lines = source.split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let code = false;
  let codeLines: string[] = [];
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code) {
        out.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
      } else closeList();
      code = !code;
      continue;
    }
    if (code) {
      codeLines.push(line);
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);
    if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((bullet ?? numbered)![1])}</li>`);
      continue;
    }
    closeList();
    if (quote) out.push(`<blockquote>${inline(quote[1])}</blockquote>`);
    else if (!line.trim()) out.push("");
    else out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (code) out.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  return out.join("\n");
}

const TOOLS: { label: string; title: string; before: string; after: string; block?: boolean }[] = [
  { label: "B", title: "Bold", before: "**", after: "**" },
  { label: "I", title: "Italic", before: "*", after: "*" },
  { label: "<>", title: "Inline code", before: "`", after: "`" },
  { label: "{ }", title: "Code block", before: "```\n", after: "\n```", block: true },
  { label: "🔗", title: "Link", before: "[", after: "](https://)" },
  { label: "❝", title: "Quote", before: "> ", after: "", block: true },
  { label: "•", title: "Bulleted list", before: "- ", after: "", block: true },
  { label: "1.", title: "Numbered list", before: "1. ", after: "", block: true },
];

export function RichEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  maxLength,
  disabled = false,
  error,
  label,
  required = false,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  id?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(tool: (typeof TOOLS)[number]) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || "text";
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const insert = tool.block && start !== lineStart ? `\n${tool.before}${selected}${tool.after}` : `${tool.before}${selected}${tool.after}`;
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(maxLength ? next.slice(0, maxLength) : next);
    requestAnimationFrame(() => {
      el?.focus();
      const caret = start + insert.length;
      el?.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-neutral-800">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className={cn("overflow-hidden rounded-md border border-neutral-300 bg-white transition-all focus-within:border-[#40533d] focus-within:ring-2 focus-within:ring-[#40533d]/20", error && "border-red-300", disabled && "opacity-60")}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-[#f7faf6] px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-0.5">
            {TOOLS.map((tool) => (
              <button
                key={tool.title}
                type="button"
                title={tool.title}
                aria-label={tool.title}
                disabled={disabled || tab === "preview"}
                onClick={() => apply(tool)}
                className="grid h-7 min-w-7 place-items-center rounded px-1.5 text-xs font-bold text-neutral-700 hover:bg-[#40533d]/10 disabled:opacity-40"
              >
                {tool.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-md bg-white p-0.5 text-xs font-semibold ring-1 ring-neutral-200">
            {(["write", "preview"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn("rounded px-2.5 py-1 capitalize", tab === item ? "bg-[#40533d] text-white" : "text-[#40533d]")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {tab === "write" ? (
          <textarea
            id={id}
            ref={ref}
            value={value}
            rows={rows}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full resize-y bg-white px-4 py-3 text-sm leading-6 outline-none disabled:cursor-not-allowed"
          />
        ) : (
          <div
            className="prose-sm min-h-[8rem] space-y-2 px-4 py-3 text-sm leading-6 text-neutral-800 [&_a]:text-[#40533d] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#b8c6b6] [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-neutral-100 [&_pre]:p-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: value.trim() ? renderMarkdown(value) : `<p class="text-neutral-400">Nothing to preview yet.</p>` }}
          />
        )}
        <div className="flex justify-between border-t border-neutral-200 bg-[#f7faf6] px-3 py-1.5 text-[11px] text-[#789078]">
          <span>Markdown supported: **bold**, *italic*, `code`, lists, &gt; quotes</span>
          {maxLength && <span>{value.length}/{maxLength}</span>}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
