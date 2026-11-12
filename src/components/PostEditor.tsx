"use client";

import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";

const PREVIEW_SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "strike", "p", "div", "br", "ul", "ol", "li", "span", "h2", "h3", "h4", "a", "blockquote"],
  ALLOWED_ATTR: ["style", "href", "target", "rel"],
  ALLOW_DATA_ATTR: false,
};

type Cat = {
  id: number;
  name: string;
};

type CustomTable = {
  id: string;
  title: string;
  description?: string;
  columns: string[];
  rows: string[][];
  rowUpdatedAt?: (string | null)[];
  layout_direction: "row" | "column";
  layout_columns: number;
  theme_primary: string;
  theme_accent: string;
  theme_background: string;
  theme_text: string;
};

const DEFAULT_TABLE_STYLE = {
  layout_direction: "row" as const,
  layout_columns: 2,
  theme_primary: "#173f70",
  theme_accent: "#e87920",
  theme_background: "#ffffff",
  theme_text: "#182638",
};

const legacyDefinitions = [
  { key: "important_dates", title: "Important Dates", columns: ["Event", "Date"] },
  { key: "application_fee", title: "Application Fee", columns: ["Category", "Fee"] },
  { key: "age_limit", title: "Age Limit", columns: ["Age Criteria", "Limit / Details"] },
  { key: "vacancy_details", title: "Vacancy Details", columns: ["Post Name", "Vacancies"] },
  { key: "important_links", title: "Important Links", columns: ["Link Title", "URL"] },
  { key: "faqs", title: "Frequently Asked Questions", columns: ["Question", "Answer"] },
];

function parseCustomTables(value: unknown): CustomTable[] {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;

    if (!Array.isArray(parsed)) return [];

    return parsed.map((table: any, index: number) => {
      const columns = Array.isArray(table.columns)
        ? table.columns.map((c: any) => String(c ?? ""))
        : [];

      const safeColumns = columns.length
        ? columns
        : ["Column 1", "Column 2"];

      const rows = Array.isArray(table.rows)
        ? table.rows.map((row: any) =>
            safeColumns.map((_: string, i: number) =>
  String(Array.isArray(row) ? row[i] ?? "" : row?.[i] ?? "")
)
          )
        : [];

      return {
        ...DEFAULT_TABLE_STYLE,
        ...table,
        id: String(table.id || `table-${index}`),
        title: String(table.title || `Table ${index + 1}`),
        description: String(table.description || ""),
        columns: safeColumns,
        rows,
        layout_direction:
          table.layout_direction === "column" ? "column" : "row",
        layout_columns: Math.min(
          3,
          Math.max(1, Number(table.layout_columns) || 2)
        ),
      };
    });
  } catch {
    return [];
  }
}

function legacyToCustomTables(post: any): CustomTable[] {
  if (!post) return [];

  const result: CustomTable[] = [];

  for (const def of legacyDefinitions) {
    const raw = post[def.key];
    if (!raw) continue;

    let data: any = raw;

    try {
      if (typeof raw === "string") data = JSON.parse(raw);
    } catch {
      data = [{ [def.columns[0]]: raw }];
    }

    const entries: any[] = Array.isArray(data)
      ? data
      : data && typeof data === "object"
        ? Object.entries(data).map(([k, v]) => ({
            [def.columns[0]]: k,
            [def.columns[1]]: v,
          }))
        : [];

    const rows = entries.map((item) =>
      def.columns.map((column, i) =>
        String(
          item?.[column] ??
            item?.[column.toLowerCase().replace(/ /g, "_")] ??
            (i === 0
              ? item?.label ??
                item?.event ??
                item?.category ??
                item?.post ??
                item?.question
              : item?.value ??
                item?.date ??
                item?.amount ??
                item?.age ??
                item?.vacancies ??
                item?.url ??
                item?.answer) ??
            ""
        )
      )
    );

    if (rows.some((row) => row.some((cell) => cell.trim()))) {
      result.push({
        ...DEFAULT_TABLE_STYLE,
        id: `legacy-${def.key}`,
        title: def.title,
        columns: [...def.columns],
        rows,
      });
    }
  }

  return result;
}



let activeRichEditor: HTMLDivElement | null = null;
let activeRichRange: Range | null = null;
let activeRichOnChange: ((value: string) => void) | null = null;


