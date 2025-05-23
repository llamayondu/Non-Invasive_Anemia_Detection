import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, SegmentedButtons } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { emailValidator } from "../helpers/emailValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { nameValidator } from "../helpers/nameValidator";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState({ value: "", error: "" });
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [role, setRole] = useState("Staff");
  const [loading, setLoading] = useState(false);

  const onSignUpPressed = async () => {
    console.log("SignUp button pressed");
    const usernameError = nameValidator(username.value);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    if (emailError || passwordError || usernameError) {
      setUsername({ ...username, error: usernameError });
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      console.log("Validation errors:", { usernameError, emailError, passwordError });
      return;
    }

    try {
      setLoading(true);
      console.log("Sending registration request");
      
      const requestBody = {
        username: username.value,
        email: email.value,
        password: password.value,
        role: role,
      };
      
      const response = await fetch("http://172.20.128.61:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.value,
          email: email.value,
          password: password.value,
          role: role,
        }),
      });

      const data = await response.json();
      console.log("Response received:", data);

      if (response.status !== 200) {
        if (data.error && data.error.includes("email already exists")) {
          Alert.alert("Registration Error", "A user with this email already exists");
          setEmail({ ...email, error: "This email is already in use" });
        } else if (data.error && data.error.includes("Username already taken")) {
          Alert.alert("Registration Error", "This username is already taken");
          setUsername({ ...username, error: "This username is already taken" });
        } else {
          Alert.alert("Registration Error", data.error || "Registration failed");
        }
        return;
      }

      if (data.success && data.token) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("userRole", data.role);
        
        navigation.reset({
          index: 0,
          routes: [{ name: "PatientListScreen" }],
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Logo />
      <Header>Create Account</Header>
      <TextInput
        label="Username"
        returnKeyType="next"
        value={username.value}
        onChangeText={(text) => setUsername({ value: text, error: "" })}
        error={!!username.error}
        errorText={username.error}
      />
      <TextInput
        label="Email"
        returnKeyType="next"
        value={email.value}
        onChangeText={(text) => setEmail({ value: text, error: "" })}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        returnKeyType="done"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />
      <Text style={styles.roleLabel}>Select Role:</Text>
      <SegmentedButtons
        value={role}
        onValueChange={setRole}
        buttons={[
          { value: "doctor", label: "Doctor" },
          { value: "Manager", label: "Manager" },
          { value: "Staff", label: "Staff" },
        ]}
        style={styles.roleSelector}
      />

      <Button
        mode="contained"
        onPress={onSignUpPressed}
        style={{ marginTop: 24 }}
        loading={loading}
        disabled={loading}
      >
        Sign Up
      </Button>
      <View style={styles.row}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.replace("LoginScreen")}>
          <Text style={styles.link}>Login</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  roleLabel: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 5,
  },
  roleSelector: {
    marginBottom: 10,
  },
});