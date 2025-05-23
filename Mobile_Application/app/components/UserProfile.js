import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Avatar } from "react-native-paper";

const UserProfile = ({ username, role }) => {
  // Get the first letter of the username for the avatar
  const firstLetter = username ? username.charAt(0).toUpperCase() : "U";
  
  // Display username if available or just use capitalized role
  const displayName = username || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "User");
  
  return (
    <View style={styles.container}>
      <Avatar.Text 
        size={30} 
        label={firstLetter} 
        style={styles.avatar} 
        labelStyle={styles.avatarLabel}
      />
      <View style={styles.textContainer}>
        <Text style={styles.username}>{displayName}</Text>
        <Text style={styles.role}>{role || "User"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  avatar: {
    marginRight: 8,
    backgroundColor: "#6200ee",
  },
  avatarLabel: {
    fontSize: 18,
  },
  textContainer: {
    flexDirection: "column",
  },
  username: {
    fontWeight: "bold",
    fontSize: 14,
  },
  role: {
    fontSize: 12,
    color: "#666",
  },
});

export default UserProfile; 