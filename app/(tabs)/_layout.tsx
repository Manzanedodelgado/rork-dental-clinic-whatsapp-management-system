import { Tabs } from "expo-router";
import { Image, View, StyleSheet } from "react-native";
import React from "react";
import Colors from "@/constants/colors";

const CustomIcon = ({ source, color, size }: { source: string; color: string; size: number }) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Image 
      source={{ uri: source }} 
      style={[styles.iconImage, { width: size, height: size, tintColor: color }]} 
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    // Dynamic styles will be applied inline for size and tintColor
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <CustomIcon 
              source="https://r2-pub.rork.com/generated-images/c8de3f54-23bd-4aa8-9bd1-2a8a8207e3a6.png" 
              color={color} 
              size={size} 
            />
          ),
        }}
      />
    </Tabs>
  );
}