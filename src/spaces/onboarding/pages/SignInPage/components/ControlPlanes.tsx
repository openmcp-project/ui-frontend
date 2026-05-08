import { CloudProjection } from './CloudProjection';
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
        primaryColor="rgba(123, 97, 255, 0.12)"
        secondaryColor="rgba(147, 51, 234, 0.15)"
        tertiaryColor="rgba(168, 85, 247, 0.1)"
      >
        <UserIcon color="rgba(168, 85, 247, 0.9)" />
        <DatabaseIcon color="rgba(147, 51, 234, 0.9)" />
        <KeyIcon color="rgba(123, 97, 255, 0.9)" />
        <ServerIcon color="rgba(168, 85, 247, 0.9)" secondaryColor="rgba(123, 97, 255, 0.9)" />
        <NetworkIcon color="rgba(147, 51, 234, 0.9)" secondaryColor="rgba(168, 85, 247, 0.9)" />
      </CloudProjection>
      <img src={image} alt="Control Plane" className={styles.controlPlaneImage} />
    </div>
  );
}

export function ControlPlane2({ image, className }: ControlPlaneProps) {
  return (
    <div className={`${styles.controlPlane} ${className}`}>
      <CloudProjection
        cloudId="2"
        badgeText="dev"
        badgeX={92}
        badgeY={24}
        badgeWidth={24}
        primaryColor="rgba(4, 159, 154, 0.08)"
        secondaryColor="rgba(44, 224, 191, 0.12)"
        tertiaryColor="rgba(194, 252, 238, 0.08)"
      >
        <CpuIcon color="rgba(44, 224, 191, 0.9)" secondaryColor="rgba(4, 159, 154, 0.9)" />
        <DockerIcon color="rgba(4, 159, 154, 0.9)" secondaryColor="rgba(44, 224, 191, 0.7)" />
        <HardDriveIcon color="rgba(44, 224, 191, 0.9)" />
        <SettingsIcon color="rgba(4, 159, 154, 0.9)" />
      </CloudProjection>
      <img src={image} alt="Control Plane" className={styles.controlPlaneImage} />
    </div>
  );
}

export function ControlPlane3({ image, className }: ControlPlaneProps) {
  return (
    <div className={`${styles.controlPlane} ${className}`}>
      <CloudProjection
        cloudId="3"
        badgeText="prod"
        badgeX={92}
        badgeY={24}
        badgeWidth={26}
        primaryColor="rgba(236, 72, 153, 0.1)"
        secondaryColor="rgba(244, 114, 182, 0.13)"
        tertiaryColor="rgba(251, 207, 232, 0.08)"
      >
        <CpuIcon color="rgba(244, 114, 182, 0.9)" secondaryColor="rgba(236, 72, 153, 0.9)" />
        <DockerIcon color="rgba(236, 72, 153, 0.9)" secondaryColor="rgba(244, 114, 182, 0.7)" />
        <HardDriveIcon color="rgba(244, 114, 182, 0.9)" />
        <SettingsIcon color="rgba(236, 72, 153, 0.9)" />
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
        primaryColor="rgba(249, 115, 22, 0.1)"
        secondaryColor="rgba(251, 146, 60, 0.13)"
        tertiaryColor="rgba(253, 186, 116, 0.08)"
      >
        <CpuIcon color="rgba(251, 146, 60, 0.9)" secondaryColor="rgba(249, 115, 22, 0.9)" />
        <UserIcon color="rgba(253, 186, 116, 0.9)" />
        <DockerIcon color="rgba(249, 115, 22, 0.9)" secondaryColor="rgba(251, 146, 60, 0.7)" />
        <MemoryIcon color="rgba(251, 146, 60, 0.9)" secondaryColor="rgba(249, 115, 22, 0.9)" />
        <GlobeIcon color="rgba(253, 186, 116, 0.9)" secondaryColor="rgba(249, 115, 22, 0.9)" />
      </CloudProjection>
      <img src={image} alt="Control Plane" className={styles.controlPlaneImage} />
    </div>
  );
}
