import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../components/common/layout/Badge';

describe('Badge Component', () => {
  it('renders correctly with default props', () => {
    render(<Badge>Default Badge</Badge>);
    
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100 text-gray-800'); // default variant
    expect(badge).toHaveClass('text-sm px-2.5 py-0.5'); // medium size
    expect(badge).toHaveClass('rounded'); // default rounded style
  });

  it('renders with different variants correctly', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary')).toHaveClass('bg-primary-100 text-primary-800');
    
    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100 text-green-800');
    
    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100 text-yellow-800');
    
    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100 text-red-800');
    
    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-100 text-blue-800');
  });

  it('applies different size classes correctly', () => {
    const { rerender } = render(<Badge size="small">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('text-xs px-2 py-0.5');
    
    rerender(<Badge size="medium">Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('text-sm px-2.5 py-0.5');
    
    rerender(<Badge size="large">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('text-base px-3 py-1');
  });

  it('applies rounded-full class when rounded prop is true', () => {
    render(<Badge rounded={true}>Rounded</Badge>);
    expect(screen.getByText('Rounded')).toHaveClass('rounded-full');
    expect(screen.getByText('Rounded')).not.toHaveClass('rounded');
  });

  it('applies custom className when provided', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('passes additional props to the span element', () => {
    render(<Badge data-testid="test-badge">Test Badge</Badge>);
    expect(screen.getByTestId('test-badge')).toBeInTheDocument();
    expect(screen.getByTestId('test-badge').textContent).toBe('Test Badge');
  });

  it('renders children correctly', () => {
    render(
      <Badge>
        <span data-testid="icon">🔔</span>
        <span>Notification</span>
      </Badge>
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Notification')).toBeInTheDocument();
  });
});