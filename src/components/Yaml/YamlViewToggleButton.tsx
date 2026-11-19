import { ToggleButton } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { YamlIcon } from './YamlIcon.tsx';
import styles from './YamlViewButton.module.css';

interface YamlViewToggleButtonProps {
  pressed: boolean;
  onClick: () => void;
  'data-testid'?: string;
}

/**
 * The familiar "YAML" button, as a toggle for in-place previews (e.g. wizard tabs) rather than
 * opening the splitter side panel like `YamlViewButton` does.
 */
export function YamlViewToggleButton({ pressed, onClick, 'data-testid': testId }: YamlViewToggleButtonProps) {
  const { t } = useTranslation();
  return (
    <ToggleButton
      className={styles.button}
      design="Transparent"
      pressed={pressed}
      accessibleName={t('buttons.viewResource')}
      tooltip={t('buttons.viewResource')}
      data-testid={testId}
      onClick={onClick}
    >
      <YamlIcon />
    </ToggleButton>
  );
}
