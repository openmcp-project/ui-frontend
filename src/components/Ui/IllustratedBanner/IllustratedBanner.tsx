import IllustrationMessageDesign from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { FlexBox, IllustratedMessage, Button, UI5WCSlotsNode } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';
import { ReactElement } from 'react';

type InfoBannerProps = {
  title: string;
  subtitle: string | UI5WCSlotsNode;
  illustrationName: IllustrationMessageType; // e.g. 'NoData', 'SimpleError', etc.
  help?: {
    link: string;
    buttonText: string;
    buttonIcon?: string;
  };
  button?: ReactElement;
};

export const IllustratedBanner = ({
  title,
  subtitle: subtitleProp,
  illustrationName,
  help,
  button,
}: InfoBannerProps) => {
  let subtitleText, subtitleNode;
  if (typeof subtitleProp === 'string') {
    subtitleText = subtitleProp;
  } else {
    subtitleNode = subtitleProp;
  }

  return (
    <FlexBox direction="Column" alignItems="Center">
      <IllustratedMessage
        design={IllustrationMessageDesign.Scene}
        name={illustrationName}
        titleText={title}
        subtitleText={subtitleText}
        subtitle={subtitleNode}
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