function RichTextToolbar() {
  const buttonStyle: React.CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 5, padding: "7px 10px", background: "#fff", color: "#243247", cursor: "pointer", fontSize: 12, fontWeight: 650, whiteSpace: "nowrap" };

  const saveSelection = () => {
    const editor = activeRichEditor;
    const selection = window.getSelection();
    if (editor && selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        activeRichRange = range.cloneRange();
      }
    }
  };

  const apply = (command: string, value?: string) => {
    const editor = activeRichEditor;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();

    // Restore the exact text range after the toolbar control takes focus.
    if (selection && activeRichRange && editor.contains(activeRichRange.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(activeRichRange);
    }

    // Force inline CSS spans so selected text colours are preserved in saved HTML.
    document.execCommand("styleWithCSS", false, "true");

    let applied = document.execCommand(command, false, value);
    if (!applied && command === "hiliteColor") {
      applied = document.execCommand("backColor", false, value);
    }

    // Keep React state in sync even when the browser reports execCommand as unsupported.
    activeRichOnChange?.(editor.innerHTML);
    saveSelection();
  };

  const applyTextColor = (color: string) => {
    const editor = activeRichEditor;
    const savedRange = activeRichRange?.cloneRange();
    if (!editor || !savedRange || !editor.contains(savedRange.commonAncestorContainer)) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(savedRange);

    if (savedRange.collapsed) {
      document.execCommand("foreColor", false, color);
    } else {
      const span = document.createElement("span");
      span.style.color = color;
      try {
        const contents = savedRange.extractContents();
        span.appendChild(contents);
        savedRange.insertNode(span);
        const nextRange = document.createRange();
        nextRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(nextRange);
        activeRichRange = nextRange.cloneRange();
      } catch {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand("foreColor", false, color);
      }
    }

    activeRichOnChange?.(editor.innerHTML);
    saveSelection();
  };

  const applyHighlight = (color: string) => {
    const editor = activeRichEditor;
    const savedRange = activeRichRange?.cloneRange();
    if (!editor || !savedRange || !editor.contains(savedRange.commonAncestorContainer)) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(savedRange);

    if (savedRange.collapsed) {
      // Keep the selected highlight colour active for text typed next.
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("hiliteColor", false, color);
    } else {
      // Wrap the selected content directly so the highlight is applied in one click.
      const span = document.createElement("span");
      span.style.backgroundColor = color;
      try {
        span.appendChild(savedRange.extractContents());
        savedRange.insertNode(span);
        const nextRange = document.createRange();
        nextRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(nextRange);
        activeRichRange = nextRange.cloneRange();
      } catch {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand("hiliteColor", false, color);
      }
    }

    activeRichOnChange?.(editor.innerHTML);
    saveSelection();
  };

  const applyHeading = (tagName: "h2" | "h3") => {
    // Use the browser's block-format command so headings work both with a
    // selected paragraph and with the caret placed inside a paragraph.
    apply("formatBlock", `<${tagName}>`);
  };

  const applyLineSpacing = (spacing: string) => {
    const editor = activeRichEditor;
    const savedRange = activeRichRange?.cloneRange();
    if (!editor || !savedRange || !editor.contains(savedRange.commonAncestorContainer)) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(savedRange);

    const node = savedRange.startContainer;
    const element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
    let block = element?.closest("p, div, h2, h3, h4, blockquote, li") as HTMLElement | null;

    if (!block || block === editor || !editor.contains(block)) {
      block = document.createElement("p");
      try {
        const contents = savedRange.extractContents();
        block.appendChild(contents);
        savedRange.insertNode(block);
      } catch {
        block.textContent = savedRange.toString();
      }
    }

    block.style.lineHeight = spacing;
    const nextRange = document.createRange();
    nextRange.selectNodeContents(block);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    activeRichRange = nextRange.cloneRange();
    activeRichOnChange?.(editor.innerHTML);
    saveSelection();
  };

  const headingButton = (label: string, tagName: "h2" | "h3") => (
    <button
      key={label}
      type="button"
      title={label}
      onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
      onClick={() => applyHeading(tagName)}
      style={buttonStyle}
    >
      {label}
    </button>
  );

  const button = (label: string, command: string, value?: string) => (
    <button key={label} type="button" title={label}
      onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
      onClick={() => apply(command, value)} style={buttonStyle}>
      {label}
    </button>
  );

  const selectStyle: React.CSSProperties = { border: 0, background: "transparent", fontSize: 12, maxWidth: 86, color: "#243247" };
  const saveBeforePicker = () => saveSelection();

  return (
    <div role="toolbar" aria-label="Post content formatting" style={{ position: "sticky", top: 8, zIndex: 50, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, padding: 10, margin: "0 0 14px", border: "1px solid #cbd5e1", borderRadius: 9, background: "#f1f5f9", boxShadow: "0 3px 12px rgba(15,23,42,.12)" }}>
      <span style={{ fontSize: 12, fontWeight: 750, color: "#475569", marginRight: 4 }}>FORMAT</span>
      {button("B", "bold")}
      {button("I", "italic")}
      {button("U̲ Underline", "underline")}
      {button("S̶ Strikethrough", "strikeThrough")}
      {button("• Bullets", "insertUnorderedList")}
      {button("1. Numbering", "insertOrderedList")}
      {headingButton("H2", "h2")}
      {headingButton("H3", "h3")}
      <label style={{ ...buttonStyle, display: "inline-flex", alignItems: "center", gap: 5 }}>
        Line spacing
        <select
          aria-label="Line spacing"
          defaultValue="1.6"
          onMouseDown={saveBeforePicker}
          onFocus={saveBeforePicker}
          onChange={(event) => applyLineSpacing(event.target.value)}
          style={selectStyle}
        >
          <option value="1.2">Compact</option>
          <option value="1.4">1.4</option>
          <option value="1.6">Normal</option>
          <option value="1.8">1.8</option>
          <option value="2">Double</option>
        </select>
      </label>
      {button("Quote", "formatBlock", "<blockquote>")}
      {button("Left", "justifyLeft")}
      {button("Center", "justifyCenter")}
      {button("Right", "justifyRight")}
      <button type="button" style={buttonStyle} onMouseDown={(event) => { event.preventDefault(); saveSelection(); }} onClick={() => { const url = window.prompt("Enter link URL (https://...)"); if (url) apply("createLink", url); }}>Link</button>
      {button("Clear", "removeFormat")}
      <div aria-label="Text colour" style={{ ...buttonStyle, display: "inline-flex", alignItems: "center", gap: 7 }}>
        <span>Text colour</span>
        {[
          ["Black", "#182638"],
          ["Red", "#ce1212"],
          ["Orange", "#e67e22"],
          ["Green", "#16804a"],
          ["Blue", "#1769aa"],
          ["Purple", "#7e22ce"],
        ].map(([name, color]) => (
          <button
            key={color}
            type="button"
            title={`Apply ${name} text colour`}
            aria-label={`Apply ${name} text colour`}
            onMouseDown={(event) => { event.preventDefault(); saveSelection(); }}
            onClick={() => applyTextColor(color)}
            style={{
              width: 19,
              height: 19,
              minWidth: 19,
              padding: 0,
              borderRadius: "50%",
              border: "2px solid #fff",
              outline: "1px solid #94a3b8",
              background: color,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <label style={{ ...buttonStyle, display: "inline-flex", alignItems: "center", gap: 5 }}>Highlight
        <select aria-label="Highlight colour" defaultValue="" onMouseDown={saveBeforePicker} onFocus={saveBeforePicker} onChange={(event) => { const color = event.target.value; if (color) applyHighlight(color); event.target.value = ""; }} style={selectStyle}>
          <option value="" disabled>Choose</option>
          <option value="#fff29a">Yellow</option><option value="#b7e1cd">Green</option><option value="#cfe2f3">Blue</option><option value="#f4cccc">Pink</option><option value="#eadcf8">Purple</option>
        </select>
      </label>
    </div>
  );
}

function RichTextField({ value, onChange, placeholder, minHeight = 90 }: { value: string; onChange: (value: string) => void; placeholder?: string; minHeight?: number }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== (value || "")) editor.innerHTML = value || "";
  }, [value]);
  const rememberEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;
    activeRichEditor = editor;
    activeRichOnChange = (html) => onChangeRef.current(html);
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.contains(selection.anchorNode)) activeRichRange = selection.getRangeAt(0).cloneRange();
  };
  return (
    <>
      <style>{`
        [contenteditable="true"] ul { list-style: disc !important; padding-left: 26px !important; margin: 8px 0 !important; }
        [contenteditable="true"] ol { list-style: decimal !important; padding-left: 26px !important; margin: 8px 0 !important; }
        [contenteditable="true"] li { display: list-item !important; margin: 4px 0 !important; }
        [contenteditable="true"] h2 { display: block; font-size: 1.5em; font-weight: 700; margin: .7em 0; }
        [contenteditable="true"] h3 { display: block; font-size: 1.25em; font-weight: 700; margin: .65em 0; }
      `}</style>
      <div style={{ border: "1px solid #cbd5e1", borderRadius: 7, overflow: "hidden", background: "#fff" }}>
        <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder || "Write here..."} onFocus={rememberEditor} onClick={rememberEditor} onInput={(e) => { rememberEditor(); onChangeRef.current(e.currentTarget.innerHTML); }} onMouseUp={rememberEditor} onKeyUp={rememberEditor} style={{ minHeight, padding: 11, outline: "none", color: "#182638", lineHeight: 1.6, overflowWrap: "anywhere" }} />
      </div>
    </>
  );
}

