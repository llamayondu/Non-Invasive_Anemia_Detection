import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Text, TextInput, SafeAreaView } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Background from "../components/Background";
import UserProfile from "../components/UserProfile";
import { FontAwesome } from "@expo/vector-icons";
import { Card, Title, Paragraph } from "react-native-paper";
import { useFocusEffect } from '@react-navigation/native';

const PatientListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [userData, setUserData] = useState(null);

  // Remove currentPage and searchQuery from the dependency array
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      // Always fetch the first page when navigating to this screen
      // This ensures fresh data and resets pagination
      setCurrentPage(1);
      fetchPatients(1, searchQuery);
      
      return () => {
        // Cleanup function if needed
      };
    }, []) // Empty dependency array makes this run on every focus
  );

  // Add a separate effect to handle pagination and search changes
  useEffect(() => {
    if (currentPage > 0) { // Skip the initial render
      fetchPatients(currentPage, searchQuery);
    }
  }, [currentPage, searchQuery]);

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

  const fetchPatients = async (page, search = "") => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `http://172.20.128.61:3000/api/patients?page=${page}&limit=10&search=${search}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.patients) {
        setPatients(data.patients);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    fetchPatients(1, text); // Fetch patients dynamically as the user types
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to the first page when searching
    fetchPatients(1, searchQuery); // Fetch patients with the new search query
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchPatients(currentPage - 1, searchQuery);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchPatients(currentPage + 1, searchQuery);
    }
  };

  const handlePatientSelect = (patient) => {
    navigation.navigate("UploadScreen", { patient });
  };

  const handleAddNewPatient = () => {
    navigation.navigate("AddPatientScreen");
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
              <UserProfile username={userData.username} role={userData.role} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNewPatient}
          >
            <FontAwesome name="plus-circle" size={36} color="#6200ee" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            onChangeText={handleSearchChange} // Trigger search dynamically
            value={searchQuery}
            placeholder="Search patients by name or phone number"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Title style={styles.title}>Patients</Title>

          {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color="#6200ee" />
          ) : patients.length > 0 ? (
            <FlatList
              data={patients}
              keyExtractor={(item) => item.patient_id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handlePatientSelect(item)}>
                  <Card style={styles.card}>
                    <Card.Content>
                      <Title style={styles.patientName}>{item.name}</Title>
                      <Paragraph style={styles.phoneNumber}>
                        Phone: {item.phone || "N/A"}
                      </Paragraph>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.list}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No patients found</Text>
              <Button
                mode="contained"
                onPress={handleAddNewPatient}
                style={styles.emptyButton}
              >
                Add New Patient
              </Button>
            </View>
          )}

          {patients.length > 0 && (
            <View style={styles.pagination}>
              <Button
                mode="text"
                disabled={currentPage === 1}
                onPress={handlePrevPage}
              >
                Previous
              </Button>
              <Text>
                Page {currentPage} of {totalPages || 1}
              </Text>
              <Button
                mode="text"
                disabled={currentPage === totalPages}
                onPress={handleNextPage}
              >
                Next
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 0,
    margin: 0,
  },
  profileContainer: {
    position: "absolute",
    top: 20,
    right: 10,
    zIndex: 10,
  },
  addButton: {
    position: "absolute",
    top: 30,
    left: 10,
    zIndex: 10,
  },
  content: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 0,
  },
  searchContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
    marginTop: 65, // Added margin to move the search bar down
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingHorizontal: 3,
    backgroundColor: "#fff",
    marginRight: 5,
  },
  searchButton: {
    height: 40,
    justifyContent: "center",
  },
  patientList: {
    width: "100%",
    padding: 0,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  phoneNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyButton: {
    marginTop: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  card: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default PatientListScreen;