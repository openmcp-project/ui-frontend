// Design tokens for SignIn page cloud projections
// Following Impeccable's OKLCH-first approach for color consistency

export const CLOUD_COLORS = {
  purple: {
    primary: 'rgba(123, 97, 255, 0.12)',
    secondary: 'rgba(147, 51, 234, 0.15)',
    tertiary: 'rgba(168, 85, 247, 0.1)',
    stroke: 'rgba(147, 51, 234, 0.5)',
    accent: 'rgba(168, 85, 247, 0.9)',
    accentAlt: 'rgba(123, 97, 255, 0.9)',
    badge: 'rgba(147, 51, 234, 0.4)',
    badgeStroke: 'rgba(168, 85, 247, 0.8)',
    sonar: 'rgba(168, 85, 247, 0.8)',
    sonarCenter: 'rgba(147, 51, 234, 0.6)',
  },
  teal: {
    primary: 'rgba(4, 159, 154, 0.08)',
    secondary: 'rgba(44, 224, 191, 0.12)',
    tertiary: 'rgba(194, 252, 238, 0.08)',
    stroke: 'rgba(4, 159, 154, 0.5)',
    accent: 'rgba(44, 224, 191, 0.9)',
    accentAlt: 'rgba(4, 159, 154, 0.9)',
    badge: 'rgba(4, 159, 154, 0.4)',
    badgeStroke: 'rgba(44, 224, 191, 0.8)',
    sonar: 'rgba(44, 224, 191, 0.8)',
    sonarCenter: 'rgba(4, 159, 154, 0.6)',
  },
  pink: {
    primary: 'rgba(236, 72, 153, 0.1)',
    secondary: 'rgba(244, 114, 182, 0.13)',
    tertiary: 'rgba(251, 207, 232, 0.08)',
    stroke: 'rgba(236, 72, 153, 0.5)',
    accent: 'rgba(244, 114, 182, 0.9)',
    accentAlt: 'rgba(236, 72, 153, 0.9)',
    badge: 'rgba(236, 72, 153, 0.4)',
    badgeStroke: 'rgba(244, 114, 182, 0.8)',
    sonar: 'rgba(244, 114, 182, 0.8)',
    sonarCenter: 'rgba(236, 72, 153, 0.6)',
  },
  orange: {
    primary: 'rgba(249, 115, 22, 0.1)',
    secondary: 'rgba(251, 146, 60, 0.13)',
    tertiary: 'rgba(253, 186, 116, 0.08)',
    stroke: 'rgba(249, 115, 22, 0.5)',
    accent: 'rgba(251, 146, 60, 0.9)',
    accentAlt: 'rgba(249, 115, 22, 0.9)',
    badge: 'rgba(249, 115, 22, 0.4)',
    badgeStroke: 'rgba(251, 146, 60, 0.8)',
    sonar: 'rgba(251, 146, 60, 0.8)',
    sonarCenter: 'rgba(249, 115, 22, 0.6)',
  },
} as const;

export const ICON_POSITIONS = {
  topLeft: { x: 42, y: 18, scale: 0.32 },
  topRight: { x: 69, y: 18, scale: 0.32 },
  left: { x: 38, y: 28, scale: 0.32 },
  right: { x: 73, y: 28, scale: 0.32 },
  bottom: { x: 52, y: 38, scale: 0.32 },
} as const;

export const HEXAGON_PATH = 'M 60 5 L 85 17.5 L 85 42.5 L 60 55 L 35 42.5 L 35 17.5 Z';

export const SONAR_CENTER = { x: 60, y: 30 };
