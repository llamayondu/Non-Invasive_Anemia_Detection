import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, Text, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { Card, Title, Paragraph, Button, Divider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Background from "../components/Background";
import Header from "../components/Header";
import UserProfile from "../components/UserProfile";
import { ActivityIndicator } from "react-native-paper";

export default function ResultsScreen({ navigation, route }) {
  const [userData, setUserData] = useState(null);
  const [segmentedImageUri, setSegmentedImageUri] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);

  // Get data from route params
  const { screening, patient, historicalData, errorMessage, originalImage, segmentedImage, processedData } = route.params || {};

  useEffect(() => {
    fetchUserData();

    // Process image data if available
    if (segmentedImage) {
      // If it's already a URI (from retake)
      if (segmentedImage.startsWith('file://') || segmentedImage.startsWith('http')) {
        setSegmentedImageUri(segmentedImage);
      }
      // If it's base64 data
      else if (segmentedImage.startsWith('data:image')) {
        setSegmentedImageUri(segmentedImage);
      }
      setLoadingImage(false);
    }

    // Debug log to check received data
    console.log("ResultsScreen received data:", {
      screening,
      segmentedImage,
      processedData
    });

    // Redirect if no screening data and no error message
    if (!screening && !errorMessage) {
      alert("No screening data available");
      navigation.navigate("PatientListScreen");
    }
  }, [route.params]);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUserData({
          userId: decoded.userId,
          role: decoded.role,
          username: decoded.username,
          email: decoded.email
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusStyle = (hemoglobinValue) => {
    // WHO guidelines for anemia (general)
    if (hemoglobinValue < 8) {
      return { color: "#d32f2f", text: "Severe Anemia" }; // Red
    } else if (hemoglobinValue < 11) {
      return { color: "#f57c00", text: "Moderate Anemia" }; // Orange
    } else if (hemoglobinValue < 12) {
      return { color: "#fbc02d", text: "Mild Anemia" }; // Yellow
    } else {
      return { color: "#388e3c", text: "Normal" }; // Green
    }
  };

  const statusStyle = screening ? getStatusStyle(screening.hemoglobin_value) : null;

  const handleReupload = () => {
    if (patient) {
      navigation.navigate("UploadScreen", { patient });
    } else {
      navigation.navigate("PatientListScreen");
    }
  };

  const handleEditPatient = () => {
    if (patient) {
      navigation.navigate("PatientDetailScreen", { patient });
    }
  };

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
              onPress={() => navigation.navigate("PatientListScreen")}
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

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.content}>
            <Header>Analysis Results</Header>

            {errorMessage ? (
              // Display error when image is unclear or dim
              <>
                <Card style={styles.errorCard}>
                  <Card.Content>
                    <Title style={styles.errorTitle}>Image Processing Failed</Title>
                    <Paragraph style={styles.errorDescription}>{errorMessage}</Paragraph>

                    {originalImage && (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: originalImage }}
                          style={styles.image}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    <Button
                      mode="contained"
                      onPress={handleReupload}
                      style={styles.reuploadButton}
                    >
                      Upload New Image
                    </Button>
                  </Card.Content>
                </Card>
              </>
            ) : screening ? (
              // Display results when screening is successful
              <>
                <Card style={styles.card}>
                  <Card.Content>
                    <Title>Hemoglobin Analysis</Title>
                    <View style={styles.valueContainer}>
                      <Text style={styles.value}>{screening.hemoglobin_value}</Text>
                      <Text style={styles.unit}>g/dL</Text>
                    </View>

                    <View style={[styles.statusContainer, { backgroundColor: statusStyle.color }]}>
                      <Text style={styles.statusText}>{statusStyle.text}</Text>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.detailsContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Confidence:</Text>
                        <Text style={styles.detailValue}>{(screening.confidence_score * 100).toFixed(1)}%</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(screening.timestamp)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Operator:</Text>
                        <Text style={styles.detailValue}>{userData?.username || "Unknown"}</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>

                <Card style={styles.imageCard}>
                  <Card.Content>
                    <Title>Analyzed Image</Title>
                    {loadingImage ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6200ee" />
                        <Text style={styles.loadingText}>Loading processed image...</Text>
                      </View>
                    ) : segmentedImageUri ? (
                      <Image
                        source={{ uri: segmentedImageUri }}
                        style={styles.image}
                        resizeMode="contain"
                        onError={(e) => {
                          console.log('Image load error:', e.nativeEvent.error);
                          Alert.alert("Image Error", "Could not load processed image");
                        }}
                      />
                    ) : (
                      <Text style={styles.errorText}>No processed image available</Text>
                    )}
                  </Card.Content>
                </Card>

                {historicalData && (
                  <Card style={styles.historyCard}>
                    <Card.Content>
                      <Title>Previous Value</Title>
                      <Paragraph>
                        Previous Hb: {historicalData.previous_hb_value} g/dL
                      </Paragraph>
                      <Paragraph>
                        Date: {formatDate(historicalData.measurement_date)}
                      </Paragraph>
                    </Card.Content>
                  </Card>
                )}
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No analysis results available</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate("PatientListScreen")}
                style={styles.button}
              >
                Back to Patients
              </Button>

              {patient && (
                <Button
                  mode="outlined"
                  onPress={handleEditPatient}
                  style={styles.button}
                >
                  Edit Patient Details
                </Button>
              )}

              {!errorMessage && (
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate("UploadScreen", { patient })}
                  style={styles.button}
                >
                  New Screening
                </Button>
              )}
            </View>
          </View>
        </ScrollView>
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
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  card: {
    width: "100%",
    marginVertical: 10,
    elevation: 3,
  },
  errorCard: {
    width: "100%",
    marginVertical: 10,
    elevation: 3,
    backgroundColor: "#ffebee",
  },
  errorTitle: {
    color: "#d32f2f",
    marginBottom: 10,
  },
  errorDescription: {
    marginBottom: 15,
  },
  imageContainer: {
    width: "100%",
    marginVertical: 15,
    alignItems: "center",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginVertical: 15,
  },
  value: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
  },
  unit: {
    fontSize: 20,
    color: "#666",
    marginBottom: 8,
    marginLeft: 5,
  },
  statusContainer: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    marginVertical: 10,
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#666",
  },
  detailValue: {
    color: "#333",
  },
  imageCard: {
    width: "100%",
    marginVertical: 10,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 250,
    marginVertical: 10,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  historyCard: {
    width: "100%",
    marginVertical: 10,
    elevation: 3,
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 16,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 20,
  },
  button: {
    marginVertical: 10,
  },
  reuploadButton: {
    marginTop: 15,
    backgroundColor: "#4CAF50",
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});