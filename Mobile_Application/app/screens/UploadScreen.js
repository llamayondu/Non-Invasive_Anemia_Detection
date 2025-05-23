import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Alert, TouchableOpacity, Text, SafeAreaView, Dimensions } from "react-native";
import { CameraView } from 'expo-camera';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import UserProfile from "../components/UserProfile";
import { ActivityIndicator } from "react-native-paper";

export default function UploadScreen({ navigation, route }) {
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [userData, setUserData] = useState(null);
  const [screeningId, setScreeningId] = useState(null);
  const [cameraType, setCameraType] = useState('back');
  const cameraRef = React.useRef(null);

  // Get patient data from route params
  const patient = route.params?.patient;

  useEffect(() => {
    fetchUserData();

    // Redirect to patient list if no patient is selected
    if (!patient) {
      Alert.alert("Error", "No patient selected. Please select a patient first.");
      navigation.navigate("PatientListScreen");
    }
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

  const toggleCameraType = () => {
    setCameraType(current => current === 'back' ? 'front' : 'back');
  };

  const takePicture = async () => {
    try {
      if (!cameraRef.current) {
        console.error('Camera ref is not available');
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true
      });

      if (photo && photo.uri) {
        setImageUri(photo.uri);
        setImageBase64(photo.base64);
        uploadImage(photo.base64);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };

  async function uploadImage(base64Image) {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        Alert.alert("Error", "You are not logged in. Please login again.");
        navigation.navigate("LoginScreen");
        return;
      }

      const response = await fetch("http://172.20.128.61:3000/api/screenings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          imageData: `data:image/jpeg;base64,${base64Image}`,
          patientId: patient.patient_id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUploadComplete(true);
        setScreeningId(data.screening_id);
      } else {
        console.error("Upload failed:", data.error);
        Alert.alert("Upload Failed", data.error || "Failed to upload image. Please try again.");
      }
    } catch (error) {
      console.error("Error during upload:", error);
      Alert.alert("Upload Error", "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function processImage() {
    if (!screeningId) {
      Alert.alert("Error", "No image to process. Please take a photo first.");
      return;
    }

    try {
      setProcessingImage(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`http://172.20.128.61:3000/api/screenings/${screeningId}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("Processing response:", data); // Debug log

      if (data.success) {
        navigation.navigate("ResultsScreen", {
          screening: data.screening,
          patient: patient,
          historicalData: data.historicalData,
          segmentedImage: data.images.segmented,
          originalImage: data.images.original,
          processedData: data
        });
      } else {
        console.error("Processing failed:", data.error);
        if (data.error && (data.error.includes("not clear") || data.error.includes("not bright") || data.error.includes("quality") || data.message)) {
          navigation.navigate("ResultsScreen", {
            errorMessage: data.error || data.message || "The image is not clear or bright enough for accurate analysis.",
            originalImage: imageUri,
            patient: patient
          });
        } else {
          Alert.alert("Processing Failed", data.error || "Failed to process image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error during processing:", error);
      Alert.alert("Processing Error", "Failed to process image. Please try again.");
    } finally {
      setProcessingImage(false);
    }
  }

  const handleRetakePicture = () => {
    setImageUri(null);
    setImageBase64(null);
    setUploadComplete(false);
    setScreeningId(null);
  };

  // Calculate crop parameters based on the Python script (asymmetric_crop function)
  const calculateCropGuidePosition = (containerSize) => {
    // In the Python script:
    // left = int(excess_w * 0.47)
    // top = int(excess_h * 0.45)
    // This means 47% of excess width from left, 45% of excess height from top

    // For the right and bottom:
    // right = left + size = left + 640
    // bottom = top + size = top + 640

    // Assuming containerSize is the width/height of our imageContainer (300)
    // We need to calculate the proportional crop size and positions

    // First, determine what percentage of the full image the crop size represents
    // Let's assume the actual photo is square for simplicity
    const cropSizePixels = 640; // The target crop size in pixels

    // Container size is our display size (e.g., 300px)
    const cropSizeOnScreen = containerSize * 0.7; // Approximate crop size relative to container

    // Calculate the percentage offset from each edge
    const leftOffsetPercent = 2.17; // 47% of excess from left
    const topOffsetPercent = 1.35;  // 45% of excess from top

    // Calculate the actual offset in display pixels
    const leftOffset = (containerSize - cropSizeOnScreen) * leftOffsetPercent;
    const topOffset = (containerSize - cropSizeOnScreen) * topOffsetPercent;

    return {
      width: cropSizeOnScreen,
      height: cropSizeOnScreen,
      left: leftOffset,
      top: topOffset
    };
  };

  // Get the crop guide position for our container
  const cropGuidePos = calculateCropGuidePosition(150); // 300px is our container size

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {userData && (
            <TouchableOpacity
              style={styles.profileContainer}
              onPress={() => navigation.navigate("ProfileScreen")}
            >
              <UserProfile
                username={userData.username}
                role={userData.role}
              />
            </TouchableOpacity>
          )}

          {patient && (
            <TouchableOpacity
              style={styles.patientContainer}
              onPress={() => navigation.navigate("PatientDetailScreen", { patient })}
            >
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientDetails}>
                  Age: {patient.age} | Gender: {patient.gender}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <Header>
            {imageUri ? "Captured Image" : "Take Photo"}
          </Header>

          {imageUri ? (
            <>
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <View style={styles.cropOverlay}>
                  <View style={[
                    styles.cropGuide,
                    {
                      width: cropGuidePos.width,
                      height: cropGuidePos.height,
                      left: cropGuidePos.left,
                      top: cropGuidePos.top
                    }
                  ]} />
                </View>
              </View>

              {loading ? (
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
                  <Text style={styles.statusText}>Uploading image...</Text>
                </View>
              ) : uploadComplete ? (
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleRetakePicture}
                    style={styles.button}
                  >
                    Retake
                  </Button>
                  <Button
                    mode="contained"
                    onPress={processImage}
                    style={[styles.button, styles.processButton]}
                    loading={processingImage}
                    disabled={processingImage}
                  >
                    Process
                  </Button>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.imageContainer}>
                <CameraView
                  style={styles.camera}
                  facing={cameraType}
                  ref={cameraRef}
                >
                  <View style={styles.cameraOverlay}>
                    {/* Square crop guide overlay */}
                    <View style={styles.cropGuideContainer}>
                      <View style={[
                        styles.cropGuide,
                        {
                          width: cropGuidePos.width,
                          height: cropGuidePos.height,
                          left: cropGuidePos.left,
                          top: cropGuidePos.top
                        }
                      ]} />

                    </View>

                    <View style={styles.cameraButtonsContainer}>
                      <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={toggleCameraType}
                      >
                        <Text style={styles.cameraButtonText}>Flip</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cameraButton, styles.captureButton]}
                        onPress={takePicture}
                      >
                        <Text style={styles.cameraButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </CameraView>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 10,
  },
  profileContainer: {
    alignSelf: "flex-end",
  },
  patientContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  patientInfo: {
    alignItems: "flex-end",
  },
  patientName: {
    fontWeight: "bold",
    fontSize: 14,
  },
  patientDetails: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  imageContainer: {
    width: 300,
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 20,
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  cropGuideContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cropGuide: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  cropGuideText: {
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    marginHorizontal: 10,
    marginVertical: 10,
    width: "40%",
  },
  processButton: {
    backgroundColor: "#009688",
  },
  cameraButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cameraButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  captureButton: {
    backgroundColor: 'red',
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  loader: {
    marginVertical: 10,
  },
});