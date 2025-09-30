import { DiffEditor } from '@monaco-editor/react';
import type { ComponentProps } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { VS_CODE_DARK_PLUS, VS_CODE_LIGHT_PLUS } from '../../lib/monaco.ts';

// Reuse all props from the underlying Monaco DiffEditor component, except language (we force YAML)
export type YamlDiffEditorProps = Omit<
  ComponentProps<typeof DiffEditor>,
  'language' | 'defaultLanguage' | 'originalLanguage' | 'modifiedLanguage'
>;

// Simple wrapper that forwards all props to Monaco DiffEditor
export const YamlDiffEditor = (props: YamlDiffEditorProps) => {
  const { isDarkTheme } = useTheme();
  const { theme, options, ...rest } = props;
  const computedTheme = theme ?? (isDarkTheme ? VS_CODE_DARK_PLUS : VS_CODE_LIGHT_PLUS);

  const simplifiedOptions = {
    // Start from consumer-provided options, then enforce our simplified look
    ...options,
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
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '50vh' }}>
      <DiffEditor
        {...rest}
        theme={computedTheme}
        options={simplifiedOptions}
        height="90vh"
        // Force YAML language for both panes
        language="yaml"
      />
    </div>
  );
};
