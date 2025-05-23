import React, { useState, useEffect } from "react";
import { StyleSheet, View, SafeAreaView, Alert, TouchableOpacity, TextInput as RNTextInput, Switch } from "react-native";
import { Card, Title, Paragraph, Button, Text, Modal, Portal, Provider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import UserProfile from "../components/UserProfile";

const PatientDetailScreen = ({ navigation, route }) => {
  const { patient } = route.params || {};
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientData, setPatientData] = useState(patient);
  useEffect(() => {
    fetchUserData();
    
    if (!patient) {
      Alert.alert("Error", "Patient information not found");
      navigation.goBack();
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

  const handleEditPatient = () => {
    setEditingPatient({
      name: patient.name,
      phone: patient.phone || "", // Include phone field
      age: patient.age.toString(),
      gender: patient.gender,
      pregnancy_status: patient.pregnancy_status || false,
    });
    setEditModalVisible(true);
  };

  const handleSavePatientChanges = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("LoginScreen");
        return;
      }

      const response = await fetch(`http://172.20.128.61:3000/api/patients/${patient.patient_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingPatient.name,
          phone: editingPatient.phone,
          age: parseInt(editingPatient.age, 10),
          gender: editingPatient.gender,
          pregnancy_status: editingPatient.gender === "Female" ? editingPatient.pregnancy_status : false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local patient data without navigating away
        const updatedPatient = {
          ...patient,
          name: editingPatient.name,
          phone: editingPatient.phone,
          age: parseInt(editingPatient.age, 10),
          gender: editingPatient.gender,
          pregnancy_status: editingPatient.gender === "Female" ? editingPatient.pregnancy_status : false,
        };

        // Update state
        route.params.patient = updatedPatient; // Update the route params

        Alert.alert("Success", "Patient information updated successfully");
        setEditModalVisible(false);

        // Force re-render by setting patient state if you have one
        // If you don't have a patient state, add this:
        const [patientData, setPatientData] = useState(patient);
        // And use this to update:
        setPatientData(updatedPatient);

        // Stay on the same screen instead of navigating away
      } else {
        Alert.alert("Error", data.error || "Failed to update patient information");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      Alert.alert("Error", "Failed to update patient information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Provider>
      <Background>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            {userData && (
              <TouchableOpacity
                style={styles.profileContainer}
                onPress={() => navigation.navigate("ProfileScreen")}
              >
                <UserProfile username={userData.username} role={userData.role} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.content}>
            <Logo />
            <Header>Patient Details</Header>

            {patient ? (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Title style={styles.title}>{patientData.name}</Title>
                  

                  <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoValue}>{patientData.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoValue}>{patientData.phone || "N/A"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Age:</Text>
                      <Text style={styles.infoValue}>{patientData.age}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Gender:</Text>
                      <Text style={styles.infoValue}>{patientData.gender}</Text>
                    </View>
                    {patientData.gender === "Female" && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Pregnancy Status:</Text>
                        <Text style={styles.infoValue}>
                          {patientData.pregnancy_status ? "Pregnant" : "Not Pregnant"}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Button 
                    mode="contained" 
                    onPress={handleEditPatient} 
                    style={styles.editButton}
                  >
                    Edit Patient
                  </Button>
                  
                  <Button 
                    mode="contained" 
                    onPress={() => navigation.navigate("UploadScreen", { patient })} 
                    style={styles.screeningButton}
                  >
                    New Screening
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <Text style={styles.errorText}>No patient information available</Text>
            )}

            <Button
              mode="outlined"
              onPress={() => navigation.navigate("PatientListScreen")}
              style={styles.button}
            >
              Back to Patient List
            </Button>
          </View>

          <Portal>
            <Modal
              visible={editModalVisible}
              onDismiss={() => setEditModalVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Title style={styles.modalTitle}>Edit Patient</Title>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <RNTextInput
                  style={styles.input}
                  value={editingPatient?.name || ""}
                  onChangeText={text => setEditingPatient(prev => ({...prev, name: text}))}
                  placeholder="Enter patient name"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone</Text>
                <RNTextInput
                  style={styles.input}
                  value={editingPatient?.phone || ""}
                  onChangeText={text => setEditingPatient(prev => ({...prev, phone: text}))}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age</Text>
                <RNTextInput
                  style={styles.input}
                  value={editingPatient?.age ? editingPatient.age.toString() : ""}
                  onChangeText={text => setEditingPatient(prev => ({...prev, age: text}))}
                  keyboardType="numeric"
                  placeholder="Enter patient age"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      editingPatient?.gender === "Male" && styles.radioButtonSelected
                    ]}
                    onPress={() => setEditingPatient(prev => ({...prev, gender: "Male"}))}
                  >
                    <Text style={styles.radioText}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      editingPatient?.gender === "Female" && styles.radioButtonSelected
                    ]}
                    onPress={() => setEditingPatient(prev => ({...prev, gender: "Female"}))}
                  >
                    <Text style={styles.radioText}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {editingPatient?.gender === "Female" && (
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Pregnancy Status</Text>
                  <View style={styles.switchRow}>
                    <Switch
                      value={editingPatient?.pregnancy_status || false}
                      onValueChange={value => 
                        setEditingPatient(prev => ({...prev, pregnancy_status: value}))
                      }
                    />
                    <Text style={styles.switchText}>
                      {editingPatient?.pregnancy_status ? "Pregnant" : "Not Pregnant"}
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <Button 
                  mode="outlined" 
                  onPress={() => setEditModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSavePatientChanges}
                  style={styles.modalButton}
                  loading={loading}
                >
                  Save
                </Button>
              </View>
            </Modal>
          </Portal>
        </SafeAreaView>
      </Background>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileContainer: {
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    marginVertical: 10,
  },
  cardContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  infoContainer: {
    width: "100%",
    marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontWeight: "bold",
    color: "#666",
  },
  infoValue: {
    color: "#333",
  },
  errorText: {
    marginVertical: 20,
    fontSize: 16,
    color: "red",
  },
  button: {
    width: "100%",
    marginVertical: 10,
  },
  editButton: {
    marginTop: 20,
    width: "100%",
  },
  screeningButton: {
    marginTop: 10,
    backgroundColor: "#009688",
    width: "100%",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radioButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 10,
    flex: 1,
    alignItems: "center",
  },
  radioButtonSelected: {
    backgroundColor: "#6200ee",
    borderColor: "#6200ee",
  },
  radioText: {
    fontWeight: "bold",
  },
  switchContainer: {
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchText: {
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default PatientDetailScreen; 