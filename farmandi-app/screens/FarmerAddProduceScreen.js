// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
// import FarmerBase from '../components/FarmerBase';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as ImagePicker from 'expo-image-picker';
// import { useNavigation } from '@react-navigation/native';

// const API_URL = 'https://qy0rsl-5000.bytexl.dev'; // Your Flask backend URL

// // Data for categories and items, replicating the HTML example
// const CATEGORIES = [
//     { emoji: "🥦", name: "Vegetable" },
//     { emoji: "🍎", name: "Fruit" },
//     { emoji: "🌾", name: "Grain" },
//     { emoji: "🫘", name: "Pulses" },
//     { emoji: "🍯", name: "Other" }
// ];

// const CATEGORY_ITEMS = {
//     "Vegetable": [{ emoji: "🥔", name: "Potato" }, { emoji: "🍅", name: "Tomato" }, { emoji: "🥕", name: "Carrot" }, { emoji: "🧅", name: "Onion" }, { emoji: "🥬", name: "Spinach" }],
//     "Fruit": [{ emoji: "🍎", name: "Apple" }, { emoji: "🍌", name: "Banana" }, { emoji: "🥭", name: "Mango" }, { emoji: "🍊", name: "Orange" }, { emoji: "🍇", name: "Grapes" }],
//     "Grain": [{ emoji: "🌾", name: "Rice" }, { emoji: "🌾", name: "Wheat" }, { emoji: "🌾", name: "Barley" }, { emoji: "🌽", name: "Corn" }],
//     "Pulses": [{ emoji: "🫘", name: "Lentil" }, { emoji: "🫘", name: "Chickpea" }, { emoji: "🫘", name: "Green Gram" }, { emoji: "🫘", name: "Black Gram" }],
//     "Other": [{ emoji: "🍯", name: "Honey" }, { emoji: "🍬", name: "Jaggery" }, { emoji: "🥜", name: "Dry Fruits" }]
// };

// export default function FarmerAddProduceScreen() {
//     const [currentStep, setCurrentStep] = useState(1);
//     const [name, setName] = useState('');
//     const [category, setCategory] = useState('');
//     const [price, setPrice] = useState('');
//     const [quantity, setQuantity] = useState('');
//     const [image, setImage] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const navigation = useNavigation();

//     const pickImage = async () => {
//         const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//         if (status !== 'granted') {
//             Alert.alert('Permission required', 'Please allow access to your photos to upload an image.');
//             return;
//         }

//         let result = await ImagePicker.launchImageLibraryAsync({
//             mediaTypes: ImagePicker.MediaTypeOptions.Images,
//             allowsEditing: true,
//             aspect: [4, 3],
//             quality: 1,
//         });

//         if (!result.canceled) {
//             setImage(result.assets[0].uri);
//         }
//     };

//     const handleSelectCategory = (catName) => {
//         setCategory(catName);
//         setCurrentStep(2);
//     };

//     const handleSelectItem = (itemName) => {
//         setName(itemName);
//         setCurrentStep(3);
//     };

//     const handleSubmit = async () => {
//         if (!name || !price || !quantity || !category) {
//             Alert.alert('Missing Fields', 'Please fill in all required fields.');
//             return;
//         }

//         setIsLoading(true);

//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const formData = new FormData();
//             formData.append('name', name);
//             formData.append('category', category);
//             formData.append('price', price);
//             formData.append('quantity', quantity);

//             if (image) {
//                 const filename = image.split('/').pop();
//                 formData.append('image', {
//                     uri: image,
//                     name: filename,
//                     type: 'image/jpeg',
//                 });
//             }

//             await axios.post(`${API_URL}/api/farmer/produce`, formData, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'multipart/form-data',
//                 },
//             });

