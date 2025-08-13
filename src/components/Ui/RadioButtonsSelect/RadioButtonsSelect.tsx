import { FlexBox, Label, ToggleButton } from '@ui5/webcomponents-react';
import styles from './RadioButtonsSelect.module.css';
import { clsx } from 'clsx';
export type RadioButtonsSelectOption = {
  label: string;
  value: string;
  icon?: string;
};

type RadioButtonsSelectProps = {
  selectedValue: string;
  options: RadioButtonsSelectOption[];
  handleOnClick: (value: string) => void;
  label: string;
};

export const RadioButtonsSelect = ({ selectedValue, options, handleOnClick, label }: RadioButtonsSelectProps) => {
  return (
    <FlexBox aria-labelledby={label} role="radiogroup" direction={'Column'}>
      <Label className={styles.label}>{label} </Label>
      <FlexBox>
        {options.map(({ value, label, icon }, index) => (
          <ToggleButton
            key={value}
            className={clsx(
              styles.button,
              { [styles.buttonFirst]: index === 0 && index !== options.length },
              {
                [styles.buttonMiddle]:
                  index !== 0 && index !== options.length && options.length > 2 && index + 1 !== options.length,
              },
              { [styles.buttonLast]: index + 1 === options.length && options.length > 1 },
              { [styles.left]: index > 0 },
            )}
            design={'Transparent'}
            style={{
              color:
                value === selectedValue ? 'var(--sapContent_Selected_ForegroundColor)' : 'var(--sapContent_LabelColor)',
            }}
            icon={icon}
            pressed={value === selectedValue}
            onClick={() => {
              handleOnClick(value);
            }}
          >
            {label}
          </ToggleButton>
        ))}
      </FlexBox>
    </FlexBox>
  );
};
