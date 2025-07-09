export interface MCPTemplate {
  metaData: {
    name: string;
    namespace: string;
  };
  spec: {
    metaData: {
      name: {
        prefix?: string;
        sufix?: string;
        validationRegex?: string;
        validationMessage?: string;
      };
      displayName: {
        prefix?: string;
        sufix?: string;
        validationRegex?: string;
        validationMessage?: string;
      };
      chargingTarget: {
        type?: string;
        value?: string;
      };
    };
    spec: {
      authentication: {
        allowAdd?: boolean;
        system: {
          enabled?: boolean;
          changeable?: boolean;
        };
        customIDPs: [
          {
            removable?: boolean;
          },
        ];
      };
      authorization: {
        default: {
          name: string;
          removable?: boolean;
        };
        allowAdd: boolean;
        allow: string[];
        deny: string[];
      };
      components: {
        default: [
          {
            name: string;
            version: string;
            removable?: boolean;
            versionChangeable?: boolean;
          },
        ];
        allow: [
          {
            name: string;
            version: string[];
          },
        ];
        deny: [
          {
            name: string;
            version: string[];
          },
        ];
      };
    };
  };
}

// kind: ManagedControlPlaneTemplate
// meta:
//   name: hahfaljf
//   namespace: project-PROJECTNAME
//   # namespace: project-PROJECTNAME--ws-WORKSPACENAME
// spec:
//   meta:
//     name:
//       prefix: optional
//       suffix: optional
//       validationRegex: optional
//       validationMessage: optional # required in combination with regex
//     displayName:
//       prefix: optional
//       suffix: optional
//       validationRegex: optional
//       validationMessage: optional # required in combination with regex
//     chargingTarget:
//       type: optional # overrides the forms, make it disabled
//       value: optional # overrides the forms, make it disabled
//   spec:
//     authentication:
//       allowAdd: true # optional, default=true
//       system: # maybe: openmcp
//         enabled: true # optional, is the predefined value
//         changeable: true # optional, default=true
//       customIDPs:
//         custom1:
//           removable: true # optional, default=false
//         custom2:
//           ...
//     authorization:
//       default:
//         - name: openmcp:maria.musterfrau@sap.com
//           removable: true # optional, default=false
//       allowAdd: true # optional, default=true
//       allow:
//         - openmcp:maria.musterfrau@sap.com
//       deny:
//         - openmcp:max.mustermann@sap.com
//     components:
//       default:
//         - name: crossplane
//           version: v0.4.0
//           removable: true # optional, default=true
//           versionChangeable: true # optional, default=true
//         - name: provider-btp
//           version: v0.4.0
//           removable: true # optional, default=true
//           versionChangeable: true # optional, default=true
//         - name: external-secrets
//           version: v0.4.0
//           removable: true # optional, default=true
//           versionChangeable: true # optional, default=true
//       allow:
//         - name: crossplane
//           version:
//             - "v0.2.0 < v0.3.0"
//             - "v0.4.0"
//       deny:
//         - name: provider-btp
//           version:
//             - ">v0.2.0"
