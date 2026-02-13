/**
 * User Guide Export — Generate a complete, user-friendly guide
 * from an API collection (no raw API endpoints/URLs).
 *
 * Supports: PDF, Word (.docx), and Markdown (.md)
 */

import type { ParsedEndpoint, FolderNode } from "@/types/postman";
import type { ParsedCollection } from "@/lib/postman-parser";
import { humanizeEndpointName, generateUserDescription } from "@/lib/postman-parser";

// ─── Shared helpers ──────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getActionVerb(method: string): string {
  switch (method.toUpperCase()) {
    case "GET": return "View / Retrieve";
    case "POST": return "Create / Submit";
    case "PUT": return "Update / Replace";
    case "PATCH": return "Modify / Edit";
    case "DELETE": return "Remove / Delete";
    default: return "Perform";
  }
}

function countEndpoints(folder: FolderNode): number {
  let count = folder.endpoints.length;
  for (const child of folder.children) count += countEndpoints(child);
  return count;
}

function getInputFields(ep: ParsedEndpoint): { name: string; description: string; required: boolean }[] {
  const fields: { name: string; description: string; required: boolean }[] = [];
  ep.pathVariables.forEach((v) => fields.push({ name: v.key, description: v.description || "Unique identifier", required: true }));
  ep.queryParams.forEach((p) => fields.push({ name: p.key, description: p.description || "Filter parameter", required: false }));
  if (ep.body?.raw) {
    try {
      const parsed = JSON.parse(ep.body.raw);
      Object.entries(parsed).forEach(([key, value]) => {
        fields.push({ name: key, description: `Example: ${typeof value === "string" ? value : JSON.stringify(value)}`, required: true });
      });
    } catch { /* ignore */ }
  }
  if (ep.body?.formdata) {
    ep.body.formdata.forEach((f) => fields.push({ name: f.key, description: f.description || `Type: ${f.type || "text"}`, required: !f.disabled }));
  }
  return fields;
}

function getSteps(ep: ParsedEndpoint): string[] {
  const steps: string[] = [];
  if (ep.auth) steps.push("Make sure you are logged in and have the necessary permissions.");
  if (ep.pathVariables.length > 0) {
    const vars = ep.pathVariables.map((v) => `"${v.key}"${v.description ? ` (${v.description})` : ""}`).join(", ");
    steps.push(`Provide the required identifier(s): ${vars}.`);
  }
  if (ep.queryParams.length > 0) {
    const req = ep.queryParams.filter((p) => p.value);
    const opt = ep.queryParams.filter((p) => !p.value);
    if (req.length > 0) steps.push(`Set the required filters: ${req.map((p) => `"${p.key}"`).join(", ")}.`);
    if (opt.length > 0) steps.push(`Optionally filter by: ${opt.map((p) => `"${p.key}"`).join(", ")}.`);
  }
  if (ep.body && (ep.body.raw || ep.body.formdata?.length || ep.body.urlencoded?.length)) {
    if (ep.body.mode === "raw" && ep.body.raw) {
      try {
        const parsed = JSON.parse(ep.body.raw);
        const flds = Object.keys(parsed);
        steps.push(`Fill in the required information: ${flds.map((f) => `"${f}"`).join(", ")}.`);
      } catch { steps.push("Provide the required data in the request."); }
    } else if (ep.body.formdata) {
      steps.push(`Fill in the form fields: ${ep.body.formdata.map((f) => `"${f.key}"`).join(", ")}.`);
    }
  }
  steps.push("Submit the request and review the response.");
  if (ep.responses.some((r) => r.code && r.code >= 200 && r.code < 300)) steps.push("On success, you will receive the updated data.");
  return steps;
}