//             Alert.alert('Success', 'Produce added successfully!');
//             setName('');
//             setCategory('');
//             setPrice('');
//             setQuantity('');
//             setImage(null);
//             setCurrentStep(1); // Reset to the first step
//             navigation.navigate('FarmerMyProduce');
//         } catch (error) {
//             console.error('Error adding produce:', error);
//             Alert.alert('Error', 'Failed to add produce. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const renderStep1 = () => (
//         <View style={styles.stepContainer}>
//             <Text style={styles.stepTitle}>Step 1: Select Category</Text>
//             <View style={styles.buttonsContainer}>
//                 {CATEGORIES.map((cat, index) => (
//                     <Pressable key={index} style={styles.selectionButton} onPress={() => handleSelectCategory(cat.name)}>
//                         <Text style={styles.emoji}>{cat.emoji}</Text>
//                         <Text style={styles.buttonText}>{cat.name}</Text>
//                     </Pressable>
//                 ))}
//             </View>
//         </View>
//     );

//     const renderStep2 = () => (
//         <View style={styles.stepContainer}>
//             <Text style={styles.stepTitle}>Step 2: Select Item</Text>
//             <View style={styles.buttonsContainer}>
//                 {CATEGORY_ITEMS[category]?.map((item, index) => (
//                     <Pressable key={index} style={styles.selectionButton} onPress={() => handleSelectItem(item.name)}>
//                         <Text style={styles.emoji}>{item.emoji}</Text>
//                         <Text style={styles.buttonText}>{item.name}</Text>
//                     </Pressable>
//                 ))}
//             </View>
//             <Pressable style={styles.backButton} onPress={() => setCurrentStep(1)}>
//                 <Text style={styles.backButtonText}>⬅ Back to Categories</Text>
//             </Pressable>
//         </View>
//     );

//     const renderStep3 = () => (
//         <View style={styles.stepContainer}>
//             <Text style={styles.stepTitle}>Step 3: Enter Details</Text>
//             <Text style={styles.selectedItemText}>You selected: {name} ({category})</Text>

//             <Text style={styles.label}>Price (per kg):</Text>
//             <TextInput style={styles.input} keyboardType="numeric" onChangeText={setPrice} value={price} placeholder="e.g., 50.00" />

//             <Text style={styles.label}>Quantity (kg):</Text>
//             <TextInput style={styles.input} keyboardType="numeric" onChangeText={setQuantity} value={quantity} placeholder="e.g., 100" />

//             <Text style={styles.label}>Produce Image:</Text>
//             <Pressable onPress={pickImage} style={styles.imagePickerButton}>
//                 <Text style={styles.imagePickerButtonText}>Select Image</Text>
//             </Pressable>
//             {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

//             <View style={styles.actionButtons}>
//                 <Pressable style={styles.backButton} onPress={() => setCurrentStep(2)}>
//                     <Text style={styles.backButtonText}>⬅ Back to Items</Text>
//                 </Pressable>
//                 <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
//                     {isLoading ? (
//                         <ActivityIndicator color="white" />
//                     ) : (
//                         <Text style={styles.submitButtonText}>Add Produce</Text>
//                     )}
//                 </Pressable>
//             </View>
//         </View>
//     );

//     const renderCurrentStep = () => {
//         switch (currentStep) {
//             case 1:
//                 return renderStep1();
//             case 2:
//                 return renderStep2();
//             case 3:
//                 return renderStep3();
//             default:
//                 return renderStep1();
//         }
//     };

//     return (
//         <FarmerBase title="Add Produce">
//             <ScrollView contentContainerStyle={styles.scrollContainer}>
//                 <View style={styles.formCard}>
//                     {renderCurrentStep()}
//                 </View>
//             </ScrollView>
//         </FarmerBase>
//     );
// }

