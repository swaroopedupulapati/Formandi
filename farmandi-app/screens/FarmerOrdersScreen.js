// screens/FarmerOrdersScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import FarmerBase from '../components/FarmerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const API_URL = 'https://qy0rsl-5000.bytexl.dev'; // Your Flask backend URL

// --- Action Map and Styles ---
const ACTION_MAP = {
  Pending: {
    accept: { label: 'Accept', color: '#4caf50' },
    reject: { label: 'Reject', color: '#f44336' },
  },
  Accepted: { pack: { label: 'Mark Packed', color: '#ff9800' } },
  Packed: { out_for_delivery: { label: 'Out for Delivery', color: '#2196f3' } },
  'Out for Delivery': { delivered: { label: 'Mark Delivered', color: '#8bc34a' } },
};

const getActionButtonProps = (status) => {
  return ACTION_MAP[status] || {};
};

// --- Order Item Component ---
const OrderItem = ({ order, onUpdateStatus }) => {
  const actions = getActionButtonProps(order.status);
  
  return (
    <View style={styles.orderItem}>
      <Text style={styles.produceName}>{order.produce_name}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Buyer:</Text>
        <Text style={styles.infoValue}>{order.buyer_name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Phone:</Text>
        <Text style={styles.infoValue}>{order.buyer_phone || 'N/A'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Address:</Text>
        <Text style={styles.infoValue}>{order.buyer_address || 'N/A'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Quantity:</Text>
        <Text style={styles.infoValue}>{order.quantity} kg</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Offer Price:</Text>
        <Text style={styles.infoValue}>₹{order.offer_price}</Text>
      </View>
      
      <Text style={[styles.statusText, { color: actions ? '#2e7d32' : '#888' }]}>
        Status: {order.status}
      </Text>

      {Object.keys(actions).length > 0 && (
        <View style={styles.actionContainer}>
          {Object.entries(actions).map(([actionKey, actionProps]) => (
            <Pressable
              key={actionKey}
              style={[styles.actionButton, { backgroundColor: actionProps.color }]}
              onPress={() => onUpdateStatus(order._id, actionKey)}
            >
              <Text style={styles.actionButtonText}>{actionProps.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Main Screen Component ---
export default function FarmerOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/api/farmer/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, action) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark this order as '${ACTION_MAP[action]?.label || action}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.put(`${API_URL}/api/farmer/orders/${orderId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert("Success", `Order status updated to ${ACTION_MAP[action]?.label}.`);
              fetchOrders(); // Refresh the list
            } catch (error) {
              Alert.alert("Error", error.response?.data?.error || "Failed to update order status.");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [isFocused]);

  if (isLoading) {
    return (
      <FarmerBase title="Incoming Orders">
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} />
      </FarmerBase>
    );
  }

  return (
    <FarmerBase title="Incoming Orders">
      <View style={styles.listContainer}>
        {orders.length > 0 ? (
          <FlatList
            data={orders}
            keyExtractor={item => item._id}
            renderItem={({ item }) => <OrderItem order={item} onUpdateStatus={handleUpdateStatus} />}
          />
        ) : (
          <Text style={styles.noOrdersText}>No incoming orders yet.</Text>
        )}
      </View>
    </FarmerBase>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    padding: 10,
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 80,
    color: '#555',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noOrdersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});