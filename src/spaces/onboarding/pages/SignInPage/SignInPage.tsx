import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';

import { Button } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

import { useAuthOnboarding as _useAuthOnboarding } from '../../auth/AuthContextOnboarding';
import { useLink as _useLink } from '../../../../lib/shared/useLink';

import cp1 from '../../../../assets/images/splash/cp1.png';
import cp2 from '../../../../assets/images/splash/cp2.png';
import cp3 from '../../../../assets/images/splash/cp3.png';
import cp4 from '../../../../assets/images/splash/cp4.png';
import logo from '../../../../assets/images/splash/logo.png';
import bmwkEu from '../../../../assets/images/splash/BMWK-EU.png';

import styles from './SignInPage.module.css';

export interface SignInPageProps {
  useAuthOnboarding?: typeof _useAuthOnboarding;
  useLink?: typeof _useLink;
}

export function SignInPage({ useAuthOnboarding = _useAuthOnboarding, useLink = _useLink }: SignInPageProps) {
  const { login } = useAuthOnboarding();
  const { documentationHomepage } = useLink();
  const { t } = useTranslation();

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Visit SignInPage',
      level: 'info',
    });
  }, []);

  useEffect(() => {
    const controlPlanes = document.querySelectorAll(`.${styles.controlPlane}`);
    const clouds = document.querySelectorAll(`.${styles.cloudProjection}`);

    controlPlanes.forEach((cp) => cp.classList.add(styles.visible));
    clouds.forEach((cloud) => cloud.classList.add(styles.visible));
  }, []);

  return (
    <div className={styles.container}>
      {/* Animated Control Planes with Cloud Projections */}
      <div className={styles.controlPlanesContainer}>
        {/* Control Plane 1 - Purple */}
        <div className={`${styles.controlPlane} ${styles.plane1}`}>
          <svg className={styles.cloudProjection} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cloudGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(123, 97, 255, 0.12)', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: 'rgba(147, 51, 234, 0.15)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(168, 85, 247, 0.1)', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow1">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Badge: EU-gov - top right with spacing from hexagon */}
            <g className={styles.cloudBadge}>
              <rect x="92" y="18" width="28" height="10" rx="5" fill="rgba(147, 51, 234, 0.4)" stroke="rgba(168, 85, 247, 0.8)" strokeWidth="1.5" />
              <text x="106" y="24.5" fontSize="6" fill="#ffffff" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">EU-gov</text>
            </g>
            <line className={styles.cloudConnection} x1="60" y1="70" x2="60" y2="56" stroke="rgba(147, 51, 234, 0.5)" strokeWidth="3" strokeDasharray="4,4" />
            <g className={styles.cloudShape} filter="url(#glow1)">
              <path className={styles.cloudHex} d="M 60 5 L 85 17.5 L 85 42.5 L 60 55 L 35 42.5 L 35 17.5 Z"
                    fill="url(#cloudGradient1)" stroke="rgba(147, 51, 234, 0.5)" strokeWidth="2" />
              {/* Sonar sweep line - animated rotating line from center */}
              <g className={styles.sonarSweep} transform-origin="60 30">
                <line x1="60" y1="30" x2="60" y2="18" stroke="rgba(168, 85, 247, 0.8)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="60" cy="30" r="2" fill="rgba(147, 51, 234, 0.6)" />
              </g>
              {/* User icon - top left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconUser}`} transform="translate(42, 18) scale(0.32)">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
                      stroke="rgba(168, 85, 247, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* Database icon - top right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconDatabase}`} transform="translate(69, 18) scale(0.32)">
                <ellipse cx="12" cy="5" rx="9" ry="3" stroke="rgba(147, 51, 234, 0.9)" strokeWidth="2" fill="none" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3"
                      stroke="rgba(147, 51, 234, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* Key icon - left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconKey}`} transform="translate(38, 28) scale(0.32)">
                <circle cx="7.5" cy="15.5" r="5.5" stroke="rgba(123, 97, 255, 0.9)" strokeWidth="2" fill="none" />
                <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"
                      stroke="rgba(123, 97, 255, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* Server icon - right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconServer}`} transform="translate(73, 28) scale(0.32)">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" stroke="rgba(168, 85, 247, 0.9)" strokeWidth="2" fill="none" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" stroke="rgba(168, 85, 247, 0.9)" strokeWidth="2" fill="none" />
                <path d="M6 6h.01M6 18h.01" stroke="rgba(123, 97, 255, 0.9)" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* Network icon - bottom inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconNetwork}`} transform="translate(52, 38) scale(0.32)">
                <rect x="9" y="2" width="6" height="6" rx="1" stroke="rgba(147, 51, 234, 0.9)" strokeWidth="2" fill="none" />
                <rect x="3" y="16" width="6" height="6" rx="1" stroke="rgba(147, 51, 234, 0.9)" strokeWidth="2" fill="none" />
                <rect x="15" y="16" width="6" height="6" rx="1" stroke="rgba(147, 51, 234, 0.9)" strokeWidth="2" fill="none" />
                <path d="M12 8v8M6 16v-4h12v4" stroke="rgba(168, 85, 247, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            </g>
          </svg>
          <img
            src={cp1}
            alt="Control Plane"
            className={styles.controlPlaneImage}
          />
        </div>

        {/* Control Plane 2 - Teal */}
        <div className={`${styles.controlPlane} ${styles.plane2}`}>
          <svg className={styles.cloudProjection} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cloudGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(4, 159, 154, 0.08)', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: 'rgba(44, 224, 191, 0.12)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(194, 252, 238, 0.08)', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Badge: dev - top right with spacing from hexagon */}
            <g className={styles.cloudBadge}>
              <rect x="92" y="24" width="24" height="10" rx="5" fill="rgba(4, 159, 154, 0.4)" stroke="rgba(44, 224, 191, 0.8)" strokeWidth="1.5" />
              <text x="104" y="30.5" fontSize="6" fill="#ffffff" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">dev</text>
            </g>
            <line className={styles.cloudConnection} x1="60" y1="70" x2="60" y2="56" stroke="rgba(4, 159, 154, 0.5)" strokeWidth="3" strokeDasharray="4,4" />
            <g className={styles.cloudShape} filter="url(#glow2)">
              <path className={styles.cloudHex} d="M 60 5 L 85 17.5 L 85 42.5 L 60 55 L 35 42.5 L 35 17.5 Z"
                    fill="url(#cloudGradient2)" stroke="rgba(4, 159, 154, 0.5)" strokeWidth="2" />
              {/* Sonar sweep line - animated rotating line from center */}
              <g className={styles.sonarSweep} transform-origin="60 30">
                <line x1="60" y1="30" x2="60" y2="18" stroke="rgba(44, 224, 191, 0.8)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="60" cy="30" r="2" fill="rgba(4, 159, 154, 0.6)" />
              </g>
              {/* CPU icon - top left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconCpu}`} transform="translate(42, 18) scale(0.32)">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="rgba(44, 224, 191, 0.9)" strokeWidth="2" fill="none" />
                <path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
                      stroke="rgba(4, 159, 154, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* Container/Docker icon - top right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconDocker}`} transform="translate(69, 18) scale(0.32)">
                <path d="M22 7.7c-.3-.2-.8-.2-1.2-.2-1.6 0-2.8.9-3.6 1.9-.6-.2-1.2-.3-1.9-.3-3.4 0-6.1 2.7-6.1 6.1 0 .3 0 .7.1 1C5.9 17.4 3 20.5 3 24h18c3.3 0 6-2.7 6-6 0-2.8-1.9-5.2-4.6-5.9l-.4-.1v-.4c0-1.5-.7-2.9-1.8-3.9z"
                      stroke="rgba(4, 159, 154, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 17h12M8 21h8" stroke="rgba(44, 224, 191, 0.7)" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* Hard Drive icon - left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconHarddrive}`} transform="translate(38, 28) scale(0.32)">
                <path d="M22 12H2l2-7h16l2 7zM2 12v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8"
                      stroke="rgba(44, 224, 191, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="16" r="1" fill="rgba(4, 159, 154, 0.9)" />
              </g>
              {/* Settings icon - right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconSettings}`} transform="translate(73, 28) scale(0.32)">
                <circle cx="12" cy="12" r="3" stroke="rgba(4, 159, 154, 0.9)" strokeWidth="2" fill="none" />
                <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"
                      stroke="rgba(44, 224, 191, 0.9)" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
          </svg>
          <img
            src={cp2}
            alt="Control Plane"
            className={styles.controlPlaneImage}
          />
        </div>

        {/* Control Plane 3 - Pink */}
        <div className={`${styles.controlPlane} ${styles.plane3}`}>
          <svg className={styles.cloudProjection} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cloudGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(236, 72, 153, 0.1)', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: 'rgba(244, 114, 182, 0.13)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(251, 207, 232, 0.08)', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow3">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Badge: prod - top right with spacing from hexagon */}
            <g className={styles.cloudBadge}>
              <rect x="92" y="24" width="26" height="10" rx="5" fill="rgba(236, 72, 153, 0.4)" stroke="rgba(244, 114, 182, 0.8)" strokeWidth="1.5" />
              <text x="105" y="30.5" fontSize="6" fill="#ffffff" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">prod</text>
            </g>
            <line className={styles.cloudConnection} x1="60" y1="70" x2="60" y2="56" stroke="rgba(236, 72, 153, 0.5)" strokeWidth="3" strokeDasharray="4,4" />
            <g className={styles.cloudShape} filter="url(#glow3)">
              <path className={styles.cloudHex} d="M 60 5 L 85 17.5 L 85 42.5 L 60 55 L 35 42.5 L 35 17.5 Z"
                    fill="url(#cloudGradient3)" stroke="rgba(236, 72, 153, 0.5)" strokeWidth="2" />
              {/* Sonar sweep line - animated rotating line from center */}
              <g className={styles.sonarSweep} transform-origin="60 30">
                <line x1="60" y1="30" x2="60" y2="18" stroke="rgba(244, 114, 182, 0.8)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="60" cy="30" r="2" fill="rgba(236, 72, 153, 0.6)" />
              </g>
              {/* CPU icon - top left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconCpu}`} transform="translate(42, 18) scale(0.32)">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="rgba(244, 114, 182, 0.9)" strokeWidth="2" fill="none" />
                <path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
                      stroke="rgba(236, 72, 153, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* Container/Docker icon - top right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconDocker}`} transform="translate(69, 18) scale(0.32)">
                <path d="M22 7.7c-.3-.2-.8-.2-1.2-.2-1.6 0-2.8.9-3.6 1.9-.6-.2-1.2-.3-1.9-.3-3.4 0-6.1 2.7-6.1 6.1 0 .3 0 .7.1 1C5.9 17.4 3 20.5 3 24h18c3.3 0 6-2.7 6-6 0-2.8-1.9-5.2-4.6-5.9l-.4-.1v-.4c0-1.5-.7-2.9-1.8-3.9z"
                      stroke="rgba(236, 72, 153, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 17h12M8 21h8" stroke="rgba(244, 114, 182, 0.7)" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* Hard Drive icon - left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconHarddrive}`} transform="translate(38, 28) scale(0.32)">
                <path d="M22 12H2l2-7h16l2 7zM2 12v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8"
                      stroke="rgba(244, 114, 182, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="16" r="1" fill="rgba(236, 72, 153, 0.9)" />
              </g>
              {/* Settings icon - right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconSettings}`} transform="translate(73, 28) scale(0.32)">
                <circle cx="12" cy="12" r="3" stroke="rgba(236, 72, 153, 0.9)" strokeWidth="2" fill="none" />
                <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"
                      stroke="rgba(244, 114, 182, 0.9)" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
          </svg>
          <img
            src={cp3}
            alt="Control Plane"
            className={styles.controlPlaneImage}
          />
        </div>

        {/* Control Plane 4 - Orange */}
        <div className={`${styles.controlPlane} ${styles.plane4}`}>
          <svg className={styles.cloudProjection} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cloudGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(249, 115, 22, 0.1)', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: 'rgba(251, 146, 60, 0.13)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(253, 186, 116, 0.08)', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow4">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Badge: EU-public - top right with spacing from hexagon */}
            <g className={styles.cloudBadge}>
              <rect x="92" y="18" width="46" height="10" rx="5" fill="rgba(249, 115, 22, 0.4)" stroke="rgba(251, 146, 60, 0.8)" strokeWidth="1.5" />
              <text x="115" y="24.5" fontSize="6" fill="#ffffff" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">EU-public</text>
            </g>
            <line className={styles.cloudConnection} x1="60" y1="70" x2="60" y2="56" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="3" strokeDasharray="4,4" />
            <g className={styles.cloudShape} filter="url(#glow4)">
              <path className={styles.cloudHex} d="M 60 5 L 85 17.5 L 85 42.5 L 60 55 L 35 42.5 L 35 17.5 Z"
                    fill="url(#cloudGradient4)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="2" />
              {/* Sonar sweep line - animated rotating line from center */}
              <g className={styles.sonarSweep} transform-origin="60 30">
                <line x1="60" y1="30" x2="60" y2="18" stroke="rgba(251, 146, 60, 0.8)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="60" cy="30" r="2" fill="rgba(249, 115, 22, 0.6)" />
              </g>
              {/* CPU icon - top left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconCpu}`} transform="translate(42, 18) scale(0.32)">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="rgba(251, 146, 60, 0.9)" strokeWidth="2" fill="none" />
                <path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
                      stroke="rgba(249, 115, 22, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* User icon - top right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconUser}`} transform="translate(69, 18) scale(0.32)">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
                      stroke="rgba(253, 186, 116, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* Container/Docker icon - left inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconDocker}`} transform="translate(38, 28) scale(0.32)">
                <path d="M22 7.7c-.3-.2-.8-.2-1.2-.2-1.6 0-2.8.9-3.6 1.9-.6-.2-1.2-.3-1.9-.3-3.4 0-6.1 2.7-6.1 6.1 0 .3 0 .7.1 1C5.9 17.4 3 20.5 3 24h18c3.3 0 6-2.7 6-6 0-2.8-1.9-5.2-4.6-5.9l-.4-.1v-.4c0-1.5-.7-2.9-1.8-3.9z"
                      stroke="rgba(249, 115, 22, 0.9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 17h12M8 21h8" stroke="rgba(251, 146, 60, 0.7)" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* Memory/RAM icon - right inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconMemory}`} transform="translate(73, 28) scale(0.32)">
                <rect x="2" y="7" width="20" height="10" rx="2" stroke="rgba(251, 146, 60, 0.9)" strokeWidth="2" fill="none" />
                <path d="M6 7V4M10 7V4M14 7V4M18 7V4M6 17v3M10 17v3M14 17v3M18 17v3"
                      stroke="rgba(249, 115, 22, 0.9)" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* Globe/Network icon - bottom inside hexagon */}
              <g className={`${styles.cloudResourceIcon} ${styles.iconGlobe}`} transform="translate(52, 38) scale(0.32)">
                <circle cx="12" cy="12" r="10" stroke="rgba(253, 186, 116, 0.9)" strokeWidth="2" fill="none" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                      stroke="rgba(249, 115, 22, 0.9)" strokeWidth="2" fill="none" />
              </g>
            </g>
          </svg>
          <img
            src={cp4}
            alt="Control Plane"
            className={styles.controlPlaneImage}
          />
        </div>
      </div>

      {/* Central Content */}
      <div className={styles.content}>
        <div className={styles.heroSection}>
          <img
            src={logo}
            alt="Open Control Plane"
            className={styles.logo}
          />
          <p className={styles.tagline}>
            Orchestrate reproducible, robust & compliant clouds - with ease and open-source.
          </p>
          <p className={styles.hashtags}>
            #Public #Private #Sovereign
          </p>

          <div className={styles.actionContainer}>
            <Button
              design={ButtonDesign.Emphasized}
              onClick={() => void login()}
              className={styles.signInButton}
            >
              {t('SignInPage.signInButton')}
            </Button>
          </div>

          <a href={documentationHomepage} target="_blank" rel="noreferrer" className={styles.docsLink}>
            {t('SignInPage.learnMoreLink')}
          </a>
          <a href="https://github.com/openmcp-project" target="_blank" rel="noreferrer" className={styles.docsLink}>
            {t('SignInPage.contributeLink')}
          </a>
        </div>
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <img
          src={bmwkEu}
          alt="Funded by BMWK and EU"
          className={styles.disclaimerImage}
        />
      </div>
    </div>
  );
}
