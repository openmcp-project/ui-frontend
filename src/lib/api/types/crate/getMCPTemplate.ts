import { Resource } from '../resource';

export const GetMCPTemplate = (): Resource<any> => {
  return {
    path: `/apis/kro.run/v1alpha1/namespaces/project-webapp-playground/managedcontrolplanetemplates/testtemplate`,
    jq: undefined,
  };
};

// apis/kro.run/v1alpha1/namespaces/project-webapp-playground/managedcontrolplanetemplates/testtemplate
