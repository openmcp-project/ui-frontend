import { useState } from 'react';
import { BentoGrid, BentoCard } from '../../../components/BentoGrid';
import { GraphCard } from '../../../components/BentoGrid/GraphCard/GraphCard';
import { CrossplaneCard } from '../../../components/BentoGrid/ComponentCard/CrossplaneCard/CrossplaneCard';
import { FluxCard } from '../../../components/BentoGrid/ComponentCard/FluxCard/FluxCard';
import { ESOCard } from '../../../components/BentoGrid/ComponentCard/ESOCard/ESOCard';
import { KyvernoCard } from '../../../components/BentoGrid/ComponentCard/KyvernoCard/KyvernoCard';
import { MembersCard } from '../../../components/BentoGrid/MembersCard/MembersCard';
import { ManagedResourceItem } from '../../../lib/shared/types';
import styles from '../pages/McpPage.module.css';

export type ExpandedCardType = 'crossplane' | 'gitops' | 'members' | null;

interface McpBentoLayoutProps {
  mcp: any;
  allItems: ManagedResourceItem[];
  memberItems: any[];
  isLoading: boolean;
  error: any;
  onExpandedCardChange?: (expandedCard: ExpandedCardType) => void;
}

export function useMcpBentoLayout({
  mcp,
  allItems,
  memberItems,
  isLoading,
  error,
  onExpandedCardChange,
}: McpBentoLayoutProps) {
  // Card expansion state management
  const [expandedCard, setExpandedCard] = useState<ExpandedCardType>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const createExpandHandler = (cardType: ExpandedCardType) => () => {
    setIsExpanding(true);
    setTimeout(() => {
      setExpandedCard(cardType);
      setIsExpanding(false);
      onExpandedCardChange?.(cardType);
    }, 50);
  };

  const handleCollapseExpanded = () => {
    setIsExpanding(true);
    setTimeout(() => {
      setExpandedCard(null);
      setIsExpanding(false);
      onExpandedCardChange?.(null);
    }, 300);
  };

  const handleCrossplaneExpand = createExpandHandler('crossplane');
  const handleGitOpsExpand = createExpandHandler('gitops');
  const handleMembersExpand = createExpandHandler('members');

  const bentoGrid = (
    <BentoGrid
      className={
        expandedCard === 'members' ? styles.expandedMembersGrid : expandedCard ? styles.expandedGrid : ''
      }
    >
      {/* Crossplane Card - always rendered but changes size/position */}
      {(!expandedCard || expandedCard === 'crossplane') && (
        <BentoCard
          size="large"
          gridColumn={expandedCard === 'crossplane' ? '1 / 13' : '1 / 9'}
          gridRow="1 / 3"
          className={expandedCard === 'crossplane' ? styles.expandedCard : ''}
        >
          <div className={styles.cardContentContainer}>
            <CrossplaneCard
              enabled={!!mcp?.spec?.components?.crossplane}
              version={mcp?.spec?.components?.crossplane?.version}
              allItems={allItems}
              isLoading={isLoading}
              error={error}
              size="large"
              expanded={expandedCard === 'crossplane'}
              onClick={expandedCard === 'crossplane' ? handleCollapseExpanded : handleCrossplaneExpand}
            />
          </div>
        </BentoCard>
      )}

      {/* GitOps Card - shows when expanded */}
      {expandedCard === 'gitops' && (
        <BentoCard size="large" gridColumn="1 / 13" gridRow="1 / 3" className={styles.expandedCard}>
          <div className={styles.cardContentContainer}>
            <FluxCard
              enabled={!!mcp?.spec?.components?.flux}
              version={mcp?.spec?.components?.flux?.version}
              allItems={allItems}
              isLoading={isLoading}
              error={error}
              size="large"
              expanded={true}
              onClick={handleCollapseExpanded}
            />
          </div>
        </BentoCard>
      )}

      {/* Members Card - shows when expanded */}
      {expandedCard === 'members' && (
        <BentoCard size="large" gridColumn="1 / 13" gridRow="1 / 7" className={styles.expandedCard}>
          <div className={styles.cardContentContainer}>
            <MembersCard
              enabled={!!mcp?.spec?.components?.apiServer}
              allItems={memberItems}
              isLoading={isLoading}
              error={error}
              size="large"
              expanded={true}
              onClick={handleCollapseExpanded}
            />
          </div>
        </BentoCard>
      )}

      {/* Graph Card - persistent, only hidden for members view */}
      {expandedCard !== 'members' && (
        <BentoCard
          size="extra-large"
          gridColumn={expandedCard ? '1 / 13' : '1 / 9'}
          gridRow="3 / 7"
          className={expandedCard ? styles.expandedCardNonInteractive : styles.nonInteractiveCard}
        >
          <GraphCard title="Resource Dependencies" colorBy={expandedCard === 'gitops' ? 'flux' : 'source'} />
        </BentoCard>
      )}

      {/* Right side cards - only show when collapsed */}
      {!expandedCard && (
        <>
          {/* GitOps Card */}
          <BentoCard
            size="medium"
            gridColumn="9 / 13"
            gridRow="1 / 3"
            className={isExpanding ? styles.hidingCard : ''}
          >
            <FluxCard
              enabled={!!mcp?.spec?.components?.flux}
              version={mcp?.spec?.components?.flux?.version}
              allItems={allItems}
              isLoading={isLoading}
              error={error}
              size="medium"
              onClick={handleGitOpsExpand}
            />
          </BentoCard>

          {/* Members Card */}
          <BentoCard
            size="medium"
            gridColumn="9 / 13"
            gridRow="3 / 5"
            className={isExpanding ? styles.hidingCard : ''}
          >
            <MembersCard
              enabled={!!mcp?.spec?.components?.apiServer}
              allItems={memberItems}
              isLoading={isLoading}
              error={error}
              size="medium"
              onClick={handleMembersExpand}
            />
          </BentoCard>

          {/* Kyverno Card */}
          <BentoCard
            size="small"
            gridColumn="9 / 11"
            gridRow="5 / 7"
            className={isExpanding ? styles.hidingCard : styles.disabledCard}
          >
            <KyvernoCard
              enabled={!!mcp?.spec?.components?.kyverno}
              version={mcp?.spec?.components?.kyverno?.version}
              allItems={allItems}
              isLoading={isLoading}
              error={error}
              size="small"
            />
          </BentoCard>

          {/* ESO Card */}
          <BentoCard
            size="small"
            gridColumn="11 / 13"
            gridRow="5 / 7"
            className={isExpanding ? styles.hidingCard : styles.disabledCard}
          >
            <ESOCard
              enabled={!!mcp?.spec?.components?.externalSecretsOperator}
              version={mcp?.spec?.components?.externalSecretsOperator?.version}
              allItems={allItems}
              isLoading={isLoading}
              error={error}
              size="small"
            />
          </BentoCard>
        </>
      )}
    </BentoGrid>
  );

  return { expandedCard, bentoGrid };
}