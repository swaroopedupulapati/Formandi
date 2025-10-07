import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LoginRegisterScreen from '../screens/LoginRegisterScreen';

export default function FarmerBase({ title, children }) {
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
    navigation.navigate(LoginRegisterScreen, { authContext });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with logo, title, and logout */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')} // 👈 replace this path with your logo image
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Farmandi - Farmer</Text>
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </Pressable>
      </View>

      {/* Main content */}
      <ScrollView style={styles.contentContainer}>
        {children}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable onPress={() => handleNavigate('FarmerDashboard')} style={styles.navItem}>
          <Text style={styles.navEmoji}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>

        <Pressable onPress={() => handleNavigate('FarmerMyProduce')} style={styles.navItem}>
          <Text style={styles.navEmoji}>🧺</Text>
          <Text style={styles.navLabel}>Produce</Text>
        </Pressable>

        <Pressable onPress={() => handleNavigate('FarmerAddProduce')} style={styles.navItem}>
          <Text style={styles.navEmoji}>➕</Text>
          <Text style={styles.navLabel}>Add</Text>
        </Pressable>

        <Pressable onPress={() => handleNavigate('FarmerOrders')} style={styles.navItem}>
          <Text style={styles.navEmoji}>📦</Text>
          <Text style={styles.navLabel}>Orders</Text>
        </Pressable>

        <Pressable onPress={() => handleNavigate('FarmerNotifications')} style={styles.navItem}>
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
    backgroundColor: '#2e7d32',
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
    backgroundColor: '#1b5e20',
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
    flex: 1,
    padding: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
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
