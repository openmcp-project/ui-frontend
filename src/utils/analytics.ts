/**
 * Simple analytics utility for tracking user interactions with Dynatrace
 */

type TrackingProperties = Record<string, string | number | boolean>;

/**
 * Track a custom event (e.g., button click, wizard open)
 *
 * @example
 * trackEvent('Button_Create_Clicked', { location: 'toolbar', projectName: 'my-project' });
 */
export const trackEvent = (eventName: string, properties?: TrackingProperties): void => {
  if (!window.dtrum?.enterAction) return;

  const actionId = window.dtrum.enterAction(eventName, 'Custom');

  if (properties && window.dtrum.addActionProperties) {
    window.dtrum.addActionProperties(actionId, properties);
  }

  if (window.dtrum.leaveAction) {
    window.dtrum.leaveAction(actionId);
  }
  console.log(`Dynatrace Event Tracked: ${eventName}`, properties);
};

export const trackAction = (name: string, callback: () => void) => {
  const actionId = window.dtrum?.enterAction(name);

  try {
    callback();
  } finally {
    if (actionId) {
      window.dtrum?.leaveAction(actionId);
    }
  }
};

export const trackActionWithProperties = (name: string, callback: () => void) => {
  const actionId = window.dtrum?.enterAction(name);

  try {
    callback();
  } finally {
    if (actionId) {
      window.dtrum?.addActionProperties(actionId, { timestamp: new Date().toISOString(), name: 'lukasz' });
      window.dtrum?.leaveAction(actionId);
    }
  }
};

/**
 * Track session-level properties (e.g., user source, app version)
 *
 * @example
 * trackSessionProperties({ userSource: 'hsp', userEmail: 'user@example.com' });
 */
export const trackSessionProperties = (properties: TrackingProperties): void => {
  console.log(window.dtrum);
  if (!window.dtrum?.sendSessionProperties) return;
  window.dtrum.sendSessionProperties(properties);
  console.log('Dynatrace Session Properties Tracked:', properties);
};

/**
 * Detect if user is accessing from HSP (iframe) or native app
 *
 * @returns 'hsp' if embedded in iframe, referrer indicates HSP, or showHeaderBar param is 'false', otherwise 'native'
 */
export const getUserSource = (): 'hsp' | 'native' => {
  const urlParams = new URLSearchParams(window.location.search);
  const showHeaderBar = urlParams.get('showHeaderBar');

  if (showHeaderBar === 'false') {
    return 'hsp';
  }

  return 'native';
};
