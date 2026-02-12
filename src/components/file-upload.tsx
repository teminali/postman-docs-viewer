"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Upload, FileJson, AlertCircle, Moon, Sun, History, KeyRound, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HistoryEntry } from "@/lib/collection-storage";

interface FileUploadProps {
  onFileLoaded: (json: unknown, fileName: string) => void;
  history?: HistoryEntry[];
  onSelectFromHistory?: (entry: HistoryEntry) => void;
  onOpenSettings?: () => void;
}

export function FileUpload({
  onFileLoaded,
  history = [],
  onSelectFromHistory,
  onOpenSettings,
}: FileUploadProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      if (!file.name.endsWith(".json")) {
        setError("Please upload a JSON file exported from Postman.");
        setFileName(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (!json.info || !json.item) {
            setError(
              "This doesn't look like a Postman collection. Make sure you exported the collection (not environment)."
            );
            setFileName(null);
            return;
          }
          onFileLoaded(json, file.name);
        } catch {
          setError("Failed to parse JSON file. Please check the file format.");
          setFileName(null);
        }
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Top-right: Auth + API key settings + Theme */}
      <div className="absolute right-4 top-4 flex items-center gap-1">
        {/* Always show auth entry: Sign in/Sign up when not configured (login page explains setup), or full auth when configured */}
        {authLoading ? null : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8" aria-label="Account menu">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline truncate max-w-[120px] text-xs">
                  {user.displayName || user.email || "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="font-normal">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile &amp; Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="default" size="sm" className="h-8 text-xs" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </>
        )}
        {onOpenSettings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={onOpenSettings}
                aria-label="AI settings & API key"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              AI settings & API key
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <FileJson className="h-4 w-4" />
            Postman Collection Viewer
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            API Documentation
            <br />
            <span className="text-muted-foreground">Made Simple</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload your Postman collection export and get beautiful, searchable
            API documentation instantly. Switch between developer and user modes.
          </p>
        </div>

        {/* Recent / History */}
        {history.length > 0 && onSelectFromHistory && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              Recent collections
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((entry) => (
                <Button
                  key={entry.id}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => onSelectFromHistory(entry)}
                >
                  <FileJson className="h-3 w-3 mr-1.5" />
                  {entry.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <Card
          className={`relative border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDragging
              ? "border-foreground bg-accent scale-[1.02]"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-accent/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label className="flex flex-col items-center justify-center gap-4 p-12 cursor-pointer">
            <div
              className={`rounded-full p-4 transition-colors ${
                isDragging ? "bg-foreground/10" : "bg-muted"
              }`}
            >
              <Upload
                className={`h-8 w-8 transition-transform ${
                  isDragging ? "scale-110 text-foreground" : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                {isDragging
                  ? "Drop your file here"
                  : "Drag & drop your Postman collection"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (JSON format)
              </p>
            </div>
            {fileName && !error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileJson className="h-4 w-4" />
                {fileName}
              </div>
            )}
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Upload Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              title: "Smart Search",
              desc: "Find any endpoint by name, URL, method, or description",
            },
            {
              title: "Dev Mode",
              desc: "Full technical docs with headers, params, and responses",
            },
            {
              title: "User Mode",
              desc: "Auto-generated user manual in plain English",
            },
          ].map((feature) => (
            <Card
              key={feature.title}
              className="p-4 space-y-1.5 bg-muted/30 border-muted"
            >
              <p className="text-sm font-medium">{feature.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </Card>
          ))}
        </div>

        {/* Sample Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              // Provide a sample collection for testing
              const sample = {
                info: {
                  name: "Sample API Collection",
                  description: "A sample API collection to demonstrate the documentation viewer.",
                  schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                },
                item: [
                  {
                    name: "Users",
                    item: [
                      {
                        name: "Get All Users",
                        request: {
                          method: "GET",
                          header: [{ key: "Authorization", value: "Bearer {{token}}" }],
                          url: {
                            raw: "{{base_url}}/api/v1/users",
                            host: ["{{base_url}}"],
                            path: ["api", "v1", "users"],
                            query: [
                              { key: "page", value: "1", description: "Page number" },
                              { key: "limit", value: "10", description: "Items per page" },
                            ],
                          },
                          description: "Retrieve a paginated list of all users in the system. Supports filtering and pagination.",
                        },
                        response: [
                          {
                            name: "Success",
                            code: 200,
                            status: "OK",
                            body: JSON.stringify({ data: [{ id: 1, name: "John Doe", email: "john@example.com" }], total: 100, page: 1 }, null, 2),
                          },
                        ],
                      },
                      {
                        name: "Create User",
                        request: {
                          method: "POST",
                          header: [
                            { key: "Authorization", value: "Bearer {{token}}" },
                            { key: "Content-Type", value: "application/json" },
                          ],
                          url: { raw: "{{base_url}}/api/v1/users", host: ["{{base_url}}"], path: ["api", "v1", "users"] },
                          body: {
                            mode: "raw",
                            raw: JSON.stringify({ name: "Jane Doe", email: "jane@example.com", role: "user" }, null, 2),
                            options: { raw: { language: "json" } },
                          },
                          description: "Create a new user account. Requires admin privileges.",
                        },
                        response: [
                          { name: "Created", code: 201, status: "Created", body: JSON.stringify({ id: 2, name: "Jane Doe", email: "jane@example.com", role: "user" }, null, 2) },
                        ],
                      },
                      {
                        name: "Get User by ID",
                        request: {
                          method: "GET",
                          header: [{ key: "Authorization", value: "Bearer {{token}}" }],
                          url: {
                            raw: "{{base_url}}/api/v1/users/:userId",
                            host: ["{{base_url}}"],
                            path: ["api", "v1", "users", ":userId"],
                            variable: [{ key: "userId", value: "1", description: "The unique user identifier" }],
                          },
                          description: "Retrieve detailed information about a specific user by their ID.",
                        },
                        response: [
                          { name: "Success", code: 200, status: "OK", body: JSON.stringify({ id: 1, name: "John Doe", email: "john@example.com", role: "admin", createdAt: "2024-01-15" }, null, 2) },
                        ],
                      },
                      {
                        name: "Update User",
                        request: {
                          method: "PUT",
                          header: [
                            { key: "Authorization", value: "Bearer {{token}}" },
                            { key: "Content-Type", value: "application/json" },
                          ],
                          url: {
                            raw: "{{base_url}}/api/v1/users/:userId",
                            host: ["{{base_url}}"],
                            path: ["api", "v1", "users", ":userId"],
                            variable: [{ key: "userId", value: "1", description: "The unique user identifier" }],
                          },
                          body: {
                            mode: "raw",
                            raw: JSON.stringify({ name: "John Updated", email: "john.updated@example.com" }, null, 2),
                            options: { raw: { language: "json" } },
                          },
                          description: "Update an existing user's information. Replaces the entire user record.",
                        },
                        response: [],
                      },
                      {
                        name: "Delete User",
                        request: {
                          method: "DELETE",
                          header: [{ key: "Authorization", value: "Bearer {{token}}" }],
                          url: {
                            raw: "{{base_url}}/api/v1/users/:userId",
                            host: ["{{base_url}}"],
                            path: ["api", "v1", "users", ":userId"],
                            variable: [{ key: "userId", value: "1", description: "The unique user identifier" }],
                          },
                          description: "Permanently delete a user from the system. This action cannot be undone.",
                        },
                        response: [
                          { name: "Deleted", code: 204, status: "No Content", body: "" },
                        ],
                      },
                    ],
                  },
                  {
                    name: "Authentication",
                    item: [
                      {
                        name: "Login",
                        request: {
                          method: "POST",
                          header: [{ key: "Content-Type", value: "application/json" }],
                          url: { raw: "{{base_url}}/api/v1/auth/login", host: ["{{base_url}}"], path: ["api", "v1", "auth", "login"] },
                          body: {
                            mode: "raw",
                            raw: JSON.stringify({ email: "user@example.com", password: "password123" }, null, 2),
                            options: { raw: { language: "json" } },
                          },
                          description: "Authenticate with email and password to receive an access token.",
                        },
                        response: [
                          { name: "Success", code: 200, status: "OK", body: JSON.stringify({ token: "eyJhbGciOiJIUzI1NiIs...", refreshToken: "abc123", expiresIn: 3600 }, null, 2) },
                        ],
                      },
                      {
                        name: "Refresh Token",
                        request: {
                          method: "POST",
                          header: [{ key: "Content-Type", value: "application/json" }],
                          url: { raw: "{{base_url}}/api/v1/auth/refresh", host: ["{{base_url}}"], path: ["api", "v1", "auth", "refresh"] },
                          body: {
                            mode: "raw",
                            raw: JSON.stringify({ refreshToken: "abc123" }, null, 2),
                            options: { raw: { language: "json" } },
                          },
                          description: "Exchange a refresh token for a new access token.",
                        },
                        response: [],
                      },
                    ],
                  },
                  {
                    name: "Products",
                    item: [
                      {
                        name: "List Products",
                        request: {
                          method: "GET",
                          header: [{ key: "Authorization", value: "Bearer {{token}}" }],
                          url: {
                            raw: "{{base_url}}/api/v1/products",
                            host: ["{{base_url}}"],
                            path: ["api", "v1", "products"],
                            query: [
                              { key: "category", value: "", description: "Filter by category" },
                              { key: "search", value: "", description: "Search products by name" },
                              { key: "sort", value: "name", description: "Sort field" },
                            ],
                          },
                          description: "Get a list of all available products. Supports filtering by category and text search.",
                        },
                        response: [],
                      },
                      {
                        name: "Create Product",
                        request: {
                          method: "POST",
                          header: [
                            { key: "Authorization", value: "Bearer {{token}}" },
                            { key: "Content-Type", value: "application/json" },
                          ],
                          url: { raw: "{{base_url}}/api/v1/products", host: ["{{base_url}}"], path: ["api", "v1", "products"] },
                          body: {
                            mode: "raw",
                            raw: JSON.stringify({ name: "New Product", price: 29.99, category: "electronics", description: "A great product" }, null, 2),
                            options: { raw: { language: "json" } },
                          },
                          description: "Add a new product to the catalog. Requires admin or manager role.",
                        },
                        response: [],
                      },
                    ],
                  },
                ],
                variable: [
                  { key: "base_url", value: "https://api.example.com" },
                  { key: "token", value: "" },
                ],
              };
              onFileLoaded(sample, "sample-collection.json");
            }}
          >
            or try with a sample collection
          </Button>
        </div>
      </div>
    </div>
  );
}
