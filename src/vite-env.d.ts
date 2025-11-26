/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CYPRESS_TEST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    VITE_CYPRESS_TEST?: string;
  }
}
