import React from 'react';
import { CheckBox, Select, Option, FlexBox } from '@ui5/webcomponents-react';
import styles from './ComponentsSelection.module.css';
import cx from 'clsx';
export interface ComponentItem {
  name: string;
  versions: string[];
}

export interface ComponentsSelectionProps {
  items: ComponentItem[];
}

export const ComponentsSelection: React.FC<ComponentsSelectionProps> = ({
  items: components,
}) => {
  const onChange = (event: any) => {
    console.log(event.detail.selectedOption.dataset.id);
  };
  return (
    <div>
      {components.map((component, idx) => (
        <FlexBox
          key={component.name}
          className={cx(styles.row, idx % 2 === 1 ? styles.oddRow : '')}
          gap={10}
          justifyContent={'SpaceBetween'}
        >
          <CheckBox valueState={'None'} text={component.name} />
          <Select onChange={onChange}>
            {component.versions.map((version) => (
              <Option key={version} data-id={version}>
                {version}
              </Option>
            ))}
          </Select>
        </FlexBox>
      ))}
    </div>
  );
};
