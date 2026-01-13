import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './frontend/src/navigation/MainNavigator';
import { AuthProvider } from './frontend/src/context/AuthContext';


const App = () => {
  const navigationRef = React.useRef();

  useEffect(() => {
    console.log('App iniciada');
    
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;