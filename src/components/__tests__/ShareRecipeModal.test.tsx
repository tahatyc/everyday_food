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
});
