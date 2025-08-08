import { FlexBox, Label, ToggleButton } from '@ui5/webcomponents-react';

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
      <Label>{label} </Label>
      <FlexBox gap={8}>
        {options.map(({ value, label, icon }) => (
          <ToggleButton
            key={value}
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
