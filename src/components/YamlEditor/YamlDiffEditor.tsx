import { DiffEditor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { GITHUB_DARK_DEFAULT, GITHUB_LIGHT_DEFAULT } from '../../lib/monaco.ts';

export type YamlDiffEditorProps = Omit<
  ComponentProps<typeof DiffEditor>,
  'language' | 'defaultLanguage' | 'originalLanguage' | 'modifiedLanguage'
>;

// Simple wrapper that forwards all props to Monaco DiffEditor
export const YamlDiffEditor = (props: YamlDiffEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { theme, options, ...rest } = props;
  const computedTheme = theme ?? (isDarkTheme ? GITHUB_DARK_DEFAULT : GITHUB_LIGHT_DEFAULT);

  const diffEditorOptions = {
    ...options,
    isKubernetes: true,
    scrollbar: {
      ...(options?.scrollbar ?? {}),
      useShadows: false,
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
      alwaysConsumeMouseWheel: false,
    },
    lineNumbers: 'off' as const,
    minimap: { enabled: false },
    glyphMargin: false,
    renderLineHighlight: 'none' as const,
    folding: false,
    renderOverviewRuler: false,
    scrollBeyondLastLine: false,
    renderMarginRevertIcon: false,
    automaticLayout: true,
    readOnly: true,
  };

  return <DiffEditor {...rest} theme={computedTheme} options={diffEditorOptions} height="100%" language="yaml" />;
};
