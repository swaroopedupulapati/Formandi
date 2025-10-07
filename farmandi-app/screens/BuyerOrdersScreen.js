import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import BuyerBase from '../components/BuyerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';

const OrderItem = ({ order }) => (
  <View style={styles.orderItem}>
    <Text style={styles.produceName}>{order.produce_name}</Text>
    <View style={styles.orderDetailRow}>
      <Text style={styles.label}>Quantity:</Text>
      <Text style={styles.value}>{order.quantity} kg</Text>
    </View>
    <View style={styles.orderDetailRow}>
      <Text style={styles.label}>Offer Price:</Text>
      <Text style={styles.value}>₹{order.offer_price}</Text>
    </View>
    <View style={styles.orderDetailRow}>
      <Text style={styles.label}>Status:</Text>
      <Text style={[styles.value, { color: order.status === 'Pending' ? 'orange' : (order.status === 'Accepted' ? 'green' : 'red') }]}>
        {order.status}
      </Text>
    </View>
    <View style={styles.orderDetailRow}>
      <Text style={styles.label}>Date:</Text>
      <Text style={styles.value}>{new Date(order.created_at).toLocaleDateString()}</Text>
    </View>
  </View>
);

export default function BuyerOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_URL}/api/buyer/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch your orders.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <BuyerBase title="My Orders">
        <ActivityIndicator size="large" color="#1565c0" style={{ marginTop: 20 }} />
      </BuyerBase>
    );
  }

  return (
    <BuyerBase title="My Orders">
      <View style={styles.container}>
        {orders.length > 0 ? (
          <FlatList
            data={orders}
            keyExtractor={item => item._id}
            renderItem={({ item }) => <OrderItem order={item} />}
          />
        ) : (
          <Text style={styles.noOrdersText}>You have not placed any orders yet.</Text>
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
  orderItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  produceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  orderDetailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 80,
  },
  value: {
    flex: 1,
  },
  noOrdersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});