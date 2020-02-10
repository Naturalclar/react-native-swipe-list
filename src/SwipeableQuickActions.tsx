import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export const SwipeableQuickActions: React.FC<Props> = ({ children, style }) => {
  return <View style={[styles.background, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  background: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
