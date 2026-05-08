import { describe, it, expect } from 'vitest';
import {
  extractTrackingData,
  extractDtName,
  trackingProps,
  dtNameProp,
  fullTrackingProps,
} from './trackingHelpers';

describe('trackingHelpers', () => {
  describe('extractTrackingData', () => {
    it('should extract event name and properties from element', () => {
      const div = document.createElement('div');
      div.setAttribute('data-track-event', 'Button Clicked');
      div.setAttribute('data-track-category', 'Control Planes');
      div.setAttribute('data-track-action', 'create');
      div.setAttribute('data-track-label', 'flux-template');
      div.setAttribute('data-track-value', '42');

      const result = extractTrackingData(div);

      expect(result.eventName).toBe('Button Clicked');
      expect(result.properties).toEqual({
        category: 'Control Planes',
        action: 'create',
        label: 'flux-template',
        value: 42,
      });
    });

    it('should handle missing attributes', () => {
      const div = document.createElement('div');

      const result = extractTrackingData(div);

      expect(result.eventName).toBeUndefined();
      expect(result.properties).toEqual({});
    });

    it('should handle partial attributes', () => {
      const div = document.createElement('div');
      div.setAttribute('data-track-event', 'Test Event');
      div.setAttribute('data-track-category', 'TestCategory');

      const result = extractTrackingData(div);

      expect(result.eventName).toBe('Test Event');
      expect(result.properties).toEqual({
        category: 'TestCategory',
      });
    });
  });

  describe('extractDtName', () => {
    it('should extract dtname attribute', () => {
      const div = document.createElement('div');
      div.setAttribute('data-dtname', 'Create MCP');

      expect(extractDtName(div)).toBe('Create MCP');
    });

    it('should return null when attribute is missing', () => {
      const div = document.createElement('div');

      expect(extractDtName(div)).toBeNull();
    });
  });

  describe('trackingProps', () => {
    it('should create tracking props object', () => {
      const props = trackingProps('Button Clicked', {
        category: 'Control Planes',
        action: 'create',
        label: 'test',
        value: 123,
      });

      expect(props).toEqual({
        'data-track-event': 'Button Clicked',
        'data-track-category': 'Control Planes',
        'data-track-action': 'create',
        'data-track-label': 'test',
        'data-track-value': '123',
      });
    });

    it('should handle minimal props', () => {
      const props = trackingProps('Simple Event');

      expect(props).toEqual({
        'data-track-event': 'Simple Event',
      });
    });

    it('should omit undefined properties', () => {
      const props = trackingProps('Test Event', {
        category: 'Test',
        action: undefined,
      });

      expect(props).toEqual({
        'data-track-event': 'Test Event',
        'data-track-category': 'Test',
      });
    });
  });

  describe('dtNameProp', () => {
    it('should create dtname prop object', () => {
      const props = dtNameProp('Create MCP');

      expect(props).toEqual({
        'data-dtname': 'Create MCP',
      });
    });
  });

  describe('fullTrackingProps', () => {
    it('should combine tracking and dtname props', () => {
      const props = fullTrackingProps('Button Clicked', {
        category: 'Control Planes',
      });

      expect(props).toEqual({
        'data-track-event': 'Button Clicked',
        'data-track-category': 'Control Planes',
        'data-dtname': 'Button Clicked',
      });
    });

    it('should work with minimal props', () => {
      const props = fullTrackingProps('Simple Event');

      expect(props).toEqual({
        'data-track-event': 'Simple Event',
        'data-dtname': 'Simple Event',
      });
    });
  });
});
