import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomTabBar } from '../BottomTabBar';

// Create mock navigation state
const createMockState = (activeIndex: number = 0) => ({
  index: activeIndex,
  routes: [
    { key: 'index-key', name: 'index' },
    { key: 'recipes-key', name: 'recipes' },
    { key: 'meal-plan-key', name: 'meal-plan' },
    { key: 'profile-key', name: 'profile' },
  ],
});

const createMockDescriptors = (routes: any[]) => {
  const descriptors: Record<string, any> = {};
  routes.forEach((route) => {
    descriptors[route.key] = {
      options: {},
    };
  });
  return descriptors;
};

const createMockNavigation = () => ({
  navigate: jest.fn(),
  emit: jest.fn(() => ({ defaultPrevented: false })),
});

describe('BottomTabBar', () => {
  it('renders all tab labels', () => {
    const state = createMockState(0);
    const { getByText } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={createMockNavigation() as any}
      />
    );

    expect(getByText('HOME')).toBeTruthy();
    expect(getByText('RECIPES')).toBeTruthy();
    expect(getByText('PLAN')).toBeTruthy();
    expect(getByText('PROFILE')).toBeTruthy();
  });

  it('renders the floating action button', () => {
    const state = createMockState(0);
    const { getByTestId } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={createMockNavigation() as any}
      />
    );

    expect(getByTestId('icon-add')).toBeTruthy();
  });

  it('navigates to correct tab on press', () => {
    const state = createMockState(0);
    const navigation = createMockNavigation();
    const { getByText } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={navigation as any}
      />
    );

    fireEvent.press(getByText('RECIPES'));
    expect(navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress' })
    );
    expect(navigation.navigate).toHaveBeenCalledWith('recipes');
  });

  it('does not navigate when pressing already active tab', () => {
    const state = createMockState(0);
    const navigation = createMockNavigation();
    const { getByText } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={navigation as any}
      />
    );

    fireEvent.press(getByText('HOME'));
    // Should emit event but not navigate
    expect(navigation.emit).toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('emits tabLongPress on long press', () => {
    const state = createMockState(0);
    const navigation = createMockNavigation();
    const { getByText } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={navigation as any}
      />
    );

    fireEvent(getByText('RECIPES'), 'onLongPress');
    expect(navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabLongPress' })
    );
  });

  it('navigates to import screen when FAB is pressed', () => {
    const state = createMockState(0);
    const navigation = createMockNavigation();
    const { getByTestId } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={navigation as any}
      />
    );

    fireEvent.press(getByTestId('icon-add'));
    expect(navigation.navigate).toHaveBeenCalledWith('import');
  });

  it('renders correct icons for tabs', () => {
    const state = createMockState(0);
    const { getByTestId } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={createMockNavigation() as any}
      />
    );

    // Active tab should show filled icon
    expect(getByTestId('icon-home')).toBeTruthy();
    // Inactive tabs show outline icons
    expect(getByTestId('icon-book-outline')).toBeTruthy();
    expect(getByTestId('icon-calendar-outline')).toBeTruthy();
    expect(getByTestId('icon-person-outline')).toBeTruthy();
  });

  it('does not navigate when event is prevented', () => {
    const state = createMockState(0);
    const navigation = createMockNavigation();
    navigation.emit.mockReturnValue({ defaultPrevented: true });

    const { getByText } = render(
      <BottomTabBar
        state={state as any}
        descriptors={createMockDescriptors(state.routes)}
        navigation={navigation as any}
      />
    );

    fireEvent.press(getByText('RECIPES'));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
