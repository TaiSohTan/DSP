import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../components/common/layout/Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <p>Test content</p>
      </Card>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Card title="Card Title">
        <p>Test content</p>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toHaveClass('text-xl font-semibold');
  });

  it('renders subtitle when provided', () => {
    render(
      <Card subtitle="Card Subtitle">
        <p>Test content</p>
      </Card>
    );
    
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toHaveClass('mt-1 text-sm text-gray-600');
  });

  it('renders both title and subtitle when provided', () => {
    render(
      <Card title="Card Title" subtitle="Card Subtitle">
        <p>Test content</p>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Card footer={<button>Submit</button>}>
        <p>Test content</p>
      </Card>
    );
    
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('includes border-t class in the footer when rendered', () => {
    render(
      <Card footer={<button>Submit</button>}>
        <p>Test content</p>
      </Card>
    );
    
    const footerElement = screen.getByRole('button', { name: 'Submit' }).closest('div');
    expect(footerElement).toHaveClass('border-t border-gray-200');
  });

  it('applies custom className when provided', () => {
    render(
      <Card className="test-class">
        <p>Test content</p>
      </Card>
    );
    
    const cardElement = screen.getByText('Test content').closest('.bg-white');
    expect(cardElement).toHaveClass('test-class');
  });

  it('does not render title section when no title or subtitle provided', () => {
    render(
      <Card>
        <p>Test content</p>
      </Card>
    );
    
    const titleElements = document.querySelectorAll('h2');
    expect(titleElements.length).toBe(0);
  });

  it('has expected base styling classes', () => {
    render(
      <Card>
        <p>Test content</p>
      </Card>
    );
    
    const cardElement = screen.getByText('Test content').closest('div.bg-white');
    expect(cardElement).toHaveClass('bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden');
  });
});