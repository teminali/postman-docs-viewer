"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ParsedEndpoint } from "@/types/postman";
import { getMethodColor, formatJson } from "@/lib/postman-parser";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Lock,
  FileJson,
  ArrowRightLeft,
  ListFilter,
  Variable,
  Code2,
  FileDown,
  Send,
} from "lucide-react";
import { ApiPlayground } from "@/components/api-playground";
import { ApiCodeSnippets } from "@/components/api-code-snippets";

interface DevViewProps {
  endpoint: ParsedEndpoint;
  onExportMd?: () => void;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative max-w-full min-w-0 rounded-lg border overflow-hidden bg-neutral-950 text-neutral-50 dark:bg-card dark:text-card-foreground dark:border-border">
      {language && (
        <div className="flex items-center justify-between border-b border-neutral-800 dark:border-border px-4 py-2">
          <span className="text-xs text-neutral-400 dark:text-muted-foreground font-mono">{language}</span>
          <button
            className="text-xs text-neutral-400 dark:text-muted-foreground hover:text-neutral-200 dark:hover:text-foreground transition-colors"
            onClick={() => navigator.clipboard.writeText(code)}
          >
            Copy
          </button>
        </div>
      )}
      <pre className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DevView({ endpoint, onExportMd }: DevViewProps) {
  const hasQueryParams = endpoint.queryParams.length > 0;
  const hasPathVars = endpoint.pathVariables.length > 0;
  const hasHeaders = endpoint.headers.length > 0;
  const hasBody = endpoint.body && (endpoint.body.raw || endpoint.body.formdata?.length || endpoint.body.urlencoded?.length);
  const hasAuth = endpoint.auth;
  const hasResponses = endpoint.responses.length > 0;

  return (
    <div className="space-y-6">
      {/* Endpoint Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
          <Badge
            variant="outline"
            className={`${getMethodColor(endpoint.method)} text-xs font-mono font-bold px-2.5 py-1 shrink-0`}
          >
            {endpoint.method}
          </Badge>
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight">{endpoint.name}</h2>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {endpoint.url}
            </p>
          </div>
          </div>
          {onExportMd && (
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onExportMd}>
              <FileDown className="h-3.5 w-3.5" />
              Export .md
            </Button>
          )}
        </div>
        {endpoint.folderPath.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {endpoint.folderPath.map((folder, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                <span>{folder}</span>
              </span>
            ))}
          </div>
        )}
        {endpoint.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {endpoint.description}
          </p>
        )}
      </div>

      <Separator />

      {/* ═══ Tabbed sections ═══ */}
      <Tabs defaultValue="docs" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="docs" className="gap-1.5 text-xs">
            <FileJson className="h-3.5 w-3.5" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="playground" className="gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" />
            Playground
          </TabsTrigger>
          <TabsTrigger value="snippets" className="gap-1.5 text-xs">
            <Code2 className="h-3.5 w-3.5" />
            Code Snippets
          </TabsTrigger>
        </TabsList>

        {/* ─── Documentation tab ─── */}
        <TabsContent value="docs" className="mt-6">
      <Accordion
        type="multiple"
        defaultValue={[
          "auth",
          "headers",
          "query",
          "path",
          "body",
          "responses",
        ]}
        className="space-y-3"
      >
        {/* Authentication */}
        {hasAuth && (
          <AccordionItem value="auth" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Authentication
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {endpoint.auth!.type}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Type: <span className="font-mono">{endpoint.auth!.type}</span>
                </p>
                {endpoint.auth!.bearer && (
                  <div className="space-y-1">
                    {endpoint.auth!.bearer.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground">
                          {item.key}:
                        </span>
                        <span className="font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Headers */}
        {hasHeaders && (
          <AccordionItem value="headers" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                Headers
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {endpoint.headers.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-xs">Key</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Value</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.headers.map((header, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">{header.key}</td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {header.value}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {header.description || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Query Parameters */}
        {hasQueryParams && (
          <AccordionItem value="query" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ListFilter className="h-4 w-4 text-muted-foreground" />
                Query Parameters
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {endpoint.queryParams.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-xs">Parameter</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Example</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.queryParams.map((param, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">
                          {param.key}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {param.value || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {param.description || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Path Variables */}
        {hasPathVars && (
          <AccordionItem value="path" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Variable className="h-4 w-4 text-muted-foreground" />
                Path Variables
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {endpoint.pathVariables.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-xs">Variable</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Example</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.pathVariables.map((variable, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">
                          :{variable.key}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {variable.value || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {variable.description || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Request Body */}
        {hasBody && (
          <AccordionItem value="body" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileJson className="h-4 w-4 text-muted-foreground" />
                Request Body
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {endpoint.body!.mode}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {endpoint.body!.mode === "raw" && endpoint.body!.raw && (
                <CodeBlock
                  code={formatJson(endpoint.body!.raw)}
                  language={
                    endpoint.body!.options?.raw?.language || "json"
                  }
                />
              )}
              {endpoint.body!.mode === "formdata" && endpoint.body!.formdata && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-xs">Key</th>
                        <th className="px-3 py-2 text-left font-medium text-xs">Value</th>
                        <th className="px-3 py-2 text-left font-medium text-xs">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.body!.formdata!.map((field, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2 font-mono text-xs">{field.key}</td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {field.value || field.src || "—"}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {field.type || "text"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {endpoint.body!.mode === "urlencoded" && endpoint.body!.urlencoded && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-xs">Key</th>
                        <th className="px-3 py-2 text-left font-medium text-xs">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.body!.urlencoded!.map((field, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2 font-mono text-xs">{field.key}</td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {field.value || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Responses */}
        {hasResponses && (
          <AccordionItem value="responses" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                Example Responses
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {endpoint.responses.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {endpoint.responses.map((response, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        response.code && response.code < 300
                          ? "border-emerald-300 text-emerald-700"
                          : response.code && response.code < 400
                          ? "border-amber-300 text-amber-700"
                          : "border-red-300 text-red-700"
                      }`}
                    >
                      {response.code || "N/A"} {response.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {response.name}
                    </span>
                  </div>
                  {response.body && (
                    <CodeBlock
                      code={formatJson(response.body)}
                      language={response._postman_previewlanguage || "json"}
                    />
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* No details fallback */}
      {!hasAuth && !hasHeaders && !hasQueryParams && !hasPathVars && !hasBody && !hasResponses && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No additional details available for this endpoint.</p>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* ─── Playground tab ─── */}
        <TabsContent value="playground" className="mt-6">
          <ApiPlayground endpoint={endpoint} />
        </TabsContent>

        {/* ─── Code Snippets tab ─── */}
        <TabsContent value="snippets" className="mt-6">
          <ApiCodeSnippets endpoint={endpoint} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