// const styles = StyleSheet.create({
//     scrollContainer: {
//         flexGrow: 1,
//         padding: 20,
//         backgroundColor: '#f9f9f9',
//     },
//     formCard: {
//         backgroundColor: '#fff',
//         borderRadius: 15,
//         padding: 20,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 10,
//         elevation: 8,
//     },
//     stepContainer: {
//         width: '100%',
//     },
//     stepTitle: {
//         fontSize: 24,
//         fontWeight: '700',
//         color: '#1E6F3A',
//         textAlign: 'center',
//         marginBottom: 20,
//     },
//     selectedItemText: {
//         fontSize: 18,
//         fontWeight: '500',
//         color: '#333',
//         textAlign: 'center',
//         marginBottom: 20,
//     },
//     buttonsContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         justifyContent: 'center',
//         marginBottom: 20,
//     },
//     selectionButton: {
//         backgroundColor: '#F5F5F5',
//         borderRadius: 10,
//         padding: 15,
//         alignItems: 'center',
//         justifyContent: 'center',
//         margin: 8,
//         minWidth: 100,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//     },
//     emoji: {
//         fontSize: 40,
//         marginBottom: 5,
//     },
//     buttonText: {
//         fontSize: 16,
//         fontWeight: '500',
//         color: '#333',
//     },
//     backButton: {
//         padding: 15,
//         backgroundColor: '#E0E0E0',
//         borderRadius: 10,
//         alignItems: 'center',
//         marginTop: 15,
//     },
//     backButtonText: {
//         color: '#333',
//         fontWeight: '600',
//     },
//     label: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#555',
//         marginBottom: 8,
//         marginTop: 15,
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: '#E0E0E0',
//         padding: 15,
//         borderRadius: 10,
//         fontSize: 16,
//         color: '#333',
//         marginBottom: 10,
//     },
//     imagePickerButton: {
//         backgroundColor: '#1E6F3A',
//         padding: 15,
//         borderRadius: 10,
//         alignItems: 'center',
//         marginTop: 10,
//     },
//     imagePickerButtonText: {
//         color: 'white',
//         fontWeight: '600',
//     },
//     imagePreview: {
//         width: 250,
//         height: 180,
//         resizeMode: 'contain',
//         marginTop: 20,
//         alignSelf: 'center',
//         borderWidth: 2,
//         borderColor: '#ddd',
//         borderRadius: 10,
//     },
//     actionButtons: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 20,
//     },
//     submitButton: {
//         flex: 1,
//         backgroundColor: '#2E7D32',
//         padding: 18,
//         borderRadius: 10,
//         alignItems: 'center',
//         marginLeft: 10,
//     },
//     submitButtonText: {
//         color: 'white',
//         fontWeight: 'bold',
//         fontSize: 18,
//     },
// });

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import FarmerBase from '../components/FarmerBase';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://qy0rsl-5000.bytexl.dev'; // Your Flask backend URL

// Data for categories and items, replicating the HTML example
const CATEGORIES = [
    { emoji: "🥦", name: "Vegetable" },
    { emoji: "🍎", name: "Fruit" },
    { emoji: "🌾", name: "Grain" },
    { emoji: "🫘", name: "Pulses" },
    { emoji: "🍯", name: "Other" }
];

