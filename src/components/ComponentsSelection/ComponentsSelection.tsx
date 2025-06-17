import React from 'react';
import { CheckBox, Select, Option, FlexBox } from '@ui5/webcomponents-react';

interface ComponentItem {
  name: string;
  versions: string[];
}

interface ComponentsSelectionProps {
  items: ComponentItem[];
}

export const ComponentsSelection: React.FC<ComponentsSelectionProps> = ({
  items,
}) => {
  const onChange = (event: any) => {
    // event.detail.selectedOption is a reference to the selected HTML Element
    // dataset contains all attributes that were passed with the data- prefix.
    console.log(event.detail.selectedOption.dataset.id);
  };
  return (
    <div>
      {items.map((item, idx) => (
        <FlexBox key={idx} gap={10} justifyContent={'SpaceBetween'}>
          <CheckBox valueState={'None'} text={'test'}>
            {item.name}
          </CheckBox>
          <Select onChange={onChange}>
            {item.versions.map((version) => (
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
