import { describe, it, expect, beforeEach } from 'vitest';
import { getRememberedProject, setRememberedProject, clearRememberedProject } from './rememberedProject';

describe('rememberedProject', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getRememberedProject()).toBeNull();
  });

  it('stores and retrieves a project name', () => {
    setRememberedProject('my-project');
    expect(getRememberedProject()).toBe('my-project');
  });

  it('overwrites the previously stored project', () => {
    setRememberedProject('first-project');
    setRememberedProject('second-project');
    expect(getRememberedProject()).toBe('second-project');
  });

  it('returns null after clearing', () => {
    setRememberedProject('my-project');
    clearRememberedProject();
    expect(getRememberedProject()).toBeNull();
  });

  it('clearing when nothing is stored does not throw', () => {
    expect(() => clearRememberedProject()).not.toThrow();
  });
});
