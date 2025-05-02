import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TextInput from '../../components/common/forms/TextInput';

describe('TextInput Component', () => {
  it('renders correctly with default props', () => {
    const handleChange = vi.fn();
    render(<TextInput label="Username" value="" onChange={handleChange} />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Username')).not.toBeRequired();
  });

  it('handles value change correctly', () => {
    const handleChange = vi.fn();
    render(<TextInput label="Username" value="" onChange={handleChange} />);
    
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders different input types correctly', () => {
    const handleChange = vi.fn();
    const { rerender } = render(<TextInput label="Password" type="password" value="" onChange={handleChange} />);
    
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    
    rerender(<TextInput label="Email" type="email" value="" onChange={handleChange} />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    
    rerender(<TextInput label="Number" type="number" value="" onChange={handleChange} />);
    expect(screen.getByLabelText('Number')).toHaveAttribute('type', 'number');
  });

  it('displays error message when provided', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Username" 
      value="" 
      onChange={handleChange} 
      error="This field is required" 
    />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('displays helper text when provided and no error', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Username" 
      value="" 
      onChange={handleChange} 
      helperText="Enter your username" 
    />);
    
    expect(screen.getByText('Enter your username')).toBeInTheDocument();
    expect(screen.getByText('Enter your username')).toHaveClass('text-gray-600');
  });

  it('prioritizes error over helper text', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Username" 
      value="" 
      onChange={handleChange} 
      error="This field is required"
      helperText="Enter your username" 
    />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your username')).not.toBeInTheDocument();
  });

  it('applies disabled style and attributes when disabled', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Username" 
      value="" 
      onChange={handleChange} 
      disabled={true}
    />);
    
    const input = screen.getByLabelText('Username');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('bg-gray-100');
    expect(input).toHaveClass('cursor-not-allowed');
  });

  it('renders with icon when provided', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Search" 
      value="" 
      onChange={handleChange} 
      icon={<span data-testid="search-icon">🔍</span>}
    />);
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    const input = screen.getByLabelText('Search');
    expect(input).toHaveClass('pl-10'); // Check for left padding when icon is present
  });

  it('shows required marker when required is true', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Username" 
      value="" 
      onChange={handleChange} 
      required={true}
    />);
    
    // Find the input element first
    const input = screen.getByLabelText(/username/i);
    expect(input).toHaveAttribute('required');
    
    // Find the asterisk within the label
    const asterisk = screen.getByText('*');
    expect(asterisk).toHaveClass('text-red-600');
  });

  it('applies full width styling when fullWidth is true', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Username" 
      value="" 
      onChange={handleChange} 
      fullWidth={true}
    />);
    
    expect(screen.getByLabelText('Username')).toHaveClass('w-full');
  });

  it('applies custom className to container', () => {
    const handleChange = vi.fn();
    render(<TextInput 
      label="Username" 
      value="" 
      onChange={handleChange} 
      className="mt-8"
    />);
    
    const container = screen.getByLabelText('Username').closest('div').parentElement;
    expect(container).toHaveClass('mb-4 mt-8');
  });
});