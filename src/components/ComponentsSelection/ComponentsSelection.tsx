import React, { useState, useMemo, useCallback } from 'react';
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
import { ComponentsListItem } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { getSelectedComponents } from './ComponentsSelectionContainer.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';

export interface ComponentsSelectionProps {
  componentsList: ComponentsListItem[];
  setComponentsList: (components: ComponentsListItem[]) => void;
  templateDefaultsError?: string;
}

export const ComponentsSelection: React.FC<ComponentsSelectionProps> = ({
  componentsList,
  setComponentsList,
  templateDefaultsError,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const selectedComponents = useMemo(() => getSelectedComponents(componentsList), [componentsList]);

  const searchResults = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return componentsList.filter(({ name }) => name.toLowerCase().includes(lowerSearch));
  }, [componentsList, searchTerm]);

  const handleSelectionChange = useCallback(
    (e: Ui5CustomEvent<CheckBoxDomRef, { checked: boolean }>) => {
      const id = e.target?.id;
      if (!id) return;
      setComponentsList(
        componentsList.map((component) =>
          component.name === id ? { ...component, isSelected: !component.isSelected } : component,
        ),
      );
    },
    [componentsList, setComponentsList],
  );

  const handleSearch = useCallback((e: Ui5CustomEvent<InputDomRef, never>) => {
    setSearchTerm(e.target.value.trim());
  }, []);

  const handleVersionChange = useCallback(
    (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
      const selectedOption = e.detail.selectedOption as HTMLElement;
      const name = selectedOption.dataset.name;
      const version = selectedOption.dataset.version;
      if (!name) return;
      setComponentsList(
        componentsList.map((component) =>
          component.name === name ? { ...component, selectedVersion: version || '' } : component,
        ),
      );
    },
    [componentsList, setComponentsList],
  );

  const isProviderDisabled = useCallback(
    (component: ComponentsListItem) => {
      if (!component.name?.includes('provider')) return false;
      const crossplane = componentsList.find(({ name }) => name === 'crossplane');
      return crossplane?.isSelected === false;
    },
    [componentsList],
  );

  return (
    <div>
      <Title>{t('componentsSelection.selectComponents')}</Title>

      <Input
        placeholder={t('common.search')}
        id="search"
        showClearIcon
        icon={<Icon name="search" />}
        value={searchTerm}
        aria-label={t('common.search')}
        onInput={handleSearch}
      />

      <Grid>
        <div data-layout-span="XL8 L8 M8 S8">
          {searchResults.length > 0 ? (
            searchResults.map((component) => {
              const providerDisabled = isProviderDisabled(component);
              return (
                <FlexBox
                  key={component.name}
                  className={styles.row}
                  gap={10}
                  justifyContent="SpaceBetween"
                  data-testid={`component-row-${component.name}`}
                >
                  <CheckBox
                    valueState="None"
                    text={component.name}
                    id={component.name}
                    checked={component.isSelected}
                    disabled={providerDisabled}
                    aria-label={component.name}
                    onChange={handleSelectionChange}
                  />
                  <FlexBox gap={10} justifyContent="SpaceBetween" alignItems="Baseline">
                    {/* TODO: Add documentation link */}
                    {component.documentationUrl && (
                      <Button
                        design="Transparent"
                        rel="noopener noreferrer"
                        aria-label={t('common.documentation')}
                        tabIndex={0}
                      >
                        {t('common.documentation')}
                      </Button>
                    )}
                    <Select
                      value={component.selectedVersion}
                      disabled={!component.isSelected || providerDisabled}
                      aria-label={`${component.name} version`}
                      valueState={component.isSelected && !component.selectedVersion ? 'Negative' : 'None'}
                      valueStateMessage={
                        component.isSelected && !component.selectedVersion ? (
                          <span>{t('ComponentsSelection.chooseVersion')}</span>
                        ) : undefined
                      }
                      onChange={handleVersionChange}
                    >
                      {!component.selectedVersion && (
                        <Option key="__placeholder" data-version="" data-name={component.name} selected>
                          {t('ComponentsSelection.chooseVersion')}
                        </Option>
                      )}
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
              );
            })
          ) : (
            <Infobox fullWidth variant="success">
              <Text>{t('componentsSelection.pleaseSelectComponents')}</Text>
            </Infobox>
          )}
        </div>

        <div data-layout-span="XL4 L4 M4 S4">
          {templateDefaultsError ? (
            <div style={{ marginBottom: 8 }}>
              <IllustratedError title={templateDefaultsError} compact />
            </div>
          ) : null}

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
            <Infobox fullWidth variant="success">
              <Text>{t('componentsSelection.pleaseSelectComponents')}</Text>
            </Infobox>
          )}
        </div>
      </Grid>
    </div>
  );
};
