import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";

export default function DisplayImageScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserImage();
  }, []);

  async function fetchUserImage() {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      console.log("Token retrieved for image fetch");
      
      // Decode JWT payload without using Buffer
      const payload = JSON.parse(decodeBase64(token.split('.')[1]));
      const userId = payload.userId;
      
      console.log("Decoded user ID from token:", userId);

      const response = await fetch(`http://172.20.128.61:3000/api/images/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log("Image fetch response:", data);
      
      if (data.images && data.images.length > 0) {
        setImageUri(data.images[0]);
      }
    } catch (err) {
      console.log("Error fetching image:", err);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to decode base64 in React Native
  function decodeBase64(str) {
    // Add padding if needed
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    
    // Decode base64
    return decodeURIComponent(
      [...atob(str)]
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }

  return (
    <Background>
      <Header>Image Preview</Header>
      
      <View style={styles.imageContainer}>
        {loading ? (
          <Text>Loading image...</Text>
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text>No image found</Text>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Back
        </Button>
        <Button mode="contained" onPress={() => navigation.navigate("UploadScreen")}>
          Replace Image
        </Button>
        <Button mode="contained" onPress={() => console.log("Continue pressed")}>
          Continue
        </Button>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "contain",
  },
  buttonContainer: {
    width: "100%",
    marginVertical: 20,
  },
});
