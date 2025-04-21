import IllustrationMessageDesign from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js';
import { FlexBox, IllustratedMessage, Button } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';
import { IllustrationName } from '../../Shared/IllustratedName';

type InfoBannerProps = {
  title: string;
  subtitle: string;
  illustrationName?: IllustrationName; // e.g. 'NoData', 'SimpleError', etc.
  buttonIcon?: string;
  helpButtonText?: string;
  helpLink?: string;
};

export const IllustratedBanner = ({
  title,
  subtitle,
  illustrationName = IllustrationName.NoData,
  buttonIcon = 'sap-icon://question-mark',
  helpButtonText,
  helpLink,
}: InfoBannerProps) => {
  return (
    <FlexBox direction="Column" alignItems="Center">
      <IllustratedMessage
        design={IllustrationMessageDesign.Spot}
        name={illustrationName}
        titleText={title}
        subtitleText={subtitle}
      />
      {helpButtonText && helpLink && (
        <Button
          design={ButtonDesign.Transparent}
          icon={buttonIcon}
          onClick={() => window.open(helpLink, '_blank')}
        >
          {helpButtonText}
        </Button>
      )}
    </FlexBox>
  );
};
