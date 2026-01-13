import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import PetMarker from './PetMarker';

const CustomMapView = ({ region, lostPets, onMarkerPress }) => {
  const mapRef = useRef(null);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={region}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {lostPets.map((pet) => (
        <Marker
          key={pet.reportId}
          coordinate={{ latitude: pet.latitude, longitude: pet.longitude }}
          onPress={() => onMarkerPress(pet)}
        >
          <PetMarker imageUrl={pet.petInfo.photo} />
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
});

export default CustomMapView;
