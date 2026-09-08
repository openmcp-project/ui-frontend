import cardStyles from './ControlPlaneCard.module.css';
import skeletonStyles from './ControlPlaneCardSkeleton.module.css';

export function ControlPlaneCardSkeleton() {
  return (
    <div aria-hidden="true" className={cardStyles.card}>
      <div className={cardStyles.cardHeader}>
        <div className={cardStyles.titleSection}>
          <div className={cardStyles.titleContent}>
            <div className={skeletonStyles.titleBar} />
            <div className={skeletonStyles.subtitleBar} />
          </div>
        </div>
        <div className={cardStyles.headerActions}>
          <div className={skeletonStyles.statusCircle} />
        </div>
      </div>
      <div className={cardStyles.cardBody}>
        <div className={cardStyles.componentIcons}>
          <div className={`${cardStyles.componentIcon} ${cardStyles.componentIconSkeleton}`} />
          <div className={`${cardStyles.componentIcon} ${cardStyles.componentIconSkeleton}`} />
          <div className={`${cardStyles.componentIcon} ${cardStyles.componentIconSkeleton}`} />
        </div>
      </div>
      <div className={cardStyles.cardFooter}>
        <div className={cardStyles.footerLeft}>
          <div className={skeletonStyles.footerBar} />
        </div>
        <div className={cardStyles.footerRight}>
          <div className={skeletonStyles.buttonBar} />
        </div>
      </div>
    </div>
  );
}
