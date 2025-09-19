import { Condition } from '../../lib/shared/types.ts';
import { Conditions, ConditionsProps } from './Conditions.tsx';
import { Button, ObjectStatus, Popover } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';

export interface ConditionsButtonProps {
  conditions: Condition[];
}

export function ConditionsButton({ conditions }: ConditionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();

  const errors = conditions.filter((condition) => condition.status !== 'True');

  const state = errors.length > 0 ? 'Negative' : 'Positive';

  return (
    <>
      <ObjectStatus id={id} interactive state={state} showDefaultIcon onClick={() => setIsOpen(true)}>
        {state === 'Negative' ? (errors.length > 1 ? `Errors (${errors.length})` : 'Error') : 'OK'}
      </ObjectStatus>
      <Popover placement="End" opener={id} open={isOpen} headerText="Conditions" onClose={() => setIsOpen(false)}>
        <Conditions conditions={conditions} />
      </Popover>
    </>
  );
}
