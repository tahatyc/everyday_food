import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import ImportScreen from '../import';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ImportScreen', () => {
  it('renders import form with URL input field', () => {
    const { getByText, getByPlaceholderText } = render(<ImportScreen />);

    expect(getByText('Import & Sync')).toBeTruthy();
    expect(getByText('PASTE A LINK\nTO COOK.')).toBeTruthy();
    expect(getByPlaceholderText('TikTok, YouTube, or Blog URL...')).toBeTruthy();
    expect(getByText('IMPORT RECIPE')).toBeTruthy();
    expect(getByText('RECIPE URL')).toBeTruthy();
  });

  it('disables import button when URL is empty', () => {
    const { getByText } = render(<ImportScreen />);

    const importButton = getByText('IMPORT RECIPE');
    // The button parent Pressable should be disabled
    fireEvent.press(importButton);
    // router.back should not be called since import doesn't fire with empty URL
    expect(router.back).not.toHaveBeenCalled();
  });

  it('shows loading state while importing', () => {
    const { getByPlaceholderText, getByText } = render(<ImportScreen />);

    const input = getByPlaceholderText('TikTok, YouTube, or Blog URL...');
    fireEvent.changeText(input, 'https://example.com/recipe');

    fireEvent.press(getByText('IMPORT RECIPE'));

    expect(getByText('SYNCING...')).toBeTruthy();
    expect(getByText('SYNCING YOUR KITCHEN')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
  });

  it('shows progress updates during import', () => {
    const { getByPlaceholderText, getByText } = render(<ImportScreen />);

    fireEvent.changeText(
      getByPlaceholderText('TikTok, YouTube, or Blog URL...'),
      'https://example.com/recipe'
    );
    fireEvent.press(getByText('IMPORT RECIPE'));

    // Advance timers to trigger progress updates
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(getByText('10%')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(getByText('20%')).toBeTruthy();
  });

  it('navigates back after successful import (100% progress)', () => {
    const { getByPlaceholderText, getByText } = render(<ImportScreen />);

    fireEvent.changeText(
      getByPlaceholderText('TikTok, YouTube, or Blog URL...'),
      'https://example.com/recipe'
    );
    fireEvent.press(getByText('IMPORT RECIPE'));

    // Advance to 100% (10 intervals of 300ms)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(router.back).toHaveBeenCalled();
  });

  it('cancel/dismiss returns to previous screen', () => {
    const { getByText } = render(<ImportScreen />);

    // The back button contains an arrow-back icon
    fireEvent.press(getByText('arrow-back'));

    expect(router.back).toHaveBeenCalled();
  });

  it('renders alternative options (manual and scan)', () => {
    const { getByText } = render(<ImportScreen />);

    expect(getByText('MANUAL')).toBeTruthy();
    expect(getByText('SCAN RECIPE')).toBeTruthy();
    expect(getByText('OR')).toBeTruthy();
  });

  it('navigates to manual recipe when manual option is pressed', () => {
    const { getByText } = render(<ImportScreen />);

    fireEvent.press(getByText('MANUAL'));

    expect(router.push).toHaveBeenCalledWith('/manual-recipe');
  });

  it('allows typing a URL into the input field', () => {
    const { getByPlaceholderText } = render(<ImportScreen />);

    const input = getByPlaceholderText('TikTok, YouTube, or Blog URL...');
    fireEvent.changeText(input, 'https://tiktok.com/@chef/video/123');

    expect(input.props.value).toBe('https://tiktok.com/@chef/video/123');
  });
});
