import React from 'react';
import {
  CheckBox,
  Select,
  Option,
  FlexBox,
  Title,
  Text,
  Label,
  Input,
  Button,
} from '@ui5/webcomponents-react';
import styles from './ComponentsSelection.module.css';
import { sortVersions } from '../../utils/componentsVersions.ts';

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
      <Title>Select components</Title>
      <Text>
        Please select components that you would like to have assigned to your
        Managed Control Plane{' '}
      </Text>
      <Label for={'search'}>Search</Label>
      <Input id={'search'} />
      <Button design={'Transparent'}>Show selected only</Button>
      <Button design={'Transparent'}>Show all</Button>
      <div>
        {components.map((component) => (
          <FlexBox
            key={component.name}
            className={styles.row}
            gap={10}
            justifyContent={'SpaceBetween'}
          >
            <CheckBox valueState={'None'} text={component.name} />
            <FlexBox
              gap={10}
              justifyContent={'SpaceBetween'}
              alignItems={'Baseline'}
            >
              <Button design={'Transparent'}>Documentation</Button>
              <Select onChange={onChange}>
                {sortVersions(component.versions).map((version) => (
                  <Option key={version} data-id={version}>
                    {version}
                  </Option>
                ))}
              </Select>
            </FlexBox>
          </FlexBox>
        ))}
      </div>
    </div>
  );
};
