import { fetchApiServer } from "../../fetch";
import { ApiConfig } from "../apiConfig";

export async function createControlPlane(
  projectName: string,
  workspaceName: string,
  controlPlaneName: string,
  apiConfig: ApiConfig,
) {
  return await fetchApiServer(
    `/apis/core.openmcp.cloud/v1alpha1/namespaces/project-${projectName}--ws-${workspaceName}/managedcontrolplanes`,
    apiConfig,
    undefined,
    "POST",
    JSON.stringify({
      apiVersion: "core.openmcp.cloud/v1alpha1",
      kind: "ControlPlane",
      metadata: {
        name: controlPlaneName,
      },
      spec: {
        dataplane: {
          type: "Gardener",
          gardener: {
            region: "eu-west-1",
          },
        },
        crossplane: {
          enabled: false,
          version: "1.14.0",
        },
      },
    }),
  );
}
