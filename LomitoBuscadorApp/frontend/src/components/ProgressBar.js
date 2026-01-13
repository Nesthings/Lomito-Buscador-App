import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ProgressBar = ({
  current = 1,
  total = 3,
  height = 12,
  backgroundColor = '#eee',
  fillColor = '#4ECDC4',
  showPercentage = true,
  borderRadius = 10,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const progress = current / total;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.container, { height, backgroundColor, borderRadius }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: fillColor,
            borderRadius,
          },
        ]}
      />
      {showPercentage && (
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    marginVertical: 10,
  },
  fill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentageContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  percentageText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default ProgressBar;
