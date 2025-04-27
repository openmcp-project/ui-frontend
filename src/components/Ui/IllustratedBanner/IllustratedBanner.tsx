import IllustrationMessageDesign from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { FlexBox, IllustratedMessage, Button } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

type InfoBannerProps = {
  title: string;
  subtitle: string;
  illustrationName?: IllustrationMessageType // e.g. 'NoData', 'SimpleError', etc.
  help?: {
    link: string;
    buttonText: string;
    buttonIcon?: string;
  }
};

export const IllustratedBanner = ({
  title,
  subtitle,
  illustrationName = IllustrationMessageType.NoData,
  help
}: InfoBannerProps) => {
  return (
    <FlexBox direction="Column" alignItems="Center">
      <IllustratedMessage
        design={IllustrationMessageDesign.Spot}
        name={illustrationName}
        titleText={title}
        subtitleText={subtitle}
      />
      {help?.buttonText && help.link && (
        <a href={help.link} target='_blank'>
          <Button
            design={ButtonDesign.Transparent}
            icon={help.buttonIcon ? help.buttonIcon : 'sap-icon://question-mark'}
          >
            {help.buttonIcon}
          </Button>
        </a>
      )}
    </FlexBox>
  );
};
