import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClusterRolesSelect } from './ClusterRolesSelect.tsx';

// jsdom does not paint UI5 web components; like TagListInput.spec we drive the custom elements'
// properties and events directly and pin the roles contract the member dialog depends on.

type MultiInputElement = HTMLElement & { value: string };

const getCustomInput = () => screen.getByTestId('custom-cluster-roles-input') as MultiInputElement;

const commit = (value: string) => {
  const input = getCustomInput();
  input.value = value;
  input.dispatchEvent(new CustomEvent('change', { bubbles: true }));
  return input;
};

describe('ClusterRolesSelect', () => {
  afterEach(cleanup);

  it('marks the built-in ClusterRoles that are selected as pressed', () => {
    render(<ClusterRolesSelect roles={['view', 'my-role']} onChange={() => {}} />);
    const pressed = (name: string) =>
      (screen.getByTestId(`cluster-role-${name}`) as HTMLElement & { pressed: boolean }).pressed;
    expect(pressed('view')).toBe(true);
    expect(pressed('cluster-admin')).toBe(false);
    expect(pressed('admin')).toBe(false);
    expect(pressed('edit')).toBe(false);
  });

  it('toggles a built-in ClusterRole on and off', () => {
    const onChange = vi.fn();
    render(<ClusterRolesSelect roles={['view']} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('cluster-role-edit'));
    expect(onChange).toHaveBeenLastCalledWith(['view', 'edit']);
    fireEvent.click(screen.getByTestId('cluster-role-view'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('renders tokens only for roles that are not built in, labelling namespaced Roles', () => {
    const { container } = render(
      <ClusterRolesSelect roles={['cluster-admin', 'my-role', 'Role/team-a/deployer']} onChange={() => {}} />,
    );
    const tokens = Array.from(container.querySelectorAll('ui5-token')) as (HTMLElement & { text: string })[];
    expect(tokens.map((token) => token.dataset.role)).toEqual(['my-role', 'Role/team-a/deployer']);
    expect(tokens[0].text).toBe('my-role');
  });

  it('adds custom ClusterRoles on commit, splitting on commas/whitespace and de-duplicating', () => {
    const onChange = vi.fn();
    render(<ClusterRolesSelect roles={['view', 'my-role']} onChange={onChange} />);
    const input = commit('my-role, crossplane-view  system:aggregate-to-view');
    expect(onChange).toHaveBeenCalledWith(['view', 'my-role', 'crossplane-view', 'system:aggregate-to-view']);
    expect(input.value).toBe('');
  });

  it('rejects an invalid name: nothing is added, the text is kept and the parent is told', () => {
    const onChange = vi.fn();
    const onInvalidInputChange = vi.fn();
    render(<ClusterRolesSelect roles={['view']} onChange={onChange} onInvalidInputChange={onInvalidInputChange} />);
    const input = commit('team-a/deployer');
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('team-a/deployer');
    expect(onInvalidInputChange).toHaveBeenLastCalledWith(true);

    commit('deployer');
    expect(onChange).toHaveBeenCalledWith(['view', 'deployer']);
    expect(onInvalidInputChange).toHaveBeenLastCalledWith(false);
  });

  it('removes the role of a deleted token', () => {
    const onChange = vi.fn();
    const { container } = render(<ClusterRolesSelect roles={['view', 'my-role', 'other-role']} onChange={onChange} />);
    const token = container.querySelector('ui5-token[data-role="my-role"]');
    getCustomInput().dispatchEvent(new CustomEvent('token-delete', { bubbles: true, detail: { tokens: [token] } }));
    expect(onChange).toHaveBeenCalledWith(['view', 'other-role']);
  });

  it('shows the error message passed by the form', () => {
    render(<ClusterRolesSelect roles={[]} errorMessage="Select at least one role." onChange={() => {}} />);
    expect(screen.queryAllByText('Select at least one role.')).toHaveLength(1);
  });
});
