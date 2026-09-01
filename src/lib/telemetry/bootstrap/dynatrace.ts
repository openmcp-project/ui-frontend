// Dynatrace has no code-side init: the OneAgent <script> tag populates
// window.dtrum. This file just declares its shape so consumers type-check.

interface DynatraceRUM {
  enterAction(name: string, type?: string): number;
  leaveAction(actionId: number): void;
  addActionProperties(
    actionId: number,
    numberProps?: Record<string, number>,
    dateProps?: Record<string, Date>,
    stringProps?: Record<string, string>,
  ): void;
  reportError(error: string | Error, parentActionId?: number): void;
  identifyUser(userTag: string): void;
}

declare global {
  interface Window {
    dtrum?: DynatraceRUM;
  }
}

export type { DynatraceRUM };
