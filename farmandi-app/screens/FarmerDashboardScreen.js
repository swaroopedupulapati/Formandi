// screens/FarmerDashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import FarmerBase from '../components/FarmerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';

export default function FarmerDashboardScreen() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert('Authentication Error', 'Please log in again.');
          return;
        }

        const response = await axios.get(`${API_URL}/api/farmer/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        Alert.alert('API Error', 'Could not fetch dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <FarmerBase title="Farmer Dashboard">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      </FarmerBase>
    );
  }

  return (
    <FarmerBase title="Farmer Dashboard">
      <Text style={styles.welcomeText}>Welcome, {dashboardData?.name} 👋</Text>
      
      <View style={styles.dashboardContainer}>
        {/* Total Produce Card */}
        <Pressable 
          style={[styles.card, styles.card1]} 
          onPress={() => navigation.navigate('FarmerMyProduce')}
        >
          <Text style={styles.cardTitle}>Total Produce</Text>
          <Text style={styles.cardValue}>{dashboardData?.total_produce}</Text>
        </Pressable>

        {/* Total Orders Card */}
        <Pressable 
          style={[styles.card, styles.card2]} 
          onPress={() => navigation.navigate('FarmerOrders')}
        >
          <Text style={styles.cardTitle}>Total Orders</Text>
          <Text style={styles.cardValue}>{dashboardData?.total_orders}</Text>
        </Pressable>

        {/* Accepted Orders Card */}
        <Pressable 
          style={[styles.card, styles.card3]} 
          onPress={() => navigation.navigate('FarmerOrders')}
        >
          <Text style={styles.cardTitle}>Accepted Orders</Text>
          <Text style={styles.cardValue}>{dashboardData?.accepted_orders}</Text>
        </Pressable>

        {/* Pending Orders Card */}
        <Pressable 
          style={[styles.card, styles.card4]} 
          onPress={() => navigation.navigate('FarmerOrders')}
        >
          <Text style={styles.cardTitle}>Pending Orders</Text>
          <Text style={styles.cardValue}>{dashboardData?.pending_orders}</Text>
        </Pressable>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('FarmerAddProduce')}>
          <Text style={styles.actionButtonText}>➕ Add New Produce</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('FarmerMyProduce')}>
          <Text style={styles.actionButtonText}>📦 My Produce</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('FarmerOrders')}>
          <Text style={styles.actionButtonText}>📬 View Orders</Text>
        </Pressable>
      </View>
    </FarmerBase>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#333',
  },
  dashboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card1: {
    backgroundColor: '#e8f5e9',
  },
  card2: {
    backgroundColor: '#fff3e0',
  },
  card3: {
    backgroundColor: '#e3f2fd',
  },
  card4: {
    backgroundColor: '#fbe9e7',
  },
  cardTitle: {
    fontSize: 16,
    color: '#555',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});