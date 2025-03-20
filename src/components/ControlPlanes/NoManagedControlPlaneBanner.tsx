import { Button, FlexBox, IllustratedMessage } from '@ui5/webcomponents-react';

import '@ui5/webcomponents-fiori/dist/illustrations/NoData.js';
import '@ui5/webcomponents-fiori/dist/illustrations/EmptyList.js';
import '@ui5/webcomponents-icons/dist/delete';
import IllustrationMessageDesign from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useFrontendConfig } from '../../context/FrontendConfigContext';
import { useTranslation } from 'react-i18next';

export function NoManagedControlPlaneBanner() {
  const { links } = useFrontendConfig();
  const { t } = useTranslation();

  return (
    <FlexBox direction="Column" alignItems="Center">
      <IllustratedMessage
        design={IllustrationMessageDesign.Spot}
        name="NoData"
        titleText={t('NoManagedControlPlaneBanner.titleMessage')}
        subtitleText={t('NoManagedControlPlaneBanner.subtitleMessage')}
      />
      <Button
        design={ButtonDesign.Transparent}
        icon="sap-icon://question-mark"
        onClick={() => {
          window.open(links.COM_PAGE_GETTING_STARTED_MCP, '_blank');
        }}
      >
        {t('NoManagedControlPlaneBanner.helpButton')}
      </Button>
    </FlexBox>
  );
}