function getResponseFields(ep: ParsedEndpoint): { field: string; desc: string }[] {
  const success = ep.responses.find((r) => r.code && r.code >= 200 && r.code < 300);
  if (!success?.body) return [];
  try {
    const parsed = JSON.parse(success.body);
    return Object.keys(parsed).map((field) => {
      const val = parsed[field];
      const desc = typeof val === "object" ? (Array.isArray(val) ? `list of ${field}` : "detailed information") : String(val);
      return { field, desc };
    });
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════════════
// MARKDOWN EXPORT
// ═══════════════════════════════════════════════════════════════════════

function endpointToUserMd(ep: ParsedEndpoint): string {
  const lines: string[] = [];
  const name = humanizeEndpointName(ep.name);
  const desc = generateUserDescription(ep);
  const verb = getActionVerb(ep.method);
  const inputFields = getInputFields(ep);
  const steps = getSteps(ep);
  const respFields = getResponseFields(ep);

  lines.push(`### ${name}\n`);
  lines.push(`${desc}\n`);
  lines.push(`- **Action:** ${verb}`);
  lines.push(`- **Category:** ${ep.folderPath.join(" > ") || "General"}`);
  lines.push(`- **Authentication:** ${ep.auth ? "Required" : "Not required"}\n`);

  if (steps.length > 0) {
    lines.push(`#### How to Use\n`);
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }

  if (inputFields.length > 0) {
    lines.push(`#### What You Need to Provide\n`);
    lines.push("| Field | Required | Description |");
    lines.push("|-------|----------|-------------|");
    inputFields.forEach((f) => lines.push(`| ${f.name} | ${f.required ? "Yes" : "No"} | ${f.description} |`));
    lines.push("");
  }

  if (respFields.length > 0) {
    lines.push(`#### What You Get Back\n`);
    respFields.forEach((r) => lines.push(`- **${r.field}** — ${r.desc}`));
    lines.push("");
  }

  if (ep.method === "DELETE" || ep.method === "PUT") {
    const note = ep.method === "DELETE"
      ? "This action will permanently remove the data. Please make sure you have the correct item selected before proceeding."
      : "This action will replace the existing data entirely. Make sure all required fields are filled in correctly.";
    lines.push(`> **Important:** ${note}\n`);
  }

  return lines.join("\n");
}

function folderToUserMd(folder: FolderNode, depth: number = 2): string {
  const lines: string[] = [];
  const h = "#".repeat(Math.min(depth, 6));
  const total = countEndpoints(folder);
  lines.push(`${h} ${folder.name}\n`);
  if (folder.description) lines.push(`${folder.description}\n`);
  lines.push(`*${total} available action${total !== 1 ? "s" : ""} in this section.*\n`);

  for (const ep of folder.endpoints) {
    lines.push(endpointToUserMd(ep));
    lines.push("---\n");
  }
  for (const child of folder.children) {
    lines.push(folderToUserMd(child, depth + 1));
  }
  return lines.join("\n");
}

export function exportUserGuideMd(collection: ParsedCollection): void {
  const lines: string[] = [];
  lines.push(`# ${collection.name} — User Guide\n`);
  if (collection.description) lines.push(`${collection.description}\n`);
  lines.push(`This guide covers all **${collection.totalRequests}** actions available across **${collection.totalFolders}** categories.\n`);

  // Table of contents
  lines.push(`## Table of Contents\n`);
  let idx = 1;
  function tocFolder(f: FolderNode, indent: number) {
    const pad = "  ".repeat(indent);
    lines.push(`${pad}${idx}. **${f.name}** (${countEndpoints(f)} actions)`);
    idx++;
    f.children.forEach((c) => tocFolder(c, indent + 1));
  }
  collection.folderTree.forEach((f) => tocFolder(f, 0));
  lines.push("\n---\n");

  for (const folder of collection.folderTree) {
    lines.push(folderToUserMd(folder, 2));
    lines.push("\n");
  }

  lines.push(`\n---\n\n*Generated by NexusDocer on ${new Date().toLocaleDateString()}*\n`);

  const content = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(collection.name)}-user-guide.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════
// PDF EXPORT
// ═══════════════════════════════════════════════════════════════════════

type jsPDFInstance = InstanceType<Awaited<ReturnType<typeof getJsPDF>>>;
async function getJsPDF() { const { jsPDF } = await import("jspdf"); return jsPDF; }

interface Ctx {
  doc: jsPDFInstance;
  y: number;
  margin: number;
  cw: number; // content width
  ph: number; // page height
}

function ck(ctx: Ctx, need: number) { if (ctx.y + need > ctx.ph - 15) { ctx.doc.addPage(); ctx.y = 20; } }

function pHeading(ctx: Ctx, text: string, size: number) {
  ck(ctx, size * 0.6 + 4);
  ctx.doc.setFontSize(size); ctx.doc.setFont("helvetica", "bold"); ctx.doc.setTextColor(30, 30, 30);
  ctx.doc.text(text, ctx.margin, ctx.y); ctx.y += size * 0.5 + 3;
}

function pText(ctx: Ctx, text: string, opts?: { bold?: boolean; color?: [number, number, number]; size?: number; indent?: number }) {
  const sz = opts?.size ?? 10; const ind = opts?.indent ?? 0;
  ctx.doc.setFontSize(sz); ctx.doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
  if (opts?.color) ctx.doc.setTextColor(...opts.color); else ctx.doc.setTextColor(60, 60, 60);
  const lines = ctx.doc.splitTextToSize(text, ctx.cw - ind) as string[];
  for (const line of lines) { ck(ctx, 5); ctx.doc.text(line, ctx.margin + ind, ctx.y); ctx.y += sz * 0.42 + 1; }
}

function pSpacer(ctx: Ctx, h = 4) { ctx.y += h; }

function pSep(ctx: Ctx) { ck(ctx, 6); ctx.doc.setDrawColor(220, 220, 220); ctx.doc.setLineWidth(0.3); ctx.doc.line(ctx.margin, ctx.y, ctx.margin + ctx.cw, ctx.y); ctx.y += 4; }

function actionColor(method: string): [number, number, number] {
  switch (method.toUpperCase()) {
    case "GET": return [34, 139, 34];
    case "POST": return [200, 160, 0];
    case "PUT": return [50, 100, 200];
    case "PATCH": return [210, 130, 0];
    case "DELETE": return [200, 50, 50];
    default: return [100, 100, 100];
  }
}

function renderEndpointPdf(ctx: Ctx, ep: ParsedEndpoint) {
  ck(ctx, 20);
  const name = humanizeEndpointName(ep.name);
  const verb = getActionVerb(ep.method);
  const desc = generateUserDescription(ep);
  const inputFields = getInputFields(ep);
  const steps = getSteps(ep);
  const respFields = getResponseFields(ep);

  // Action badge + name
  const col = actionColor(ep.method);
  ctx.doc.setFillColor(...col);
  ctx.doc.roundedRect(ctx.margin, ctx.y - 3.5, ctx.doc.getTextWidth(verb) + 6, 5, 1, 1, "F");
  ctx.doc.setFontSize(7); ctx.doc.setFont("helvetica", "bold"); ctx.doc.setTextColor(255, 255, 255);
  ctx.doc.text(verb, ctx.margin + 3, ctx.y);

  const badgeW = ctx.doc.getTextWidth(verb) + 9;
  ctx.doc.setFontSize(11); ctx.doc.setFont("helvetica", "bold"); ctx.doc.setTextColor(30, 30, 30);
  ctx.doc.text(name, ctx.margin + badgeW, ctx.y);
  ctx.y += 5;

  if (ep.folderPath.length > 0) {
    pText(ctx, ep.folderPath.join(" > "), { size: 8, color: [140, 140, 140] });
  }

  pText(ctx, desc, { size: 9 });
  pSpacer(ctx, 2);

  // Overview
  pText(ctx, `Authentication: ${ep.auth ? "Required" : "Not required"}`, { size: 8, bold: true, color: [100, 100, 100] });
  pSpacer(ctx, 2);

  // Steps
  if (steps.length > 0) {
    pText(ctx, "How to Use:", { size: 9, bold: true });
    pSpacer(ctx, 1);
    steps.forEach((s, i) => {
      ck(ctx, 6);
      pText(ctx, `${i + 1}. ${s}`, { size: 8.5, indent: 4 });
    });
    pSpacer(ctx, 3);
  }

  // Input fields
  if (inputFields.length > 0) {
    pText(ctx, "What You Need to Provide:", { size: 9, bold: true });
    pSpacer(ctx, 1);
    for (const f of inputFields) {
      ck(ctx, 8);
      pText(ctx, `${f.name} (${f.required ? "Required" : "Optional"})`, { size: 8.5, bold: true, indent: 4 });
      pText(ctx, f.description, { size: 7.5, indent: 8, color: [120, 120, 120] });
    }
    pSpacer(ctx, 3);
  }

  // Response fields
  if (respFields.length > 0) {
    pText(ctx, "What You Get Back:", { size: 9, bold: true });
    pSpacer(ctx, 1);
    for (const r of respFields) {
      pText(ctx, `• ${r.field} — ${r.desc}`, { size: 8.5, indent: 4 });
    }
    pSpacer(ctx, 3);
  }

  // Important note
  if (ep.method === "DELETE" || ep.method === "PUT") {
    const note = ep.method === "DELETE"
      ? "This action will permanently remove the data. Make sure you have the correct item selected before proceeding."
      : "This action will replace existing data entirely. Make sure all required fields are filled in correctly.";
    ck(ctx, 10);
    ctx.doc.setFillColor(255, 248, 230);
    ctx.doc.roundedRect(ctx.margin, ctx.y - 2, ctx.cw, 10, 1.5, 1.5, "F");
    pText(ctx, `⚠ ${note}`, { size: 7.5, color: [180, 100, 0] });
    pSpacer(ctx, 4);
  }
}

function renderFolderPdf(ctx: Ctx, folder: FolderNode, depth: number = 0) {
  ck(ctx, 14);
  const headingSize = depth === 0 ? 14 : 12;
  pHeading(ctx, folder.name, headingSize);
  if (folder.description) { pText(ctx, folder.description, { size: 9 }); pSpacer(ctx, 2); }
  const total = countEndpoints(folder);
  pText(ctx, `${total} available action${total !== 1 ? "s" : ""}`, { size: 8, color: [140, 140, 140] });
  pSpacer(ctx, 3);

  for (const ep of folder.endpoints) {
    renderEndpointPdf(ctx, ep);
    pSep(ctx);
  }
  for (const child of folder.children) {
    renderFolderPdf(ctx, child, depth + 1);
  }
}

function addPdfFooters(ctx: Ctx, title: string) {
  const total = ctx.doc.getNumberOfPages();
  const pw = ctx.doc.internal.pageSize.getWidth();
  for (let i = 1; i <= total; i++) {
    ctx.doc.setPage(i);
    ctx.doc.setFontSize(7); ctx.doc.setFont("helvetica", "normal"); ctx.doc.setTextColor(170, 170, 170);
    const ph = ctx.doc.internal.pageSize.getHeight();
    ctx.doc.text(`${title} — User Guide — Generated by NexusDocer — Page ${i} of ${total}`, ctx.margin, ph - 8);
    ctx.doc.text(new Date().toLocaleDateString(), pw - ctx.margin, ph - 8, { align: "right" });
  }
}

export async function exportUserGuidePdf(collection: ParsedCollection): Promise<void> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;
  const ctx: Ctx = { doc, y: 20, margin, cw: pw - margin * 2, ph: doc.internal.pageSize.getHeight() };

  // ── Cover page ──
  doc.setFillColor(25, 25, 25);
  doc.rect(0, 0, pw, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text("User Guide", margin, 18);
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(collection.name, ctx.cw) as string[];
  let ty = 32;
  for (const l of titleLines.slice(0, 2)) { doc.text(l, margin, ty); ty += 10; }
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 200, 200);
  doc.text(`Complete guide for all ${collection.totalRequests} available actions`, margin, 52);
  ctx.y = 72; doc.setTextColor(60, 60, 60);

  // Stats
  const stats = [
    { label: "Actions", value: String(collection.totalRequests) },
    { label: "Categories", value: String(collection.totalFolders) },
    { label: "Action Types", value: String(Object.keys(collection.methods).length) },
  ];
  const cardW = (ctx.cw - (stats.length - 1) * 4) / stats.length;
  for (let i = 0; i < stats.length; i++) {
    const x = margin + i * (cardW + 4);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(x, ctx.y, cardW, 20, 2, 2, "F");
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
    doc.text(stats[i].value, x + cardW / 2, ctx.y + 10, { align: "center" });
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(130, 130, 130);
    doc.text(stats[i].label, x + cardW / 2, ctx.y + 16, { align: "center" });
  }
  ctx.y += 28;

  if (collection.description) { pText(ctx, collection.description); pSpacer(ctx, 6); }

  // Table of contents
  pHeading(ctx, "Table of Contents", 14); pSpacer(ctx, 2);
  let idx = 1;
  function tocFolder(f: FolderNode, depth: number) {
    pText(ctx, `${idx}. ${f.name} (${countEndpoints(f)} actions)`, { size: 9, bold: depth === 0, indent: depth * 6 });
    idx++;
    f.children.forEach((c) => tocFolder(c, depth + 1));
  }
  collection.folderTree.forEach((f) => tocFolder(f, 0));
  pSpacer(ctx, 6);

  // Content
  doc.addPage(); ctx.y = 20;
  for (const folder of collection.folderTree) {
    renderFolderPdf(ctx, folder);
    pSpacer(ctx, 4);
  }

  addPdfFooters(ctx, collection.name);
  doc.save(`${slugify(collection.name)}-user-guide.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════
// WORD (.DOCX) EXPORT
// ═══════════════════════════════════════════════════════════════════════

export async function exportUserGuideDocx(collection: ParsedCollection): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
    ShadingType,
  } = await import("docx");
  const { saveAs } = await import("file-saver");

  const children: (
    InstanceType<typeof Paragraph> |
    InstanceType<typeof Table>
  )[] = [];

  // ── Title ──
  children.push(new Paragraph({
    children: [new TextRun({ text: collection.name, bold: true, size: 52, font: "Calibri", color: "1a1a1a" })],
    heading: HeadingLevel.TITLE,
    spacing: { after: 100 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "User Guide", size: 28, font: "Calibri", color: "888888", italics: true })],
    spacing: { after: 200 },
  }));
  if (collection.description) {
    children.push(new Paragraph({
      children: [new TextRun({ text: collection.description, size: 22, font: "Calibri", color: "555555" })],
      spacing: { after: 200 },
    }));
  }

  // Stats
  children.push(new Paragraph({
    children: [
      new TextRun({ text: `${collection.totalRequests} Actions`, bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text: `  •  ${collection.totalFolders} Categories`, size: 22, font: "Calibri", color: "666666" }),
      new TextRun({ text: `  •  ${Object.keys(collection.methods).length} Action Types`, size: 22, font: "Calibri", color: "666666" }),
    ],
    spacing: { after: 400 },
  }));

  // ── Table of Contents ──
  children.push(new Paragraph({
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: "Calibri" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 100 },
  }));

  function addToc(f: FolderNode, depth: number) {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: f.name, bold: depth === 0, size: 22, font: "Calibri" }),
        new TextRun({ text: ` (${countEndpoints(f)} actions)`, size: 20, font: "Calibri", color: "999999" }),
      ],
      indent: { left: depth * 400 },
      spacing: { after: 40 },
    }));
    f.children.forEach((c) => addToc(c, depth + 1));
  }
  collection.folderTree.forEach((f) => addToc(f, 0));

  // ── Render folders ──
  function addFolder(f: FolderNode, level: number) {
    const headingLevel = level === 0 ? HeadingLevel.HEADING_1 : level === 1 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
    const total = countEndpoints(f);

    children.push(new Paragraph({
      children: [new TextRun({ text: f.name, bold: true, size: level === 0 ? 32 : 28, font: "Calibri" })],
      heading: headingLevel,
      spacing: { before: 300, after: 60 },
    }));
    if (f.description) {
      children.push(new Paragraph({
        children: [new TextRun({ text: f.description, size: 22, font: "Calibri", color: "555555" })],
        spacing: { after: 60 },
      }));
    }
    children.push(new Paragraph({
      children: [new TextRun({ text: `${total} available action${total !== 1 ? "s" : ""} in this section`, italics: true, size: 20, font: "Calibri", color: "999999" })],
      spacing: { after: 160 },
    }));

    for (const ep of f.endpoints) addEndpoint(ep);
    for (const child of f.children) addFolder(child, level + 1);
  }

  function addEndpoint(ep: ParsedEndpoint) {
    const name = humanizeEndpointName(ep.name);
    const verb = getActionVerb(ep.method);
    const desc = generateUserDescription(ep);
    const inputFields = getInputFields(ep);
    const steps = getSteps(ep);
    const respFields = getResponseFields(ep);

    // Name + badge
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `[${verb}]`, bold: true, size: 18, font: "Calibri", color: ep.method === "DELETE" ? "cc3333" : ep.method === "GET" ? "228b22" : "cc9900" }),
        new TextRun({ text: `  ${name}`, bold: true, size: 26, font: "Calibri" }),
      ],
      spacing: { before: 200, after: 40 },
    }));

    if (ep.folderPath.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: ep.folderPath.join(" > "), size: 18, font: "Calibri", color: "999999" })],
        spacing: { after: 40 },
      }));
    }

    children.push(new Paragraph({
      children: [new TextRun({ text: desc, size: 21, font: "Calibri", color: "444444" })],
      spacing: { after: 60 },
    }));

    children.push(new Paragraph({
      children: [new TextRun({ text: `Authentication: ${ep.auth ? "Required" : "Not required"}`, size: 20, font: "Calibri", color: "777777" })],
      spacing: { after: 100 },
    }));

    // Steps
    if (steps.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "How to Use", bold: true, size: 22, font: "Calibri" })],
        spacing: { before: 60, after: 40 },
      }));
      steps.forEach((s, i) => {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${s}`, size: 20, font: "Calibri" })],
          indent: { left: 300 },
          spacing: { after: 30 },
        }));
      });
    }

    // Input fields table
    if (inputFields.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "What You Need to Provide", bold: true, size: 22, font: "Calibri" })],
        spacing: { before: 100, after: 40 },
      }));

      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Field", bold: true, size: 18, font: "Calibri" })] })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "f0f0f0" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Required", bold: true, size: 18, font: "Calibri" })] })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "f0f0f0" },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true, size: 18, font: "Calibri" })] })],
            width: { size: 60, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: "f0f0f0" },
          }),
        ],
      });

      const dataRows = inputFields.map((f) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: f.name, bold: true, size: 18, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: f.required ? "Yes" : "No", size: 18, font: "Calibri", color: f.required ? "cc3333" : "228b22" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: f.description, size: 18, font: "Calibri", color: "555555" })] })] }),
        ],
      }));

      children.push(new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }

    // Response fields
    if (respFields.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "What You Get Back", bold: true, size: 22, font: "Calibri" })],
        spacing: { before: 100, after: 40 },
      }));
      respFields.forEach((r) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `• ${r.field}`, bold: true, size: 20, font: "Calibri" }),
            new TextRun({ text: ` — ${r.desc}`, size: 20, font: "Calibri", color: "666666" }),
          ],
          indent: { left: 300 },
          spacing: { after: 20 },
        }));
      });
    }

    // Important note
    if (ep.method === "DELETE" || ep.method === "PUT") {
      const note = ep.method === "DELETE"
        ? "This action will permanently remove the data. Make sure you have the correct item selected before proceeding."
        : "This action will replace existing data entirely. Make sure all required fields are filled in correctly.";
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "⚠ Important: ", bold: true, size: 20, font: "Calibri", color: "b46400" }),
          new TextRun({ text: note, size: 20, font: "Calibri", color: "b46400" }),
        ],
        spacing: { before: 80, after: 60 },
        shading: { type: ShadingType.SOLID, color: "fff8e6" },
      }));
    }

    // Separator
    children.push(new Paragraph({
      children: [],
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "dddddd" } },
      spacing: { before: 100, after: 100 },
    }));
  }

  for (const folder of collection.folderTree) {
    addFolder(folder, 0);
  }

  // Footer
  children.push(new Paragraph({
    children: [new TextRun({ text: `Generated by NexusDocer on ${new Date().toLocaleDateString()}`, size: 18, font: "Calibri", color: "bbbbbb", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
  }));

  const docObj = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(docObj);
  saveAs(blob, `${slugify(collection.name)}-user-guide.docx`);
}
