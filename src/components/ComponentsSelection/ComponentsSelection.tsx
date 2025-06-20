import React, { Dispatch, SetStateAction } from 'react';
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
  Grid,
  List,
  ListItemStandard,
} from '@ui5/webcomponents-react';
import styles from './ComponentsSelection.module.css';

import { Infobox } from '../Ui/Infobox/Infobox.tsx';

export interface ComponentSelectionItem {
  name: string;
  versions: string[];
  isSelected: boolean;
  selectedVersion: string;
}

export interface ComponentsSelectionProps {
  components: ComponentSelectionItem[];
  setSelectedComponents: Dispatch<SetStateAction<ComponentSelectionItem[]>>;
}

export const ComponentsSelection: React.FC<ComponentsSelectionProps> = ({
  components,
  setSelectedComponents,
}) => {
  const onChangeSelection = (event: any) => {
    console.log(event.detail.selectedOption.dataset.id);
    setSelectedComponents(
      components.map((component) =>
        component.name === event.detail.selectedOption.dataset.id
          ? { ...component, isSelected: !component.isSelected }
          : component,
      ),
    );
  };
  const onChangeVersion = (event: any) => {
    console.log(event.detail.selectedOption.dataset.id);
    setSelectedComponents(
      components.map((component) =>
        component.name === event.detail.selectedOption.dataset.name
          ? {
              ...component,
              selectedVersion: event.detail.selectedOption.dataset.version,
            }
          : component,
      ),
    );
  };
  return (
    <div>
      <Title>Select components</Title>
      <Text>
        Please select components that you would like to have assigned to your
        Managed Control Plane
      </Text>
      <Label for={'search'}>Search</Label>
      <Input id={'search'} />
      <Button design={'Transparent'}>Show selected only</Button>
      <Button design={'Transparent'}>Show all</Button>
      <Grid>
        <div data-layout-span="XL8 L8 M8 S8">
          {components.map((component) => (
            <FlexBox
              key={component.name}
              className={styles.row}
              gap={10}
              justifyContent={'SpaceBetween'}
            >
              <CheckBox
                valueState={'None'}
                text={component.name}
                id={component.name}
                checked={component.isSelected}
                onChange={onChangeSelection}
              />
              <FlexBox
                gap={10}
                justifyContent={'SpaceBetween'}
                alignItems={'Baseline'}
              >
                <Button design={'Transparent'}>Documentation</Button>
                <Select onChange={onChangeVersion}>
                  {component.versions.map((version) => (
                    <Option
                      key={version}
                      data-version={version}
                      data-name={component.name}
                    >
                      {version}
                    </Option>
                  ))}
                </Select>
              </FlexBox>
            </FlexBox>
          ))}
        </div>
        <div data-layout-span="XL4 L4 M4 S4">
          <Infobox variant={'normal'} fullWidth>
            <List headerText={'Selected components'}>
              {components
                .filter((component) => component.isSelected)
                .map((component) => (
                  <ListItemStandard
                    key={component.name}
                    text={component.name}
                    additionalText={component.selectedVersion}
                  />
                ))}
            </List>
          </Infobox>
        </div>
      </Grid>
    </div>
  );
};
