import { DiffEditor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { VS_CODE_DARK_PLUS, VS_CODE_LIGHT_PLUS } from '../../lib/monaco.ts';

// Reuse all props from the underlying Monaco DiffEditor component
export type YamlDiffEditorProps = ComponentProps<typeof DiffEditor>;

// Simple wrapper that forwards all props to Monaco DiffEditor
export const YamlDiffEditor = (props: YamlDiffEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { theme, ...rest } = props;
  const computedTheme = theme ?? (isDarkTheme ? VS_CODE_DARK_PLUS : VS_CODE_LIGHT_PLUS);

  return <DiffEditor theme={computedTheme} {...rest} />;
};
