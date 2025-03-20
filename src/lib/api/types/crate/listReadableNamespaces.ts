import { Resource } from '../resource';

type ReadableNamespaces = string;

export const ListReadableNamespaces: Resource<ReadableNamespaces[]> = {
  path: `/apis/authorization.k8s.io/v1/selfsubjectrulesreviews`,
  jq: '[[.status.resourceRules[] | select(.resources[] == "namespaces" and .verbs[] == "get") | .resourceNames[]] | unique[]]',
  method: 'POST',
  body: '{"spec": {"namespace": "*"}}',
};
