import { HEXAGON_PATH, SONAR_CENTER } from '../design-tokens';
import styles from '../SignInPage.module.css';

interface CloudColors {
  primary: string;
  secondary: string;
  tertiary: string;
  stroke: string;
  badge: string;
  badgeStroke: string;
  sonar: string;
  sonarCenter: string;
}

interface CloudProjectionProps {
  cloudId: string;
  badgeText: string;
  badgeX: number;
  badgeY: number;
  badgeWidth: number;
  colors: CloudColors;
  children: React.ReactNode;
}

export function CloudProjection({
  cloudId,
  badgeText,
  badgeX,
  badgeY,
  badgeWidth,
  colors,
  children,
}: CloudProjectionProps) {
  return (
    <svg className={styles.cloudProjection} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`cloudGradient${cloudId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: colors.tertiary, stopOpacity: 1 }} />
        </linearGradient>
        <filter id={`glow${cloudId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className={styles.cloudBadge}>
        <rect
          x={badgeX}
          y={badgeY}
          width={badgeWidth}
          height="10"
          rx="5"
          fill={colors.badge}
          stroke={colors.badgeStroke}
          strokeWidth="1.5"
        />
        <text
          x={badgeX + badgeWidth / 2}
          y={badgeY + 6.5}
          fontSize="6"
          fill="#ffffff"
          textAnchor="middle"
          fontWeight="700"
          fontFamily="sans-serif"
        >
          {badgeText}
        </text>
      </g>

      <line
        className={styles.cloudConnection}
        x1="60"
        y1="70"
        x2="60"
        y2="56"
        stroke={colors.stroke}
        strokeWidth="3"
        strokeDasharray="4,4"
      />

      <g className={styles.cloudShape} filter={`url(#glow${cloudId})`}>
        <path
          className={styles.cloudHex}
          d={HEXAGON_PATH}
          fill={`url(#cloudGradient${cloudId})`}
          stroke={colors.stroke}
          strokeWidth="2"
        />

        <g className={styles.sonarSweep} style={{ transformOrigin: `${SONAR_CENTER.x}px ${SONAR_CENTER.y}px` }}>
          <line
            x1={SONAR_CENTER.x}
            y1={SONAR_CENTER.y}
            x2={SONAR_CENTER.x}
            y2="18"
            stroke={colors.sonar}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx={SONAR_CENTER.x} cy={SONAR_CENTER.y} r="2" fill={colors.sonarCenter} />
        </g>

        {children}
      </g>
    </svg>
  );
}
