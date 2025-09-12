import React from 'react';
import { Image, StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';

type LogoVariant = 'full' | 'icon';

type RubioGarciaLogoProps = {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
};

export const RubioGarciaLogo: React.FC<RubioGarciaLogoProps> = ({
  variant = 'full',
  width = 200,
  height,
  style,
  containerStyle,
}) => {
  // URL del logo completo de Rubio García Dental
  const fullLogoUrl = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/19j5tvlvv61576u09l3ei';
  
  // URL del icono de diente (podemos usar el que ya existe o crear uno nuevo)
  const iconLogoUrl = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/s3ovjqswsrmm1jlhn4f84';
  
  const logoSource = { uri: variant === 'full' ? fullLogoUrl : iconLogoUrl };
  
  // Si solo se proporciona el ancho, calculamos la altura manteniendo la proporción
  // La proporción aproximada del logo es 4:1 (ancho:alto)
  const calculatedHeight = height || (variant === 'full' ? width / 4 : width);

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={logoSource}
        style={[
          {
            width,
            height: calculatedHeight,
          },
          styles.logo,
          style,
        ]}
        resizeMode="contain"
        testID="rubio-garcia-logo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Estilos adicionales si son necesarios
  },
});

export default RubioGarciaLogo;