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

  it('sends a friend request from search results', async () => {
    mockSendRequest.mockResolvedValue({ success: true });
    const searchResults = [{ userId: 'u5', name: 'Eve', email: 'eve@test.com' }];
    let qCount = 0;
    const queryValues = [[], { incoming: [], outgoing: [] }, searchResults, { friends: 0, pendingIncoming: 0, pendingOutgoing: 0 }];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[qCount % 4];
      qCount++;
      return val;
    });
    let mCount = 0;
    const mutations = [mockSendRequest, mockAcceptRequest, mockRejectRequest, mockCancelRequest, mockRemoveFriend];
    (useMutation as jest.Mock).mockImplementation(() => {
      const val = mutations[mCount % 5];
      mCount++;
      return val;
    });

    const { getByPlaceholderText, getByText, getByTestId } = render(<FriendsScreen />);
    fireEvent.changeText(getByPlaceholderText('Search by name or email...'), 'Eve');

    expect(getByText('Eve')).toBeTruthy();
    fireEvent.press(getByTestId('icon-person-add'));

    await waitFor(() => {
      expect(mockSendRequest).toHaveBeenCalledWith({ friendId: 'u5' });
    });
  });

  it('shows success alert after sending friend request', async () => {
    mockSendRequest.mockResolvedValue({ success: true });
    let qCount = 0;
    const queryValues = [[], { incoming: [], outgoing: [] }, [{ userId: 'u5', name: 'Eve', email: 'eve@test.com' }], { friends: 0, pendingIncoming: 0, pendingOutgoing: 0 }];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[qCount % 4];
      qCount++;
      return val;
    });
    let mCount = 0;
    const mutations = [mockSendRequest, mockAcceptRequest, mockRejectRequest, mockCancelRequest, mockRemoveFriend];
    (useMutation as jest.Mock).mockImplementation(() => {
      const val = mutations[mCount % 5];
      mCount++;
      return val;
    });

    const { getByPlaceholderText, getByTestId } = render(<FriendsScreen />);
    fireEvent.changeText(getByPlaceholderText('Search by name or email...'), 'Eve');
    fireEvent.press(getByTestId('icon-person-add'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Friend request sent!');
    });
  });

  it('shows error alert when sending friend request fails', async () => {
    mockSendRequest.mockRejectedValue(new Error('Already friends'));
    let qCount = 0;
    const queryValues = [[], { incoming: [], outgoing: [] }, [{ userId: 'u5', name: 'Eve', email: 'eve@test.com' }], { friends: 0, pendingIncoming: 0, pendingOutgoing: 0 }];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[qCount % 4];
      qCount++;
      return val;
    });
    let mCount = 0;
    const mutations = [mockSendRequest, mockAcceptRequest, mockRejectRequest, mockCancelRequest, mockRemoveFriend];
    (useMutation as jest.Mock).mockImplementation(() => {
      const val = mutations[mCount % 5];
      mCount++;
      return val;
    });

    const { getByPlaceholderText, getByTestId } = render(<FriendsScreen />);
    fireEvent.changeText(getByPlaceholderText('Search by name or email...'), 'Eve');
    fireEvent.press(getByTestId('icon-person-add'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Already friends');
    });
  });

  it('cancels an outgoing friend request', async () => {
    mockCancelRequest.mockResolvedValue({ success: true });
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce({
        incoming: [],
        outgoing: [
          { friendshipId: 'f3', userId: 'u3', name: 'Diana', requestedAt: Date.now() },
        ],
      })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 0, pendingIncoming: 0, pendingOutgoing: 1 });

    const { getByText } = render(<FriendsScreen />);
    fireEvent.press(getByText('CANCEL'));

    await waitFor(() => {
      expect(mockCancelRequest).toHaveBeenCalledWith({ friendshipId: 'f3' });
    });
  });

  it('removes a friend via alert confirmation', async () => {
    mockRemoveFriend.mockResolvedValue({ success: true });
    (useQuery as jest.Mock)
      .mockReturnValueOnce([
        { friendshipId: 'f1', friendId: 'u1', name: 'Alice', email: 'alice@test.com' },
      ])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 1, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByTestId } = render(<FriendsScreen />);

    // Press the more button (ellipsis) to trigger Alert
    fireEvent.press(getByTestId('icon-ellipsis-vertical'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove Friend',
      'Are you sure you want to remove Alice from your friends?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Remove', style: 'destructive' }),
      ])
    );

    // Simulate pressing "Remove" in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const removeButton = alertCall[2].find((btn: any) => btn.text === 'Remove');
    await removeButton.onPress();

    expect(mockRemoveFriend).toHaveBeenCalledWith({ friendId: 'u1' });
  });

  it('shows error alert when accept request fails', async () => {
    mockAcceptRequest.mockRejectedValue(new Error('Network error'));
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
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
    });
  });

  it('shows error alert when reject request fails', async () => {
    mockRejectRequest.mockRejectedValue(new Error('Failed'));
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
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed');
    });
  });

  it('shows error alert when cancel request fails', async () => {
    mockCancelRequest.mockRejectedValue(new Error('Cannot cancel'));
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
    fireEvent.press(getByText('CANCEL'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Cannot cancel');
    });
  });

  it('shows "No users found" when search returns empty results', () => {
    let callCount = 0;
    const queryValues = [
      [],
      { incoming: [], outgoing: [] },
      [],  // empty search results
      { friends: 0, pendingIncoming: 0, pendingOutgoing: 0 }
    ];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 4];
      callCount++;
      return val;
    });

    const { getByPlaceholderText, getByText } = render(<FriendsScreen />);
    fireEvent.changeText(getByPlaceholderText('Search by name or email...'), 'zzz');

    expect(getByText('No users found')).toBeTruthy();
  });

  it('clears search input when clear button is pressed', () => {
    let callCount = 0;
    const queryValues = [
      [],
      { incoming: [], outgoing: [] },
      [],
      { friends: 0, pendingIncoming: 0, pendingOutgoing: 0 }
    ];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 4];
      callCount++;
      return val;
    });

    const { getByPlaceholderText, getByTestId } = render(<FriendsScreen />);
    fireEvent.changeText(getByPlaceholderText('Search by name or email...'), 'test');

    // Press the close-circle icon to clear search
    fireEvent.press(getByTestId('icon-close-circle'));

    // The input should be cleared (placeholder visible again)
    expect(getByPlaceholderText('Search by name or email...')).toBeTruthy();
  });

  it('shows friend email when available', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([
        { friendshipId: 'f1', friendId: 'u1', name: 'Alice', email: 'alice@example.com' },
      ])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 1, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByText } = render(<FriendsScreen />);
    expect(getByText('alice@example.com')).toBeTruthy();
  });

  it('shows error alert when remove friend fails', async () => {
    mockRemoveFriend.mockRejectedValue(new Error('Remove failed'));
    (useQuery as jest.Mock)
      .mockReturnValueOnce([
        { friendshipId: 'f1', friendId: 'u1', name: 'Alice' },
      ])
      .mockReturnValueOnce({ incoming: [], outgoing: [] })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ friends: 1, pendingIncoming: 0, pendingOutgoing: 0 });

    const { getByTestId } = render(<FriendsScreen />);
    fireEvent.press(getByTestId('icon-ellipsis-vertical'));

    // Simulate pressing "Remove" in alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const removeButton = alertCall[2].find((btn: any) => btn.text === 'Remove');
    await removeButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Remove failed');
    });
  });
});
