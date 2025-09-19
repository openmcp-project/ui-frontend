import { Button, CheckBox, Form, Input, Label } from '@ui5/webcomponents-react';

import styles from './ModifyKustomizationForm.module.css';
import { useEffect, useState } from 'react';

export function ModifyKustomizationForm() {
  const [substitutions, setSubstituions] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    setSubstituions([
      { key: 'KEY1', value: 'VAl1' },
      { key: 'KEY2', value: 'VAl2x' },
    ]);
  }, []);

  return (
    <div style={{ maxWidth: '1200px' }}>
      <Form layout={'S1 M1 L1 XL1'}>
        <div className={styles.labelInput}>
          <div className={styles.labelContainer}>
            <Label required>Name</Label>
          </div>
          <Input style={{ width: '100%' }} type="Text" required />
        </div>

        <div className={styles.labelInput}>
          <div className={styles.labelContainer}>
            <Label required>Interval</Label>
          </div>
          <Input style={{ width: '100%' }} type="Text" required />
        </div>

        <div className={styles.labelInput}>
          <div className={styles.labelContainer}>
            <Label required>Target Namespace</Label>
          </div>
          <Input style={{ width: '100%' }} type="Text" required />
        </div>

        <div className={styles.labelInput}>
          <div className={styles.labelContainer}>
            <Label required>Git Repository</Label>
          </div>
          <Input type="Text" required />
        </div>

        <div className={styles.labelInput}>
          <div className={styles.labelContainer}>
            <Label required>Prune</Label>
          </div>
          <CheckBox />
        </div>

        <div className={styles.labelInput}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginInlineEnd: '1rem' }}>
            <Label>Substitutions</Label>
          </div>
          <div className={styles.substitutesContainer}>
            {substitutions.map((substitution, index) => (
              <div key={substitution.key} className={styles.substitutionRow}>
                <div className={styles.substituteLabelInput}>
                  <div className={styles.labelContainer}>
                    <Label required>{`Key ${index + 1}`}</Label>
                  </div>
                  <Input style={{ width: '100%' }} type="Text" required />
                </div>

                <div className={styles.substituteLabelInput}>
                  <div className={styles.labelContainer}>
                    <Label>{`Value ${index + 1}`}</Label>
                  </div>
                  <Input style={{ width: '100%' }} type="Text" required />
                </div>

                <div className={styles.substituteButtonContainer}>
                  <Button
                    style={{ marginLeft: '8px' }}
                    design="Transparent"
                    icon="sap-icon://delete"
                    onClick={() => setSubstituions((prev) => prev.filter((_, idx) => idx !== index))}
                  />
                </div>
              </div>
            ))}

            <Button
              style={{ marginTop: '1rem' }}
              icon="sap-icon://add"
              onClick={() => setSubstituions((substitutions) => [...substitutions, { key: '', value: '' }])}
            >
              Add substitution
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
