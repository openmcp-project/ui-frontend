type TrackingProperties = Record<string, string | number | boolean>;

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
  if (!window.dtrum?.enterAction) return;

  const actionId = window.dtrum.enterAction(eventName, 'Custom');

  if (properties) {
    addProperties(actionId, properties);
  }

  if (window.dtrum.leaveAction) {
    window.dtrum.leaveAction(actionId);
  }
  console.log(`Dynatrace Event Tracked: ${eventName}`, properties);
};

export const trackEventStart = (eventName: string, properties?: TrackingProperties): number | undefined => {
  if (!window.dtrum?.enterAction) return undefined;

  const actionId = window.dtrum.enterAction(eventName, 'Custom');

  if (properties) {
    addProperties(actionId, properties);
  }

  console.log(`Dynatrace Event Started: ${eventName}`, properties);
  return actionId;
};

export const trackEventEnd = (actionId: number | undefined, properties?: TrackingProperties): void => {
  if (!actionId || !window.dtrum?.leaveAction) return;

  if (properties) {
    addProperties(actionId, properties);
  }

  window.dtrum.leaveAction(actionId);
  console.log(`Dynatrace Event Ended: ${actionId}`, properties);
};

export const trackXhrStart = (
  type: string,
  xmode?: 0 | 1 | 3,
  xhrUrl?: string,
  properties?: TrackingProperties,
): number | undefined => {
  if (!window.dtrum?.enterXhrAction) return undefined;

  const actionId = window.dtrum.enterXhrAction(type, xmode, xhrUrl);

  if (properties) {
    addProperties(actionId, properties);
  }

  console.log(`Dynatrace XHR Started: ${type}`, { xmode, xhrUrl, properties });
  return actionId;
};

export const trackXhrEnd = (actionId: number | undefined, stopTime?: number): void => {
  if (!actionId || !window.dtrum?.leaveXhrAction) return;

  window.dtrum.leaveXhrAction(actionId, stopTime);
  console.log(`Dynatrace XHR Ended: ${actionId}`, { stopTime });
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
