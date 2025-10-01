import { Editor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../../lib/monaco.ts';

// Reuse all props from the underlying Monaco Editor component, except language (we force YAML)
export type YamlEditorProps = Omit<ComponentProps<typeof Editor>, 'language'>;

// Simple wrapper that forwards all props to Monaco Editor
export const YamlEditor = (props: YamlEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { theme, ...rest } = props;
  const computedTheme = theme ?? (isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT);

  return (
    <Editor
      {...rest}
      theme={computedTheme}
      // Force YAML language for this editor wrapper
      language="yaml"
    />
  );
};
