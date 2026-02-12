// Postman Collection v2.0 / v2.1 Types

export interface PostmanCollection {
  info: PostmanInfo;
  item: PostmanItem[];
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
  event?: PostmanEvent[];
}

export interface PostmanInfo {
  _postman_id?: string;
  name: string;
  description?: string;
  schema: string;
}

export interface PostmanItem {
  name: string;
  description?: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  response?: PostmanResponse[];
  event?: PostmanEvent[];
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
}

export interface PostmanRequest {
  method: string;
  header?: PostmanHeader[];
  url: PostmanUrl | string;
  body?: PostmanBody;
  description?: string;
  auth?: PostmanAuth;
}

export interface PostmanUrl {
  raw?: string;
  protocol?: string;
  host?: string[];
  port?: string;
  path?: string[];
  query?: PostmanQueryParam[];
  variable?: PostmanVariable[];
}

export interface PostmanHeader {
  key: string;
  value: string;
  description?: string;
  disabled?: boolean;
  type?: string;
}

export interface PostmanBody {
  mode: "raw" | "formdata" | "urlencoded" | "file" | "graphql";
  raw?: string;
  formdata?: PostmanFormData[];
  urlencoded?: PostmanUrlEncoded[];
  file?: { src: string };
  graphql?: { query: string; variables?: string };
  options?: {
    raw?: {
      language?: string;
    };
  };
}

export interface PostmanFormData {
  key: string;
  value?: string;
  description?: string;
  type?: string;
  src?: string;
  disabled?: boolean;
}

export interface PostmanUrlEncoded {
  key: string;
  value?: string;
  description?: string;
  disabled?: boolean;
}

export interface PostmanQueryParam {
  key: string;
  value?: string;
  description?: string;
  disabled?: boolean;
}

export interface PostmanVariable {
  key: string;
  value?: string;
  description?: string;
  type?: string;
}

export interface PostmanResponse {
  name: string;
  originalRequest?: PostmanRequest;
  status?: string;
  code?: number;
  header?: PostmanHeader[];
  body?: string;
  _postman_previewlanguage?: string;
}

export interface PostmanAuth {
  type: string;
  bearer?: { key: string; value: string; type?: string }[];
  basic?: { key: string; value: string; type?: string }[];
  apikey?: { key: string; value: string; type?: string }[];
  oauth2?: { key: string; value: string; type?: string }[];
  [key: string]: unknown;
}

export interface PostmanEvent {
  listen: string;
  script?: {
    id?: string;
    type?: string;
    exec?: string[];
  };
}

// Parsed / Flattened types for the app

export interface ParsedEndpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  description: string;
  folderPath: string[];
  headers: PostmanHeader[];
  queryParams: PostmanQueryParam[];
  pathVariables: PostmanVariable[];
  body: PostmanBody | null;
  auth: PostmanAuth | null;
  responses: PostmanResponse[];
  rawRequest: PostmanRequest;
}

export interface FolderNode {
  name: string;
  path: string[];
  children: FolderNode[];
  endpoints: ParsedEndpoint[];
  description?: string;
}

export type ViewMode = "dev" | "user";
