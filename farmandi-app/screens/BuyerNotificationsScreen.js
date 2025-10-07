import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import BuyerBase from '../components/BuyerBase'; // Assuming you have a reusable BuyerBase component
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';

export default function BuyerNotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_URL}/api/buyer/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch notifications.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (isLoading) {
    return (
      <BuyerBase title="Notifications">
        <ActivityIndicator size="large" color="#1565c0" style={{ marginTop: 20 }} />
      </BuyerBase>
    );
  }

  return (
    <BuyerBase title="Notifications">
      <View style={styles.container}>
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationDate}>{new Date(item.date).toLocaleDateString()}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noNotificationsText}>No notifications yet.</Text>
        )}
      </View>
    </BuyerBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  notificationItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
  },
  notificationMessage: {
    fontSize: 16,
    marginTop: 5,
  },
  noNotificationsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});