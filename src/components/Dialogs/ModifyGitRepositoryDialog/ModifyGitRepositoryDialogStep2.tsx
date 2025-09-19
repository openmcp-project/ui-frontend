import { stringify } from 'yaml';
import YamlViewer from '../../Yaml/YamlViewer.tsx';

export interface ModifyGitRepositoryDialogStep2Props {
  close: () => void;
}

export function ModifyGitRepositoryDialogStep2() {
  return (
    <YamlViewer
      yamlString={stringify({
        apiVersion: 'source.toolkit.fluxcd.io/v1',
        kind: 'GitRepository TODO FAKE DATA',
        metadata: {
          name: 'flux-example-repository',
        },
        spec: {
          interval: '1m0s',
          url: 'https://github.tools.sap/cloud-orchestration-demo/gitops-samples-btp',
          ref: {
            branch: 'main',
          },
          secretRef: {
            name: 'github-tools-secret',
          },
        },
      })}
      filename={`xxx`}
    />
  );
}
