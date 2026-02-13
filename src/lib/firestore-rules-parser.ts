/**
 * Parse firestore.rules text to extract collection paths and their rules.
 * This is a regex-based extraction — not a full interpreter.
 */

export interface ParsedRuleNode {
  /** Collection name (e.g. "users") */
  collectionName: string;
  /** Full match path (e.g. "/users/{userId}") */
  matchPath: string;
  /** The rules text for this match block (allow statements) */
  rulesText: string;
  /** Nested subcollection rules */
  children: ParsedRuleNode[];
}

export interface ParsedRules {
  /** Tree of collection rules */
  collections: ParsedRuleNode[];
  /** Unique collection paths (e.g. ["users", "users/{userId}/posts"]) */
  collectionPaths: string[];
  /** Just the collection names (e.g. ["users", "posts"]) for discovery */
  collectionNames: string[];
  /** Raw rules text */
  rawText: string;
}

/**
 * Parse Firestore security rules text and extract collection paths + rules.
 */
export function parseFirestoreRules(rulesText: string): ParsedRules {
  const collections: ParsedRuleNode[] = [];
  const allPaths: string[] = [];
  const allNames = new Set<string>();

  // Find the outermost documents match block
  // match /databases/{database}/documents { ... }
  const docsMatch = rulesText.match(
    /match\s+\/databases\/\{[^}]+\}\/documents\s*\{([\s\S]*)\}/
  );

  if (!docsMatch) {
    // Try to parse even without the standard wrapper
    const rootContent = rulesText;
    parseMatchBlocks(rootContent, "", collections, allPaths, allNames);
  } else {
    parseMatchBlocks(docsMatch[1], "", collections, allPaths, allNames);
  }

  return {
    collections,
    collectionPaths: allPaths,
    collectionNames: Array.from(allNames).sort(),
    rawText: rulesText,
  };
}

/**
 * Recursively parse match blocks from rules content.
 */
function parseMatchBlocks(
  content: string,
  parentPath: string,
  results: ParsedRuleNode[],
  allPaths: string[],
  allNames: Set<string>
): void {
  // Match pattern: match /path/{wildcard} { ... }
  // We need to handle nested braces carefully
  const matchRegex = /match\s+(\/[^\s{]+)\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = matchRegex.exec(content)) !== null) {
    const matchPath = m[1];
    const blockStart = m.index + m[0].length;

    // Find the matching closing brace
    const blockContent = extractBlock(content, blockStart);
    if (blockContent === null) continue;

    // Extract collection name from the path
    // e.g. /users/{userId} → "users"
    // e.g. /posts/{postId}/comments/{commentId} → "comments"
    const segments = matchPath.split("/").filter(Boolean);
    const collectionName = segments.find((s) => !s.startsWith("{")) ?? segments[0];
    if (!collectionName) continue;

    // Build the full path
    const fullPath = parentPath
      ? `${parentPath}${matchPath}`
      : matchPath;

    // Extract the collection path (removing wildcards for discovery)
    // /users/{userId} → "users"
    // parentPath="/users/{userId}" + matchPath="/posts/{postId}" → "users/{userId}/posts"
    const discoveryPath = fullPath
      .split("/")
      .filter(Boolean)
      .join("/");

    allNames.add(collectionName);
    allPaths.push(discoveryPath);

    // Extract allow rules from this block (not from nested matches)
    const rulesText = extractAllowRules(blockContent);

    // Parse nested match blocks
    const children: ParsedRuleNode[] = [];
    parseMatchBlocks(blockContent, fullPath, children, allPaths, allNames);

    results.push({
      collectionName,
      matchPath: fullPath,
      rulesText,
      children,
    });

    // Advance past this block to avoid re-matching nested content
    matchRegex.lastIndex = blockStart + blockContent.length + 1;
  }
}

/**
 * Extract the content of a brace-delimited block starting after the opening brace.
 */
function extractBlock(content: string, start: number): string | null {
  let depth = 1;
  let i = start;
  while (i < content.length && depth > 0) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") depth--;
    i++;
  }
  if (depth !== 0) return null;
  return content.slice(start, i - 1);
}

/**
 * Extract allow statements from a block (top-level only, not from nested matches).
 */
function extractAllowRules(blockContent: string): string {
  const lines = blockContent.split("\n");
  const allowLines: string[] = [];
  let inNestedMatch = false;
  let depth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("match ") && trimmed.includes("{")) {
      inNestedMatch = true;
      depth = 1;
      continue;
    }

    if (inNestedMatch) {
      for (const ch of trimmed) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (depth <= 0) {
        inNestedMatch = false;
        depth = 0;
      }
      continue;
    }

    if (trimmed.startsWith("allow ")) {
      allowLines.push(trimmed);
    }
  }

  return allowLines.join("\n");
}

/**
 * Get the rules text for a specific collection path from parsed rules.
 */
export function getRulesForCollection(
  parsed: ParsedRules,
  collectionName: string
): string | undefined {
  function find(nodes: ParsedRuleNode[]): string | undefined {
    for (const node of nodes) {
      if (node.collectionName === collectionName && node.rulesText) {
        return node.rulesText;
      }
      const found = find(node.children);
      if (found) return found;
    }
    return undefined;
  }
  return find(parsed.collections);
}
