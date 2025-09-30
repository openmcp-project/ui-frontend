import React, { useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Button } from '@ui5/webcomponents-react';
import * as yaml from 'js-yaml';
import styles from './YamlEditor.module.css';
import { useTranslation } from 'react-i18next';

interface YamlEditorProps {
  yamlString: string;
}

const YamlEditor: React.FC<YamlEditorProps> = ({ yamlString }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const { t } = useTranslation();

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
  };

  const validateAndSubmit = () => {
    if (editorRef.current) {
      const currentYaml = editorRef.current.getValue();
      try {
        const parsedYaml = yaml.load(currentYaml);
        console.log(parsedYaml);
        setErrors([]);
        alert(t('YamlEditor.validationSuccess'));
      } catch (e: unknown) {
        if (e instanceof Error) {
          setErrors([e.message]);
        } else {
          setErrors([t('YamlEditor.unknownError')]);
        }
      }
    }
  };

  return (
    <div className={styles.editorContainer}>
      <Editor height="400px" language="yaml" theme="vs-dark" value={yamlString} onMount={handleEditorDidMount} />
      <Button className={styles.submitButton} onClick={validateAndSubmit}>
        {t('buttons.submit')}
      </Button>
      {errors.length > 0 && (
        <div className={styles.errorOutput}>
          <h3>{t('YamlEditor.errors')}</h3>
          {errors.map((error, index) => (
            <pre key={index}>{error}</pre>
          ))}
        </div>
      )}
    </div>
  );
};

export default YamlEditor;
