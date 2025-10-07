// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import all your screens
import LoginRegisterScreen from './screens/LoginRegisterScreen';

// Farmer Screens
import FarmerDashboardScreen from './screens/FarmerDashboardScreen';
import FarmerAddProduceScreen from './screens/FarmerAddProduceScreen';
import FarmerMyProduceScreen from './screens/FarmerMyProduceScreen';
import FarmerOrdersScreen from './screens/FarmerOrdersScreen';
import FarmerNotificationsScreen from './screens/FarmerNotificationsScreen';
import FarmerEditProduceScreen from './screens/FarmerEditProduceScreen';

// Buyer Screens
import BuyerDashboardScreen from './screens/BuyerDashboardScreen';
import BuyerOrdersScreen from './screens/BuyerOrdersScreen';
import BuyerProduceScreen from './screens/BuyerProduceScreen';
import BuyerNotificationsScreen from './screens/BuyerNotificationsScreen';
import BuyerViewProduceScreen from './screens/BuyerViewProduceScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    // Check for a stored token and user type on app launch
    const bootstrapAsync = async () => {
      let storedToken;
      let storedUserType;
      try {
        storedToken = await AsyncStorage.getItem('userToken');
        storedUserType = await AsyncStorage.getItem('userType');
      } catch (e) {
        console.error('Failed to restore token:', e);
      }
      setUserToken(storedToken);
      setUserType(storedUserType);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (token, type) => {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userType', type);
        setUserToken(token);
        setUserType(type);
      },
      signOut: async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userType');
        setUserToken(null);
        setUserType(null);
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  const FarmerStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FarmerDashboard" component={FarmerDashboardScreen} initialParams={{ authContext }} />
      <Stack.Screen name="FarmerAddProduce" component={FarmerAddProduceScreen} initialParams={{ authContext }} />
      <Stack.Screen name="FarmerMyProduce" component={FarmerMyProduceScreen} initialParams={{ authContext }} />
      <Stack.Screen name="FarmerOrders" component={FarmerOrdersScreen} initialParams={{ authContext }} />
      <Stack.Screen name="FarmerNotifications" component={FarmerNotificationsScreen} initialParams={{ authContext }} />
      <Stack.Screen name="FarmerEditProduce" component={FarmerEditProduceScreen} initialParams={{ authContext }} />
    </Stack.Navigator>
  );

  const BuyerStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuyerDashboard" component={BuyerDashboardScreen} initialParams={{ authContext }} />
      <Stack.Screen name="BuyerProduce" component={BuyerProduceScreen} initialParams={{ authContext }} />
      <Stack.Screen name="BuyerViewProduce" component={BuyerViewProduceScreen} initialParams={{ authContext }} />
      <Stack.Screen name="BuyerOrders" component={BuyerOrdersScreen} initialParams={{ authContext }} />
      <Stack.Screen name="BuyerNotifications" component={BuyerNotificationsScreen} initialParams={{ authContext }} />
    </Stack.Navigator>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Auth" component={LoginRegisterScreen} initialParams={{ authContext }} />
        ) : userType === 'farmer' ? (
          <Stack.Screen name="Farmer" component={FarmerStack} />
        ) : (
          <Stack.Screen name="Buyer" component={BuyerStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});