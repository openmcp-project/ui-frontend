import { gql } from '@apollo/client';

export const CreateCrossplaneMutation = gql`
  mutation CreateCrossplane($namespace: String, $object: CrossplaneInput!) {
    crossplane_services_openmcp_cloud {
      v1alpha1 {
        createCrossplane(namespace: $namespace, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;
