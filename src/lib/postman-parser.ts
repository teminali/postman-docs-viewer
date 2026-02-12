import type {
  PostmanCollection,
  PostmanItem,
  PostmanRequest,
  PostmanUrl,
  PostmanHeader,
  PostmanQueryParam,
  PostmanVariable,
  PostmanAuth,
  ParsedEndpoint,
  FolderNode,
} from "@/types/postman";

let endpointCounter = 0;
let navCounter = 0;

function resolveUrl(url: PostmanUrl | string | undefined): string {
  if (!url) return "";
  if (typeof url === "string") return url;
  return url.raw || "";
}

function resolveHeaders(request: PostmanRequest): PostmanHeader[] {
  return (request.header || []).filter((h) => !h.disabled);
}

function resolveQueryParams(
  url: PostmanUrl | string | undefined
): PostmanQueryParam[] {
  if (!url || typeof url === "string") return [];
  return (url.query || []).filter((q) => !q.disabled);
}

function resolvePathVariables(
  url: PostmanUrl | string | undefined
): PostmanVariable[] {
  if (!url || typeof url === "string") return [];
  return url.variable || [];
}

function resolveAuth(
  item: PostmanItem,
  collectionAuth?: PostmanAuth
): PostmanAuth | null {
  if (item.request?.auth) return item.request.auth;
  if (item.auth) return item.auth;
  if (collectionAuth) return collectionAuth;
  return null;
}

function flattenItems(
  items: PostmanItem[],
  folderPath: string[],
  collectionAuth?: PostmanAuth
): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  for (const item of items) {
    if (item.item && item.item.length > 0) {
      // It's a folder
      endpoints.push(
        ...flattenItems(
          item.item,
          [...folderPath, item.name],
          item.auth || collectionAuth
        )
      );
    } else if (item.request) {
      // It's a request
      const request = item.request;
      endpointCounter++;
      endpoints.push({
        id: `endpoint-${endpointCounter}`,
        name: item.name,
        method: request.method?.toUpperCase() || "GET",
        url: resolveUrl(request.url),
        description:
          (typeof request.description === "string"
            ? request.description
            : item.description) || "",
        folderPath,
        headers: resolveHeaders(request),
        queryParams: resolveQueryParams(request.url),
        pathVariables: resolvePathVariables(request.url),
        body: request.body || null,
        auth: resolveAuth(item, collectionAuth),
        responses: item.response || [],
        rawRequest: request,
      });
    }
  }

  return endpoints;
}

function buildFolderTree(
  items: PostmanItem[],
  path: string[] = []
): FolderNode[] {
  const nodes: FolderNode[] = [];

  for (const item of items) {
    if (item.item && item.item.length > 0) {
      const currentPath = [...path, item.name];
      const childNodes = buildFolderTree(item.item, currentPath);
      const directEndpoints = item.item
        .filter((child) => child.request)
        .map((child) => {
          navCounter++;
          return {
          id: `nav-${navCounter}`,
          name: child.name,
          method: child.request!.method?.toUpperCase() || "GET",
          url: resolveUrl(child.request!.url),
          description:
            (typeof child.request!.description === "string"
              ? child.request!.description
              : child.description) || "",
          folderPath: currentPath,
          headers: resolveHeaders(child.request!),
          queryParams: resolveQueryParams(child.request!.url),
          pathVariables: resolvePathVariables(child.request!.url),
          body: child.request!.body || null,
          auth: child.request?.auth || null,
          responses: child.response || [],
          rawRequest: child.request!,
        };
        });

      nodes.push({
        name: item.name,
        path: currentPath,
        children: childNodes.filter((n) => n.children.length > 0 || n.endpoints.length > 0),
        endpoints: directEndpoints,
        description: item.description,
      });
    }
  }

  // Add root-level endpoints
  const rootEndpoints = items
    .filter((item) => item.request)
    .map((item) => {
      navCounter++;
      return {
      id: `nav-${navCounter}`,
      name: item.name,
      method: item.request!.method?.toUpperCase() || "GET",
      url: resolveUrl(item.request!.url),
      description:
        (typeof item.request!.description === "string"
          ? item.request!.description
          : item.description) || "",
      folderPath: path,
      headers: resolveHeaders(item.request!),
      queryParams: resolveQueryParams(item.request!.url),
      pathVariables: resolvePathVariables(item.request!.url),
      body: item.request!.body || null,
      auth: item.request?.auth || null,
      responses: item.response || [],
      rawRequest: item.request!,
    };
    });

  if (rootEndpoints.length > 0 && path.length === 0) {
    nodes.unshift({
      name: "Root Endpoints",
      path: [],
      children: [],
      endpoints: rootEndpoints,
    });
  }

  return nodes;
}

