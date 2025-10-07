import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BuyerBase({ title, children }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { authContext } = route.params;

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => authContext.signOut() }
      ]
    );
  };

  const handleNavigate = (screenName) => {
    navigation.navigate(screenName, { authContext });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with logo, title, and logout */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* 👇 Replace this with your actual logo path */}
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.title}>Farmandi - Buyer</Text>
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {children}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable onPress={() => handleNavigate('BuyerDashboard')} style={styles.navItem}>
          <Text style={styles.navEmoji}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>

        <Pressable onPress={() => handleNavigate('BuyerProduce')} style={styles.navItem}>
          <Text style={styles.navEmoji}>🛒</Text>
          <Text style={styles.navLabel}>Browse</Text>
        </Pressable>

        <Pressable onPress={() => handleNavigate('BuyerOrders')} style={styles.navItem}>
          <Text style={styles.navEmoji}>📦</Text>
          <Text style={styles.navLabel}>Orders</Text>
        </Pressable>

        <Pressable onPress={() => handleNavigate('BuyerNotifications')} style={styles.navItem}>
          <Text style={styles.navEmoji}>🔔</Text>
          <Text style={styles.navLabel}>Alerts</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#1565c0',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#0d47a1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1565c0',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  navItem: {
    alignItems: 'center',
  },
  navEmoji: {
    fontSize: 24,
    color: 'white',
  },
  navLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
