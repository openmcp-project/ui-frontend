import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import {
  CreateCrossplaneDocument,
  type CreateCrossplaneMutationVariables,
} from '../../../types/__generated__/graphql/graphql';

export function useCreateCrossplane() {
  const [createMutation, { loading, error }] = useMutation(CreateCrossplaneDocument, {
    refetchQueries: ['GetCrossplane'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateCrossplaneMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
