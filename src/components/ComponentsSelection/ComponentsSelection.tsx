import React, { useState } from 'react';
import {
  CheckBox,
  Select,
  Option,
  FlexBox,
  Title,
  Text,
  Input,
  Button,
  Grid,
  List,
  ListItemStandard,
  Icon,
  Ui5CustomEvent,
  CheckBoxDomRef,
  SelectDomRef,
  InputDomRef,
} from '@ui5/webcomponents-react';
import styles from './ComponentsSelection.module.css';
import { Infobox } from '../Ui/Infobox/Infobox.tsx';
import { useTranslation } from 'react-i18next';

export interface ComponentSelectionItem {
  name: string;
  versions: string[];
  isSelected: boolean;
  selectedVersion: string;
}

export interface ComponentsSelectionProps {
  components: ComponentSelectionItem[];
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<ComponentSelectionItem[]>
  >;
}

export const ComponentsSelection: React.FC<ComponentsSelectionProps> = ({
  components,
  setSelectedComponents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const handleSelectionChange = (
    e: Ui5CustomEvent<CheckBoxDomRef, { checked: boolean }>,
  ) => {
    const id = e.target?.id;
    setSelectedComponents((prev) =>
      prev.map((component) =>
        component.name === id
          ? { ...component, isSelected: !component.isSelected }
          : component,
      ),
    );
  };

  const handleSearch = (e: Ui5CustomEvent<InputDomRef, never>) => {
    setSearchTerm(e.target.value.trim());
  };

  const handleVersionChange = (
    e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>,
  ) => {
    const selectedOption = e.detail.selectedOption as HTMLElement;
    const name = selectedOption.dataset.name;
    const version = selectedOption.dataset.version;
    setSelectedComponents((prev) =>
      prev.map((component) =>
        component.name === name
          ? { ...component, selectedVersion: version || '' }
          : component,
      ),
    );
  };

  const filteredComponents = components.filter(({ name }) =>
    name.includes(searchTerm),
  );
  const selectedComponents = components.filter(
    (component) => component.isSelected,
  );

  return (
    <div>
      <Title>{t('componentsSelection.selectComponents')}</Title>

      <Input
        placeholder={t('common.search')}
        id="search"
        showClearIcon
        icon={<Icon name="search" />}
        onInput={handleSearch}
      />

      <Grid>
        <div data-layout-span="XL8 L8 M8 S8">
          {filteredComponents.map((component) => (
            <FlexBox
              key={component.name}
              className={styles.row}
              gap={10}
              justifyContent="SpaceBetween"
            >
              <CheckBox
                valueState="None"
                text={component.name}
                id={component.name}
                checked={component.isSelected}
                onChange={handleSelectionChange}
              />
              <FlexBox
                gap={10}
                justifyContent="SpaceBetween"
                alignItems="Baseline"
              >
                <Button design="Transparent">
                  {t('common.documentation')}
                </Button>
                <Select
                  value={component.selectedVersion}
                  onChange={handleVersionChange}
                >
                  {component.versions.map((version) => (
                    <Option
                      key={version}
                      data-version={version}
                      data-name={component.name}
                      selected={component.selectedVersion === version}
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
          {selectedComponents.length > 0 ? (
            <List headerText={t('componentsSelection.selectedComponents')}>
              {selectedComponents.map((component) => (
                <ListItemStandard
                  key={component.name}
                  text={component.name}
                  additionalText={component.selectedVersion}
                />
              ))}
            </List>
          ) : (
            <Infobox fullWidth variant={'success'}>
              <Text>{t('componentsSelection.pleaseSelectComponents')}</Text>
            </Infobox>
          )}
        </div>
      </Grid>
    </div>
  );
};