const CATEGORY_ITEMS = {
    "Vegetable": [
        { emoji: "🥔", name: "Potato" },
        { emoji: "🍅", name: "Tomato" },
        { emoji: "🥕", name: "Carrot" },
        { emoji: "🧅", name: "Onion" },
        { emoji: "🥬", name: "Spinach" },
        { emoji: "🥒", name: "Cucumber" },
        { emoji: "🌶️", name: "Chili" },
        { emoji: "🥦", name: "Broccoli" },
        { emoji: "🍆", name: "Eggplant" },
        { emoji: "🫑", name: "Bell Pepper" },
        { emoji: "🧄", name: "Garlic" },
        { emoji: "🌽", name: "Corn" },
        { emoji: "🥗", name: "Lettuce" },
        { emoji: "🥜", name: "Peas" },
        { emoji: "🍠", name: "Sweet Potato" },
        { emoji: "🥚", name: "Mushroom" },
        { emoji: "🥦", name: "Cauliflower" },
        { emoji: "🥬", name: "Cabbage" },
        { emoji: "🥒", name: "Zucchini" },
        { emoji: "🥕", name: "Radish" }
    ],
    "Fruit": [
        { emoji: "🍎", name: "Apple" },
        { emoji: "🍌", name: "Banana" },
        { emoji: "🥭", name: "Mango" },
        { emoji: "🍊", name: "Orange" },
        { emoji: "🍇", name: "Grapes" },
        { emoji: "🍉", name: "Watermelon" },
        { emoji: "🍓", name: "Strawberry" },
        { emoji: "🍍", name: "Pineapple" },
        { emoji: "🍑", name: "Peach" },
        { emoji: "🍒", name: "Cherry" },
        { emoji: "🥝", name: "Kiwi" },
        { emoji: "🍐", name: "Pear" },
        { emoji: "🍈", name: "Melon" },
        { emoji: "🍋", name: "Lemon" },
        { emoji: "🫐", name: "Blueberry" },
        { emoji: "🍏", name: "Green Apple" },
        { emoji: "🍅", name: "Guava" },
        { emoji: "🍊", name: "Tangerine" },
        { emoji: "🍌", name: "Plantain" }
    ],
    "Grain": [
        { emoji: "🌾", name: "Rice" },
        { emoji: "🌾", name: "Wheat" },
        { emoji: "🌾", name: "Barley" },
        { emoji: "🌽", name: "Maize" },
        { emoji: "🌾", name: "Oats" },
        { emoji: "🌾", name: "Millet" },
        { emoji: "🌾", name: "Sorghum" },
        { emoji: "🌾", name: "Rye" },
        { emoji: "🌾", name: "Quinoa" },
        { emoji: "🌾", name: "Buckwheat" }
    ],
    "Pulses": [
        { emoji: "🫘", name: "Lentil" },
        { emoji: "🫘", name: "Chickpea" },
        { emoji: "🫘", name: "Green Gram" },
        { emoji: "🫘", name: "Black Gram" },
        { emoji: "🫘", name: "Kidney Beans" },
        { emoji: "🫘", name: "Soybean" },
        { emoji: "🫘", name: "Pigeon Pea" },
        { emoji: "🫘", name: "Pea" },
        { emoji: "🫘", name: "Moth Bean" },
        { emoji: "🫘", name: "Horse Gram" },
        { emoji: "🫘", name: "Black Eyed Pea" },
        { emoji: "🫘", name: "Fava Bean" }
    ],
    "Other": [
        { emoji: "🍯", name: "Honey" },
        { emoji: "🍬", name: "Jaggery" },
        { emoji: "🥜", name: "Dry Fruits" },
        { emoji: "🥛", name: "Milk" },
        { emoji: "🧀", name: "Cheese" },
        { emoji: "🍄", name: "Mushroom" },
        { emoji: "🥚", name: "Egg" },
        { emoji: "🍗", name: "Chicken" },
        { emoji: "🍖", name: "Meat" },
        { emoji: "🥚", name: "Duck Egg" },
        { emoji: "🥓", name: "Bacon" },
        { emoji: "🧈", name: "Butter" },
        { emoji: "🥯", name: "Bagel" }
    ]
};

