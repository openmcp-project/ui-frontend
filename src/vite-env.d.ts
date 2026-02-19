/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MARK_MCP_V1_AS_DEPRECATED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
