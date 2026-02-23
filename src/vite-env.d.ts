/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MCP_V1_AS_DEPRECATED?: string;
  readonly VITE_MCP2_DOCS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
