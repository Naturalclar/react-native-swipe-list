import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

/**
 * A thin wrapper around standard quick action buttons that can, if the user
 * chooses, be used with SwipeableListView. Sample usage is as follows, in the
 * renderQuickActions callback:
 *
 * <SwipeableQuickActions>
 *   <SwipeableQuickActionButton {..props} />
 *   <SwipeableQuickActionButton {..props} />
 * </SwipeableQuickActions>
 */
export const SwipeableQuickActions: React.FC<Props> = ({ children, style }) => {
  let buttons: React.ReactNode[] = [];
  if (children instanceof Array) {
    for (let i = 0; i < children.length; i++) {
      buttons.push(children[i]);

      if (i < children.length - 1) {
        // Not last button
        buttons.push(<View key={i} style={styles.divider} />);
      }
    }
  } else {
    // 1 child
    buttons = [children];
  }

  return <View style={[styles.background, style]}>{buttons}</View>;
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  divider: {
    width: 4,
  },
});
