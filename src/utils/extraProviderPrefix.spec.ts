import { describe, it, expect } from 'vitest';
import { resolveExtraProviderUsernamePrefix, resolveExtraProviderGroupsPrefix } from './extraProviderPrefix';

describe('resolveExtraProviderUsernamePrefix', () => {
  it('defaults to "<name>:" when usernamePrefix is unset', () => {
    expect(resolveExtraProviderUsernamePrefix({ name: 'custom' })).to.equal('custom:');
  });

  it('defaults to "<name>:" when usernamePrefix is null', () => {
    expect(resolveExtraProviderUsernamePrefix({ name: 'custom', usernamePrefix: null })).to.equal('custom:');
  });

  it('returns an empty string when usernamePrefix is explicitly disabled', () => {
    expect(resolveExtraProviderUsernamePrefix({ name: 'custom', usernamePrefix: '' })).to.equal('');
  });

  it('returns the explicit custom value verbatim', () => {
    expect(resolveExtraProviderUsernamePrefix({ name: 'custom', usernamePrefix: 'other-' })).to.equal('other-');
  });
});

describe('resolveExtraProviderGroupsPrefix', () => {
  it('defaults to "<name>:" when groupsPrefix is unset', () => {
    expect(resolveExtraProviderGroupsPrefix({ name: 'custom' })).to.equal('custom:');
  });

  it('defaults to "<name>:" when groupsPrefix is null', () => {
    expect(resolveExtraProviderGroupsPrefix({ name: 'custom', groupsPrefix: null })).to.equal('custom:');
  });

  it('returns an empty string when groupsPrefix is explicitly disabled', () => {
    expect(resolveExtraProviderGroupsPrefix({ name: 'custom', groupsPrefix: '' })).to.equal('');
  });

  it('returns the explicit custom value verbatim', () => {
    expect(resolveExtraProviderGroupsPrefix({ name: 'custom', groupsPrefix: 'other-' })).to.equal('other-');
  });
});
