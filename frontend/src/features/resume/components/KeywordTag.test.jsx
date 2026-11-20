import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { KeywordTag } from './KeywordTag';
import { KeywordTag as ImportedFromIndex } from '../index';
import { KeywordTag as ReExportedFromPage } from '../../../pages/ResumeAnalyzer';

describe('KeywordTag Component', () => {
  it('renders technical tag by default', () => {
    render(<KeywordTag label="React.js" />);
    const tag = screen.getByTestId('keyword-tag');
    expect(tag).toHaveTextContent('React.js');
    expect(tag.getAttribute('data-type')).toBe('technical');
    expect(screen.queryByTestId('keyword-tag-missing-icon')).not.toBeInTheDocument();
  });

  it('renders soft skill tag', () => {
    render(<KeywordTag label="Communication" type="soft" />);
    const tag = screen.getByTestId('keyword-tag');
    expect(tag).toHaveTextContent('Communication');
    expect(tag.getAttribute('data-type')).toBe('soft');
    expect(screen.queryByTestId('keyword-tag-missing-icon')).not.toBeInTheDocument();
  });

  it('renders missing keyword tag with warning AlertTriangle icon', () => {
    render(<KeywordTag label="Kubernetes" type="missing" />);
    const tag = screen.getByTestId('keyword-tag');
    expect(tag).toHaveTextContent('Kubernetes');
    expect(tag.getAttribute('data-type')).toBe('missing');
    expect(screen.getByTestId('keyword-tag-missing-icon')).toBeInTheDocument();
  });

  it('applies custom className and custom style', () => {
    render(
      <KeywordTag
        label="TypeScript"
        type="technical"
        className="custom-class"
        style={{ margin: '8px' }}
      />
    );
    const tag = screen.getByTestId('keyword-tag');
    expect(tag.className).toContain('custom-class');
    expect(tag.getAttribute('style')).toContain('margin: 8px');
  });

  it('is exported identically from resume module index and ResumeAnalyzer', () => {
    expect(KeywordTag).toBeDefined();
    expect(ImportedFromIndex).toBe(KeywordTag);
    expect(ReExportedFromPage).toBe(KeywordTag);
  });
});
