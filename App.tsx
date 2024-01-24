import React, { useEffect, useRef } from 'react';
import { PermissionsAndroid, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation Permission',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

const getGeoLocationJS = () => {
  const requestPermissionsFromWebView = `
    window.requestPermissionsFromWebView = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'requestPermissions' }));
    };
  `;

  const getCurrentPosition = `
    navigator.geolocation.getCurrentPosition = (success, error, options) => {
      window.requestPermissionsFromWebView(); // Llama a la función para solicitar permisos desde la WebView
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'getCurrentPosition', options: options }));
    };
  `;

  const watchPosition = `
    navigator.geolocation.watchPosition = (success, error, options) => {
      window.requestPermissionsFromWebView(); // Llama a la función para solicitar permisos desde la WebView
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'watchPosition', options: options }));
    };
  `;

  const clearWatch = `
    navigator.geolocation.clearWatch = (watchID) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'clearWatch', watchID: watchID }));
    };
  `;

  console.log('GeoLocationJS executed'); 

  return `
    (function() {
      ${requestPermissionsFromWebView}
      ${getCurrentPosition}
      ${watchPosition}
      ${clearWatch}
    })();
  `;
};

const App = () => {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const onMessage = (event: { nativeEvent: { data: any; }; }) => {
    const { data } = event.nativeEvent;
  
    if (data === 'requestGeolocation') {
      Geolocation.getCurrentPosition(
        (position) => {
          if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({ event: 'currentPosition', data: position }));
          }
        },
        (error) => {
          console.warn(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://power-app-engine.vercel.app/flake/bIt5ItBs9IIuBtzziqyJ.4vqLSttZiqGhrNRea8s5' }}
        onMessage={(event) => onMessage(event)} 
        javaScriptEnabled={true}
        injectedJavaScript={getGeoLocationJS()}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default App;