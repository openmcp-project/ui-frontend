import React from 'react';
import { useTranslation } from 'react-i18next';
import { HintConfig } from './types';
import { calculateCrossplaneSegments, calculateGitOpsSegments, calculateVaultSegments } from './calculations';
import { CrossplaneHoverContent } from './CrossplaneHoverContent';

export const useCrossplaneHintConfig = (): HintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.CrossplaneHint.title'),
    subtitle: t('Hints.CrossplaneHint.subtitle'),
    iconSrc: '/crossplane-icon.png',
    iconAlt: 'Crossplane',
    scrollTarget: '.crossplane-table-element',
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateCrossplaneSegments(allItems, isLoading, error, enabled, t),
    renderHoverContent: (allItems, enabled) => {
      return React.createElement(CrossplaneHoverContent, { allItems, enabled });
    },
  };
};

export const useGitOpsHintConfig = (): HintConfig => {
  const { t } = useTranslation();

  return {
    title: t('Hints.GitOpsHint.title'),
    subtitle: t('Hints.GitOpsHint.subtitle'),
    iconSrc: '/flux.png',
    iconAlt: 'Flux',
    scrollTarget: '.cp-page-section-gitops',
    calculateSegments: (allItems, isLoading, error, enabled) =>
      calculateGitOpsSegments(allItems, isLoading, error, enabled, t),
  };
};

export const useVaultHintConfig = (): HintConfig => {
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
