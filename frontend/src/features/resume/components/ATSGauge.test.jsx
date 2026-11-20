import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { ATSGauge } from './ATSGauge';
import { ATSGauge as ImportedFromIndex } from '../index';
import { ATSGauge as ReExportedFromPage } from '../../../pages/ResumeAnalyzer';

describe('ATSGauge Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with default props', () => {
    const { container } = render(<ATSGauge />);
    expect(screen.getByText('ATS Score')).toBeInTheDocument();
    expect(screen.getByText('Needs Work')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('180');
    expect(svg?.getAttribute('height')).toBe('180');
  });

  it('renders excellent rating for scores 80 and above', () => {
    render(<ATSGauge score={85} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('renders good rating for scores between 60 and 79', () => {
    render(<ATSGauge score={70} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('renders fair rating for scores between 40 and 59', () => {
    render(<ATSGauge score={50} />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('renders needs work for scores below 40', () => {
    render(<ATSGauge score={30} />);
    expect(screen.getByText('Needs Work')).toBeInTheDocument();
  });

  it('animates score over time with requestAnimationFrame', () => {
    render(<ATSGauge score={90} />);
    
    // Fast-forward animation
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('respects custom size prop', () => {
    const { container } = render(<ATSGauge score={75} size={240} />);
    const root = container.querySelector('.ats-gauge');
    expect(root?.getAttribute('style')).toContain('width: 240px');
    expect(root?.getAttribute('style')).toContain('height: 240px');
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('240');
  });

  it('is exported identically from resume module index and ResumeAnalyzer', () => {
    expect(ATSGauge).toBeDefined();
    expect(ImportedFromIndex).toBe(ATSGauge);
    expect(ReExportedFromPage).toBe(ATSGauge);
  });
});
