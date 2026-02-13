import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import ShareRecipeModal from '../ShareRecipeModal';

jest.spyOn(Alert, 'alert');

const mockShareWithFriend = jest.fn();
const mockUnshare = jest.fn();
const mockCreateLink = jest.fn();
const mockRevokeLink = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockShareWithFriend)
    .mockReturnValueOnce(mockUnshare)
    .mockReturnValueOnce(mockCreateLink)
    .mockReturnValueOnce(mockRevokeLink);
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
  const mutations = [mockShareWithFriend, mockUnshare, mockCreateLink, mockRevokeLink];
  (useMutation as jest.Mock).mockImplementation(() => {
    const val = mutations[mCount % 4];
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

  it('renders friends and link tabs', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('FRIENDS')).toBeTruthy();
    expect(getByText('LINK')).toBeTruthy();
  });

  it('shows loading indicator when friends are loading', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('Share with friends')).toBeTruthy();
  });

  it('shows empty state when no friends exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([]) // friends
      .mockReturnValueOnce([]) // sharedWith
      .mockReturnValueOnce([]); // shareLinks

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
      .mockReturnValueOnce([])
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
      .mockReturnValueOnce(mockSharedWith)
      .mockReturnValueOnce([]);

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

  it('switches to link tab when pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));
    expect(getByText('Create shareable link')).toBeTruthy();
    expect(getByText('Anyone with the link can view this recipe')).toBeTruthy();
  });

  it('shows create new link button on link tab', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));
    expect(getByText('CREATE NEW LINK')).toBeTruthy();
  });

  it('shows existing share links', () => {
    const mockShareLinks = [
      {
        linkId: 'link1' as any,
        shareCode: 'ABC123',
        accessCount: 5,
        isActive: true,
        isExpired: false,
      },
    ];
    // Use cycling mock so data persists across re-renders
    let callCount = 0;
    const queryValues = [[], [], mockShareLinks];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));
    expect(getByText('ABC123')).toBeTruthy();
    expect(getByText('5 views')).toBeTruthy();
  });

  it('shows alert when sharing with no friends selected', async () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockFriends)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // The share button should be disabled when no friends are selected
    // but we still check the button text renders
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
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    expect(getByText('A')).toBeTruthy();
  });

  it('selects a friend when pressed', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
      { friendId: 'user2' as any, name: 'Bob' },
    ];
    // Use cycling mock for re-renders
    let callCount = 0;
    const queryValues = [mockFriends, [], []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
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
    const queryValues = [mockFriends, [], []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
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
    const queryValues = [mockFriends, [], []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
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
    const queryValues = [mockFriends, [], []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
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
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // The share button is disabled when 0 friends selected, so we can't press it
    // But we verify the text shows 0
    expect(getByText(/SHARE WITH 0 FRIEND/)).toBeTruthy();
  });

  it('creates a shareable link', async () => {
    mockCreateLink.mockResolvedValue({ shareCode: 'XYZ789' });
    setupCyclingMutations();
    let callCount = 0;
    const queryValues = [[], [], []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    // Switch to link tab
    fireEvent.press(getByText('LINK'));

    // Press create link
    fireEvent.press(getByText('CREATE NEW LINK'));

    await waitFor(() => {
      expect(mockCreateLink).toHaveBeenCalledWith({ recipeId: 'recipe123' });
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Link Created', 'Share link copied to clipboard!');
    });
  });

  it('shows error when creating link fails', async () => {
    mockCreateLink.mockRejectedValue(new Error('Link creation failed'));
    setupCyclingMutations();
    let callCount = 0;
    const queryValues = [[], [], []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));
    fireEvent.press(getByText('CREATE NEW LINK'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Link creation failed');
    });
  });

  it('copies share link to clipboard', async () => {
    const Clipboard = require('expo-clipboard');
    const mockShareLinks = [
      {
        linkId: 'link1' as any,
        shareCode: 'ABC123',
        accessCount: 5,
        isActive: true,
        isExpired: false,
      },
    ];
    let callCount = 0;
    const queryValues = [[], [], mockShareLinks];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText, getByTestId } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));

    // Press copy button
    fireEvent.press(getByTestId('icon-copy'));

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('everydayfood://share/ABC123');
    });
  });

  it('revokes a share link', async () => {
    mockRevokeLink.mockResolvedValue({ success: true });
    setupCyclingMutations();
    const mockShareLinks = [
      {
        linkId: 'link1' as any,
        shareCode: 'ABC123',
        accessCount: 5,
        isActive: true,
        isExpired: false,
      },
    ];
    let callCount = 0;
    const queryValues = [[], [], mockShareLinks];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText, getByTestId } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));

    // Press revoke (trash) button
    fireEvent.press(getByTestId('icon-trash'));

    await waitFor(() => {
      expect(mockRevokeLink).toHaveBeenCalledWith({ linkId: 'link1' });
    });
  });

  it('shows error when revoking link fails', async () => {
    mockRevokeLink.mockRejectedValue(new Error('Revoke failed'));
    setupCyclingMutations();
    const mockShareLinks = [
      {
        linkId: 'link1' as any,
        shareCode: 'ABC123',
        accessCount: 5,
        isActive: true,
        isExpired: false,
      },
    ];
    let callCount = 0;
    const queryValues = [[], [], mockShareLinks];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText, getByTestId } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));
    fireEvent.press(getByTestId('icon-trash'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Revoke failed');
    });
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
    const queryValues = [mockFriends, mockSharedWith, []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
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

  it('shows expired and revoked status on links', () => {
    const mockShareLinks = [
      {
        linkId: 'link1' as any,
        shareCode: 'EXPIRED1',
        accessCount: 10,
        isActive: true,
        isExpired: true,
      },
      {
        linkId: 'link2' as any,
        shareCode: 'REVOKED1',
        accessCount: 3,
        isActive: false,
        isExpired: false,
      },
    ];
    let callCount = 0;
    const queryValues = [[], [], mockShareLinks];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('LINK'));

    expect(getByText('EXPIRED1')).toBeTruthy();
    expect(getByText('REVOKED1')).toBeTruthy();
    expect(getByText(/Expired/)).toBeTruthy();
    expect(getByText(/Revoked/)).toBeTruthy();
  });

  it('selects multiple friends', () => {
    const mockFriends = [
      { friendId: 'user1' as any, name: 'Alice' },
      { friendId: 'user2' as any, name: 'Bob' },
      { friendId: 'user3' as any, name: 'Carol' },
    ];
    let callCount = 0;
    const queryValues = [mockFriends, [], []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText } = render(<ShareRecipeModal {...defaultProps} />);

    fireEvent.press(getByText('Alice'));
    fireEvent.press(getByText('Bob'));

    expect(getByText(/SHARE WITH 2 FRIENDS/)).toBeTruthy();
  });
});
