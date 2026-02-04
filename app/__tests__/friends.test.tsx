import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import FriendsScreen from '../friends';

jest.spyOn(Alert, 'alert');

const mockSendRequest = jest.fn();
const mockAcceptRequest = jest.fn();
const mockRejectRequest = jest.fn();
const mockCancelRequest = jest.fn();
const mockRemoveFriend = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockSendRequest)
    .mockReturnValueOnce(mockAcceptRequest)
    .mockReturnValueOnce(mockRejectRequest)
    .mockReturnValueOnce(mockCancelRequest)
    .mockReturnValueOnce(mockRemoveFriend);
});

describe('FriendsScreen', () => {
  it('renders header with title', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([]) // friends
      .mockReturnValueOnce({ incoming: [], outgoing: [] }) // pending
      .mockReturnValueOnce(undefined) // searchResults (skipped)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 0, pendingOutgoing: 0 }); // stats

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('FRIENDS')).toBeTruthy();
  });

  it('renders search section', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByText, getByPlaceholderText } = render(<FriendsScreen />);
    expect(getByText('FIND FRIENDS')).toBeTruthy();
    expect(getByPlaceholderText('Search by name or email...')).toBeTruthy();
  });

  it('shows empty state when no friends exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('No friends yet')).toBeTruthy();
    expect(getByText('Search for friends above to get started')).toBeTruthy();
  });

  it('shows friends count in section header', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([
        { friendshipId: 'f1', friendId: 'u1', name: 'Alice', email: 'alice@test.com' },
        { friendshipId: 'f2', friendId: 'u2', name: 'Bob', email: 'bob@test.com' },
      ])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 2, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('MY FRIENDS (2)')).toBeTruthy();
  });

  it('renders friend cards with names and avatars', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([
        { friendshipId: 'f1', friendId: 'u1', name: 'Alice' },
        { friendshipId: 'f2', friendId: 'u2', name: 'Bob' },
      ])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 2, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });

  it('shows pending requests section when requests exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({
        incoming: [
          { friendshipId: 'f1', userId: 'u1', name: 'Charlie', requestedAt: Date.now() },
        ],
        outgoing: [],
      })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 1, pendingOutgoing: 0 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('PENDING REQUESTS')).toBeTruthy();
    expect(getByText('Incoming')).toBeTruthy();
    expect(getByText('Charlie')).toBeTruthy();
    expect(getByText('Wants to be your friend')).toBeTruthy();
  });

  it('shows outgoing requests', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({
        incoming: [],
        outgoing: [
          { friendshipId: 'f2', userId: 'u2', name: 'Diana', requestedAt: Date.now() },
        ],
      })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 0, pendingOutgoing: 1 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('Sent')).toBeTruthy();
    expect(getByText('Diana')).toBeTruthy();
    expect(getByText('Request pending')).toBeTruthy();
    expect(getByText('CANCEL')).toBeTruthy();
  });

  it('handles accepting a friend request', async () => {
    mockAcceptRequest.mockResolvedValue({ success: true });
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({
        incoming: [
          { friendshipId: 'f1', userId: 'u1', name: 'Charlie', requestedAt: Date.now() },
        ],
        outgoing: [],
      })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 1, pendingOutgoing: 0 });

    const { getByTestId } = render(<FriendsScreen />);
    fireEvent.press(getByTestId('icon-checkmark'));

    await waitFor(() => {
      expect(mockAcceptRequest).toHaveBeenCalledWith({ friendshipId: 'f1' });
    });
  });

  it('handles rejecting a friend request', async () => {
    mockRejectRequest.mockResolvedValue({ success: true });
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({
        incoming: [
          { friendshipId: 'f1', userId: 'u1', name: 'Charlie', requestedAt: Date.now() },
        ],
        outgoing: [],
      })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 1, pendingOutgoing: 0 });

    const { getByTestId } = render(<FriendsScreen />);
    fireEvent.press(getByTestId('icon-close'));

    await waitFor(() => {
      expect(mockRejectRequest).toHaveBeenCalledWith({ friendshipId: 'f1' });
    });
  });

  it('navigates back when back button is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByTestId } = render(<FriendsScreen />);
    fireEvent.press(getByTestId('icon-arrow-back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('shows badge count for pending incoming requests', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 3, pendingOutgoing: 0 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('3')).toBeTruthy();
  });

  it('shows loading state when friends are undefined', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('MY FRIENDS (0)')).toBeTruthy();
  });
});
