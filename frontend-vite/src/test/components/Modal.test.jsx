import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/common/feedback/Modal';

// Mock createPortal to make it work in tests
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

describe('Modal Component', () => {
  let onClose;

  beforeEach(() => {
    onClose = vi.fn();
    // Create a div where the portal would normally be rendered
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);

    // Mock body style for overflow testing
    Object.defineProperty(document.body.style, 'overflow', {
      configurable: true,
      value: '',
      writable: true
    });
  });

  afterEach(() => {
    // Cleanup
    document.querySelector('#portal-root')?.remove();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal
        isOpen={false}
        onClose={onClose}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked if closeOnOverlayClick is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        closeOnOverlayClick={true}
      >
        <p>Modal content</p>
      </Modal>
    );
    
    // Find the overlay (the background div)
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when overlay is clicked if closeOnOverlayClick is false', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        closeOnOverlayClick={false}
      >
        <p>Modal content</p>
      </Modal>
    );
    
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when clicking inside the modal content', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        closeOnOverlayClick={true}
      >
        <p>Modal content</p>
      </Modal>
    );
    
    fireEvent.click(screen.getByText('Modal content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies different size classes correctly', () => {
    const { rerender } = render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        size="small"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    let modalContent = screen.getByRole('document');
    expect(modalContent).toHaveClass('max-w-sm');
    
    rerender(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        size="large"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    modalContent = screen.getByRole('document');
    expect(modalContent).toHaveClass('max-w-3xl');
  });

  it('renders footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        footer={<button>Submit</button>}
      >
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    const footerElement = screen.getByRole('button', { name: 'Submit' }).parentElement;
    expect(footerElement).toHaveClass('border-t border-gray-200');
  });

  it('does not show close button when showCloseButton is false', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        showCloseButton={false}
      >
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Testing that body style changes to prevent scrolling
  it('sets body overflow to hidden when open', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
      >
        <p>Modal content</p>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
  });
});