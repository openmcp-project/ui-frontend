import { useTranslation } from 'react-i18next';
import { GenericHintConfig } from '../../../types/types';
import {
  calculateCrossplaneSegments,
  calculateGitOpsSegments,
  calculateVaultSegments,
  calculateCrossplaneHoverDataGeneric,
  calculateGitOpsHoverDataGeneric,
} from '../../../utils/hintsCardsRowCalculations';

export const useCrossplaneHintConfig = (): GenericHintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.CrossplaneHint.title'),
    subtitle: t('Hints.CrossplaneHint.subtitle'),
    iconSrc: '/crossplane-icon.png',
    iconAlt: 'Crossplane',
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateCrossplaneSegments(allItems, isLoading, error, enabled, t),
    calculateHoverData: (allItems, enabled) => calculateCrossplaneHoverDataGeneric(allItems, enabled, t),
  };
};

export const useGitOpsHintConfig = (): GenericHintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.GitOpsHint.title'),
    subtitle: t('Hints.GitOpsHint.subtitle'),
    iconSrc: '/flux.png',
    iconAlt: 'Flux',
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateGitOpsSegments(allItems, isLoading, error, enabled, t),
    calculateHoverData: (allItems, enabled) => calculateGitOpsHoverDataGeneric(allItems, enabled, t),
  };
};

export const useVaultHintConfig = (): GenericHintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.VaultHint.title'),
    subtitle: t('Hints.VaultHint.subtitle'),
    iconSrc: '/vault.png',
    iconAlt: 'Vault',
    iconStyle: { borderRadius: '0' }, // Vault icon should not be rounded
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateVaultSegments(allItems, isLoading, error, enabled, t),
  };
};
