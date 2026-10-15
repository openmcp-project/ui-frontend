export type ServiceMutationAction = 'create' | 'update' | 'delete' | 'skip';

export function resolveServiceMutationAction(
  isEditMode: boolean,
  wasInstalled: boolean,
  isSelected: boolean,
): ServiceMutationAction {
  if (isSelected) return isEditMode && wasInstalled ? 'update' : 'create';
  if (isEditMode && wasInstalled) return 'delete';
  return 'skip';
}
