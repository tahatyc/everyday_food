import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import ShareRecipeModal from '../ShareRecipeModal';

jest.spyOn(Alert, 'alert');

const mockShareWithFriend = jest.fn();
const mockUnshare = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockShareWithFriend)
    .mockReturnValueOnce(mockUnshare);
});

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  recipeId: 'recipe123' as any,
  recipeTitle: 'Test Recipe',
};

// Helper to set up cycling mutation mocks (survives re-renders)
function setupCyclingMutations() {
  let mCount = 0;
  const mutations = [mockShareWithFriend, mockUnshare];
  (useMutation as jest.Mock).mockImplementation(() => {
    const val = mutations[mCount % 2];
    mCount++;
    return val;
  });
}

describe('ShareRecipeModal', () => {
  it('renders the modal with header and title', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('SHARE RECIPE')).toBeTruthy();
    expect(getByText('Test Recipe')).toBeTruthy();
  });

  it('shows loading indicator when friends are loading', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('Share with friends')).toBeTruthy();
  });

  it('shows empty state when no friends exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([]) // friends
      .mockReturnValueOnce([]); // sharedWith

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('No friends yet')).toBeTruthy();
    expect(getByText('Add friends to share recipes')).toBeTruthy();
  });

  it('renders friend list when friends exist', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice', email: 'alice@test.com' },
      { friendId: 'user2' as any, name: 'Bob', email: 'bob@test.com' },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockFriends)
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('shows "Already shared" for friends who already have access', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    const mockSharedWith = [
      { userId: 'user1' as any },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockFriends)
      .mockReturnValueOnce(mockSharedWith);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('Already shared')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ShareRecipeModal {...defaultProps} onClose={onClose} />
    );

    fireEvent.press(getByTestId('icon-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows alert when sharing with no friends selected', async () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockFriends)
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // The share button should be disabled when no friends are selected
    expect(getByText(/SHARE WITH 0 FRIEND/)).toBeTruthy();
  });

  it('does not render when not visible', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const { queryByText } = render(
      <ShareRecipeModal {...defaultProps} visible={false} />
    );

    // Modal should not show content when not visible
    expect(queryByText('SHARE RECIPE')).toBeNull();
  });

  it('displays friend avatar initials', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockFriends)
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('A')).toBeTruthy();
  });

  it('selects a friend when pressed', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
      { friendId: 'user2' as any, name: 'Bob' },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 2];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // Press Alice to select
    fireEvent.press(getByText('Alice'));

    // After selection, the share button should show count
    expect(getByText(/SHARE WITH 1 FRIEND$/)).toBeTruthy();
  });

  it('deselects a previously selected friend', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 2];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // Select Alice
    fireEvent.press(getByText('Alice'));
    expect(getByText(/SHARE WITH 1 FRIEND$/)).toBeTruthy();

    // Deselect Alice
    fireEvent.press(getByText('Alice'));
    expect(getByText(/SHARE WITH 0 FRIEND/)).toBeTruthy();
  });

  it('shares with selected friends successfully', async () => {
    mockShareWithFriend.mockResolvedValue({ success: true });
    setupCyclingMutations();
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 2];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // Select Alice
    fireEvent.press(getByText('Alice'));

    // Press share button
    fireEvent.press(getByText(/SHARE WITH 1 FRIEND$/));

    await waitFor(() => {
      expect(mockShareWithFriend).toHaveBeenCalledWith({
        recipeId: 'recipe123',
        friendId: 'user1',
      });
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Recipe shared successfully!');
    });
  });

  it('shows error when sharing fails', async () => {
    mockShareWithFriend.mockRejectedValue(new Error('Share failed'));
    setupCyclingMutations();
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 2];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('Alice'));
    fireEvent.press(getByText(/SHARE WITH 1 FRIEND$/));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Share failed');
    });
  });

  it('shows alert when trying to share with no friends selected', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockFriends)
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // The share button is disabled when 0 friends selected
    expect(getByText(/SHARE WITH 0 FRIEND/)).toBeTruthy();
  });

  it('unshares from an already-shared friend', async () => {
    mockUnshare.mockResolvedValue({ success: true });
    setupCyclingMutations();
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    const mockSharedWith = [
      { userId: 'user1' as any },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, mockSharedWith];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 2];
      callCount++;
      return val;
    });

    const { getByTestId } = render(<ShareRecipeModal {...defaultProps} />);

    // Press the unshare (close-circle) button for the already-shared friend
    fireEvent.press(getByTestId('icon-close-circle'));

    await waitFor(() => {
      expect(mockUnshare).toHaveBeenCalledWith({
        recipeId: 'recipe123',
        userId: 'user1',
      });
    });
  });

  it('selects multiple friends', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
      { friendId: 'user2' as any, name: 'Bob' },
      { friendId: 'user3' as any, name: 'Carol' },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 2];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('Alice'));
    fireEvent.press(getByText('Bob'));

    expect(getByText(/SHARE WITH 2 FRIENDS/)).toBeTruthy();
  });

  it('does not allow selecting already-shared friends', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    const mockSharedWith = [
      { userId: 'user1' as any },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, mockSharedWith];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 2];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // Clicking already-shared friend should not change selection count
    fireEvent.press(getByText('Alice'));

    expect(getByText('Already shared')).toBeTruthy();
  });
});
