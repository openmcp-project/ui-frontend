import { useTranslation } from 'react-i18next';
import { GenericHintConfig } from '../../../types/types';
import {
  calculateCrossplaneSegments,
  calculateGitOpsSegments,
  calculateVaultSegments,

} from '../../../utils/hintsCardsRowCalculations';

export const useCrossplaneHintConfig = (): GenericHintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.CrossplaneHint.title'),
    subtitle: t('Hints.CrossplaneHint.subtitle'),
    iconSrc: '/crossplane-icon.png',
    iconAlt: 'Crossplane',
    scrollTarget: '.crossplane-table-element',
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateCrossplaneSegments(allItems, isLoading, error, enabled, t),
    // calculateHoverData: (allItems, enabled) => calculateCrossplaneHoverDataGeneric(allItems, enabled, t),
  };
};

export const useGitOpsHintConfig = (): GenericHintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.GitOpsHint.title'),
    subtitle: t('Hints.GitOpsHint.subtitle'),
    iconSrc: '/flux.png',
    iconAlt: 'Flux',
    scrollTarget: '.cp-page-section-gitops',
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateGitOpsSegments(allItems, isLoading, error, enabled, t),
    // calculateHoverData: (allItems, enabled) => calculateGitOpsHoverDataGeneric(allItems, enabled, t),
  };
};

export const useESOHintConfig = (): GenericHintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.ESOHint.title'),
    subtitle: t('Hints.ESOHint.subtitle'),
    iconSrc: '/eso.png',
    iconAlt: 'ESO',
    // Not sure yet whether this looks better fully round or with rounded edges...
    // iconStyle: { borderRadius: '8px' }, // ESO icon with rounded corners
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateVaultSegments(allItems, isLoading, error, enabled, t),
  };
};

export const useKyvernoHintConfig = (): GenericHintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.KyvernoHint.title'),
    subtitle: t('Hints.KyvernoHint.subtitle'),
    iconSrc: '/kyverno.svg',
    iconAlt: 'Kyverno',
    iconStyle: { borderRadius: '0' }, // Vault icon should not be rounded
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateVaultSegments(allItems, isLoading, error, enabled, t),
  };
};
