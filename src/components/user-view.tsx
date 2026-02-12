"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ParsedEndpoint } from "@/types/postman";
import {
  humanizeEndpointName,
  generateUserDescription,
  formatJson,
  getMethodColor,
} from "@/lib/postman-parser";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle2,
  Info,
  ListChecks,
  ArrowRight,
  AlertTriangle,
  FileDown,
} from "lucide-react";

interface UserViewProps {
  endpoint: ParsedEndpoint;
  onExportMd?: () => void;
}

function getActionVerb(method: string): string {
  switch (method) {
    case "GET":
      return "View / Retrieve";
    case "POST":
      return "Create / Submit";
    case "PUT":
      return "Update / Replace";
    case "PATCH":
      return "Modify / Edit";
    case "DELETE":
      return "Remove / Delete";
    default:
      return "Perform";
  }
}

function getSteps(endpoint: ParsedEndpoint): string[] {
  const steps: string[] = [];

  if (endpoint.auth) {
    steps.push(
      "Make sure you are logged in and have the necessary permissions."
    );
  }

  if (endpoint.pathVariables.length > 0) {
    const vars = endpoint.pathVariables
      .map((v) => `"${v.key}"${v.description ? ` (${v.description})` : ""}`)
      .join(", ");
    steps.push(`Provide the required identifier(s): ${vars}.`);
  }

  if (endpoint.queryParams.length > 0) {
    const required = endpoint.queryParams.filter((p) => p.value);
    const optional = endpoint.queryParams.filter((p) => !p.value);

    if (required.length > 0) {
      steps.push(
        `Set the required filters: ${required.map((p) => `"${p.key}"`).join(", ")}.`
      );
    }
    if (optional.length > 0) {
      steps.push(
        `Optionally, you can also filter by: ${optional.map((p) => `"${p.key}"`).join(", ")}.`
      );
    }
  }

  if (
    endpoint.body &&
    (endpoint.body.raw || endpoint.body.formdata?.length || endpoint.body.urlencoded?.length)
  ) {
    if (endpoint.body.mode === "raw" && endpoint.body.raw) {
      try {
        const parsed = JSON.parse(endpoint.body.raw);
        const fields = Object.keys(parsed);
        steps.push(
          `Fill in the required information: ${fields.map((f) => `"${f}"`).join(", ")}.`
        );
      } catch {
        steps.push("Provide the required data in the request.");
      }
    } else if (endpoint.body.formdata) {
      const fields = endpoint.body.formdata.map((f) => `"${f.key}"`);
      steps.push(
        `Fill in the form fields: ${fields.join(", ")}.`
      );
    }
  }

  steps.push("Submit the request and review the response.");

  if (endpoint.responses.some((r) => r.code && r.code >= 200 && r.code < 300)) {
    steps.push("On success, you will receive the updated data.");
  }

  return steps;
}

function getInputFields(
  endpoint: ParsedEndpoint
): { name: string; description: string; required: boolean }[] {
  const fields: { name: string; description: string; required: boolean }[] = [];

  endpoint.pathVariables.forEach((v) => {
    fields.push({
      name: v.key,
      description: v.description || "Unique identifier",
      required: true,
    });
  });

  endpoint.queryParams.forEach((p) => {
    fields.push({
      name: p.key,
      description: p.description || "Filter parameter",
      required: false,
    });
  });

  if (endpoint.body?.raw) {
    try {
      const parsed = JSON.parse(endpoint.body.raw);
      Object.entries(parsed).forEach(([key, value]) => {
        fields.push({
          name: key,
          description: `Example: ${typeof value === "string" ? value : JSON.stringify(value)}`,
          required: true,
        });
      });
    } catch {
      // ignore
    }
  }

  if (endpoint.body?.formdata) {
    endpoint.body.formdata.forEach((f) => {
      fields.push({
        name: f.key,
        description: f.description || `Type: ${f.type || "text"}`,
        required: !f.disabled,
      });
    });
  }

  return fields;
}

export function UserView({ endpoint, onExportMd }: UserViewProps) {
  const humanName = humanizeEndpointName(endpoint.name);
  const description = generateUserDescription(endpoint);
  const actionVerb = getActionVerb(endpoint.method);
  const steps = getSteps(endpoint);
  const inputFields = getInputFields(endpoint);
  const successResponse = endpoint.responses.find(
    (r) => r.code && r.code >= 200 && r.code < 300
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Title */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${getMethodColor(endpoint.method)} text-[10px] font-bold px-2 py-0.5`}
          >
            {actionVerb}
          </Badge>
          {endpoint.folderPath.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {endpoint.folderPath.join(" > ")}
            </span>
          )}
          </div>
          {onExportMd && (
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onExportMd}>
              <FileDown className="h-3.5 w-3.5" />
              Export .md
            </Button>
          )}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{humanName}</h2>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <Separator />

      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Action Type</p>
              <p className="font-medium">{actionVerb}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Category</p>
              <p className="font-medium">
                {endpoint.folderPath.join(" > ") || "General"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">
                Authentication Required
              </p>
              <p className="font-medium">
                {endpoint.auth ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">
                Input Required
              </p>
              <p className="font-medium">
                {inputFields.length > 0
                  ? `${inputFields.filter((f) => f.required).length} required, ${inputFields.filter((f) => !f.required).length} optional`
                  : "None"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            How to Use (Step by Step)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Input Fields */}
      {inputFields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              What You Need to Provide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inputFields.map((field, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2 border-b last:border-0"
                >
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{field.name}</span>
                      <Badge
                        variant={field.required ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {field.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {field.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* What You Get Back */}
      {successResponse && successResponse.body && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              What You Get Back
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              When successful, you will receive the following data:
            </p>
            {(() => {
              try {
                const parsed = JSON.parse(successResponse.body);
                const fields = Object.keys(parsed);
                return (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div
                        key={field}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium">{field}</span>
                        <span className="text-muted-foreground">
                          — {typeof parsed[field] === "object"
                            ? Array.isArray(parsed[field])
                              ? `list of ${field}`
                              : "detailed information"
                            : String(parsed[field])}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              } catch {
                return (
                  <div className="rounded-lg border bg-muted/30 p-4 max-w-full min-w-0 overflow-hidden">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {formatJson(successResponse.body)}
                    </pre>
                  </div>
                );
              }
            })()}
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      {(endpoint.method === "DELETE" || endpoint.method === "PUT") && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Important Note
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {endpoint.method === "DELETE"
                    ? "This action will permanently remove the data. Please make sure you have the correct item selected before proceeding. This action may not be reversible."
                    : "This action will replace the existing data entirely. Make sure all required fields are filled in correctly to avoid data loss."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
