import React, { useState, useEffect } from "react";
import { StyleSheet, View, SafeAreaView, Alert, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import { Card, Title, Paragraph, Avatar, Button, Text, Modal, Portal, Provider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("LoginScreen");
        return;
      }

      const response = await fetch("http://172.20.128.61:3000/api/user/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      navigation.reset({
        index: 0,
        routes: [{ name: "StartScreen" }],
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleEditUser = () => {
    setEditingUser({
      username: userData.username,
    });
    setEditModalVisible(true);
  };

  const handleSaveUserChanges = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("LoginScreen");
        return;
      }

      const response = await fetch("http://172.20.128.61:3000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editingUser.username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserData(prev => ({ ...prev, username: editingUser.username }));
        Alert.alert("Success", "Profile updated successfully");
        setEditModalVisible(false);
      } else {
        Alert.alert("Error", data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAadhar = () => {
    setAadharImage(null);
    setAadharBase64(null);
    setAadharModalVisible(true);
  };

  const pickAadharImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload your Aadhar card');
        return;
      }

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
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image. Please try again.');
    }
  };

  const captureAadharImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your camera to take a photo of your Aadhar card');
        return;
      }

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
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Could not capture image. Please try again.');
    }
  };

  const verifyAadhar = async () => {
    if (!aadharBase64) {
      Alert.alert("Error", "Please select or take a photo of your Aadhar card first");
      return;
    }

    try {
      setVerifying(true);
      const token = await AsyncStorage.getItem("token");
      
      const response = await fetch("http://172.20.128.61:3000/api/verify-aadhar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          aadhar_image: aadharBase64
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          "Success", 
          "Your Aadhar card has been verified successfully!",
          [
            { 
              text: "OK", 
              onPress: () => {
                setAadharModalVisible(false);
                fetchUserData(); // Refresh user data
              }
            }
          ]
        );
      } else {
        Alert.alert("Verification Failed", data.error || "Could not verify Aadhar. Please try again with a clearer image.");
      }
    } catch (error) {
      console.error("Error verifying Aadhar:", error);
      Alert.alert("Error", "Failed to verify Aadhar. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Provider>
      <Background>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Logo />
            <Header>My Profile</Header>

            {userData ? (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Avatar.Text
                    size={80}
                    label={userData.username.charAt(0).toUpperCase()}
                    style={styles.avatar}
                  />
                  <Title style={styles.title}>{userData.username}</Title>
                  <Paragraph style={styles.subtitle}>{userData.role}</Paragraph>

                  <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoValue}>{userData.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>User ID:</Text>
                      <Text style={styles.infoValue}>{userData.userId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Created:</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(userData.created_at)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Login:</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(userData.last_login)}
                      </Text>
                    </View>
                  </View>

                  <Button
                    mode="contained"
                    onPress={handleEditUser}
                    style={styles.editButton}
                  >
                    Edit Profile
                  </Button>
                </Card.Content>
              </Card>
            ) : loading ? (
              <Text style={styles.loadingText}>Loading profile...</Text>
            ) : (
              <Text style={styles.errorText}>Failed to load profile</Text>
            )}

            <Button
              mode="contained"
              onPress={() => navigation.navigate("PatientListScreen")}
              style={styles.button}
            >
              Return to Patients
            </Button>

            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.button}
              color="#f13a59"
            >
              Logout
            </Button>
          </View>

          <Portal>
            <Modal
              visible={editModalVisible}
              onDismiss={() => setEditModalVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Title style={styles.modalTitle}>Edit Profile</Title>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <RNTextInput
                  style={styles.input}
                  value={editingUser?.username || ""}
                  onChangeText={text => setEditingUser(prev => ({ ...prev, username: text }))}
                  placeholder="Enter username"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email (Cannot be changed)</Text>
                <RNTextInput
                  style={[styles.input, styles.disabledInput]}
                  value={userData?.email || ""}
                  editable={false}
                />
              </View>

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
                  onPress={handleSaveUserChanges}
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
  avatar: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
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
  loadingText: {
    marginVertical: 20,
    fontSize: 16,
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
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#666",
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

export default ProfileScreen; 