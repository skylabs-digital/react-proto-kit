import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlAccordion } from '../useUrlAccordion';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(BrowserRouter, null, children);

describe('useUrlAccordion - Single Mode', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should return undefined when nothing is expanded', () => {
    const { result } = renderHook(() => useUrlAccordion('section'), { wrapper });
    expect(result.current[0]).toBeUndefined();
  });

  it('should expand section', () => {
    const { result } = renderHook(() => useUrlAccordion('section'), { wrapper });

    act(() => {
      result.current[1].expand('section1');
    });

    expect(result.current[0]).toBe('section1');
    expect(window.location.search).toContain('section=section1');
  });

  it('should collapse all sections', () => {
    window.history.pushState({}, '', '/?section=section1');
    const { result } = renderHook(() => useUrlAccordion('section'), { wrapper });

    act(() => {
      result.current[1].collapse();
    });

    expect(result.current[0]).toBeUndefined();
    expect(window.location.search).not.toContain('section');
  });

  it('should toggle section', () => {
    const { result } = renderHook(() => useUrlAccordion('section'), { wrapper });

    // Toggle to expand
    act(() => {
      result.current[1].toggle('section1');
    });
    expect(result.current[0]).toBe('section1');

    // Toggle to collapse
    act(() => {
      result.current[1].toggle('section1');
    });
    expect(result.current[0]).toBeUndefined();
  });
});

describe('useUrlAccordion - Multiple Mode', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should return undefined when nothing is expanded', () => {
    const { result } = renderHook(() => useUrlAccordion('sections', { multiple: true }), {
      wrapper,
    });
    expect(result.current[0]).toBeUndefined();
  });

  it('should expand multiple sections', () => {
    const { result } = renderHook(() => useUrlAccordion('sections', { multiple: true }), {
      wrapper,
    });

    act(() => {
      result.current[1].expand('section1');
    });

    expect(result.current[0]).toEqual(['section1']);

    act(() => {
      result.current[1].expand('section2');
    });

    expect(result.current[0]).toEqual(['section1', 'section2']);
  });

  it('should collapse specific section', () => {
    window.history.pushState({}, '', '/?sections=section1,section2,section3');
    const { result } = renderHook(() => useUrlAccordion('sections', { multiple: true }), {
      wrapper,
    });

    act(() => {
      result.current[1].collapse('section2');
    });

    expect(result.current[0]).toEqual(['section1', 'section3']);
  });

  it('should expand all sections', () => {
    const { result } = renderHook(() => useUrlAccordion('sections', { multiple: true }), {
      wrapper,
    });

    act(() => {
      result.current[1].expandAll(['s1', 's2', 's3']);
    });

    expect(result.current[0]).toEqual(['s1', 's2', 's3']);
  });

  it('should collapse all sections', () => {
    window.history.pushState({}, '', '/?sections=s1,s2,s3');
    const { result } = renderHook(() => useUrlAccordion('sections', { multiple: true }), {
      wrapper,
    });

    act(() => {
      result.current[1].collapseAll();
    });

    expect(result.current[0]).toBeUndefined();
  });

  it('should toggle section in multiple mode', () => {
    const { result } = renderHook(() => useUrlAccordion('sections', { multiple: true }), {
      wrapper,
    });

    // Toggle to expand
    act(() => {
      result.current[1].toggle('section1');
    });
    expect(result.current[0]).toEqual(['section1']);

    // Toggle another
    act(() => {
      result.current[1].toggle('section2');
    });
    expect(result.current[0]).toEqual(['section1', 'section2']);

    // Toggle to collapse first
    act(() => {
      result.current[1].toggle('section1');
    });
    expect(result.current[0]).toEqual(['section2']);
  });
});
