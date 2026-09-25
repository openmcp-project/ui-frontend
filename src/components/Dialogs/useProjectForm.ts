import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createProjectWorkspaceSchema } from '../../lib/api/validations/schemas.ts';
import { CreateDialogProps } from './CreateWorkspaceDialogContainer.tsx';

export function useProjectForm(defaultValues: CreateDialogProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => createProjectWorkspaceSchema(t), [t]);
  return useForm<CreateDialogProps>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues });
}
