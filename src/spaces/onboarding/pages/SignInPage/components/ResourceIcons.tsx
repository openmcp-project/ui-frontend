import styles from '../SignInPage.module.css';

interface IconProps {
  color: string;
  secondaryColor?: string;
}

export function UserIcon({ color }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconUser}`} transform="translate(42, 18) scale(0.32)">
      <path
        d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function DatabaseIcon({ color }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconDatabase}`} transform="translate(69, 18) scale(0.32)">
      <ellipse cx="12" cy="5" rx="9" ry="3" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function KeyIcon({ color }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconKey}`} transform="translate(38, 28) scale(0.32)">
      <circle cx="7.5" cy="15.5" r="5.5" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function ServerIcon({ color, secondaryColor }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconServer}`} transform="translate(73, 28) scale(0.32)">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" />
      <path d="M6 6h.01M6 18h.01" stroke={secondaryColor || color} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

export function NetworkIcon({ color, secondaryColor }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconNetwork}`} transform="translate(52, 38) scale(0.32)">
      <rect x="9" y="2" width="6" height="6" rx="1" stroke={color} strokeWidth="2" fill="none" />
      <rect x="3" y="16" width="6" height="6" rx="1" stroke={color} strokeWidth="2" fill="none" />
      <rect x="15" y="16" width="6" height="6" rx="1" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M12 8v8M6 16v-4h12v4"
        stroke={secondaryColor || color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

export function CpuIcon({ color, secondaryColor }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconCpu}`} transform="translate(42, 18) scale(0.32)">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
        stroke={secondaryColor || color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function DockerIcon({ color, secondaryColor }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconDocker}`} transform="translate(69, 18) scale(0.32)">
      <path
        d="M22 7.7c-.3-.2-.8-.2-1.2-.2-1.6 0-2.8.9-3.6 1.9-.6-.2-1.2-.3-1.9-.3-3.4 0-6.1 2.7-6.1 6.1 0 .3 0 .7.1 1C5.9 17.4 3 20.5 3 24h18c3.3 0 6-2.7 6-6 0-2.8-1.9-5.2-4.6-5.9l-.4-.1v-.4c0-1.5-.7-2.9-1.8-3.9z"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 17h12M8 21h8" stroke={secondaryColor || color} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

export function HardDriveIcon({ color }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconHarddrive}`} transform="translate(38, 28) scale(0.32)">
      <path
        d="M22 12H2l2-7h16l2 7zM2 12v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="16" r="1" fill={color} />
    </g>
  );
}

export function SettingsIcon({ color }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconSettings}`} transform="translate(73, 28) scale(0.32)">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

export function MemoryIcon({ color, secondaryColor }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconMemory}`} transform="translate(73, 28) scale(0.32)">
      <rect x="2" y="7" width="20" height="10" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M6 7V4M10 7V4M14 7V4M18 7V4M6 17v3M10 17v3M14 17v3M18 17v3"
        stroke={secondaryColor || color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

export function GlobeIcon({ color, secondaryColor }: IconProps) {
  return (
    <g className={`${styles.cloudResourceIcon} ${styles.iconGlobe}`} transform="translate(52, 38) scale(0.32)">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke={secondaryColor || color}
        strokeWidth="2"
        fill="none"
      />
    </g>
  );
}
