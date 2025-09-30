import { Editor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { VS_CODE_DARK_PLUS, VS_CODE_LIGHT_PLUS } from '../../lib/monaco.ts';

// Reuse all props from the underlying Monaco Editor component
export type YamlEditorProps = ComponentProps<typeof Editor>;

// Simple wrapper that forwards all props to Monaco Editor
export const YamlEditor = (props: YamlEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { theme, ...rest } = props;
  const computedTheme = theme ?? (isDarkTheme ? VS_CODE_DARK_PLUS : VS_CODE_LIGHT_PLUS);

  return <Editor theme={computedTheme} {...rest} />;
};
