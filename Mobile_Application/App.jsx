import React from "react";
import { Provider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { theme } from "./app/core/theme";
import {
  StartScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  HomeScreen,
} from "./app/screens";
import UploadScreen from "./app/screens/UploadScreen";
import DisplayImageScreen from "./app/screens/DisplayImageScreen";
import ResultsScreen from "./app/screens/ResultsScreen";
import PatientListScreen from "./app/screens/PatientListScreen";
import AddPatientScreen from "./app/screens/AddPatientScreen";
import ProfileScreen from "./app/screens/ProfileScreen";
import PatientDetailScreen from "./app/screens/PatientDetailScreen";
import LiveCameraScreen from "./app/screens/LiveCameraScreen";
const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="StartScreen"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="StartScreen" component={StartScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen
            name="ResetPasswordScreen"
            component={ResetPasswordScreen}
          />
          <Stack.Screen name="PatientListScreen" component={PatientListScreen} />
          <Stack.Screen name="AddPatientScreen" component={AddPatientScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="UploadScreen" component={UploadScreen} />
          <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
          <Stack.Screen name="DisplayImageScreen" component={DisplayImageScreen} />
          <Stack.Screen name="PatientDetailScreen" component={PatientDetailScreen} />
          <Stack.Screen name="LiveCameraScreen" component={LiveCameraScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
