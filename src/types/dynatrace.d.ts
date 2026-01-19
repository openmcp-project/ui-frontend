// Dynatrace RUM API Type Definitions

type PropertyMap<T> = Record<string, T>;

interface PropertyObject {
  [key: string]: number | Date | string;
}

interface ActionNameResult {
  actionId?: number;
  actionName: string;
}

interface PropertiesSendingReport {
  sentProperties: number;
  sentBytes: number;
}

interface DtRumUserInput {
  id: number;
}

interface MetaData {
  key: string;
  value: string;
}

interface DtrumApi {
  actionName(actionName: string, actionId?: number): ActionNameResult;
  addActionProperties(
    parentActionId: number,
    javaLong?: PropertyMap<number>,
    date?: PropertyMap<Date>,
    shortString?: PropertyMap<string>,
    javaDouble?: PropertyMap<number>,
  ): PropertiesSendingReport;
  addEnterActionListener(
    listener: (actionId: number, starttime: number, isRootAction: boolean, element?: string | EventTarget) => void,
  ): void;
  addLeaveActionListener(listener: (actionId: number, stoptime: number, isRootAction: boolean) => void): void;
  addPageLeavingListener(listener: (unloadRunning: boolean) => void): void;
  addVisitTimeoutListener(listener: (visitId: string, newVisitAfterTimeout: boolean) => void): void;
  beginUserInput(domNode: string | HTMLElement, type: string, addInfo?: string, validTime?: number): DtRumUserInput;
  disable(): void;
  disablePersistentValues(remember: boolean): void;
  disableSessionReplay(): void;
  enable(): void;
  enableManualPageDetection(): void;
  enablePersistentValues(): void;
  enableSessionReplay(ignoreCostControl: boolean): void;
  endSession(): void;
  endUserInput(userInputObject: DtRumUserInput): void;
  enterAction(actionName: string, actionType?: string, startTime?: number, sourceUrl?: string): number;
  enterXhrAction(type: string, xmode?: 0 | 1 | 3, xhrUrl?: string): number;
  enterXhrCallback(actionId: number): void;
  getAndEvaluateMetaData(): MetaData[];
  identifyUser(value: string): void;
  incrementOnLoadEndMarkers(): void;
  leaveAction(actionId: number, stopTime?: number, startTime?: number): void;
  leaveXhrAction(actionId: number, stopTime?: number): void;
  leaveXhrCallback(actionId: number): void;
  markAsErrorPage(responseCode: number, message: string): boolean;
  markXHRFailed(responseCode: number, message: string, parentActionId?: number): boolean;
  now(): number;
  removeEnterActionListener(
    listener: (actionId: number, starttime: number, isRootAction: boolean, element?: string | EventTarget) => void,
  ): void;
  removeLeaveActionListener(listener: (actionId: number, stoptime: number, isRootAction: boolean) => void): void;
  reportCustomError(key: string, value: string, hint?: string, parentingInfo?: number | boolean): void;
  reportError(error: string | Error, parentActionId?: number): void;
  sendBeacon(forceSync: boolean, sendPreview: boolean, killUnfinished: boolean): void;
  sendSessionProperties(
    javaLongOrObject?: PropertyObject | PropertyMap<number>,
    date?: PropertyMap<Date>,
    shortString?: PropertyMap<string>,
    javaDouble?: PropertyMap<number>,
  ): PropertiesSendingReport;
  setAutomaticActionDetection(enabled: boolean): void;
  setLoadEndManually(): void;
  setPage(newPage: { group?: string; name: string }): number;
  signalLoadEnd(): void;
  signalOnLoadEnd(): void;
  signalOnLoadStart(): void;
}

declare global {
  interface Window {
    dtrum?: DtrumApi;
  }
}

export {};
