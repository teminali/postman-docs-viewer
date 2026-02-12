"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  /** Called with the rendered SVG string when ready (e.g. for export). */
  onSvgReady?: (svg: string) => void;
}

export function MermaidDiagram({ chart, className, onSvgReady }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart.trim()) {
      setSvg(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setSvg(null);

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            primaryColor: "#f1f5f9",
            primaryTextColor: "#0f172a",
            primaryBorderColor: "#cbd5e1",
            lineColor: "#64748b",
            secondaryColor: "#e2e8f0",
            tertiaryColor: "#f8fafc",
            fontSize: "15px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
            padding: 16,
          },
        });
        const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
        const { svg: result } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(result);
          onSvgReady?.(result);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to render diagram");
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onSvgReady intentionally not in deps to avoid re-running when parent passes new callback
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive ${className ?? ""}`}>
        {error}
      </div>
    );
  }
  if (!svg) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 p-8 text-muted-foreground ${className ?? ""}`}>
        Loading diagram…
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      className={`mermaid-diagram-wrapper overflow-auto rounded-lg border border-border bg-muted/20 p-6 ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
