import { Trans, useTranslation } from 'react-i18next';
import { SupportInfoSource } from '../../lib/supportInfo.ts';

export function InheritedFromText({ source }: { source: SupportInfoSource }) {
  const { t } = useTranslation();
  return (
    <Trans
      i18nKey="SupportInfo.inheritedFrom"
      values={{ kind: t(`Entities.${source.kind}`), name: source.name }}
      components={{ b: <b /> }}
    />
  );
}
