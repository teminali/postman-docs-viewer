"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  WrapText,
  Hash,
  Download,
  PenLine,
  Eye,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Language map for prism ─────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  tsx: "tsx",
  jsx: "jsx",
  python: "python",
  dart: "javascript", // prism doesn't have dart, fallback
  swift: "swift",
  kotlin: "kotlin",
  bash: "bash",
  markdown: "markdown",
  json: "json",
  yaml: "yaml",
  css: "css",
  html: "markup",
};

function resolveLanguage(lang: string): string {
  return LANG_MAP[lang.toLowerCase()] || "typescript";
}

// ─── Props ──────────────────────────────────────────────────────────────

interface CodeViewerProps {
  code: string;
  language: string;
  fileName?: string;
  badge?: string;
  lineCount?: number;
  onCodeChange?: (newCode: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────

export function CodeViewer({
  code,
  language,
  fileName,
  badge,
  lineCount,
  onCodeChange,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [editorMode, setEditorMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const lang = resolveLanguage(language);
  const lines = useMemo(() => (editorMode ? editedCode : code).split("\n"), [editorMode, editedCode, code]);
  const displayLineCount = lineCount ?? lines.length;

  // Sync external code changes
  useEffect(() => {
    setEditedCode(code);
  }, [code]);

  // Focus textarea when entering editor mode
  useEffect(() => {
    if (editorMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editorMode]);

  // Focus search input when opening search
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Search matches
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setCurrentMatch(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches: number[] = [];
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(q)) matches.push(i);
    });
    setSearchMatches(matches);
    setCurrentMatch(0);
  }, [searchQuery, lines]);

  // Scroll to current match
  useEffect(() => {
    if (searchMatches.length === 0 || !codeContainerRef.current) return;
    const lineIndex = searchMatches[currentMatch];
    const lineEl = codeContainerRef.current.querySelector(`[data-line="${lineIndex}"]`);
    if (lineEl) {
      lineEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [currentMatch, searchMatches]);

  const handleCopy = useCallback(async () => {
    const textToCopy = editorMode ? editedCode : code;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code, editedCode, editorMode]);

  const handleDownload = useCallback(() => {
    const textToDownload = editorMode ? editedCode : code;
    const ext = fileName?.split(".").pop() || "txt";
    const name = fileName || `generated.${ext}`;
    const blob = new Blob([textToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, editedCode, editorMode, fileName]);

  const handleReset = useCallback(() => {
    setEditedCode(code);
    onCodeChange?.(code);
  }, [code, onCodeChange]);

  const handleEditorChange = useCallback(
    (value: string) => {
      setEditedCode(value);
      onCodeChange?.(value);
    },
    [onCodeChange]
  );

  const nextMatch = () => setCurrentMatch((prev) => (prev + 1) % searchMatches.length);
  const prevMatch = () => setCurrentMatch((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f" && !editorMode) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
      if (e.key === "Enter" && searchOpen && searchMatches.length > 0) {
        if (e.shiftKey) prevMatch();
        else nextMatch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen, searchMatches.length, editorMode]);

  // ── Toolbar ──
  const toolbar = (isFullscreen: boolean) => (
    <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5 gap-2 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        {badge && (
          <Badge variant="outline" className="text-[10px] shrink-0">
            {badge}
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground shrink-0">
          {displayLineCount} lines
        </span>
        {editorMode && editedCode !== code && (
          <Badge variant="secondary" className="text-[9px] bg-yellow-500/20 text-yellow-600 shrink-0">
            Modified
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <TooltipProvider delayDuration={300}>
          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={searchOpen ? "secondary" : "ghost"}
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (searchOpen) setSearchQuery("");
                }}
              >
                <Search className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Find (Cmd+F)</TooltipContent>
          </Tooltip>

          {/* Line numbers */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showLineNumbers ? "secondary" : "ghost"}
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowLineNumbers(!showLineNumbers)}
              >
                <Hash className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Line numbers</TooltipContent>
          </Tooltip>

          {/* Word wrap */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={wordWrap ? "secondary" : "ghost"}
                size="icon"
                className="h-6 w-6"
                onClick={() => setWordWrap(!wordWrap)}
              >
                <WrapText className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Word wrap</TooltipContent>
          </Tooltip>

          {/* Editor mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorMode ? "secondary" : "ghost"}
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditorMode(!editorMode)}
              >
                {editorMode ? <Eye className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">
              {editorMode ? "Preview mode" : "Editor mode"}
            </TooltipContent>
          </Tooltip>

          {/* Reset (only in editor mode when modified) */}
          {editorMode && editedCode !== code && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Reset changes</TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Download */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">Download file</TooltipContent>
          </Tooltip>

          {/* Copy */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">
              {copied ? "Copied!" : "Copy to clipboard"}
            </TooltipContent>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  // ── Search bar ──
  const searchBar = (
    <div className="flex items-center gap-1.5 border-b bg-muted/30 px-3 py-1">
      <Search className="h-3 w-3 text-muted-foreground shrink-0" />
      <Input
        ref={searchInputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Find in code..."
        className="border-0 h-6 text-[11px] bg-transparent focus-visible:ring-0 px-1"
      />
      {searchMatches.length > 0 && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {currentMatch + 1}/{searchMatches.length}
        </span>
      )}
      {searchQuery && searchMatches.length === 0 && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          No results
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0"
        onClick={prevMatch}
        disabled={searchMatches.length === 0}
      >
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0"
        onClick={nextMatch}
        disabled={searchMatches.length === 0}
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0"
        onClick={() => {
          setSearchOpen(false);
          setSearchQuery("");
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  // ── Highlight search matches in a line ──
  const highlightSearch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const q = searchQuery.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-400/40 text-inherit rounded-sm px-0.5">{text.slice(idx, idx + searchQuery.length)}</mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  // Sync textarea scroll with highlight layer
  const highlightRef = useRef<HTMLPreElement>(null);
  const handleEditorScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // ── Highlighted code layer (shared between editor & preview) ──
  const highlightedCode = (displayCode: string, isEditor: boolean) => (
    <Highlight theme={themes.oneDark} code={displayCode} language={lang}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          ref={isEditor ? highlightRef : undefined}
          className={cn(
            "text-xs font-mono leading-[1.65rem] p-3 m-0 bg-transparent",
            wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
            isEditor && "pointer-events-none"
          )}
          style={{ background: "transparent" }}
          aria-hidden={isEditor}
        >
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line });
            const isMatchLine = searchMatches.includes(i);
            return (
              <div
                key={i}
                {...lineProps}
                data-line={i}
                className={cn(
                  lineProps.className,
                  "flex",
                  isMatchLine && searchOpen && "bg-yellow-500/10"
                )}
              >
                {showLineNumbers && (
                  <span className="inline-block w-10 shrink-0 select-none text-right pr-4 text-muted-foreground/40 text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span className="flex-1">
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token });
                    return (
                      <span key={key} {...tokenProps}>
                        {searchOpen && searchQuery
                          ? highlightSearch(token.content)
                          : token.content}
                      </span>
                    );
                  })}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );

  // ── Code body ──
  const codeBody = (maxHeight: string) => (
    <div
      ref={codeContainerRef}
      className={cn("overflow-auto", maxHeight)}
    >
      {editorMode ? (
        /* ── Editor mode: highlighted background + transparent textarea ── */
        <div className="relative min-h-[200px]">
          {/* Syntax-highlighted layer (background) — positioned under textarea, sized by grid overlap */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {highlightedCode(editedCode, true)}
          </div>
          {/* Transparent textarea (foreground, captures input) — defines the scroll height */}
          <textarea
            ref={textareaRef}
            value={editedCode}
            onChange={(e) => handleEditorChange(e.target.value)}
            onScroll={handleEditorScroll}
            spellCheck={false}
            className={cn(
              "relative w-full resize-none bg-transparent text-xs font-mono leading-[1.65rem] p-3 outline-none text-transparent caret-white selection:bg-blue-500/30",
              showLineNumbers && "pl-[3.5rem]",
              wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            )}
            style={{
              tabSize: 2,
              caretColor: "#abb2bf",
              /* Make textarea tall enough for all lines */
              height: `${(editedCode.split("\n").length + 1) * 1.65}rem`,
              minHeight: "200px",
            }}
          />
        </div>
      ) : (
        /* ── Preview mode: syntax highlighted ── */
        highlightedCode(code, false)
      )}
    </div>
  );

  // ── Status bar ──
  const statusBar = (
    <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1">
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground font-mono">
          {language}
        </span>
        {fileName && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
            {fileName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">
          {editorMode ? "Editor" : "Preview"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {wordWrap ? "Wrap" : "No Wrap"}
        </span>
        <span className="text-[10px] text-muted-foreground">
          UTF-8
        </span>
      </div>
    </div>
  );

  // ── Inline viewer ──
  const inlineViewer = (
    <div className="rounded-lg border overflow-hidden bg-[#282c34] min-w-0 max-w-full">
      {toolbar(false)}
      {searchOpen && searchBar}
      {codeBody("max-h-[400px]")}
      {statusBar}
    </div>
  );

  // ── Fullscreen dialog ──
  const fullscreenViewer = (
    <Dialog open={fullscreen} onOpenChange={setFullscreen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[95vw] max-w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden gap-0"
      >
        <DialogTitle className="sr-only">Code Viewer</DialogTitle>
        {toolbar(true)}
        {searchOpen && searchBar}
        <div className="flex-1 min-h-0 bg-[#282c34]">
          {codeBody("h-full")}
        </div>
        {statusBar}
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {inlineViewer}
      {fullscreenViewer}
    </>
  );
}