export default function PostEditor({
  categories,
  post,
}: {
  categories: Cat[];
  post?: any;
}) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
    const saved = Array.isArray(post?.category_ids) ? post.category_ids.map((id: any) => String(id)) : [];
    return saved.length ? saved : [String(post?.category_id || categories[0]?.id || "")].filter(Boolean);
  });

  const [form, setForm] = useState<any>({
    title: post?.title || "",
    category_id: String(
      post?.category_id || categories[0]?.id || ""
    ),
    short_description: post?.short_description || "",
    organization: post?.organization || "",
    source_url: post?.source_url || "",
    application_url: post?.application_url || "",
    qualification: post?.qualification || "",
    selection_process: post?.selection_process || "",
    how_to_apply: post?.how_to_apply || "",
    seo_title: post?.seo_title || "",
    seo_description: post?.seo_description || "",
    status: post?.status || "draft",
    scheduled_at: post?.scheduled_at ? (() => { const date = new Date(post.scheduled_at); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })() : "",
    verification_status: post?.verification_status || "unverified",
    notice_text: post?.notice_text || "",
    layout_direction: post?.layout_direction || "row",
    layout_columns: String(post?.layout_columns || 2),
    theme_primary: post?.theme_primary || "#173f70",
    theme_accent: post?.theme_accent || "#e87920",
    theme_background: post?.theme_background || "#ffffff",
    theme_text: post?.theme_text || "#182638",
    image_url: post?.image_url || "",
    image_title: post?.image_title || "",
  });

  const [customTables, setCustomTables] = useState<CustomTable[]>(() => {
    const saved = parseCustomTables(post?.custom_tables);
    return saved.length ? saved : legacyToCustomTables(post);
  });

  const [notice, setNotice] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [expandedTables, setExpandedTables] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const autoDraftIdRef = useRef<number | null>(post?.id ? Number(post.id) : null);
  const autoSavePromiseRef = useRef<Promise<void> | null>(null);

  const descriptionEditor = useRef<HTMLDivElement>(null);
  const descriptionInitialized = useRef(false);

  const change = (key: string, value: string) => {
    setForm((old: any) => ({
      ...old,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (descriptionEditor.current && !descriptionInitialized.current) {
      descriptionEditor.current.innerHTML = form.short_description || "";
      descriptionInitialized.current = true;
    }
  }, [form.short_description]);

  // Automatically preserve new posts as unpublished drafts while the editor is open.
  useEffect(() => {
    if (post || !form.title.trim() || !selectedCategoryIds.length || busy || imageBusy) return;

    const timer = window.setTimeout(() => {
      const cleanedTables = customTables
        .map((table) => ({
          ...table,
          title: table.title.trim(),
          description: (table.description || "").trim(),
          columns: table.columns.map((column) => column.trim()),
          rows: table.rows.filter((row) => row.some((cell) => cell.trim())),
        }))
        .filter((table) => table.title && table.columns.length);

      const payload = {
        ...form,
        status: "draft",
        scheduled_at: "",
        category_id: selectedCategoryIds[0],
        category_ids: selectedCategoryIds,
        custom_tables: JSON.stringify(cleanedTables),
      };

      setAutoSaveStatus("Saving draft…");
      const previousSave = autoSavePromiseRef.current;
      const request = (async () => {
        try {
          if (previousSave) await previousSave;
          const draftId = autoDraftIdRef.current;
          const response = await fetch(
            draftId ? `/api/admin/posts/${draftId}` : "/api/admin/posts",
            {
              method: draftId ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Draft auto-save failed.");
          if (!draftId && data.id) autoDraftIdRef.current = Number(data.id);
          setAutoSaveStatus("Draft saved automatically");
        } catch {
          setAutoSaveStatus("Auto-save pending — keep this page open and use Save Post before leaving.");
        }
      })();
      const trackedSave = request.finally(() => {
        if (autoSavePromiseRef.current === trackedSave) autoSavePromiseRef.current = null;
      });
      autoSavePromiseRef.current = trackedSave;
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [form, customTables, selectedCategoryIds, post, busy, imageBusy]);

  const formatDescription = (command: string, value?: string) => {
    descriptionEditor.current?.focus();

    document.execCommand(command, false, value);

    if (descriptionEditor.current) {
      change(
        "short_description",
        descriptionEditor.current.innerHTML
      );
    }
  };

  const addTable = () => {
    const id = `table-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    setCustomTables((old) => [
      ...old,
      {
        ...DEFAULT_TABLE_STYLE,
        id,
        title: "New Table",
        description: "",
        columns: ["Column 1", "Column 2"],
        rows: [["", ""]],
      },
    ]);

    setExpandedTables((old) => [...old, id]);
  };

  const updateTable = (
    id: string,
    patch: Partial<CustomTable>
  ) => {
    setCustomTables((old) =>
      old.map((table) =>
        table.id === id ? { ...table, ...patch } : table
      )
    );
  };

  const updateColumn = (
    id: string,
    index: number,
    value: string
  ) => {
    setCustomTables((old) =>
      old.map((table) =>
        table.id === id
          ? {
              ...table,
              columns: table.columns.map((column, i) =>
                i === index ? value : column
              ),
            }
          : table
      )
    );
  };

  const addColumn = (id: string) => {
    setCustomTables((old) =>
      old.map((table) =>
        table.id === id
          ? {
              ...table,
              columns: [
                ...table.columns,
                `Column ${table.columns.length + 1}`,
              ],
              rows: table.rows.map((row) => [...row, ""]),
            }
          : table
      )
    );
  };

  const removeColumn = (id: string, index: number) => {
    setCustomTables((old) =>
      old.map((table) =>
        table.id === id
          ? {
              ...table,
              columns:
                table.columns.length > 1
                  ? table.columns.filter((_, i) => i !== index)
                  : table.columns,
              rows:
                table.columns.length > 1
                  ? table.rows.map((row) =>
                      row.filter((_, i) => i !== index)
                    )
                  : table.rows,
            }
          : table
      )
    );
  };

  const addRow = (id: string) => {
    setCustomTables((old) =>
      old.map((table) =>
        table.id === id
          ? {
              ...table,
              rows: [
                ...table.rows,
                table.columns.map(() => ""),
              ],
            }
          : table
      )
    );
  };

  const updateCell = (
    id: string,
    rowIndex: number,
    columnIndex: number,
    value: string
  ) => {
    setCustomTables((old) =>
      old.map((table) =>
        table.id === id
          ? {
              ...table,
              rows: table.rows.map((row, ri) =>
                ri === rowIndex
                  ? row.map((cell, ci) =>
                      ci === columnIndex ? value : cell
                    )
                  : row
              ),
            }
          : table
      )
    );
  };

  const boldAllTableText = (id: string) => {
    const makeContentBold = (html: string) => {
      if (!html.trim()) return html;
      const container = document.createElement("div");
      container.innerHTML = html;
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

      textNodes.forEach((textNode) => {
        if (!textNode.textContent?.trim()) return;
        const parent = textNode.parentElement;
        if (parent?.closest("strong, b")) return;
        const strong = document.createElement("strong");
        textNode.parentNode?.replaceChild(strong, textNode);
        strong.appendChild(textNode);
      });

      return container.innerHTML;
    };

    setCustomTables((old) =>
      old.map((table) =>
        table.id === id
          ? { ...table, rows: table.rows.map((row) => row.map((cell) => makeContentBold(cell))) }
          : table
      )
    );
  };

  const removeRow = (id: string, index: number) => {
    setCustomTables((old) =>
      old.map((table) =>
        table.id === id
          ? {
              ...table,
              rows: table.rows.filter((_, i) => i !== index),
            }
          : table
      )
    );
  };

  const duplicateTable = (id: string) => {
    const copyId = `table-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setCustomTables((old) => {
      const sourceIndex = old.findIndex((table) => table.id === id);
      if (sourceIndex === -1) return old;

      const source = old[sourceIndex];
      const copy: CustomTable = {
        ...source,
        id: copyId,
        title: `${source.title} (Copy)`,
        columns: [...source.columns],
        rows: source.rows.map((row) => [...row]),
        rowUpdatedAt: source.rowUpdatedAt ? [...source.rowUpdatedAt] : source.rowUpdatedAt,
      };

      const updated = [...old];
      updated.splice(sourceIndex + 1, 0, copy);
      return updated;
    });

    setExpandedTables((old) => old.includes(copyId) ? old : [...old, copyId]);
  };

  const removeTable = (id: string) => {
    setCustomTables((old) =>
      old.filter((table) => table.id !== id)
    );

    setExpandedTables((old) => old.filter((x) => x !== id));
  };

  const toggleTable = (id: string) => {
    setExpandedTables((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : [...old, id]
    );
  };

  async function uploadImage(file?: File) {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setNotice("Only JPG, PNG, WEBP and GIF images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice("Image size must be 5 MB or less.");
      return;
    }

    setImageBusy(true);
    setNotice("");

    try {
      let uploadFile = file;
      // Resize raster images and convert to WebP; preserve animated GIFs.
      if (file.type !== "image/gif" && typeof createImageBitmap === "function") {
        try {
          const bitmap = await createImageBitmap(file);
          const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const optimized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
            if (optimized && optimized.size < file.size) {
              uploadFile = new File([optimized], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
            }
          }
          bitmap.close();
        } catch {
          // Fall back to the original if browser optimization is unavailable.
        }
      }
      const body = new FormData();
      body.append("file", uploadFile);

      const response = await fetch(
        "/api/admin/upload-image",
        {
          method: "POST",
          body,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image upload failed.");
      }

      change("image_url", data.url);
      setNotice("Image converted to WebP, uploaded and JharResult watermark applied successfully. Add its title and save the post.");
    } catch (error: any) {
      setNotice(error.message || "Image upload failed.");
    } finally {
      setImageBusy(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();

    setBusy(true);
    setNotice("");

    try {
      if (autoSavePromiseRef.current) await autoSavePromiseRef.current;
      // Row-level NEW badges are only generated when editing a post that
      // was already published. Draft editing and first-time publishing must
      // not mark every row as new.
      const isEditingPublishedPost =
        post?.status === "published" && form.status === "published";
      const parsedBaselineTables = parseCustomTables(post?.custom_tables);
      const baselineTables = parsedBaselineTables.length
        ? parsedBaselineTables
        : legacyToCustomTables(post);

      const cleanedTables = customTables
        .map((table) => {
          const baseline = baselineTables.find((item) => item.id === table.id);
          const rows = table.rows.filter((row) =>
            row.some((cell) => cell.trim())
          );

          let rowUpdatedAt: (string | null)[];

          if (!isEditingPublishedPost) {
            // Keep drafts free of row-level NEW markers.
            rowUpdatedAt = rows.map(() => null);
          } else {
            // Match unchanged rows by their content, not their array index.
            // This prevents inserting/deleting/reordering one row from making
            // every following row appear newly updated.
            const previousTimestampsByRow = new Map<string, (string | null)[]>();
            baseline?.rows.forEach((previousRow, index) => {
              const key = JSON.stringify(previousRow);
              const timestamps = previousTimestampsByRow.get(key) || [];
              timestamps.push(baseline.rowUpdatedAt?.[index] || null);
              previousTimestampsByRow.set(key, timestamps);
            });

            const updatedAt = new Date().toISOString();
            rowUpdatedAt = rows.map((row) => {
              const key = JSON.stringify(row);
              const timestamps = previousTimestampsByRow.get(key);

              if (timestamps?.length) {
                return timestamps.shift() || null;
              }

              // Only genuinely new or edited rows receive a NEW timestamp.
              return updatedAt;
            });
          }

          return {
            ...table,
            title: table.title.trim(),
            columns: table.columns.map((c) => c.trim()),
            rows,
            rowUpdatedAt,
          };
        })
        .filter((table) => table.title && table.columns.length);

      if (!selectedCategoryIds.length) {
        setNotice("Please select at least one category.");
        setBusy(false);
        return;
      }
      if (form.status === "scheduled" && !form.scheduled_at) {
        setNotice("Please choose a date and time for scheduled publishing.");
        setBusy(false);
        return;
      }
      if (form.status === "scheduled" && new Date(form.scheduled_at).getTime() <= Date.now()) {
        setNotice("Scheduled publishing time must be in the future.");
        setBusy(false);
        return;
      }

      const payload = {
        ...form,
        category_id: selectedCategoryIds[0],
        category_ids: selectedCategoryIds,
        custom_tables: JSON.stringify(cleanedTables),
      };

      const existingDraftId = autoDraftIdRef.current;
      const targetPostId = post?.id || existingDraftId;
      const response = await fetch(
        targetPostId
          ? `/api/admin/posts/${targetPostId}`
          : "/api/admin/posts",
        {
          method: targetPostId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      window.location.href = "/admin";
    } catch (error: any) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    padding: "11px 12px",
    border: "1px solid #d7dee8",
    borderRadius: 7,
    background: "#fff",
    color: "#172033",
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 650,
    fontSize: 13,
    margin: "13px 0 6px",
    color: "#253247",
  };

  const sectionStyle: React.CSSProperties = {
    border: "1px solid #dce3ec",
    borderRadius: 10,
    marginTop: 16,
    overflow: "hidden",
    background: "#fff",
  };

  const tableButton: React.CSSProperties = {
    border: 0,
    borderRadius: 7,
    padding: "9px 13px",
    background: "#173f70",
    color: "white",
    fontWeight: 650,
    cursor: "pointer",
  };

  return (
    <div
      className="panel"
      style={{
        marginTop: 18,
        padding: 22,
        background: "#f8fafc",
      }}
    >
      <form onSubmit={save}>
          <RichTextToolbar />
          <section style={sectionStyle}>
            <div style={{ padding: 18 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>
                Basic Post Information
              </h2>

              <label style={labelStyle}>Post Title *</label>

              <input
                style={inputStyle}
                required
                value={form.title}
                onChange={(e) => change("title", e.target.value)}
                placeholder="e.g. JSSC CGL Recruitment 2026"
              />

              <label style={labelStyle}>Categories (select one or more)</label>
              <div style={{ ...inputStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 9, maxHeight: 220, overflowY: "auto" }}>
                {categories.map((category) => {
                  const id = String(category.id);
                  return (
                    <label key={category.id} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(id)}
                        onChange={(event) => setSelectedCategoryIds((old) => event.target.checked ? [...old, id] : old.filter((value) => value !== id))}
                      />
                      {category.name}
                    </label>
                  );
                })}
              </div>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>Selected categories mein yehi post same URL ke saath show hoga. At least one category select karein.</p>

              {/* POST DESCRIPTION EDITOR */}
              <label style={labelStyle}>Post Description</label>
              <RichTextField
                value={form.short_description}
                onChange={(value) => change("short_description", value)}
                placeholder="Post ka description yahan likhein..."
                minHeight={150}
              />

              {/* IMAGE UPLOAD */}

              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  border: "1px dashed #b8c5d6",
                  borderRadius: 9,
                  background: "#f8fbff",
                }}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>
                  Post Image
                </h3>

                <label style={labelStyle}>
                  Choose Image (JPG, PNG, WEBP, GIF · max 5 MB)
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={imageBusy}
                  onChange={(e) => {
                    void uploadImage(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                  style={{ ...inputStyle, padding: 8 }}
                />

                {imageBusy && (
                  <p style={{ color: "#475569", fontSize: 13 }}>
                    Uploading image...
                  </p>
                )}

                <label style={labelStyle}>Image Title / Caption</label>

                <input
                  style={inputStyle}
                  value={form.image_title}
                  onChange={(e) =>
                    change("image_title", e.target.value)
                  }
                  placeholder="e.g. JAC Class 12 Exam 2026"
                />

                <label style={labelStyle}>Image URL</label>

                <input
                  style={inputStyle}
                  value={form.image_url}
                  onChange={(e) =>
                    change("image_url", e.target.value)
                  }
                  placeholder="/uploads/your-image.webp or https://..."
                />

                {form.image_url && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  >
                    <img
                      src={form.image_url}
                      alt={form.image_title || "Post image preview"}
                      style={{
                        display: "block",
                        width: "100%",
                        maxWidth: 460,
                        maxHeight: 260,
                        objectFit: "contain",
                        borderRadius: 6,
                      }}
                    />

                    {form.image_title && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 13,
                          color: "#475569",
                        }}
                      >
                        {form.image_title}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        change("image_url", "");
                        change("image_title", "");
                      }}
                      style={{
                        ...tableButton,
                        marginTop: 8,
                        background: "#a12b2b",
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              <label style={labelStyle}>
                Organization / Department
              </label>

              <input
                style={inputStyle}
                value={form.organization}
                onChange={(e) =>
                  change("organization", e.target.value)
                }
                placeholder="JSSC / JAC / JRHMS"
              />

              <label style={labelStyle}>
                Official Notification URL
              </label>

              <input
                style={inputStyle}
                value={form.source_url}
                onChange={(e) =>
                  change("source_url", e.target.value)
                }
                placeholder="https://..."
              />

              <label style={labelStyle}>Apply Online URL</label>

              <input
                style={inputStyle}
                value={form.application_url}
                onChange={(e) =>
                  change("application_url", e.target.value)
                }
                placeholder="https://..."
              />
            </div>
          </section>

          {/* CUSTOM TABLE BUILDER */}

          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>
              Post Details – Custom Table Builder
            </h2>

            <p style={{ color: "#64748b", fontSize: 13, marginTop: 0 }}>
              Apne hisaab se table ka title, columns aur rows banayein.
              Har cell mein directly content type kar sakte hain.
            </p>
          </div>

          {customTables.map((table, tableIndex) => (
            <section key={table.id} style={sectionStyle}>
              <button
                type="button"
                onClick={() => toggleTable(table.id)}
                style={{
                  width: "100%",
                  border: 0,
                  background: "#edf3fa",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  color: "#173f70",
                  textAlign: "left",
                }}
              >
                <span>
                  <strong>
                    {table.title || `Table ${tableIndex + 1}`}
                  </strong>

                  <small
                    style={{
                      display: "block",
                      color: "#64748b",
                      marginTop: 3,
                    }}
                  >
                    {table.columns.length} columns · {table.rows.length} rows
                  </small>
                </span>

                <strong>
                  {expandedTables.includes(table.id) ? "−" : "+"}
                </strong>
              </button>

              {expandedTables.includes(table.id) && (
                <div style={{ padding: 14 }}>
                  <label style={labelStyle}>Table Title</label>

                  <input
                    style={inputStyle}
                    value={table.title}
                    onChange={(e) =>
                      updateTable(table.id, {
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Important Dates"
                  />

                  <label style={{ ...labelStyle, marginTop: 14 }}>Post Description</label>
                  <RichTextField
                    value={table.description || ""}
                    onChange={(value) => updateTable(table.id, { description: value })}
                    placeholder="Is table ke baare mein additional information yahan likhein..."
                    minHeight={100}
                  />

                  <h4 style={{ margin: "18px 0 8px", color: "#253247" }}>
                    Table Layout &amp; Colors
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(180px,1fr))",
                      gap: 12,
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        Section Arrangement
                      </label>

                      <select
                        style={inputStyle}
                        value={table.layout_direction}
                        onChange={(e) =>
                          updateTable(table.id, {
                            layout_direction: e.target.value as
                              | "row"
                              | "column",
                          })
                        }
                      >
                        <option value="row">Row – side by side</option>
                        <option value="column">Column – full width</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Number of Columns
                      </label>

                      <select
                        style={inputStyle}
                        value={String(table.layout_columns)}
                        disabled={table.layout_direction === "column"}
                        onChange={(e) =>
                          updateTable(table.id, {
                            layout_columns: Number(e.target.value),
                          })
                        }
                      >
                        <option value="1">1 Column</option>
                        <option value="2">2 Columns</option>
                        <option value="3">3 Columns</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(190px,1fr))",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    {(
                      [
                        ["theme_primary", "Heading / Header Color"],
                        ["theme_accent", "Highlight / Button Color"],
                        ["theme_background", "Table Background Color"],
                        ["theme_text", "Text Color"],
                      ] as const
                    ).map(([key, title]) => (
                      <label
                        key={key}
                        style={{
                          ...labelStyle,
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          padding: 9,
                          background: "#fff",
                        }}
                      >
                        {title}

                        <input
                          type="color"
                          aria-label={title}
                          value={table[key]}
                          onChange={(e) =>
                            updateTable(table.id, {
                              [key]: e.target.value,
                            } as Partial<CustomTable>)
                          }
                          style={{
                            width: 42,
                            height: 34,
                            padding: 2,
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        />
                      </label>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 7,
                      background: table.theme_background,
                      color: table.theme_text,
                      border: `1px solid ${table.theme_primary}`,
                    }}
                  >
                    <div
                      style={{
                        padding: 8,
                        borderRadius: 5,
                        background: table.theme_primary,
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {table.title || "Table Heading Preview"}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        padding: 6,
                        background: table.theme_accent,
                        color: "#fff",
                        display: "inline-block",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      Highlight Preview
                    </div>
                  </div>

                  <h4 style={{ margin: "16px 0 8px", color: "#253247" }}>
                    Columns – edit column headings
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(170px,1fr))",
                      gap: 9,
                    }}
                  >
                    {table.columns.map((column, columnIndex) => (
                      <div
                        key={columnIndex}
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <input
                          style={inputStyle}
                          value={column}
                          onChange={(e) =>
                            updateColumn(
                              table.id,
                              columnIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Column ${columnIndex + 1}`}
                        />

                        <button
                          type="button"
                          title="Remove column"
                          disabled={table.columns.length <= 1}
                          onClick={() =>
                            removeColumn(table.id, columnIndex)
                          }
                          style={{
                            border: "1px solid #fecaca",
                            color: "#b42318",
                            background: "#fff5f5",
                            borderRadius: 7,
                            padding: "9px 10px",
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    style={{
                      ...tableButton,
                      marginTop: 10,
                      background: "#475569",
                    }}
                    onClick={() => addColumn(table.id)}
                  >
                    + Add Column
                  </button>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", margin: "20px 0 8px" }}>
                    <h4 style={{ margin: 0, color: "#253247" }}>
                      Table Rows – type your content
                    </h4>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => boldAllTableText(table.id)}
                        style={{ ...tableButton, background: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 6 }}
                        title="Make all text in this table bold"
                      >
                        <strong>B</strong> Bold All Table Text
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateTable(table.id)}
                        style={{ ...tableButton, background: "#0f766e", display: "inline-flex", alignItems: "center", gap: 6 }}
                        title="Create a new table with the same content"
                      >
                        Copy Table
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: Math.max(
                          500,
                          table.columns.length * 180
                        ),
                      }}
                    >
                      <thead>
                        <tr>
                          {table.columns.map((column, i) => (
                            <th
                              key={i}
                              style={{
                                textAlign: "left",
                                padding: 8,
                                background: "#f1f5f9",
                                border: "1px solid #dce3ec",
                                fontSize: 12,
                              }}
                            >
                              {column || `Column ${i + 1}`}
                            </th>
                          ))}

                          <th
                            style={{
                              border: "1px solid #dce3ec",
                              background: "#f1f5f9",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {table.columns.map((_, columnIndex) => (
                              <td
                                key={columnIndex}
                                style={{
                                  padding: 5,
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <RichTextField
                                  value={row[columnIndex] || ""}
                                  onChange={(value) =>
                                    updateCell(table.id, rowIndex, columnIndex, value)
                                  }
                                  placeholder="Enter content..."
                                  minHeight={58}
                                />
                              </td>
                            ))}

                            <td
                              style={{
                                border: "1px solid #e2e8f0",
                                textAlign: "center",
                                padding: 5,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  removeRow(table.id, rowIndex)
                                }
                                style={{
                                  border: "1px solid #fecaca",
                                  color: "#b42318",
                                  background: "#fff5f5",
                                  borderRadius: 6,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 9,
                      flexWrap: "wrap",
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      style={tableButton}
                      onClick={() => addRow(table.id)}
                    >
                      + Add Row
                    </button>

                    <button
                      type="button"
                      style={{
                        ...tableButton,
                        background: "#a12b2b",
                      }}
                      onClick={() => removeTable(table.id)}
                    >
                      Delete Table
                    </button>
                  </div>
                </div>
              )}
            </section>
          ))}

          <button
            type="button"
            style={{
              ...tableButton,
              marginTop: 14,
              padding: "12px 18px",
              background: "#16804a",
            }}
            onClick={addTable}
          >
            + Add New Table
          </button>

          {/* OTHER INFORMATION */}

          <section style={sectionStyle}>
            <div style={{ padding: 18 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>
                Other Information
              </h2>

              {(
                [
                  ["qualification", "Educational Qualification"],
                  ["selection_process", "Selection Process"],
                  ["how_to_apply", "How to Apply"],
                ] as const
              ).map(([key, title]) => (
                <div key={key}>
                  <label style={labelStyle}>{title}</label>

                  <RichTextField
                    value={form[key] || ""}
                    onChange={(value) => change(key, value)}
                    placeholder={`${title} details...`}
                    minHeight={100}
                  />
                </div>
              ))}

              <label style={labelStyle}>SEO Title</label>

              <input
                style={inputStyle}
                value={form.seo_title}
                onChange={(e) =>
                  change("seo_title", e.target.value)
                }
              />

              <label style={labelStyle}>SEO Description</label>

              <textarea
                style={{ ...inputStyle, minHeight: 65 }}
                value={form.seo_description}
                onChange={(e) =>
                  change("seo_description", e.target.value)
                }
              />

              <label style={labelStyle}>Publication Status</label>

              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) =>
                  change("status", e.target.value)
                }
              >
                <option value="draft">Save as Draft</option>
                <option value="published">Publish Now</option>
                <option value="scheduled">Schedule for Later</option>
              </select>

              {form.status === "scheduled" && (
                <>
                  <label style={labelStyle}>Scheduled Publish Date &amp; Time</label>
                  <input type="datetime-local" style={inputStyle} value={form.scheduled_at}
                    min={(() => { const date = new Date(Date.now() + 60000); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })()}
                    onChange={(e) => change("scheduled_at", e.target.value)} required />
                  <p style={{ margin: "-7px 0 12px", color: "#64748b", fontSize: 12 }}>
                    Scheduled posts publish automatically when the site cron endpoint runs.
                  </p>
                </>
              )}

              <label style={labelStyle}>Verification Status</label>

              <select
                style={inputStyle}
                value={form.verification_status}
                onChange={(e) =>
                  change("verification_status", e.target.value)
                }
              >
                <option value="unverified">Unverified</option>
                <option value="verified">
                  Verified – checked against official source
                </option>
              </select>
            </div>
          </section>

          {previewOpen && (
            <section aria-label="Post preview" style={{ marginTop: 18, padding: 18, border: "2px solid #93c5fd", borderRadius: 10, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Post Preview</h2>
                <button type="button" onClick={() => setPreviewOpen(false)} style={{ ...tableButton, background: "#475569" }}>Close Preview</button>
              </div>
              <h1 style={{ margin: "14px 0 8px", fontSize: 25 }}>{form.title || "Post title preview"}</h1>
              <p style={{ color: "#64748b", fontSize: 13 }}>Categories: {categories.filter((item) => selectedCategoryIds.includes(String(item.id))).map((item) => item.name).join(", ") || "None selected"}</p>
              {form.image_url && <img src={form.image_url} alt={form.image_title || form.title || "Post image"} style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain" }} />}
              {form.image_title && <p style={{ color: "#64748b", fontSize: 12 }}>{form.image_title}</p>}
              {form.short_description && (
                <div
                  className="article-summary"
                  style={{ margin: "18px 0", padding: "15px 17px", border: "1px solid #dce3ec", borderLeft: "4px solid #e87920", borderRadius: 7, background: "#f8fafc", color: "#182638", lineHeight: 1.75, overflowWrap: "anywhere" }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(form.short_description), PREVIEW_SANITIZE_OPTIONS) }}
                />
              )}
              {(["organization", "qualification", "selection_process", "how_to_apply"] as const).map((key) => form[key] ? (
                <section key={key} className="detail-section" style={{ margin: "20px 0 24px", border: "1px solid #dce3ec", borderRadius: 4, overflow: "hidden" }}>
                  <h2 style={{ margin: 0, padding: "9px 12px", background: "#173f70", color: "#fff", fontSize: 17, lineHeight: 1.35 }}>
                    {key === "organization" ? "Organization" : key === "qualification" ? "Educational Qualification" : key === "selection_process" ? "Selection Process" : "How to Apply"}
                  </h2>
                  <div
                    style={{ padding: "12px", lineHeight: 1.7, overflowWrap: "anywhere" }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(form[key]), PREVIEW_SANITIZE_OPTIONS) }}
                  />
                </section>
              ) : null)}
              {customTables.filter((table) => table.title.trim() && (Boolean(table.description?.trim()) || table.rows.some((row) => row.some((cell) => cell.trim())))).map((table) => (
                <section key={table.id} className="detail-section" style={{ margin: "20px 0 24px", border: `1px solid ${table.theme_primary}`, background: table.theme_background, color: table.theme_text, minWidth: 0 }}>
                  <h2 style={{ margin: 0, padding: "9px 12px", background: table.theme_primary, color: "#fff", fontSize: 17 }}>{table.title}</h2>
                  {table.description && (
                    <div
                      className="table-description"
                      style={{ padding: "12px 12px 0", lineHeight: 1.7, overflowWrap: "anywhere" }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(table.description), PREVIEW_SANITIZE_OPTIONS) }}
                    />
                  )}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", color: table.theme_text, fontSize: 14, background: table.theme_background }}>
                      <thead>
                        <tr>{table.columns.map((column, i) => <th key={i} style={{ border: "1px solid #dce3ec", padding: "10px 9px", textAlign: "left", background: table.theme_accent, color: "#fff" }}>{column}</th>)}</tr>
                      </thead>
                      <tbody>
                        {table.rows.filter((row) => row.some((cell) => cell.trim())).map((row, i) => (
                          <tr key={i}>{table.columns.map((_, j) => (
                            <td key={j} style={{ border: "1px solid #dce3ec", padding: "10px 9px", verticalAlign: "top", overflowWrap: "anywhere" }}>
                              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(row[j] || ""), PREVIEW_SANITIZE_OPTIONS) }} />
                            </td>
                          ))}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
              <p style={{ marginTop: 14, color: "#64748b", fontSize: 12 }}>Preview is for content review; final public layout may differ slightly.</p>
            </section>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <button type="button" onClick={() => setPreviewOpen((value) => !value)} style={{ ...tableButton, background: "#1d4ed8" }}>
              {previewOpen ? "Hide Preview" : "Preview Before Publishing"}
            </button>
            <button
              type="submit"
              style={{
                ...tableButton,
                background: "#16804a",
                padding: "12px 22px",
              }}
              disabled={busy || imageBusy}
            >
              {busy
                ? "Saving..."
                : post
                  ? "Update Post"
                  : "Save Post"}
            </button>

            <span role="status" aria-live="polite" style={{ color: autoSaveStatus.startsWith("Draft saved") ? "#16804a" : "#64748b", fontSize: 12 }}>
              {autoSaveStatus || "Auto-save starts after you enter a post title."}
            </span>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              Draft save karne se public nahi hoga.
            </span>
          </div>
      </form>

      {notice && (
        <p
          role="status"
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 8,
            background: notice.startsWith("AI draft")
              ? "#ecfdf3"
              : "#fff1f0",
            color: notice.startsWith("AI draft")
              ? "#12633a"
              : "#b42318",
          }}
        >
          {notice}
        </p>
      )}
    </div>
  );
}