import { CloudProjection } from './CloudProjection';
import { CLOUD_COLORS } from '../design-tokens';
import {
  UserIcon,
  DatabaseIcon,
  KeyIcon,
  ServerIcon,
  NetworkIcon,
  CpuIcon,
  DockerIcon,
  HardDriveIcon,
  SettingsIcon,
  MemoryIcon,
  GlobeIcon,
} from './ResourceIcons';
import styles from '../SignInPage.module.css';

interface ControlPlaneProps {
  image: string;
  className: string;
}

export function ControlPlane1({ image, className }: ControlPlaneProps) {
  return (
    <div className={`${styles.controlPlane} ${className}`}>
      <CloudProjection
        cloudId="1"
        badgeText="EU-gov"
        badgeX={92}
        badgeY={18}
        badgeWidth={28}
        colors={CLOUD_COLORS.purple}
      >
        <UserIcon color={CLOUD_COLORS.purple.accent} />
        <DatabaseIcon color={CLOUD_COLORS.purple.accentAlt} />
        <KeyIcon color={CLOUD_COLORS.purple.accentAlt} />
        <ServerIcon color={CLOUD_COLORS.purple.accent} secondaryColor={CLOUD_COLORS.purple.accentAlt} />
        <NetworkIcon color={CLOUD_COLORS.purple.accentAlt} secondaryColor={CLOUD_COLORS.purple.accent} />
      </CloudProjection>
      <img src={image} alt="Control Plane" className={styles.controlPlaneImage} />
    </div>
  );
}

export function ControlPlane2({ image, className }: ControlPlaneProps) {
  return (
    <div className={`${styles.controlPlane} ${className}`}>
      <CloudProjection cloudId="2" badgeText="dev" badgeX={92} badgeY={24} badgeWidth={24} colors={CLOUD_COLORS.teal}>
        <CpuIcon color={CLOUD_COLORS.teal.accent} secondaryColor={CLOUD_COLORS.teal.accentAlt} />
        <DockerIcon color={CLOUD_COLORS.teal.accentAlt} secondaryColor="rgba(44, 224, 191, 0.7)" />
        <HardDriveIcon color={CLOUD_COLORS.teal.accent} />
        <SettingsIcon color={CLOUD_COLORS.teal.accentAlt} />
      </CloudProjection>
      <img src={image} alt="Control Plane" className={styles.controlPlaneImage} />
    </div>
  );
}

export function ControlPlane3({ image, className }: ControlPlaneProps) {
  return (
    <div className={`${styles.controlPlane} ${className}`}>
      <CloudProjection cloudId="3" badgeText="prod" badgeX={92} badgeY={24} badgeWidth={26} colors={CLOUD_COLORS.pink}>
        <CpuIcon color={CLOUD_COLORS.pink.accent} secondaryColor={CLOUD_COLORS.pink.accentAlt} />
        <DockerIcon color={CLOUD_COLORS.pink.accentAlt} secondaryColor="rgba(244, 114, 182, 0.7)" />
        <HardDriveIcon color={CLOUD_COLORS.pink.accent} />
        <SettingsIcon color={CLOUD_COLORS.pink.accentAlt} />
      </CloudProjection>
      <img src={image} alt="Control Plane" className={styles.controlPlaneImage} />
    </div>
  );
}

export function ControlPlane4({ image, className }: ControlPlaneProps) {
  return (
    <div className={`${styles.controlPlane} ${className}`}>
      <CloudProjection
        cloudId="4"
        badgeText="EU-public"
        badgeX={92}
        badgeY={18}
        badgeWidth={46}
        colors={CLOUD_COLORS.orange}
      >
        <CpuIcon color={CLOUD_COLORS.orange.accent} secondaryColor={CLOUD_COLORS.orange.accentAlt} />
        <UserIcon color="rgba(253, 186, 116, 0.9)" />
        <DockerIcon color={CLOUD_COLORS.orange.accentAlt} secondaryColor="rgba(251, 146, 60, 0.7)" />
        <MemoryIcon color={CLOUD_COLORS.orange.accent} secondaryColor={CLOUD_COLORS.orange.accentAlt} />
        <GlobeIcon color="rgba(253, 186, 116, 0.9)" secondaryColor={CLOUD_COLORS.orange.accentAlt} />
      </CloudProjection>
      <img src={image} alt="Control Plane" className={styles.controlPlaneImage} />
    </div>
  );
}
