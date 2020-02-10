# react-native-swipe-list

<!--[![Build Status][build-badge]][build]-->
[![Version][version-badge]][package]
![Supports iOS and Android][support-badge]
[![MIT License][license-badge]][license]

An FlatList Component that is swipeable.

This was originally a fork of an experimental component `SwipeableFlatList` which was removed from the react-native core.

![Demo](https://user-images.githubusercontent.com/6936373/74122473-b188b100-4c0e-11ea-9d11-953c822a911f.gif)

## Install

In order to use this package, you will also need to install `react-native-gesture-handler` to your project.

```
yarn add react-native-swipe-list react-native-gesture-handler
```

## Usage

```tsx
import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, LayoutAnimation} from 'react-native';
import {
  SwipeableFlatList,
  SwipeableQuickActions,
  SwipeableQuickActionButton,
} from 'react-native-swipe-list';
import {ListItem} from './ListItem';
const styles = StyleSheet.create({
  container: {flex: 1},
});

const initialData = [...Array(30)].map((_, index) => ({id:index, text:`Item ${index}`}));

export const TestModule = () => {
  const [data, setData] = useState(initialData);

  return (
    <SafeAreaView style={styles.container}>
      <SwipeableFlatList
        data={data}
        renderItem={({item}) => <ListItem {...item} />}
        keyExtractor={index => index.id}
        renderLeftActions={({item}) => (
          <SwipeableQuickActions>
            <SwipeableQuickActionButton
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setData(data.filter(value => value !== item.album));
              }}
              text="delete"
              textStyle={{fontWeight: 'bold', color: 'white'}}
            />
          </SwipeableQuickActions>
        )}
        renderRightActions={({item}) => (
          <SwipeableQuickActions>
            <SwipeableQuickActionButton
              onPress={() => {}}
              text="Other"
            />
            <SwipeableQuickActionButton
              onPress={() => {}}
              text="Flag"
            />
            <SwipeableQuickActionButton
              onPress={() => {}}
              text="Archive"
            />
          </SwipeableQuickActions>
        )}
      />
    </SafeAreaView>
  );
};
```

# Reference

## Props

`SwipeableFlatList` takes in `FlatListProps` as well as the following props:

### `renderLeftActions`

Views to be displayed when user swipes the item from the left side.

| Type   | Required |
| ------ | -------- |
| (info: ListRenderItemInfo) => React.ReactNode | No       |

---

### `renderRightActions`

Views to be displayed when user swipes the item from the right side.

| Type   | Required |
| ------ | -------- |
| (info: ListRenderItemInfo) => React.ReactNode | No       |

---

### `closeOnScroll`

When `true`, swiped view will close when user scrolls.
Default is `true`

| Type   | Required |
| ------ | -------- |
| boolean | No       |


## License

The library is released under the MIT license. For more information see [`LICENSE`](/LICENSE).

<!-- [build-badge]: https://img.shields.io/circleci/project/github/Naturalclar/react-native-swipe-list/master.svg?style=flat-square
[build]: https://circleci.com/gh/Naturalclar/react-native-swipe-list -->
[version-badge]: https://img.shields.io/npm/v/Naturalclar/react-native-swipe-list.svg?style=flat-square
[package]: https://www.npmjs.com/package/Naturalclar/react-native-swipe-list
[support-badge]:https://img.shields.io/badge/platforms-ios-lightgrey.svg?style=flat-square
[license-badge]: https://img.shields.io/npm/l/Naturalclar/react-native-swipe-list.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[lean-core-badge]: https://img.shields.io/badge/Lean%20Core-Extracted-brightgreen.svg?style=flat-square
[lean-core-issue]: https://github.com/facebook/react-native/issues/23313
