import { IllustratedMessage } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-fiori/dist/illustrations/PageNotFound";
// thorws error sometimes if not imported
import "@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch";
import Delayed from "../Helper/Delayed.tsx";
import { useTranslation } from 'react-i18next';

export default function NotInLuigiView() {
  const { t } = useTranslation();

  return (
    <Delayed waitBeforeShow={2000}>
      <IllustratedMessage
        name="PageNotFound"
        titleText={t('NotInLuigiView.titleMessage')}
        subtitleText={t('NotInLuigiView.subtitleMessage')}
      />
    </Delayed>
  );
}
