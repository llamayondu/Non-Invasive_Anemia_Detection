import React from "react";

import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Paragraph from "../components/Paragraph";
import Button from "../components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
  async function fetchProtectedData() {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch("http://172.20.128.61:3000/api/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("Protected data:", data);
    } catch (err) {
      console.log("Error fetching protected data:", err);
    }
  }

  return (
    <Background>
      <Logo />
      <Header>Welcome 💫</Header>
      <Paragraph>Congratulations you are logged in.</Paragraph>
      <Button
        mode="outlined"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: "StartScreen" }],
          })
        }
      >
        Sign out
      </Button>
      <Button mode="contained" onPress={fetchProtectedData}>
        Load Protected Data
      </Button>
    </Background>
  );
}
