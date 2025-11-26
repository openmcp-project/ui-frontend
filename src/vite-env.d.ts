/// <reference types="vite/client" />

declare global {
  interface Window {
    VITE_CYPRESS_TEST?: string;
  }
}

export {};
