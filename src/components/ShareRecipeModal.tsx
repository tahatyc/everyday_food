import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../styles/neobrutalism";

interface ShareRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: Id<"recipes">;
  recipeTitle: string;
}

export default function ShareRecipeModal({
  visible,
  onClose,
  recipeId,
  recipeTitle,
}: ShareRecipeModalProps) {
  const [selectedFriends, setSelectedFriends] = useState<Set<Id<"users">>>(
    new Set()
  );
  const [isSharing, setIsSharing] = useState(false);

  const friends = useQuery(api.friends.list);
  const sharedWith = useQuery(api.recipeShares.getSharedWith, { recipeId });

  const shareWithFriend = useMutation(api.recipeShares.share);
  const unshare = useMutation(api.recipeShares.unshare);

  const handleShareWithFriends = async () => {
    if (selectedFriends.size === 0) {
      Alert.alert("Select friends", "Please select at least one friend to share with");
      return;
    }

    setIsSharing(true);
    try {
      for (const friendId of selectedFriends) {
        await shareWithFriend({ recipeId, friendId });
      }
      setSelectedFriends(new Set());
      Alert.alert("Success", "Recipe shared successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to share recipe");
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async (userId: Id<"users">) => {
    try {
      await unshare({ recipeId, userId });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to revoke access");
    }
  };

  const toggleFriendSelection = (friendId: Id<"users">) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const isAlreadyShared = (friendId: Id<"users">) => {
    return sharedWith?.some((s) => s.userId === friendId) ?? false;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={styles.modalContainer}
          entering={FadeIn.duration(200)}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>SHARE RECIPE</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <Text style={styles.recipeTitle} numberOfLines={1}>
            {recipeTitle}
          </Text>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Friends to share with */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Share with friends</Text>
              {friends === undefined ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="people-outline"
                    size={32}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyText}>No friends yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add friends to share recipes
                  </Text>
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {friends.filter((f): f is NonNullable<typeof f> => f !== null).map((friend, index) => {
                    const alreadyShared = isAlreadyShared(friend.friendId);
                    const isSelected = selectedFriends.has(friend.friendId);
                    return (
                      <Animated.View
                        key={friend.friendId}
                        entering={FadeInDown.delay(index * 50).duration(200)}
                      >
                        <Pressable
                          style={[
                            styles.friendItem,
                            isSelected && styles.friendItemSelected,
                            alreadyShared && styles.friendItemShared,
                          ]}
                          onPress={() => {
                            if (!alreadyShared) {
                              toggleFriendSelection(friend.friendId);
                            }
                          }}
                          disabled={alreadyShared}
                        >
                          <View style={styles.friendAvatar}>
                            <Text style={styles.friendAvatarText}>
                              {friend.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>
                              {friend.name}
                            </Text>
                            {alreadyShared && (
                              <Text style={styles.sharedBadge}>
                                Already shared
                              </Text>
                            )}
                          </View>
                          {alreadyShared ? (
                            <Pressable
                              style={styles.unshareButton}
                              onPress={() => handleUnshare(friend.friendId)}
                            >
                              <Ionicons
                                name="close-circle"
                                size={20}
                                color={colors.error}
                              />
                            </Pressable>
                          ) : (
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxChecked,
                              ]}
                            >
                              {isSelected && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color={colors.textLight}
                                />
                              )}
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Share Button */}
            {friends && friends.length > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.shareButton,
                  selectedFriends.size === 0 && styles.shareButtonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleShareWithFriends}
                disabled={selectedFriends.size === 0 || isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={colors.textLight} />
                ) : (
                  <>
                    <Ionicons
                      name="share"
                      size={18}
                      color={colors.textLight}
                    />
                    <Text style={styles.shareButtonText}>
                      SHARE WITH {selectedFriends.size} FRIEND
                      {selectedFriends.size !== 1 ? "S" : ""}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    borderWidth: borders.thick,
    borderBottomWidth: 0,
    borderColor: borders.color,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeTitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyState: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  friendsList: {
    gap: spacing.sm,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  friendItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  friendItemShared: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.8,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    backgroundColor: colors.secondary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  friendAvatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  sharedBadge: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  unshareButton: {
    padding: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    ...shadows.md,
  },
  shareButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.6,
  },
  shareButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
});
