// Dynatrace RUM API Type Definitions

interface DtrumApi {
  enterAction(name: string, type?: string): number;
  leaveAction(actionId: number): void;
  addActionProperties(actionId: number, properties: Record<string, string | number | boolean>): void;
  sendSessionProperties(properties: Record<string, string | number | boolean>): void;
  identifyUser(userId: string): void;
  reportError(error: Error | string): void;
}

declare global {
  interface Window {
    dtrum?: DtrumApi;
  }
}

export {};
