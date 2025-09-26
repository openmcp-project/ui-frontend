import { Button, CheckBox, CheckBoxDomRef, Input, Label, Panel, Ui5CustomEvent } from '@ui5/webcomponents-react';

import styles from './ModifyKustomizationForm.module.css';
import React, { useCallback, useEffect, useState } from 'react';
import { useSplitter } from './SplitterContext.tsx';
import YamlViewer from '../../../components/Yaml/YamlViewer.tsx';
import { stringify } from 'yaml';

export function ModifyKustomizationForm() {
  const [substitutions, setSubstituions] = useState<{ key: string; value: string }[]>([]);
  const [isPrune, setIsPrune] = useState<boolean>(true);

  const splitter = useSplitter();

  const handleUpdate = () => {
    splitter.open(
      <YamlViewer
        yamlString={stringify({
          apiVersion: 'kustomize.toolkit.fluxcd.io/v1',
          kind: 'Kustomization',
          metadata: {
            name: 'flux-example-kustomization',
          },
          spec: {
            interval: '1m',
            targetNamespace: 'default',
            sourceRef: {
              kind: 'GitRepository',
              name: 'flux-example-repository',
            },
            path: './subaccount/kustomization',
            prune: isPrune,
            timeout: '1m',
            postBuild: {
              substitute: {
                name: 'hello-docs',
                subaccount_admin_mail: 'Johannes.Ott@sap.com',
              },
            },
          },
        })}
        filename={`xxx`}
      />,
    );
  };

  const handlePruneChange = () => {
    setIsPrune((a) => !a);
    handleUpdate();
  };

  useEffect(() => {
    setSubstituions([
      { key: 'KEY1', value: 'VAl1' },
      { key: 'KEY2', value: 'VAl2x' },
    ]);
  }, []);

  return (
    <Panel style={{ maxWidth: '1200px', padding: '16px' }}>
      <Panel headerText="Metadata" fixed>
        <div className={styles.gridRow}>
          <div className={styles.labelContainer}>
            <Label required>Name</Label>
          </div>
          <div>
            <Input type="Text" required />
          </div>
        </div>
      </Panel>

      <Panel headerText="Spec" fixed>
        <div className={styles.gridRow}>
          <div className={styles.labelContainer}>
            <Label required>Interval</Label>
          </div>
          <div>
            <Input type="Text" required />{' '}
          </div>
        </div>

        <div className={styles.gridRow}>
          <div className={styles.labelContainer}>
            <Label required>Target Namespace</Label>
          </div>
          <div>
            <Input type="Text" required />
          </div>
        </div>

        <div className={styles.gridRow}>
          <div className={styles.labelContainer}>
            <Label required>Git Repository</Label>
          </div>
          <div>
            <Input type="Text" required />
          </div>
        </div>

        <div className={styles.gridRow}>
          <div className={styles.labelContainer}>
            <Label required>Prune</Label>
          </div>
          <div>
            <CheckBox checked={isPrune} onChange={handlePruneChange} />
          </div>
        </div>
      </Panel>

      <Panel headerText="Substitutions" fixed>
        {substitutions.map((substitution, index) => (
          <div key={substitution.key} className={styles.gridRow}>
            <div className={styles.labelContainer}>
              <Label required>{`Key ${index + 1}`}</Label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 5rem 1fr auto', gap: '16px' }}>
              <Input style={{ width: '100%' }} type="Text" required />
              <div className={styles.labelContainer}>
                <Label>{`Value ${index + 1}`}</Label>
              </div>
              <Input style={{ width: '100%' }} type="Text" required />
              <div className={styles.substituteButtonContainer}>
                <Button
                  style={{ marginLeft: '8px' }}
                  design="Transparent"
                  icon="sap-icon://delete"
                  onClick={() => setSubstituions((prev) => prev.filter((_, idx) => idx !== index))}
                />
              </div>
            </div>
          </div>
        ))}

        <div className={styles.gridRow}>
          <div />
          <div className={styles.substituteButtonContainer}>
            <Button
              icon="sap-icon://add"
              onClick={() => setSubstituions((substitutions) => [...substitutions, { key: '', value: '' }])}
            >
              Add substitution
            </Button>
          </div>
        </div>
      </Panel>
    </Panel>
  );
}
