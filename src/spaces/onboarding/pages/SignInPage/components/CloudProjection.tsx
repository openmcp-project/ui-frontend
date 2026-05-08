import styles from '../SignInPage.module.css';

interface CloudProjectionProps {
  cloudId: string;
  badgeText: string;
  badgeX: number;
  badgeY: number;
  badgeWidth: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  children: React.ReactNode;
}

export function CloudProjection({
  cloudId,
  badgeText,
  badgeX,
  badgeY,
  badgeWidth,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  children,
}: CloudProjectionProps) {
  return (
    <svg className={styles.cloudProjection} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`cloudGradient${cloudId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: primaryColor, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: secondaryColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: tertiaryColor, stopOpacity: 1 }} />
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
          fill={secondaryColor.replace(/[\d.]+\)/, '0.4)')}
          stroke={tertiaryColor.replace(/[\d.]+\)/, '0.8)')}
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
        stroke={secondaryColor.replace(/[\d.]+\)/, '0.5)')}
        strokeWidth="3"
        strokeDasharray="4,4"
      />

      <g className={styles.cloudShape} filter={`url(#glow${cloudId})`}>
        <path
          className={styles.cloudHex}
          d="M 60 5 L 85 17.5 L 85 42.5 L 60 55 L 35 42.5 L 35 17.5 Z"
          fill={`url(#cloudGradient${cloudId})`}
          stroke={secondaryColor.replace(/[\d.]+\)/, '0.5)')}
          strokeWidth="2"
        />

        <g className={styles.sonarSweep} style={{ transformOrigin: '60px 30px' }}>
          <line
            x1="60"
            y1="30"
            x2="60"
            y2="18"
            stroke={tertiaryColor.replace(/[\d.]+\)/, '0.8)')}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="60" cy="30" r="2" fill={secondaryColor.replace(/[\d.]+\)/, '0.6)')} />
        </g>

        {children}
      </g>
    </svg>
  );
}