export interface ParsedCollection {
  name: string;
  description: string;
  endpoints: ParsedEndpoint[];
  folderTree: FolderNode[];
  variables: PostmanVariable[];
  totalFolders: number;
  totalRequests: number;
  methods: Record<string, number>;
}

function countFolders(items: PostmanItem[]): number {
  let count = 0;
  for (const item of items) {
    if (item.item && item.item.length > 0) {
      count += 1 + countFolders(item.item);
    }
  }
  return count;
}

export function parsePostmanCollection(
  json: PostmanCollection
): ParsedCollection {
  endpointCounter = 0;
  navCounter = 0;

  if (!json.info || !json.item) {
    throw new Error(
      "Invalid Postman collection format. Missing 'info' or 'item' fields."
    );
  }

  const endpoints = flattenItems(json.item, [], json.auth);
  const folderTree = buildFolderTree(json.item);

  const methods: Record<string, number> = {};
  for (const ep of endpoints) {
    methods[ep.method] = (methods[ep.method] || 0) + 1;
  }

  return {
    name: json.info.name,
    description: json.info.description || "",
    endpoints,
    folderTree,
    variables: json.variable || [],
    totalFolders: countFolders(json.item),
    totalRequests: endpoints.length,
    methods,
  };
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-800 border-emerald-300",
    POST: "bg-amber-100 text-amber-800 border-amber-300",
    PUT: "bg-blue-100 text-blue-800 border-blue-300",
    PATCH: "bg-violet-100 text-violet-800 border-violet-300",
    DELETE: "bg-red-100 text-red-800 border-red-300",
    HEAD: "bg-gray-100 text-gray-800 border-gray-300",
    OPTIONS: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return colors[method.toUpperCase()] || "bg-gray-100 text-gray-800 border-gray-300";
}

export function getMethodDot(method: string): string {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500",
    POST: "bg-amber-500",
    PUT: "bg-blue-500",
    PATCH: "bg-violet-500",
    DELETE: "bg-red-500",
    HEAD: "bg-gray-500",
    OPTIONS: "bg-gray-500",
  };
  return colors[method.toUpperCase()] || "bg-gray-500";
}

export function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export function humanizeEndpointName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function generateUserDescription(endpoint: ParsedEndpoint): string {
  const method = endpoint.method;
  const name = humanizeEndpointName(endpoint.name);

  if (endpoint.description) return endpoint.description;

  const urlParts = endpoint.url.split("/").filter(Boolean);
  const resource = urlParts[urlParts.length - 1]
    ?.replace(/[{}:]/g, "")
    .replace(/[-_]/g, " ");

  switch (method) {
    case "GET":
      return `Retrieves ${resource || name.toLowerCase()}. Use this to fetch and view the data.`;
    case "POST":
      return `Creates a new ${resource || name.toLowerCase()}. Use this to add new data to the system.`;
    case "PUT":
      return `Updates an existing ${resource || name.toLowerCase()}. This replaces the entire record with new data.`;
    case "PATCH":
      return `Partially updates ${resource || name.toLowerCase()}. Use this to modify specific fields.`;
    case "DELETE":
      return `Removes ${resource || name.toLowerCase()} from the system. This action may be irreversible.`;
    default:
      return `Performs a ${method} operation on ${resource || name.toLowerCase()}.`;
  }
}
