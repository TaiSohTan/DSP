import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Alert from '../../components/common/feedback/Alert';

describe('Alert Component', () => {
  it('renders correctly with default props', () => {
    render(<Alert message="This is an info alert" />);
    
    expect(screen.getByText('This is an info alert')).toBeInTheDocument();
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('bg-blue-50 border-l-4 border-blue-500');
  });

  it('renders with different types correctly', () => {
    const { rerender } = render(<Alert type="success" message="Success message" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50 border-l-4 border-green-500');
    
    rerender(<Alert type="warning" message="Warning message" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50 border-l-4 border-yellow-500');
    
    rerender(<Alert type="error" message="Error message" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50 border-l-4 border-red-500');
  });

  it('displays title when provided', () => {
    render(<Alert title="Important Notice" message="Alert content" />);
    
    expect(screen.getByText('Important Notice')).toBeInTheDocument();
    expect(screen.getByText('Alert content')).toBeInTheDocument();
  });

  it('shows dismiss button when dismissible is true', () => {
    render(<Alert message="Dismissible alert" dismissible={true} onDismiss={() => {}} />);
    
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = vi.fn();
    render(<Alert message="Dismissible alert" dismissible={true} onDismiss={handleDismiss} />);
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', () => {
    render(<Alert message="Custom styled alert" className="custom-class" />);
    
    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });

  it('does not render dismiss button when dismissible is false', () => {
    render(<Alert message="Non-dismissible alert" dismissible={false} />);
    
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('does not render title section when title is not provided', () => {
    render(<Alert message="Alert with no title" />);
    
    // Should only have one text element (the message)
    const alertElement = screen.getByRole('alert');
    expect(alertElement.querySelector('.font-medium')).not.toBeInTheDocument();
  });
});