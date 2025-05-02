import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IconButton from '../../components/common/buttons/IconButton';

describe('IconButton Component', () => {
  const mockIcon = <svg data-testid="test-icon" />;

  it('renders correctly with default props', () => {
    render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Test button"
      />
    );
    
    const button = screen.getByRole('button', { name: 'Test button' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('text-gray-700');
    expect(button).toHaveClass('p-2'); // medium size
    
    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-5 w-5'); // medium icon size
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Test button"
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies different size classes correctly', () => {
    const { rerender } = render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Small button"
        size="small"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('p-1');
    expect(screen.getByTestId('test-icon')).toHaveClass('h-4 w-4');
    
    rerender(
      <IconButton
        icon={mockIcon}
        ariaLabel="Medium button"
        size="medium"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('p-2');
    expect(screen.getByTestId('test-icon')).toHaveClass('h-5 w-5');
    
    rerender(
      <IconButton
        icon={mockIcon}
        ariaLabel="Large button"
        size="large"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('p-3');
    expect(screen.getByTestId('test-icon')).toHaveClass('h-6 w-6');
  });

  it('applies different variant classes correctly', () => {
    const { rerender } = render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Default button"
        variant="default"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('text-gray-700');
    
    rerender(
      <IconButton
        icon={mockIcon}
        ariaLabel="Primary button"
        variant="primary"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('text-primary-600');
    
    rerender(
      <IconButton
        icon={mockIcon}
        ariaLabel="Danger button"
        variant="danger"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('text-red-600');
  });

  it('applies disabled styles when disabled prop is true', () => {
    render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Disabled button"
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  it('does not call onClick when clicked while disabled', () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Disabled button"
        disabled={true}
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className when provided', () => {
    render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Custom button"
        className="my-custom-class"
      />
    );
    
    expect(screen.getByRole('button')).toHaveClass('my-custom-class');
  });

  it('preserves icon className when cloning icon', () => {
    const iconWithClass = <svg data-testid="test-icon" className="original-class" />;
    
    render(
      <IconButton
        icon={iconWithClass}
        ariaLabel="Button with custom icon"
      />
    );
    
    const icon = screen.getByTestId('test-icon');
    expect(icon).toHaveClass('original-class');
    expect(icon).toHaveClass('h-5 w-5'); // Still has the added size class
  });

  it('passes additional props to button element', () => {
    render(
      <IconButton
        icon={mockIcon}
        ariaLabel="Test button"
        data-custom="test-value"
        id="custom-id"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-custom', 'test-value');
    expect(button).toHaveAttribute('id', 'custom-id');
  });
});