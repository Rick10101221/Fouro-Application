import React from 'react';
import { StyleSheet } from 'react-native';

import MainNavPage from './src/pages/main_nav/MainNavPage';

import FriendHistoryPage from './src/pages/off-nav/FriendHistoryPage';
import FriendProfilePage from './src/pages/off-nav/FriendProfilePage';
import CorkboardPage from './src/pages/off-nav/CorkboardPage';
import HugInfoPage from './src/pages/off-nav/HugInfoPage';

import LoginPage from './src/pages/onboarding/LoginPage';
import LaunchPage from './src/pages/onboarding/LaunchPage';
import SignupPage from './src/pages/onboarding/SignupPage';
import PicUploadPage from './src/pages/onboarding/PicUploadPage';
import NamePage from './src/pages/onboarding/NamePage';
import QuestionPage from './src/pages/onboarding/QuestionPage';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CreateHugPage from './src/pages/off-nav/CreateHugPage';

export default function App() {
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator style={styles.appContainer}>
        <Stack.Screen name="Main Nav Page" component={MainNavPage} />

        <Stack.Screen name="Create Hug" component={CreateHugPage} />
        <Stack.Screen name="Friend History" component={FriendHistoryPage} />
        <Stack.Screen name="Friend Profile" component={FriendProfilePage} />
        <Stack.Screen name="Corkboard" component={CorkboardPage} />
        <Stack.Screen name="Hug Info" component={HugInfoPage} />

        <Stack.Screen name='Login Page' component={LoginPage} />
        <Stack.Screen name='Signup Page' component={SignupPage} />
        <Stack.Screen name='Launch Page' component={LaunchPage} />
        <Stack.Screen name='Pic Upload Page' component={PicUploadPage} />
        <Stack.Screen name='Name Page' component={NamePage} />
        <Stack.Screen name='Question Page' component={QuestionPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    backgroundColor: 'transparent',
  }
})