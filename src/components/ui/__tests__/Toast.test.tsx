import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Toast } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the message text', () => {
    const { getByText } = render(
      <Toast id="1" type="error" message="Something went wrong" onDismiss={jest.fn()} />
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders a dismiss button with the correct accessibility label', () => {
    const { getByLabelText } = render(
      <Toast id="1" type="success" message="Done!" onDismiss={jest.fn()} />
    );
    expect(getByLabelText('Dismiss notification')).toBeTruthy();
  });

  it('renders a close icon inside the dismiss button', () => {
    const { getByTestId } = render(
      <Toast id="1" type="error" message="Error" onDismiss={jest.fn()} />
    );
    expect(getByTestId('icon-close')).toBeTruthy();
  });

  it('calls onDismiss with the correct id when dismiss button is pressed', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <Toast id="toast-42" type="info" message="Info message" onDismiss={onDismiss} />
    );

    fireEvent.press(getByLabelText('Dismiss notification'));

    expect(onDismiss).toHaveBeenCalledWith('toast-42');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('limits message text to 4 lines', () => {
    const { getByText } = render(
      <Toast id="1" type="warning" message="A long multi-line message" onDismiss={jest.fn()} />
    );
    expect(getByText('A long multi-line message').props.numberOfLines).toBe(4);
  });

  describe('auto-dismiss', () => {
    it('auto-dismisses after the default duration of 3500ms', () => {
      const onDismiss = jest.fn();
      render(<Toast id="auto" type="success" message="Hello" onDismiss={onDismiss} />);

      expect(onDismiss).not.toHaveBeenCalled();

      act(() => { jest.advanceTimersByTime(3500); });

      expect(onDismiss).toHaveBeenCalledWith('auto');
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not dismiss before the default duration elapses', () => {
      const onDismiss = jest.fn();
      render(<Toast id="early" type="error" message="Error" onDismiss={onDismiss} />);

      act(() => { jest.advanceTimersByTime(3499); });

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('auto-dismisses after a custom duration', () => {
      const onDismiss = jest.fn();
      render(
        <Toast id="custom" type="warning" message="Warning" onDismiss={onDismiss} duration={2000} />
      );

      act(() => { jest.advanceTimersByTime(1999); });
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => { jest.advanceTimersByTime(1); });
      expect(onDismiss).toHaveBeenCalledWith('custom');
    });

    it('does not dismiss before a custom duration elapses', () => {
      const onDismiss = jest.fn();
      render(
        <Toast id="c2" type="info" message="Info" onDismiss={onDismiss} duration={5000} />
      );

      act(() => { jest.advanceTimersByTime(4999); });
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('type variants — icons', () => {
    it('renders the alert-circle icon for the error type', () => {
      const { getByTestId } = render(
        <Toast id="1" type="error" message="Error!" onDismiss={jest.fn()} />
      );
      expect(getByTestId('icon-alert-circle')).toBeTruthy();
    });

    it('renders the checkmark-circle icon for the success type', () => {
      const { getByTestId } = render(
        <Toast id="1" type="success" message="Success!" onDismiss={jest.fn()} />
      );
      expect(getByTestId('icon-checkmark-circle')).toBeTruthy();
    });

    it('renders the warning icon for the warning type', () => {
      const { getByTestId } = render(
        <Toast id="1" type="warning" message="Warning!" onDismiss={jest.fn()} />
      );
      expect(getByTestId('icon-warning')).toBeTruthy();
    });

    it('renders the information-circle icon for the info type', () => {
      const { getByTestId } = render(
        <Toast id="1" type="info" message="Info!" onDismiss={jest.fn()} />
      );
      expect(getByTestId('icon-information-circle')).toBeTruthy();
    });

    it('renders all 4 types without throwing', () => {
      const types = ['error', 'success', 'warning', 'info'] as const;
      for (const type of types) {
        expect(() =>
          render(<Toast id="t" type={type} message="Test" onDismiss={jest.fn()} />)
        ).not.toThrow();
      }
    });
  });

  describe('type variants — background colors', () => {
    it('applies the error background color', () => {
      const { toJSON } = render(
        <Toast id="1" type="error" message="Error" onDismiss={jest.fn()} />
      );
      const tree = toJSON() as any;
      // The root Animated.View carries backgroundColor in its style
      const containerStyle = Array.isArray(tree.props.style)
        ? Object.assign({}, ...tree.props.style)
        : tree.props.style;
      expect(containerStyle.backgroundColor).toBe('#FF4757');
    });

    it('applies the success background color', () => {
      const { toJSON } = render(
        <Toast id="1" type="success" message="Success" onDismiss={jest.fn()} />
      );
      const tree = toJSON() as any;
      const containerStyle = Array.isArray(tree.props.style)
        ? Object.assign({}, ...tree.props.style)
        : tree.props.style;
      expect(containerStyle.backgroundColor).toBe('#2DD881');
    });

    it('applies the warning background color', () => {
      const { toJSON } = render(
        <Toast id="1" type="warning" message="Warning" onDismiss={jest.fn()} />
      );
      const tree = toJSON() as any;
      const containerStyle = Array.isArray(tree.props.style)
        ? Object.assign({}, ...tree.props.style)
        : tree.props.style;
      expect(containerStyle.backgroundColor).toBe('#FFB800');
    });

    it('applies the info background color', () => {
      const { toJSON } = render(
        <Toast id="1" type="info" message="Info" onDismiss={jest.fn()} />
      );
      const tree = toJSON() as any;
      const containerStyle = Array.isArray(tree.props.style)
        ? Object.assign({}, ...tree.props.style)
        : tree.props.style;
      expect(containerStyle.backgroundColor).toBe('#00D4FF');
    });
  });
});
