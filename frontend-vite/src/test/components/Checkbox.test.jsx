import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Checkbox from '../../components/common/forms/Checkbox';

describe('Checkbox Component', () => {
  it('renders correctly with default props', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(checkbox).not.toBeDisabled();
    
    const label = screen.getByText('Accept terms');
    expect(label).toBeInTheDocument();
  });

  it('renders in checked state when checked prop is true', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        checked={true}
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onChange handler when clicked', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with description when provided', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        description="By accepting, you agree to our terms and conditions"
        onChange={handleChange}
      />
    );
    
    const description = screen.getByText('By accepting, you agree to our terms and conditions');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-gray-500');
  });

  it('displays error message when provided', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        error="This field is required"
        onChange={handleChange}
      />
    );
    
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
    
    // Label should also have error styling
    const label = screen.getByText('Accept terms');
    expect(label).toHaveClass('text-red-600');
    
    // Checkbox should have error border
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('border-red-500');
  });

  it('applies disabled styles when disabled prop is true', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        disabled={true}
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveClass('opacity-60');
    expect(checkbox).toHaveClass('cursor-not-allowed');
    
    const label = screen.getByText('Accept terms');
    expect(label).toHaveClass('text-gray-500');
  });

  it('does not call onChange when clicked while disabled', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        disabled={true}
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies custom className when provided', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Accept terms"
        className="mt-4 custom-class"
        onChange={handleChange}
      />
    );
    
    const container = screen.getByRole('checkbox').closest('div').parentElement;
    expect(container).toHaveClass('mt-4');
    expect(container).toHaveClass('custom-class');
  });

  it('uses provided id for checkbox and label association', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        id="custom-id"
        label="Accept terms"
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'custom-id');
    
    const label = screen.getByText('Accept terms');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('uses provided name attribute', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        name="terms"
        label="Accept terms"
        onChange={handleChange}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('name', 'terms');
  });
});