import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { BottomTabBar } from "../../src/components/navigation/BottomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipes",
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Plan",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      {/* Hide shopping from tabs - will be accessed from meal-plan */}
      <Tabs.Screen
        name="shopping"
        options={{
          href: null,
        }}
      />
      {/* Hide the old "two" screen */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    display: "none", // Hide default tab bar, using custom one
  },
});
