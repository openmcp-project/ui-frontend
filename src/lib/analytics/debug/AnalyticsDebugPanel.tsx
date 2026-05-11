import { useState, useEffect } from 'react';
import { Button, Panel, Title } from '@ui5/webcomponents-react';
import styles from './AnalyticsDebugPanel.module.css';

/* eslint-disable i18next/no-literal-string */
// Debug panel intentionally uses literal strings - not for translation

interface AnalyticsEvent {
  timestamp: Date;
  type: 'event' | 'pageView' | 'error' | 'action';
  name: string;
  properties?: Record<string, unknown>;
  duration?: number;
}

/**
 * Debug panel for analytics events
 * Only renders when debug mode is enabled
 * Shows all tracked events in real-time
 */
export function AnalyticsDebugPanel({ enabled }: { enabled: boolean }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    // Intercept console.log calls from analytics adapters
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      originalLog(...args);

      // Parse analytics debug messages
      if (typeof args[0] === 'string') {
        const message = args[0];

        if (message.includes('trackEvent:')) {
          setEvents((prev) => [
            ...prev.slice(-49),
            {
              timestamp: new Date(),
              type: 'event',
              name: String(args[1] || ''),
              properties: args[2] as Record<string, unknown>,
            },
          ]);
        } else if (message.includes('trackPageView:')) {
          setEvents((prev) => [
            ...prev.slice(-49),
            {
              timestamp: new Date(),
              type: 'pageView',
              name: String(args[1] || ''),
              properties: args[2] as Record<string, unknown>,
            },
          ]);
        } else if (message.includes('trackError:')) {
          setEvents((prev) => [
            ...prev.slice(-49),
            {
              timestamp: new Date(),
              type: 'error',
              name: String(args[1] || ''),
              properties: args[2] as Record<string, unknown>,
            },
          ]);
        } else if (message.includes('endAction:')) {
          setEvents((prev) => [
            ...prev.slice(-49),
            {
              timestamp: new Date(),
              type: 'action',
              name: String(args[1] || ''),
              duration: Number(args[3]),
            },
          ]);
        }
      }
    };

    return () => {
      console.log = originalLog;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={styles.container}>
      <Panel
        collapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        headerLevel="H4"
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Title level="H4">🔍 Analytics Debug ({events.length} events)</Title>
            <Button
              design="Transparent"
              icon="delete"
              onClick={(e) => {
                e.stopPropagation();
                setEvents([]);
              }}
            >
              Clear
            </Button>
          </div>
        }
      >
        <div className={styles.eventList}>
          {events.length === 0 ? (
            <div className={styles.emptyState}>No events tracked yet. Interact with the app to see events.</div>
          ) : (
            events
              .slice()
              .reverse()
              .map((event, index) => (
                <div key={`${event.timestamp.getTime()}-${index}`} className={styles.event}>
                  <div className={styles.eventHeader}>
                    <span className={`${styles.eventType} ${styles[event.type]}`}>{event.type}</span>
                    <span className={styles.eventName}>{event.name}</span>
                    <span className={styles.eventTime}>
                      {event.timestamp.toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                  </div>
                  {event.properties && Object.keys(event.properties).length > 0 && (
                    <div className={styles.eventProperties}>
                      {Object.entries(event.properties).map(([key, value]) => (
                        <div key={key} className={styles.property}>
                          <span className={styles.propertyKey}>{key}:</span>
                          <span className={styles.propertyValue}>{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {event.duration !== undefined && (
                    <div className={styles.eventDuration}>Duration: {event.duration}ms</div>
                  )}
                </div>
              ))
          )}
        </div>
      </Panel>
    </div>
  );
}
