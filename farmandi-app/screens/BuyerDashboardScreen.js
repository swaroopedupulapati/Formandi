import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import BuyerBase from '../components/BuyerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';

export default function BuyerDashboardScreen() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  // You will need to create a new Flask endpoint for the buyer dashboard
  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/api/buyer/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('API Error', 'Could not fetch dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <BuyerBase title="Buyer Dashboard">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565c0" />
        </View>
      </BuyerBase>
    );
  }

  return (
    <BuyerBase title="Buyer Dashboard">
      <Text style={styles.welcomeText}>Welcome, {dashboardData?.name} 👋</Text>
      <View style={styles.dashboardContainer}>
        <Pressable style={[styles.card, styles.card1]} onPress={() => navigation.navigate('BuyerOrders')}>
          <Text style={styles.cardTitle}>Total Orders Placed</Text>
          <Text style={styles.cardValue}>{dashboardData?.total_orders}</Text>
        </Pressable>
        <Pressable style={[styles.card, styles.card2]} onPress={() => navigation.navigate('BuyerOrders')}>
          <Text style={styles.cardTitle}>Accepted Orders</Text>
          <Text style={styles.cardValue}>{dashboardData?.accepted_orders}</Text>
        </Pressable>
        <Pressable style={[styles.card, styles.card3]} onPress={() => navigation.navigate('BuyerOrders')}>
          <Text style={styles.cardTitle}>Rejected Orders</Text>
          <Text style={styles.cardValue}>{dashboardData?.rejected_orders}</Text>
        </Pressable>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('BuyerProduce')}>
          <Text style={styles.actionButtonText}>🛒 Browse Produce</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('BuyerOrders')}>
          <Text style={styles.actionButtonText}>📋 My Orders</Text>
        </Pressable>
      </View>
    </BuyerBase>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#e3f2fd',
  },
  card2: {
    backgroundColor: '#fff8e1',
  },
  card3: {
    backgroundColor: '#fce4ec',
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
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#1565c0',
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