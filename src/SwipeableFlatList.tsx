import React, { useRef, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SwipeableRow } from './SwipeableRow';

type SwipableListProps<ItemT> = {
  /**
   * To alert the user that swiping is possible, the first row can bounce
   * on component mount.
   */
  bounceFirstRowOnMount?: boolean;
  // Maximum distance to open to after a swipe
  maxSwipeDistance?: number | ((info: ListRenderItemInfo<ItemT>) => number);
  // Callback method to render the view that will be unveiled on swipe
  renderQuickActions?: (info: ListRenderItemInfo<ItemT>) => React.ReactNode;
};

type Props<ItemT> = SwipableListProps<ItemT> & FlatListProps<ItemT>;

type State = {
  openRowKey?: React.ReactText;
};

/**
 * A container component that renders multiple SwipeableRow's in a FlatList
 * implementation. This is designed to be a drop-in replacement for the
 * standard React Native `FlatList`, so use it as if it were a FlatList, but
 * with extra props, i.e.
 *
 * <SwipeableListView renderRow={..} renderQuickActions={..} {..FlatList props} />
 *
 * SwipeableRow can be used independently of this component, but the main
 * benefit of using this component is
 *
 * - It ensures that at most 1 row is swiped open (auto closes others)
 * - It can bounce the 1st row of the list so users know it's swipeable
 * - Increase performance on iOS by locking list swiping when row swiping is occurring
 * - More to come
 */
export const SwipeableFlatList = <ItemT extends {}>(props: Props<ItemT>) => {
  const _flatListRef = useRef<FlatList<ItemT>>();

  const [openRowKey, setOpenRowKey] = useState<React.ReactText | null>(null);

  const _onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    // Close any opens rows on ListView scroll
    if (openRowKey !== null) {
      setOpenRowKey(null);
    }
    props.onScroll && props.onScroll(e);
  };

  const _renderItem = (
    info: ListRenderItemInfo<ItemT>,
  ): React.ReactElement | null => {
    const { renderQuickActions = () => null } = props;
    const slideoutView = renderQuickActions(info);
    const key = props.keyExtractor
      ? props.keyExtractor(info.item, info.index)
      : info.index;

    // If renderQuickActions is unspecified or returns falsey, don't allow swipe
    if (!slideoutView) {
      return props.renderItem ? props.renderItem(info) : null;
    }

    return (
      <SwipeableRow
        slideoutView={slideoutView}
        isOpen={key === openRowKey}
        maxSwipeDistance={_getMaxSwipeDistance(info)}
        onOpen={() => _onOpen(key)}
        onClose={() => _onClose(key)}
        shouldBounceOnMount={props.bounceFirstRowOnMount}
        onSwipeEnd={_setListViewScrollable}
        onSwipeStart={_setListViewNotScrollable}
      >
        {props.renderItem && props.renderItem(info)}
      </SwipeableRow>
    );
  };
  // This enables rows having variable width slideoutView.
  const _getMaxSwipeDistance = (info: ListRenderItemInfo<ItemT>): number => {
    if (typeof props.maxSwipeDistance === 'function') {
      return props.maxSwipeDistance(info);
    }

    return props.maxSwipeDistance || 50;
  };

  const _setListViewScrollableTo = (value: boolean) => {
    if (_flatListRef.current) {
      _flatListRef.current.setNativeProps({
        scrollEnabled: value,
      });
    }
  };

  const _setListViewScrollable = () => {
    _setListViewScrollableTo(true);
  };

  const _setListViewNotScrollable = () => {
    _setListViewScrollableTo(false);
  };

  const _onOpen = (key: React.ReactText): void => {
    setOpenRowKey(key);
  };

  const _onClose = (_key: React.ReactText): void => {
    setOpenRowKey(null);
  };

  return (
    <FlatList
      {...props}
      ref={ref => {
        if (ref !== null) {
          _flatListRef.current = ref;
        }
      }}
      onScroll={_onScroll}
      renderItem={_renderItem}
    />
  );
};
