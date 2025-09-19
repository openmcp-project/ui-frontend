import { FlexBox, Button } from '@ui5/webcomponents-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard.ts';
import '@ui5/webcomponents-icons/dist/copy';
import { ThemingParameters } from '@ui5/webcomponents-react-base';

interface KubeCtlTerminalProps {
  command: string;
}

export const KubectlTerminal = ({ command }: KubeCtlTerminalProps) => {
  const { copyToClipboard } = useCopyToClipboard();

  const FormattedCommand = () => {
    if (command.startsWith("echo '") && command.includes('apiVersion:')) {
      const [_, afterEcho] = command.split("echo '", 2);
      const [yamlContent, afterYaml] = afterEcho.split("' | kubectl", 2);
      const kubectlPart = 'kubectl' + afterYaml;

      const yamlLines = yamlContent.split('\n').map((line, index) => (
        <div key={index} style={{ marginLeft: line.startsWith(' ') ? '16px' : '0' }}>
          {line}
        </div>
      ));

      return (
        <>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <span>echo &apos;</span>
          <div style={{ marginLeft: '16px' }}>{yamlLines}</div>
          <span>&apos;</span> | <span>{kubectlPart}</span>
        </>
      );
    }

    return <span>{command}</span>;
  };

  return (
    <div
      style={{
        backgroundColor: ThemingParameters.sapBackgroundColor,
        borderRadius: '6px',
        color: ThemingParameters.sapTextColor,
        fontFamily: ThemingParameters.sapFontFamily,
        border: `1px solid ${ThemingParameters.sapGroup_ContentBorderColor}`,
        marginTop: '8px',
      }}
    >
      <FlexBox
        justifyContent="SpaceBetween"
        alignItems="Center"
        style={{
          padding: '2px 16px',
          borderBottom: ThemingParameters.sapGroup_ContentBorderColor,
        }}
      >
        <FlexBox style={{ gap: '6px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: ThemingParameters.sapErrorColor,
            }}
          />
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: ThemingParameters.sapWarningColor,
            }}
          />
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: ThemingParameters.sapSuccessColor,
            }}
          />
        </FlexBox>
        <Button icon="copy" design="Transparent" tooltip="Copy to clipboard" onClick={() => copyToClipboard(command)} />
      </FlexBox>

      <div style={{ padding: '12px 16px', overflowX: 'auto' }}>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span style={{ marginRight: '8px' }}>❯</span>
        {FormattedCommand()}
      </div>
    </div>
  );
};
