import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useRoute } from '@react-navigation/native'; // Use useRoute to get params
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://qy0rsl-5000.bytexl.dev';

export default function LoginRegisterScreen() {
    const route = useRoute(); // Get the route object to access params
    const { authContext } = route.params; // Extract authContext from route params
    
    const [isLoginForm, setIsLoginForm] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pincode, setPincode] = useState('');
    const [userType, setUserType] = useState('farmer');
    const [villages, setVillages] = useState([]);
    const [village, setVillage] = useState('');
    const [district, setDistrict] = useState('');
    const [state, setState] = useState('');
    const [loading, setLoading] = useState(false);

    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const toggleForm = () => {
        setIsLoginForm(!isLoginForm);
        setName('');
        setEmail('');
        setPassword('');
        setPincode('');
        setVillages([]);
        setVillage('');
        setDistrict('');
        setState('');
        setUserType('farmer');
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/login`, {
                email,
                password,
                user_type: userType,
            });
            
            const { access_token, user_type } = response.data;
            
            // Call the signIn function from authContext to update the global state
            await authContext.signIn(access_token, user_type);
            
            Alert.alert('Success', 'Login successful!');
            
            // NOTE: The navigation is now handled by the App.js component 
            // after the global state is updated. No need for navigation.navigate here.

        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/register`, {
                name,
                email,
                password,
                pincode,
                village,
                district,
                state,
                user_type: userType,
            });
            Alert.alert('Success', response.data.message);
            toggleForm();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocationDetails = async () => {
        if (pincode.length !== 6) {
            Alert.alert('Error', 'Enter a valid 6-digit pincode.');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = res.data;
            if (data[0].Status === 'Success' && data[0].PostOffice) {
                const postOffices = data[0].PostOffice;
                setVillages(postOffices.map(post => post.Name));
                setVillage(postOffices[0].Name);
                setDistrict(postOffices[0].District);
                setState(postOffices[0].State);
            } else {
                Alert.alert('Error', 'Invalid Pincode or no data found.');
                setVillages([]);
                setVillage('');
                setDistrict('');
                setState('');
            }
        } catch (error) {
            Alert.alert('Error', 'Error fetching location info.');
        } finally {
            setLoading(false);
        }
    };

    const renderLoginForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back!</Text>
            <Text style={styles.subTitle}>Sign in to your account</Text>
            <View style={styles.inputGroup}>
                <TextInput style={styles.input} placeholder="Email Address" onChangeText={setEmail} value={email} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
            </View>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={userType} onValueChange={setUserType} style={styles.picker}>
                    <Picker.Item label="Select User Type" value="" />
                    <Picker.Item label="Farmer" value="farmer" />
                    <Picker.Item label="Buyer" value="buyer" />
                    <Picker.Item label="Retailer" value="retailer" />
                    <Picker.Item label="Distributor" value="distributor" />
                    <Picker.Item label="Admin" value="admin" />
                </Picker>
            </View>
            <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </Pressable>
            <Text style={styles.switchText}>
                Don't have an account? <Text style={styles.link} onPress={toggleForm}>Register here</Text>
            </Text>
        </View>
    );

    const renderRegisterForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create an Account</Text>
            <Text style={styles.subTitle}>Join the Farmandi community</Text>
            <View style={styles.inputGroup}>
                <TextInput style={styles.input} placeholder="Full Name" onChangeText={setName} value={name} />
                <TextInput style={styles.input} placeholder="Email Address" onChangeText={setEmail} value={email} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
            </View>
            <View style={styles.pincodeRow}>
                <TextInput style={[styles.input, styles.pincodeInput]} placeholder="Enter Pincode" onChangeText={setPincode} value={pincode} keyboardType="numeric" maxLength={6} />
                <Pressable style={styles.pincodeButton} onPress={fetchLocationDetails} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Fetch</Text>}
                </Pressable>
            </View>
            <View style={styles.inputGroup}>
                <View style={styles.pickerContainer}>
                    <Picker selectedValue={village} onValueChange={setVillage} style={styles.picker}>
                        <Picker.Item label="Select Village/Post Office" value="" />
                        {villages.map((v, index) => <Picker.Item key={index} label={v} value={v} />)}
                    </Picker>
                </View>
                <TextInput style={styles.input} placeholder="District" value={district} editable={false} />
                <TextInput style={styles.input} placeholder="State" value={state} editable={false} />
            </View>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={userType} onValueChange={setUserType} style={styles.picker}>
                    <Picker.Item label="Select User Type" value="" />
                    <Picker.Item label="Farmer" value="farmer" />
                    <Picker.Item label="Buyer" value="buyer" />
                    <Picker.Item label="Retailer" value="retailer" />
                    <Picker.Item label="Distributor" value="distributor" />
                    <Picker.Item label="Admin" value="admin" />
                </Picker>
            </View>
            <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
            </Pressable>
            <Text style={styles.switchText}>
                Already have an account? <Text style={styles.link} onPress={toggleForm}>Login here</Text>
            </Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={[styles.container, !isMobile && { flexDirection: 'row' }]}>
            <View style={[styles.leftPanel, isMobile && styles.mobileLeftPanel]}>
                <Text style={styles.title}>Farmandi</Text>
                <Text style={styles.description}>
                    Empowering farmers to connect directly with buyers, retailers, and distributors. Simplify your selling process and increase your profit.
                </Text>
            </View>
            <View style={styles.rightPanel}>
                {isLoginForm ? renderLoginForm() : renderRegisterForm()}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f9f9f9',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftPanel: {
        flex: 1,
        backgroundColor: '#1E6F3A',
        padding: 40,
        justifyContent: 'center',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        marginRight: 20,
    },
    mobileLeftPanel: {
        marginBottom: 20,
        width: '100%',
        marginRight: 0,
    },
    title: {
        fontSize: 48,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 18,
        color: '#D4E8D4',
        lineHeight: 28,
        textAlign: 'center',
    },
    rightPanel: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 40,
        justifyContent: 'center',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    formContainer: {
        width: '100%',
    },
    formTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 25,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 15,
    },
    input: {
        height: 55,
        backgroundColor: '#F7F7F7',
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    pickerContainer: {
        backgroundColor: '#F7F7F7',
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    picker: {
        height: 55,
        color: '#333',
    },
    pincodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    pincodeInput: {
        flex: 2,
        marginRight: 10,
    },
    pincodeButton: {
        flex: 1,
        height: 55,
        backgroundColor: '#2E7D32',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    button: {
        backgroundColor: '#2E7D32',
        paddingVertical: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 18,
    },
    switchText: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 15,
        color: '#666',
    },
    link: {
        color: '#2E7D32',
        fontWeight: '600',
    },
});