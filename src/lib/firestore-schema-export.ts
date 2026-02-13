/**
 * Export FirestoreSchema to Markdown.
 */

import type {
  FirestoreSchema,
  FirestoreCollectionSchema,
  FirestoreFieldSchema,
  FirestoreIndex,
  FirestoreFieldOverride,
} from "@/types/firestore-schema";

// ─── Full database export ───────────────────────────────────────────

/** Export the entire schema as one Markdown document. */
export function schemaToMarkdown(schema: FirestoreSchema): string {
  const lines: string[] = [];

  lines.push(`# ${schema.projectName} — Database Documentation\n`);
  lines.push(`Scanned: ${new Date(schema.scannedAt).toLocaleString()}\n`);
  lines.push(`- **Collections:** ${schema.collections.length}`);
  const totalFields = schema.collections.reduce(
    (sum, c) => sum + c.fields.length,
    0
  );
  lines.push(`- **Total fields discovered:** ${totalFields}`);
  lines.push(`- **Composite indexes:** ${schema.indexes.length}\n`);

  // Table of contents
  lines.push("## Table of Contents\n");
  for (const col of schema.collections) {
    lines.push(`- [${col.name}](#${slugify(col.name)})`);
    for (const sub of col.subcollections) {
      lines.push(`  - [${sub.name}](#${slugify(sub.path)})`);
    }
  }
  lines.push("");

  // Collections
  for (const col of schema.collections) {
    lines.push(collectionToSchemaMarkdown(col, schema, 2));
    lines.push("");
  }

  // Indexes
  if (schema.indexes.length > 0) {
    lines.push(indexesToMarkdown(schema.indexes, schema.fieldOverrides));
  }

  // Rules
  if (schema.rawRules) {
    lines.push(rulesToMarkdown(schema.rawRules));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

// ─── Per-collection export ──────────────────────────────────────────

/** Export a single collection (with its subcollections) as Markdown. */
export function collectionToSchemaMarkdown(
  col: FirestoreCollectionSchema,
  schema?: FirestoreSchema | null,
  headingLevel = 1
): string {
  const lines: string[] = [];
  const prefix = "#".repeat(Math.min(headingLevel, 6));

  lines.push(`${prefix} ${col.name}\n`);
  lines.push(`**Path:** \`${col.path}\`  `);
  lines.push(`**Documents sampled:** ${col.sampleDocCount}\n`);

  // Fields table
  if (col.fields.length > 0) {
    lines.push(`${prefix}# Fields\n`);
    lines.push("| Field | Type | Required | Frequency | Sample |");
    lines.push("|-------|------|----------|-----------|--------|");
    for (const f of col.fields) {
      const required =
        f.sampleSize > 0 && f.frequency === f.sampleSize ? "Yes" : "No";
      const freq =
        f.sampleSize > 0
          ? `${f.frequency}/${f.sampleSize} (${Math.round((f.frequency / f.sampleSize) * 100)}%)`
          : "—";
      const sample = formatSampleValue(f.sampleValues?.[0]);
      lines.push(
        `| \`${f.name}\` | ${f.type} | ${required} | ${freq} | ${sample} |`
      );

      // Show nested map fields inline
      if (f.nestedFields && f.nestedFields.length > 0) {
        for (const nf of f.nestedFields) {
          const nRequired =
            nf.sampleSize > 0 && nf.frequency === nf.sampleSize
              ? "Yes"
              : "No";
          const nFreq =
            nf.sampleSize > 0
              ? `${nf.frequency}/${nf.sampleSize}`
              : "—";
          const nSample = formatSampleValue(nf.sampleValues?.[0]);
          lines.push(
            `| \`${f.name}.${nf.name}\` | ${nf.type} | ${nRequired} | ${nFreq} | ${nSample} |`
          );
        }
      }
    }
    lines.push("");
  } else {
    lines.push("*No documents found or collection is empty.*\n");
  }

  // Applicable indexes
  if (schema) {
    const colIndexes = schema.indexes.filter(
      (idx) => idx.collectionGroup === col.name
    );
    if (colIndexes.length > 0) {
      lines.push(`${prefix}# Indexes\n`);
      for (const idx of colIndexes) {
        const fields = idx.fields
          .map(
            (f) =>
              `\`${f.fieldPath}\` ${f.order ?? f.arrayConfig ?? ""}`
          )
          .join(", ");
        lines.push(`- **${idx.queryScope}:** ${fields}`);
      }
      lines.push("");
    }
  }

  // Security rules
  if (col.rules) {
    lines.push(`${prefix}# Security Rules\n`);
    lines.push("```");
    lines.push(col.rules);
    lines.push("```\n");
  }

  // Subcollections
  if (col.subcollections.length > 0) {
    lines.push(`${prefix}# Subcollections\n`);
    for (const sub of col.subcollections) {
      lines.push(
        collectionToSchemaMarkdown(sub, schema, headingLevel + 1)
      );
    }
  }

  return lines.join("\n");
}

// ─── Indexes-only export ────────────────────────────────────────────

export function indexesToMarkdown(
  indexes: FirestoreIndex[],
  fieldOverrides: FirestoreFieldOverride[] = []
): string {
  const lines: string[] = [];

  lines.push("## Composite Indexes\n");

  if (indexes.length === 0) {
    lines.push("*No composite indexes configured.*\n");
  } else {
    lines.push(
      "| Collection | Scope | Fields |"
    );
    lines.push("|------------|-------|--------|");
    for (const idx of indexes) {
      const fields = idx.fields
        .map(
          (f) => `\`${f.fieldPath}\` ${f.order ?? f.arrayConfig ?? ""}`
        )
        .join(", ");
      lines.push(`| ${idx.collectionGroup} | ${idx.queryScope} | ${fields} |`);
    }
    lines.push("");
  }

  if (fieldOverrides.length > 0) {
    lines.push("## Field Overrides\n");
    lines.push("| Collection | Field | Indexes |");
    lines.push("|------------|-------|---------|");
    for (const fo of fieldOverrides) {
      const idxDesc = fo.indexes
        .map((i) => `${i.queryScope}: ${i.order ?? i.arrayConfig ?? "—"}`)
        .join("; ");
      lines.push(
        `| ${fo.collectionGroup} | \`${fo.fieldPath}\` | ${idxDesc} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Rules-only export ──────────────────────────────────────────────

export function rulesToMarkdown(rawRules: string): string {
  const lines: string[] = [];
  lines.push("## Security Rules\n");
  lines.push("```");
  lines.push(rawRules.trim());
  lines.push("```\n");
  return lines.join("\n");
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatSampleValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const str = String(value);
  // Escape pipe chars for markdown tables
  const escaped = str.replace(/\|/g, "\\|");
  return escaped.length > 40
    ? `\`${escaped.slice(0, 40)}...\``
    : `\`${escaped}\``;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");
}
