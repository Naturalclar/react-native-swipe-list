import React from 'react';
import {
  View,
  TouchableHighlight,
  Text,
  Image,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType,
  StyleSheet,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
type Props = {
  accessibilityLabel?: string;
  imageSource?: ImageSourcePropType | number;
  imageStyle?: StyleProp<ImageStyle>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  text?: string | Object | Array<string | Object>;
  textStyle?: StyleProp<TextStyle>;
};
/**
 * Standard set of quick action buttons that can, if the user chooses, be used
 * with SwipeableListView. Each button takes an image and text with optional
 * formatting.
 */
export const SwipeableQuickActionButton = ({
  accessibilityLabel,
  imageSource,
  imageStyle,
  onPress,
  style,
  testID,
  text,
  textStyle,
}: Props) => {
  if (!imageSource && !text) {
    return null;
  }

  return (
    <TouchableHighlight
      onPress={onPress}
      testID={testID}
      underlayColor="transparent"
    >
      <View style={[styles.container, style]}>
        {imageSource ? (
          <Image
            accessibilityLabel={accessibilityLabel}
            source={imageSource}
            style={imageStyle}
          />
        ) : null}
        <Text style={textStyle}>{text}</Text>
      </View>
    </TouchableHighlight>
  );
};
