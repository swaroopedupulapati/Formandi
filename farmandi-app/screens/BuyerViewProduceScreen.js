import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import BuyerBase from '../components/BuyerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';
const { width } = Dimensions.get('window');

export default function BuyerViewProduceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { produceId, authContext } = route.params;

  const [produce, setProduce] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  
  // Order Form State
  const [quantity, setQuantity] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data Fetching (GET) ---
  useEffect(() => {
    const fetchProduceDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_URL}/api/buyer/produce/${produceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProduce(response.data.produce);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch produce details.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduceDetails();
  }, [produceId]);

  // --- Order Submission (POST) ---
  const handlePlaceOrder = async () => {
    if (!quantity || !offerPrice || !buyerName || !buyerPhone || !buyerAddress) {
      Alert.alert('Missing Fields', 'Please fill in all order and delivery details.');
      return;
    }

    const qty = parseFloat(quantity);
    const offer = parseFloat(offerPrice);
    
    if (isNaN(qty) || isNaN(offer) || qty <= 0 || qty > produce.quantity) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity and offer price, and ensure quantity is available.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const postData = {
          quantity: qty,
          offer_price: offer,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          buyer_address: buyerAddress,
      };

      await axios.post(`${API_URL}/api/buyer/produce/${produceId}`, postData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      Alert.alert('Success', 'Order placed successfully! Check My Orders for updates.');
      navigation.navigate('BuyerOrders', { authContext });
      
    } catch (error) {
      console.error('Error placing order:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !produce) {
    return (
      <BuyerBase title="Place Order" authContext={authContext}>
        <ActivityIndicator size="large" color="#1565c0" style={styles.loadingIndicator} />
      </BuyerBase>
    );
  }

  const isMobile = width < 600;

  return (
    <BuyerBase title={`Order for ${produce.name}`} authContext={authContext}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.produceDetailContainer}>
          
          <View style={[styles.mainContentRow, isMobile && { flexDirection: 'column' }]}>
            
            {/* Left Column: Image */}
            <View style={[styles.imageColumn, isMobile && { width: '100%', marginBottom: 20 }]}>
              <Image 
                source={{ uri: produce.photo || 'https://via.placeholder.com/300' }} 
                style={styles.produceImage} 
              />
            </View>

            {/* Right Column: Info & Buy Button */}
            <View style={[styles.infoColumn, isMobile && { width: '100%' }]}>
              <Text style={styles.detailText}>**Category:** {produce.category}</Text>
              <Text style={styles.detailText}>**Price:** ₹{produce.price}/kg</Text>
              <Text style={styles.detailText}>**Available:** {produce.quantity} kg</Text>
              <Text style={styles.detailText}>**Farmer:** {produce.farmer_name}</Text>

              {/* Buy Button: Show only if the form is NOT visible */}
              {!showOrderForm && ( 
                  <Pressable 
                    style={styles.buyButton} 
                    onPress={() => setShowOrderForm(true)}
                  >
                    <Text style={styles.buyButtonText}>🛒 Buy Now</Text>
                  </Pressable>
              )}
            </View>
          </View>

          {/* Hidden Order Form */}
          {showOrderForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>🧾 Order Details</Text>
              
              <Text style={styles.label}>Quantity (kg):</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder={`Max ${produce.quantity} kg`}
                value={quantity}
                onChangeText={setQuantity}
                maxLength={5}
              />
              
              <Text style={styles.label}>Offer Price (₹):</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Your offer price"
                value={offerPrice}
                onChangeText={setOfferPrice}
              />

              <Text style={styles.formTitle}>🚚 Delivery Details</Text>
              
              <Text style={styles.label}>Full Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                value={buyerName}
                onChangeText={setBuyerName}
              />
              
              <Text style={styles.label}>Phone Number:</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="10-digit phone number"
                value={buyerPhone}
                onChangeText={setBuyerPhone}
              />
              
              <Text style={styles.label}>Delivery Address:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="House No, Street, Village, Pincode"
                value={buyerAddress}
                onChangeText={setBuyerAddress}
                multiline={true}
                numberOfLines={3}
              />

              <Pressable style={styles.confirmButton} onPress={handlePlaceOrder} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyButtonText}>Confirm Order</Text>}
              </Pressable>
            </View>
          )}

        </View>
      </ScrollView>
    </BuyerBase>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  produceDetailContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 20,
  },
  mainContentRow: {
    flexDirection: 'row',
    gap: 20,
  },
  imageColumn: {
    flex: 1,
    minWidth: 300,
  },
  infoColumn: {
    flex: 2,
    minWidth: 300,
  },
  produceImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  buyButton: {
    backgroundColor: '#1565c0',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  formContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: '#1565c0',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
});