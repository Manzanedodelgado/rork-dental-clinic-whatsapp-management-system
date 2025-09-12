import { Tabs } from "expo-router";
import { Image, View, StyleSheet } from "react-native";
import React from "react";
import Colors from "@/constants/colors";
import { AppHeader } from "@/components";
import { useAuth } from "@/hooks/useAuth";

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
  const { hasPermission } = useAuth();

  console.log('🔍 Checking permissions in TabLayout');
  console.log('Dashboard permission:', hasPermission('dashboard'));
  console.log('Patients permission:', hasPermission('patients'));
  console.log('WhatsApp permission:', hasPermission('whatsapp'));
  console.log('Templates permission:', hasPermission('templates'));
  console.log('Automations permission:', hasPermission('automations'));
  console.log('AI permission:', hasPermission('ai'));
  console.log('Users permission:', hasPermission('users'));

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.secondary,
        headerShown: true,
        header: () => <AppHeader />,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.border,
          elevation: 8,
          shadowColor: Colors.light.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
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
      {hasPermission('appointments') && (
        <Tabs.Screen
          name="agenda"
          options={{
            title: "Agenda",
            tabBarIcon: ({ color, size }) => (
              <CustomIcon 
                source="https://r2-pub.rork.com/generated-images/a4133784-84e0-4490-ac56-fd38b81872a2.png" 
                color={color} 
                size={size} 
              />
            ),
          }}
        />
      )}
      {hasPermission('whatsapp') && (
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
      )}
      {hasPermission('patients') && (
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
      )}
      {hasPermission('templates') && (
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
      )}
      {hasPermission('automations') && (
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
      )}
      {hasPermission('ai') && (
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
      )}
      {hasPermission('users') && (
        <Tabs.Screen
          name="users"
          options={{
            title: "Usuarios",
            tabBarIcon: ({ color, size }) => (
              <CustomIcon 
                source="https://r2-pub.rork.com/generated-images/3fb11af3-6ee1-4115-85ed-09c054afb0e0.png" 
                color={color} 
                size={size} 
              />
            ),
          }}
        />
      )}
    </Tabs>
  );
}