export default function FarmerAddProduceScreen() {
    const [currentStep, setCurrentStep] = useState(1);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const pickImage = async () => {
        // Ask for permissions
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted' || mediaStatus !== 'granted') {
            Alert.alert('Permission required', 'Please allow access to your camera and photos.');
            return;
        }

        // Show options to user
        Alert.alert(
            'Select Image',
            'Choose image source',
            [
                {
                    text: 'Camera',
                    onPress: async () => {
                        let result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 1,
                        });
                        if (!result.canceled) {
                            setImage(result.assets[0].uri);
                        }
                    }
                },
                {
                    text: 'Browse',
                    onPress: async () => {
                        let result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 1,
                        });
                        if (!result.canceled) {
                            setImage(result.assets[0].uri);
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleSelectCategory = (catName) => {
        setCategory(catName);
        setCurrentStep(2);
    };

    const handleSelectItem = (itemName) => {
        setName(itemName);
        setCurrentStep(3);
    };

    const handleSubmit = async () => {
        if (!name || !price || !quantity || !category) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setIsLoading(true);

        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();
            formData.append('name', name);
            formData.append('category', category);
            formData.append('price', price);
            formData.append('quantity', quantity);

            if (image) {
                const filename = image.split('/').pop();
                formData.append('image', {
                    uri: image,
                    name: filename,
                    type: 'image/jpeg',
                });
            }

            await axios.post(`${API_URL}/api/farmer/produce`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Produce added successfully!');
            setName('');
            setCategory('');
            setPrice('');
            setQuantity('');
            setImage(null);
            setCurrentStep(1); // Reset to the first step
            navigation.navigate('FarmerMyProduce');
        } catch (error) {
            console.error('Error adding produce:', error);
            Alert.alert('Error', 'Failed to add produce. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Select Category</Text>
            <View style={styles.buttonsContainer}>
                {CATEGORIES.map((cat, index) => (
                    <Pressable key={index} style={styles.selectionButton} onPress={() => handleSelectCategory(cat.name)}>
                        <Text style={styles.emoji}>{cat.emoji}</Text>
                        <Text style={styles.buttonText}>{cat.name}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 2: Select Item</Text>
            <View style={styles.buttonsContainer}>
                {CATEGORY_ITEMS[category]?.map((item, index) => (
                    <Pressable key={index} style={styles.selectionButton} onPress={() => handleSelectItem(item.name)}>
                        <Text style={styles.emoji}>{item.emoji}</Text>
                        <Text style={styles.buttonText}>{item.name}</Text>
                    </Pressable>
                ))}
            </View>
            <Pressable style={styles.backButton} onPress={() => setCurrentStep(1)}>
                <Text style={styles.backButtonText}>⬅ Back to Categories</Text>
            </Pressable>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 3: Enter Details</Text>
            <Text style={styles.selectedItemText}>You selected: {name} ({category})</Text>

            <Text style={styles.label}>Price (per kg):</Text>
            <TextInput style={styles.input} keyboardType="numeric" onChangeText={setPrice} value={price} placeholder="e.g., 50.00" />

            <Text style={styles.label}>Quantity (kg):</Text>
            <TextInput style={styles.input} keyboardType="numeric" onChangeText={setQuantity} value={quantity} placeholder="e.g., 100" />

            <Text style={styles.label}>Produce Image:</Text>
            <Pressable onPress={pickImage} style={styles.imagePickerButton}>
                <Text style={styles.imagePickerButtonText}>Select Image</Text>
            </Pressable>
            {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

            <View style={styles.actionButtons}>
                <Pressable style={styles.backButton} onPress={() => setCurrentStep(2)}>
                    <Text style={styles.backButtonText}>⬅ Back to Items</Text>
                </Pressable>
                <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Add Produce</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            default:
                return renderStep1();
        }
    };

    return (
        <FarmerBase title="Add Produce">
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formCard}>
                    {renderCurrentStep()}
                </View>
            </ScrollView>
        </FarmerBase>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    stepContainer: {
        width: '100%',
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E6F3A',
        textAlign: 'center',
        marginBottom: 20,
    },
    selectedItemText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
    },
    selectionButton: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 8,
        minWidth: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emoji: {
        fontSize: 40,
        marginBottom: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    backButton: {
        padding: 15,
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    backButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    imagePickerButton: {
        backgroundColor: '#1E6F3A',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    imagePickerButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    imagePreview: {
        width: 250,
        height: 180,
        resizeMode: 'contain',
        marginTop: 20,
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#2E7D32',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginLeft: 10,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});