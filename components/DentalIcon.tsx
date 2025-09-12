import React from 'react';
import { Image, StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';
import { DENTAL_ICONS } from '@/constants/icons';

type DentalIconProps = {
  variant?: 'blue' | 'gray' | 'black';
  size?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
};

export const DentalIcon: React.FC<DentalIconProps> = ({
  variant = 'blue',
  size = 40,
  style,
  containerStyle,
}) => {
  const iconSource = { uri: DENTAL_ICONS[variant] };

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={iconSource}
        style={[
          {
            width: size,
            height: size,
          },
          styles.icon,
          style,
        ]}
        resizeMode="contain"
        testID="dental-icon"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    aspectRatio: 1,
  },
});

export default DentalIcon;