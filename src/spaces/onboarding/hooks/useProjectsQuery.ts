import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { graphql } from '../../../types/__generated__/graphql/index.ts';
import { Io_K8s_Api_Authorization_V1_ResourceRuleResourceRules_Input as ResourceRule } from '../../../types/__generated__/graphql/graphql.ts';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';

const PROJECTS_REFRESH_INTERVAL_MS = 30_000;

const CreateSelfSubjectRulesReview = graphql(`
  mutation CreateSelfSubjectRulesReview($object: AuthorizationK8sIoV1SelfSubjectRulesReview_Input!) {
    authorization_k8s_io {
      v1 {
        createSelfSubjectRulesReview(object: $object) {
          status {
            evaluationError
            incomplete
            resourceRules {
              apiGroups
              resources
              verbs
              resourceNames
            }
          }
        }
      }
    }
  }
`);

function parseProjectNamesFromRules(rules: (ResourceRule | null)[] | null | undefined): string[] {
  if (!Array.isArray(rules)) return [];
  const names = rules.flatMap((r) => {
    const apiGroups = r?.apiGroups ?? [];
    const resources = r?.resources ?? [];
    const verbs = r?.verbs ?? [];
    const apiGroupMatches = apiGroups.includes('core.openmcp.cloud') || apiGroups.includes('*');
    const resourceMatches = resources.includes('projects') || resources.includes('*');
    const verbMatches = verbs.includes('get') || verbs.includes('*');

    if (apiGroupMatches && resourceMatches && verbMatches) {
      return r?.resourceNames ?? [];
    }
    return [];
  });
  return Array.from(new Set(names.filter((name): name is string => Boolean(name))));
}

export function useProjectsQuery() {
  const [data, setData] = useState<string[]>([]);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [fetchMutation, { loading, error }] = useMutation(CreateSelfSubjectRulesReview);
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const hasReportedEvaluationErrorRef = useRef(false);
  const hasReportedIncompleteRef = useRef(false);

  const fetch = useCallback(async () => {
    try {
      setLocalError((previousError) => (previousError ? null : previousError));

      const res = await fetchMutation({
        variables: {
          object: {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectRulesReview',
            metadata: {
              name: 'projects-access-check',
            },
            spec: { namespace: '*' },
          },
        },
      });

      const status = res.data?.authorization_k8s_io?.v1?.createSelfSubjectRulesReview?.status;
      // These fields fire on every 30s refetch when the platform's webhook
      // authorizer can't fully resolve rules — that's a normal fallback
      // path, not a user-visible failure. Route them through telemetry so
      // Sentry still captures them with context, but the browser console
      // stays clean. Reported at most once per hook lifetime to avoid
      // spamming Sentry every refetch interval.
      if (status?.evaluationError && !hasReportedEvaluationErrorRef.current) {
        hasReportedEvaluationErrorRef.current = true;
        telemetry.report(new Error(status.evaluationError), {
          message: 'SelfSubjectRulesReview evaluationError',
        });
      }
      if (status?.incomplete && !hasReportedIncompleteRef.current) {
        hasReportedIncompleteRef.current = true;
        telemetry.report(new Error('SelfSubjectRulesReview result is incomplete'), {
          message: 'SelfSubjectRulesReview incomplete',
        });
      }

      const rules = status?.resourceRules;
      const names = parseProjectNamesFromRules(rules);
      setData(names);
      return names;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(t('ProjectsListView.fetchError'));
      console.error(err);
      setLocalError(err);
      return [];
    }
  }, [fetchMutation, t, telemetry]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetch();
    }, 0);
    const intervalId = window.setInterval(() => {
      void fetch();
    }, PROJECTS_REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetch]);

  return { data, isLoading: loading, error: localError ?? error ?? null, refetch: fetch } as const;
}
