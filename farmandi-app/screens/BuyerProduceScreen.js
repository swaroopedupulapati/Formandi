import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native';
import BuyerBase from '../components/BuyerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';
const { width } = Dimensions.get('window');

const ProduceCard = ({ item, navigation, authContext }) => (
  <Pressable
    style={styles.card}
    onPress={() => navigation.navigate('BuyerViewProduce', { produceId: item.id, authContext })}
  >
    <Image 
        source={{ uri: item.photo || 'https://via.placeholder.com/180' }} 
        style={styles.cardImage} 
        resizeMode="cover" 
    />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardText}>Category: {item.category}</Text>
      <Text style={styles.priceText}>Price: ₹{item.price}/kg</Text>
      <Text style={styles.cardText}>Quantity: {item.quantity} kg</Text>
      <Text style={styles.farmerText}>Farmer: {item.farmer_name}</Text>
      <View style={styles.orderButton}>
        <Text style={styles.orderButtonText}>View & Order</Text>
      </View>
    </View>
  </Pressable>
);

export default function BuyerProduceScreen() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const { authContext } = route.params;

  useEffect(() => {
    const fetchProduceListings = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_URL}/api/buyer/produce`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListings(response.data);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch produce listings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduceListings();
  }, []);

  if (isLoading) {
    return (
      <BuyerBase title="Browse Produce" authContext={authContext}>
        <ActivityIndicator size="large" color="#1565c0" style={{ marginTop: 20 }} />
      </BuyerBase>
    );
  }

  return (
    <BuyerBase title="Browse Produce" authContext={authContext}>
      {listings.length > 0 ? (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProduceCard item={item} navigation={navigation} authContext={authContext} />}
          numColumns={width < 600 ? 1 : 2} // Single column on small screens, two on larger screens
          columnWrapperStyle={width >= 600 && styles.row}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noProduceText}>No available produce at the moment.</Text>
      )}
    </BuyerBase>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 5,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: width < 600 ? '100%' : '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: width < 600 ? 0 : '1%',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E6F3A',
    marginVertical: 4,
  },
  farmerText: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },
  orderButton: {
    backgroundColor: '#1565c0',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  orderButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noProduceText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});