import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

// User Card for search results
function UserSearchCard({
  user,
  onAdd,
  index,
}: {
  user: { userId: Id<"users">; name: string; email?: string };
  onAdd: () => void;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
      style={styles.userCard}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onAdd}
      >
        <Ionicons name="person-add" size={18} color={colors.textLight} />
      </Pressable>
    </Animated.View>
  );
}

// Friend Request Card
function RequestCard({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
  index,
}: {
  request: {
    friendshipId: Id<"friendships">;
    userId: Id<"users">;
    name: string;
    email?: string;
  };
  type: "incoming" | "outgoing";
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.requestCard}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {request.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{request.name}</Text>
        <Text style={styles.requestType}>
          {type === "incoming" ? "Wants to be your friend" : "Request pending"}
        </Text>
      </View>
      <View style={styles.requestActions}>
        {type === "incoming" ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.acceptButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onAccept}
            >
              <Ionicons name="checkmark" size={18} color={colors.textLight} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.rejectButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onReject}
            >
              <Ionicons name="close" size={18} color={colors.error} />
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// Friend Card
function FriendCard({
  friend,
  onRemove,
  index,
}: {
  friend: {
    friendshipId: Id<"friendships">;
    friendId: Id<"users">;
    name: string;
    email?: string;
  };
  onRemove: () => void;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.friendCard}
    >
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {friend.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        {friend.email && <Text style={styles.friendEmail}>{friend.email}</Text>}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.moreButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => {
          Alert.alert(
            "Remove Friend",
            `Are you sure you want to remove ${friend.name} from your friends?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: onRemove },
            ]
          );
        }}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
      </Pressable>
    </Animated.View>
  );
}

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const friends = useQuery(api.friends.list);
  const pending = useQuery(api.friends.getPending);
  const searchResults = useQuery(
    api.friends.searchUsers,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );
  const stats = useQuery(api.friends.getStats);

  const sendRequest = useMutation(api.friends.sendRequest);
  const acceptRequest = useMutation(api.friends.acceptRequest);
  const rejectRequest = useMutation(api.friends.rejectRequest);
  const cancelRequest = useMutation(api.friends.cancelRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  const handleSendRequest = async (friendId: Id<"users">) => {
    try {
      await sendRequest({ friendId });
      setSearchQuery("");
      Alert.alert("Success", "Friend request sent!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send request");
    }
  };

  const handleAcceptRequest = async (friendshipId: Id<"friendships">) => {
    try {
      await acceptRequest({ friendshipId });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (friendshipId: Id<"friendships">) => {
    try {
      await rejectRequest({ friendshipId });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reject request");
    }
  };

  const handleCancelRequest = async (friendshipId: Id<"friendships">) => {
    try {
      await cancelRequest({ friendshipId });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to cancel request");
    }
  };

  const handleRemoveFriend = async (friendId: Id<"users">) => {
    try {
      await removeFriend({ friendId });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to remove friend");
    }
  };

  const isLoading = friends === undefined;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.duration(300)}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>FRIENDS</Text>
        <View style={styles.headerButton}>
          {stats && stats.pendingIncoming > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{stats.pendingIncoming}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Section */}
        <Animated.View
          style={styles.searchSection}
          entering={FadeInDown.delay(100).duration(400)}
        >
          <View style={styles.searchLabelContainer}>
            <Text style={styles.searchLabel}>FIND FRIENDS</Text>
          </View>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <View style={styles.searchResults}>
              {searchResults === undefined ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : searchResults.length === 0 ? (
                <Text style={styles.noResults}>No users found</Text>
              ) : (
                searchResults.map((user, index) => (
                  <UserSearchCard
                    key={user.userId}
                    user={user}
                    onAdd={() => handleSendRequest(user.userId)}
                    index={index}
                  />
                ))
              )}
            </View>
          )}
        </Animated.View>

        {/* Pending Requests Section */}
        {pending && (pending.incoming.length > 0 || pending.outgoing.length > 0) && (
          <Animated.View
            style={styles.section}
            entering={FadeInDown.delay(200).duration(400)}
          >
            <View style={styles.sectionLabelContainer}>
              <Text style={styles.sectionLabel}>PENDING REQUESTS</Text>
            </View>

            {/* Incoming Requests */}
            {pending.incoming.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Incoming</Text>
                {pending.incoming.map((request, index) => (
                  <RequestCard
                    key={request.friendshipId}
                    request={request}
                    type="incoming"
                    onAccept={() => handleAcceptRequest(request.friendshipId)}
                    onReject={() => handleRejectRequest(request.friendshipId)}
                    index={index}
                  />
                ))}
              </View>
            )}

            {/* Outgoing Requests */}
            {pending.outgoing.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Sent</Text>
                {pending.outgoing.map((request, index) => (
                  <RequestCard
                    key={request.friendshipId}
                    request={request}
                    type="outgoing"
                    onCancel={() => handleCancelRequest(request.friendshipId)}
                    index={index}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Friends List Section */}
        <Animated.View
          style={styles.section}
          entering={FadeInDown.delay(300).duration(400)}
        >
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>
              MY FRIENDS ({friends?.length || 0})
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : friends && friends.length > 0 ? (
            <View style={styles.friendsList}>
              {friends.map((friend, index) => (
                <FriendCard
                  key={friend.friendshipId}
                  friend={friend}
                  onRemove={() => handleRemoveFriend(friend.friendId)}
                  index={index}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>
                Search for friends above to get started
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  searchSection: {
    marginBottom: spacing.xl,
  },
  searchLabelContainer: {
    alignSelf: "flex-start",
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  searchLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  searchResults: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  noResults: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  userAvatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  buttonPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    ...shadows.pressed,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabelContainer: {
    alignSelf: "flex-start",
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
  subsection: {
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  requestType: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  requestActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  acceptButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  rejectButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  cancelButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
  },
  friendsList: {
    gap: spacing.sm,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.secondary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  friendAvatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  friendEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  moreButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  emptyContainer: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    ...shadows.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: 100,
  },
});
