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
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <CustomIcon 
              source="https://r2-pub.rork.com/generated-images/b75c13da-045f-47f5-9c03-03d09b6824f9.png" 
              color={color} 
              size={size} 
            />
          ),
        }}
      />

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

      <Tabs.Screen
        name="chat"
        options={{
          title: "WhatsApp",
          tabBarIcon: ({ color, size }) => (
            <CustomIcon 
              source="https://r2-pub.rork.com/generated-images/1516dee0-3c9c-4f18-88ce-b92da20749b6.png" 
              color={color} 
              size={size} 
            />
          ),
          tabBarBadge: undefined,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Pacientes",
          tabBarIcon: ({ color, size }) => (
            <CustomIcon 
              source="https://r2-pub.rork.com/generated-images/056906b8-fb08-46a5-aaee-c724559bb811.png" 
              color={color} 
              size={size} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: "Plantillas",
          tabBarIcon: ({ color, size }) => (
            <CustomIcon 
              source="https://r2-pub.rork.com/generated-images/90d0d48b-65b1-404f-8421-00b22cfa6193.png" 
              color={color} 
              size={size} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="automations"
        options={{
          title: "Automatización",
          tabBarIcon: ({ color, size }) => (
            <CustomIcon 
              source="https://r2-pub.rork.com/generated-images/8fa6393c-75f0-4389-9681-90709a1ffa69.png" 
              color={color} 
              size={size} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "IA",
          tabBarIcon: ({ color, size }) => (
            <CustomIcon 
              source="https://r2-pub.rork.com/generated-images/ebcec8d3-c017-4ed7-8b6f-4a455eeb14c6.png" 
              color={color} 
              size={size} 
            />
          ),
        }}
      />
    </Tabs>
  );
}