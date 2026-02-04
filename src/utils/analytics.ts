type TrackingProperties = Record<string, string | number | boolean>;

let currentActionId: number | undefined;
let listenersInitialized = false;
const pendingEventEndCallbacks = new Map<number, TrackingProperties | undefined>();

export const initializeDynatrace = () => {
  if (listenersInitialized || !window.dtrum) return;

  window.dtrum.addEnterActionListener((actionId) => {
    currentActionId = actionId;
  });

  window.dtrum.addLeaveActionListener((actionId) => {
    if (currentActionId === actionId) {
      currentActionId = undefined;
    }

    // Handle trackEventEnd callbacks
    if (pendingEventEndCallbacks.has(actionId)) {
      const properties = pendingEventEndCallbacks.get(actionId);
      if (properties) {
        addProperties(actionId, properties);
      }
      console.log(`Dynatrace Event Ended: ${actionId}`, properties);
      pendingEventEndCallbacks.delete(actionId);
    }
  });

  listenersInitialized = true;
};

const addProperties = (actionId: number, properties: TrackingProperties): void => {
  if (!window.dtrum?.addActionProperties) return;

  const numbers: Record<string, number> = {};
  const strings: Record<string, string> = {};

  Object.entries(properties).forEach(([key, value]) => {
    if (typeof value === 'number') {
      numbers[key] = value;
    } else if (typeof value === 'boolean') {
      strings[key] = String(value);
    } else {
      strings[key] = value;
    }
  });

  window.dtrum.addActionProperties(
    actionId,
    Object.keys(numbers).length > 0 ? numbers : undefined,
    undefined,
    Object.keys(strings).length > 0 ? strings : undefined,
  );
};

export const trackEvent = (eventName: string, properties?: TrackingProperties): void => {
  initializeDynatrace();

  if (!currentActionId) return;

  if (properties) {
    addProperties(currentActionId, properties);
  }

  console.log(`Dynatrace Event Tracked: ${eventName}`, properties);
};

export const trackEventStart = (eventName: string, properties?: TrackingProperties): number | undefined => {
  initializeDynatrace();

  if (!currentActionId) return undefined;

  if (properties) {
    addProperties(currentActionId, properties);
  }

  console.log(`Dynatrace Event Started: ${eventName}`, properties);
  return currentActionId;
};

export const trackEventEnd = (actionId: number | undefined, properties?: TrackingProperties): void => {
  if (!actionId) return;

  // Register properties to be added when the action ends (via addLeaveActionListener)
  pendingEventEndCallbacks.set(actionId, properties);
};

export const trackXhrStart = (
  type: string,
  xmode?: 0 | 1 | 3,
  xhrUrl?: string,
  properties?: TrackingProperties,
): number | undefined => {
  if (!window.dtrum?.enterXhrAction) return undefined;

  const actionId = window.dtrum.enterXhrAction(type, xmode, xhrUrl);

  // Add service name and start timestamp for duration tracking
  const enrichedProperties = {
    ...properties,
    serviceName: 'ui-request-test',
    requestStartTime: Date.now(),
  };

  if (enrichedProperties) {
    addProperties(actionId, enrichedProperties);
  }

  console.log(`Dynatrace XHR Started: ${type}`, { xmode, xhrUrl, properties: enrichedProperties });
  return actionId;
};

export const trackXhrEnd = (actionId: number | undefined, stopTime?: number): void => {
  if (!actionId || !window.dtrum?.leaveXhrAction) return;

  // Calculate and add request duration
  const endTime = stopTime || Date.now();
  const durationProperties: TrackingProperties = {
    requestEndTime: endTime,
  };

  addProperties(actionId, durationProperties);
  window.dtrum.leaveXhrAction(actionId, stopTime);
  console.log(`Dynatrace XHR Ended: ${actionId}`, { stopTime, endTime });
};

export const trackXhrFailed = (responseCode: number, message: string, parentActionId?: number): boolean => {
  if (!window.dtrum?.markXHRFailed) return false;

  const result = window.dtrum.markXHRFailed(responseCode, message, parentActionId);
  console.log(`Dynatrace XHR Failed: ${responseCode}`, { message, parentActionId, result });
  return result;
};

export const getUserSource = (): 'hsp' | 'native' => {
  const urlParams = new URLSearchParams(window.location.search);
  const showHeaderBar = urlParams.get('showHeaderBar');

  if (showHeaderBar === 'false') {
    return 'hsp';
  }

  return 'native';
};
