// screens/FarmerEditProduceScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import FarmerBase from '../components/FarmerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';

export default function FarmerEditProduceScreen({ route, navigation }) {
  const { produceId } = route.params;
  const [item, setItem] = useState(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState('Available');
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        // Assuming you have a GET endpoint for single produce items
        const response = await axios.get(`${API_URL}/api/farmer/produce/${produceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedItem = response.data;
        setItem(fetchedItem);
        setPrice(String(fetchedItem.price));
        setQuantity(String(fetchedItem.quantity));
        setStatus(fetchedItem.status);
        setImage(fetchedItem.photo);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch produce details.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchItemDetails();
  }, [produceId]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const formData = new FormData();
      formData.append('price', price);
      formData.append('quantity', quantity);
      formData.append('status', status);

      // Check if a new image was selected
      if (image && !image.startsWith('data:')) {
        formData.append('image', {
          uri: image,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });
      }

      await axios.put(`${API_URL}/api/farmer/produce/${produceId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Produce updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update produce.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !item) {
    return (
      <FarmerBase title="Edit Produce">
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} />
      </FarmerBase>
    );
  }

  return (
    <FarmerBase title="Edit Produce">
      <View style={styles.formContainer}>
        <Text style={styles.label}>Price (per kg):</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />

        <Text style={styles.label}>Quantity (kg):</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />

        <Text style={styles.label}>Status:</Text>
        <Picker selectedValue={status} onValueChange={(itemValue) => setStatus(itemValue)} style={styles.picker}>
          <Picker.Item label="Available" value="Available" />
          <Picker.Item label="Paused" value="Paused" />
          <Picker.Item label="Sold" value="Sold" />
        </Picker>

        <Text style={styles.label}>Change Produce Image:</Text>
        <Pressable onPress={pickImage} style={styles.imagePickerButton}>
          <Text style={styles.imagePickerButtonText}>Select Image</Text>
        </Pressable>
        {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

        <Pressable style={styles.submitButton} onPress={handleUpdate}>
          <Text style={styles.submitButtonText}>Update Produce</Text>
        </Pressable>
      </View>
    </FarmerBase>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  imagePickerButton: {
    backgroundColor: '#2e7d32',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  imagePickerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
    marginTop: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});