import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemberAccessSelect } from './MemberAccessSelect.tsx';

// jsdom does not paint UI5 web components; like TagListInput.spec we drive the custom elements'
// properties and events directly and pin the roles contract the member dialog depends on.

type Checkable = HTMLElement & { checked: boolean };
type MultiInputElement = HTMLElement & { value: string };

const isChecked = (role: string) => (screen.getByTestId(`access-${role}`) as Checkable).checked;
const toggle = (role: string) =>
  screen.getByTestId(`access-${role}`).dispatchEvent(new CustomEvent('change', { bubbles: true }));
const getCustomInput = () => screen.getByTestId('custom-roles-input') as MultiInputElement;
const commit = (value: string) => {
  const input = getCustomInput();
  input.value = value;
  input.dispatchEvent(new CustomEvent('change', { bubbles: true }));
  return input;
};
const tokenRoles = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('ui5-token')).map((token) => (token as HTMLElement).dataset.role);

describe('MemberAccessSelect', () => {
  afterEach(cleanup);

  it('ticks exactly the standard roles the member has, in any combination', () => {
    render(<MemberAccessSelect roles={['admin', 'view', 'my-role']} onChange={() => {}} />);
    expect(isChecked('cluster-admin')).toBe(false);
    expect(isChecked('admin')).toBe(true);
    expect(isChecked('view')).toBe(true);
  });

  it('adds and removes a standard role without touching the other roles', () => {
    const onChange = vi.fn();
    render(<MemberAccessSelect roles={['view', 'my-role']} onChange={onChange} />);
    toggle('admin');
    expect(onChange).toHaveBeenLastCalledWith(['view', 'my-role', 'admin']);
    toggle('view');
    expect(onChange).toHaveBeenLastCalledWith(['my-role']);
  });

  it('notes a role that a broader selected role already covers, without removing it', () => {
    render(<MemberAccessSelect roles={['admin', 'view']} onChange={() => {}} />);
    expect(screen.queryAllByTestId('access-view-covered')).toHaveLength(1);
    expect(screen.queryAllByTestId('access-admin-covered')).toHaveLength(0);
    cleanup();

    render(<MemberAccessSelect roles={['cluster-admin', 'admin', 'my-role']} onChange={() => {}} />);
    expect(screen.queryAllByTestId('access-admin-covered')).toHaveLength(1);
    expect(screen.queryAllByTestId('access-custom-covered')).toHaveLength(1);
    expect(screen.queryAllByTestId('access-cluster-admin-covered')).toHaveLength(0);
  });

  it('shows only non-standard roles as tokens', () => {
    const { container } = render(
      <MemberAccessSelect roles={['view', 'my-role', 'Role/team-a/deployer']} onChange={() => {}} />,
    );
    expect(tokenRoles(container)).toEqual(['my-role', 'Role/team-a/deployer']);
  });

  it('accepts any valid role name, whether or not it is known to exist', () => {
    const onChange = vi.fn();
    render(
      <MemberAccessSelect
        roles={['view']}
        availableCustomRoles={['crossplane-view']}
        customRolesState="ready"
        onChange={onChange}
      />,
    );
    const input = commit('crossplane-view, not-created-yet');
    expect(onChange).toHaveBeenCalledWith(['view', 'crossplane-view', 'not-created-yet']);
    expect(input.value).toBe('');
  });

  it('rejects an invalid name and keeps the text for correction', () => {
    const onChange = vi.fn();
    render(<MemberAccessSelect roles={['view']} onChange={onChange} />);
    const input = commit('team-a/deployer');
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('team-a/deployer');
  });

  it('removes the role of a deleted token and keeps standard roles', () => {
    const onChange = vi.fn();
    const { container } = render(<MemberAccessSelect roles={['view', 'my-role', 'other']} onChange={onChange} />);
    const token = container.querySelector('ui5-token[data-role="my-role"]');
    getCustomInput().dispatchEvent(new CustomEvent('token-delete', { bubbles: true, detail: { tokens: [token] } }));
    expect(onChange).toHaveBeenCalledWith(['view', 'other']);
  });

  it('flags roles as not found only once the existing roles are known', () => {
    const props = { roles: ['missing-role', 'crossplane-view'], availableCustomRoles: ['crossplane-view'] };
    render(<MemberAccessSelect {...props} customRolesState="unknown" onChange={() => {}} />);
    expect(screen.queryAllByTestId('custom-roles-not-found')).toHaveLength(0);
    cleanup();

    render(<MemberAccessSelect {...props} customRolesState="ready" onChange={() => {}} />);
    expect(screen.queryAllByTestId('custom-roles-not-found')).toHaveLength(1);
  });

  it('offers create and upload only when the caller can handle them', () => {
    render(<MemberAccessSelect roles={['view']} onChange={() => {}} />);
    expect(screen.queryAllByTestId('create-custom-role')).toHaveLength(0);
    cleanup();

    const onCreateRole = vi.fn();
    render(<MemberAccessSelect roles={['view']} onChange={() => {}} onCreateRole={onCreateRole} />);
    fireEvent.click(screen.getByTestId('create-custom-role'));
    expect(onCreateRole).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByTestId('upload-custom-role')).toHaveLength(0);
  });
});
