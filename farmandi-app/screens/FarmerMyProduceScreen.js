// screens/FarmerMyProduceScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import FarmerBase from '../components/FarmerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';

const MyProduceItem = ({ item, navigation, onDelete }) => (
  <View style={styles.itemContainer}>
    {item.photo ? (
      <Image source={{ uri: item.photo }} style={styles.itemImage} />
    ) : (
      <View style={styles.itemImagePlaceholder}>
        <Text>No Image</Text>
      </View>
    )}
    <View style={styles.itemDetails}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemText}>Category: {item.category}</Text>
      <Text style={styles.itemText}>Price: ₹{item.price}</Text>
      <Text style={styles.itemText}>Quantity: {item.quantity} kg</Text>
      <Text style={[styles.itemText, { color: item.status === 'Available' ? 'green' : 'orange' }]}>
        Status: {item.status}
      </Text>
    </View>
    <View style={styles.itemActions}>
      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('FarmerEditProduce', { produceId: item.id })}>
        <Text style={styles.actionButtonText}>Edit</Text>
      </Pressable>
      <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(item.id)}>
        <Text style={styles.actionButtonText}>Delete</Text>
      </Pressable>
    </View>
  </View>
);

export default function FarmerMyProduceScreen() {
  const [produce, setProduce] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Hook to re-fetch when the screen comes into focus

  const fetchProduce = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/api/farmer/produce`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProduce(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch your produce listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchProduce();
    }
  }, [isFocused]);

  const handleDelete = (id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this produce listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${API_URL}/api/farmer/produce/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Produce deleted successfully.');
              fetchProduce(); // Refresh the list
            } catch (error) {
              Alert.alert('Error', 'Could not delete the produce listing.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <FarmerBase title="My Produce">
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} />
      </FarmerBase>
    );
  }

  return (
    <FarmerBase title="My Produce">
      {produce.length === 0 ? (
        <Text style={styles.noItemsText}>You have no produce listings.</Text>
      ) : (
        <FlatList
          data={produce}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MyProduceItem item={item} navigation={navigation} onDelete={handleDelete} />}
        />
      )}
    </FarmerBase>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
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
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  itemText: {
    fontSize: 14,
    color: '#555',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});