import IllustrationMessageDesign from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { FlexBox, IllustratedMessage, Button } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';

type InfoBannerProps = {
  title: string;
  subtitle: string;
  illustrationName: IllustrationMessageType; // e.g. 'NoData', 'SimpleError', etc.
  help?: {
    link: string;
    buttonText: string;
    buttonIcon?: string;
  };
  button?: React.ReactElement;
};

export const IllustratedBanner = ({ title, subtitle, illustrationName, help, button }: InfoBannerProps) => {
  return (
    <FlexBox direction="Column" alignItems="Center">
      <IllustratedMessage
        design={IllustrationMessageDesign.Scene}
        name={illustrationName}
        titleText={title}
        subtitleText={subtitle}
      />
      {help && (
        <a href={help.link} target="_blank" rel="noreferrer">
          <Button
            design={ButtonDesign.Transparent}
            icon={help.buttonIcon ? help.buttonIcon : 'sap-icon://question-mark'}
          >
            {help.buttonText}
          </Button>
        </a>
      )}
      {button}
    </FlexBox>
  );
};
