import { Resource } from "../resource";

type ListProjectNamesType = string;

export const ListProjectNames: Resource<ListProjectNamesType[]> = {
  path: `/apis/authorization.k8s.io/v1/selfsubjectrulesreviews`,
  jq: '[[.status.resourceRules[] | select(.apiGroups[] == "core.openmcp.cloud" and .resources[] == "projects" and .verbs[] == "get") | .resourceNames[]] | unique[]]',
  method: "POST",
  body: '{"spec": {"namespace": "*"}}',
};
