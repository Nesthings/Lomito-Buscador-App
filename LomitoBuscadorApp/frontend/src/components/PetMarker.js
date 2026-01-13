// src/components/PetMarker.js
import React from 'react';
import { Image, StyleSheet } from 'react-native';

const PetMarker = ({ imageUrl }) => {
  return (
    <Image
      source={{ uri: imageUrl || 'https://via.placeholder.com/40' }}
      style={styles.markerImage}
    />
  );
};

const styles = StyleSheet.create({
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default PetMarker;
