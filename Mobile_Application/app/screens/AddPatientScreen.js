import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Text, SafeAreaView, Image, ScrollView, Alert } from "react-native";
import { TextInput, Button, Switch, ActivityIndicator } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import * as ImagePicker from 'expo-image-picker';
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import UserProfile from "../components/UserProfile";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  age: yup
    .number()
    .typeError("Age must be a number")
    .positive("Age must be positive")
    .integer("Age must be an integer")
    .required("Age is required"),
  gender: yup
    .string()
    .oneOf(["Male", "Female", "Other"], "Invalid gender")
    .required("Gender is required"),
});

const AddPatientScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [pregnancyStatus, setPregnancyStatus] = useState(false);
  const [userData, setUserData] = useState(null);
  const [aadharImage, setAadharImage] = useState(null);
  const [aadharBase64, setAadharBase64] = useState(null);
  const [extractingData, setExtractingData] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      age: "",
      gender: "Male",
    },
  });

  const gender = watch("gender");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUserData({
          userId: decoded.userId,
          role: decoded.role,
          username: decoded.username,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const pickAadharImage = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload your Aadhar card');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAadharImage(asset.uri);
        setAadharBase64(`data:image/jpeg;base64,${asset.base64}`);
        
        // Process Aadhar image to extract patient information
        extractPatientData(asset.base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image. Please try again.');
    }
  };

  const captureAadharImage = async () => {
    try {
      // Request permission to use camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your camera to take a photo of your Aadhar card');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAadharImage(asset.uri);
        setAadharBase64(`data:image/jpeg;base64,${asset.base64}`);
        
        // Process Aadhar image to extract patient information
        extractPatientData(asset.base64);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Could not capture image. Please try again.');
    }
  };

  const removeAadharImage = () => {
    setAadharImage(null);
    setAadharBase64(null);
  };

  const extractPatientData = async (base64Image) => {
    try {
      setExtractingData(true);
      const token = await AsyncStorage.getItem("token");
      
      console.log("Sending Aadhar image for extraction");
      const response = await fetch("http://172.20.128.61:3000/api/extract-aadhar-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          aadhar_image: `data:image/jpeg;base64,${base64Image}`
        }),
      });

      console.log("Received extraction response");
      const data = await response.json();
      console.log("Extraction result:", data);
      
      let fieldsExtracted = false;
      
      // Auto-fill form with extracted data if available
      if (data.patientData) {
        const patientData = data.patientData;
        
        if (patientData.name) {
          console.log("Setting name:", patientData.name);
          setValue("name", patientData.name);
          fieldsExtracted = true;
        }
        
        if (patientData.age) {
          console.log("Setting age:", patientData.age);
          setValue("age", patientData.age.toString());
          fieldsExtracted = true;
        }
        
        if (patientData.gender) {
          console.log("Setting gender:", patientData.gender);
          setValue("gender", patientData.gender);
          if (patientData.gender === "Female") {
            setPregnancyStatus(false);
          }
          fieldsExtracted = true;
        }
      }
      
      if (fieldsExtracted) {
        Alert.alert(
          "Data Extracted",
          "Patient information has been extracted from the Aadhar card and filled in the form. Please verify and complete any missing fields."
        );
      } else {
        // Show debugging info in the alert for better visibility
        const rawTextPreview = data.rawText ? 
          `\n\nRaw text preview: ${data.rawText.substring(0, 100)}...` : '';
          
        Alert.alert(
          "No Data Extracted", 
          `Could not extract patient information from the image. Please fill in the details manually.${rawTextPreview}`
        );
      }
    } catch (error) {
      console.error("Error extracting data:", error);
      Alert.alert(
        "Extraction Error",
        `Failed to process the Aadhar image: ${error.message || "Unknown error"}\n\nPlease fill in the details manually.`
      );
    } finally {
      setExtractingData(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch("http://172.20.128.61:3000/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          pregnancy_status: gender === "Female" ? pregnancyStatus : false,
        }),
      });

      const result = await response.json();
      if (result.success) {
        navigation.navigate("UploadScreen", { patient: result.patient });
      } else {
        alert("Error: " + (result.error || "Failed to add patient"));
      }
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("Error adding patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        {userData && (
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <UserProfile username={userData.username} role={userData.role} />
          </TouchableOpacity>
        )}

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Logo />
            <Header>Add New Patient</Header>

            {/* Aadhar Image Upload Section */}
            <View style={styles.aadharSection}>
              <Text style={styles.sectionTitle}>Upload Aadhar Card (Optional)</Text>
              <Text style={styles.sectionDescription}>
                Upload an Aadhar card to automatically fill in patient details
              </Text>

              {aadharImage ? (
                <View style={styles.aadharPreviewContainer}>
                  <Image source={{ uri: aadharImage }} style={styles.aadharPreview} />
                  {extractingData ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#6200ee" />
                      <Text style={styles.loadingText}>Extracting patient information...</Text>
                    </View>
                  ) : (
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={() => extractPatientData(aadharBase64.split('base64,')[1])}
                      >
                        <Text style={styles.buttonText}>Retry Extraction</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeButton} 
                        onPress={removeAadharImage}
                      >
                        <Text style={styles.buttonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.aadharButtonsContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={pickAadharImage} 
                    style={styles.aadharButton}
                    icon="image"
                  >
                    Browse Gallery
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={captureAadharImage} 
                    style={styles.aadharButton}
                    icon="camera"
                  >
                    Take Photo
                  </Button>
                </View>
              )}
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Patient Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={styles.input}
                    error={!!errors.name}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    style={styles.input}
                    error={!!errors.phone}
                  />
                )}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}

              <Controller
                control={control}
                name="age"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Age"
                    value={value.toString()}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    style={styles.input}
                    error={!!errors.age}
                  />
                )}
              />
              {errors.age && (
                <Text style={styles.errorText}>{errors.age.message}</Text>
              )}

              <Text style={styles.label}>Gender</Text>
              <View style={styles.radioGroup}>
                {["Male", "Female", "Other"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioButton,
                      gender === option && styles.radioButtonSelected,
                    ]}
                    onPress={() => setValue("gender", option)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        gender === option && styles.radioTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender.message}</Text>
              )}

              {gender === "Female" && (
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Pregnancy Status</Text>
                  <Switch
                    value={pregnancyStatus}
                    onValueChange={setPregnancyStatus}
                  />
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                style={styles.button}
                loading={loading}
                disabled={loading || extractingData}
              >
                Add Patient
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.button}
                disabled={loading || extractingData}
              >
                Cancel
              </Button>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollView: {
    width: "100%",
  },
  profileContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  content: {
    flex: 1,
    width: "100%",
    padding: 20,
    alignItems: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 10,
  },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 20,
  },
  radioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6200ee",
  },
  radioButtonSelected: {
    backgroundColor: "#6200ee",
  },
  radioText: {
    color: "#6200ee",
  },
  radioTextSelected: {
    color: "#fff",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
  },
  button: {
    marginTop: 15,
  },
  errorText: {
    color: "#f13a59",
    marginBottom: 10,
  },
  aadharSection: {
    width: "100%",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  aadharButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  aadharButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  aadharPreviewContainer: {
    alignItems: "center",
    width: "100%",
  },
  aadharPreview: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    borderRadius: 5,
    marginVertical: 10,
  },
  removeButton: {
    backgroundColor: "#f13a59",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6200ee',
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AddPatientScreen;