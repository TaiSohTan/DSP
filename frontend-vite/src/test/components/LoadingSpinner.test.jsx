import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import LoadingSpinner from '../../components/common/feedback/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders correctly with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8 w-8'); // medium size
    expect(spinner).toHaveClass('text-primary-600'); // primary color
  });

  it('renders with different sizes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-4 w-4');
    
    rerender(<LoadingSpinner size="medium" />);
    spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-8 w-8');
    
    rerender(<LoadingSpinner size="large" />);
    spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-12 w-12');
  });

  it('renders with different colors correctly', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />);
    let spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('text-primary-600');
    
    rerender(<LoadingSpinner color="white" />);
    spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('text-white');
    
    rerender(<LoadingSpinner color="gray" />);
    spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('text-gray-600');
  });

  it('applies custom className when provided', () => {
    render(<LoadingSpinner className="test-class" />);
    
    const container = document.querySelector('.flex');
    expect(container).toHaveClass('test-class');
  });

  it('contains both circle and path elements for the spinner animation', () => {
    render(<LoadingSpinner />);
    
    const svg = document.querySelector('svg');
    expect(svg.querySelector('circle')).toBeInTheDocument();
    expect(svg.querySelector('path')).toBeInTheDocument();
  });

  it('has animate-spin class for animation', () => {
    render(<LoadingSpinner />);
    
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
  });
});