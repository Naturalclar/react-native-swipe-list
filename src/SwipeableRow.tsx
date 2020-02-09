import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  StyleSheet,
  View,
  I18nManager,
  PanResponder,
  PanResponderInstance,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';

const IS_RTL = I18nManager.isRTL;

// NOTE: Eventually convert these consts to an input object of configurations

// Position of the left of the swipable item when closed
const CLOSED_LEFT_POSITION = 0;
// Minimum swipe distance before we recognize it as such
const HORIZONTAL_SWIPE_DISTANCE_THRESHOLD = 10;
// Minimum swipe speed before we fully animate the user's action (open/close)
const HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD = 0.3;
// Factor to divide by to get slow speed; i.e. 4 means 1/4 of full speed
const SLOW_SPEED_SWIPE_FACTOR = 4;
// Time, in milliseconds, of how long the animated swipe should be
const SWIPE_DURATION = 300;

/**
 * On SwipeableListView mount, the 1st item will bounce to show users it's
 * possible to swipe
 */
const ON_MOUNT_BOUNCE_DELAY = 700;
const ON_MOUNT_BOUNCE_DURATION = 400;

// Distance left of closed position to bounce back when right-swiping from closed
const RIGHT_SWIPE_BOUNCE_BACK_DISTANCE = 30;
const RIGHT_SWIPE_BOUNCE_BACK_DURATION = 300;
/**
 * Max distance of right swipe to allow (right swipes do functionally nothing).
 * Must be multiplied by SLOW_SPEED_SWIPE_FACTOR because gestureState.dx tracks
 * how far the finger swipes, and not the actual animation distance.
 */
const RIGHT_SWIPE_THRESHOLD = 30 * SLOW_SPEED_SWIPE_FACTOR;

type Props = Readonly<{
  children?: React.ReactNode;
  isOpen?: boolean;
  maxSwipeDistance?: number;
  onClose?: () => void;
  onOpen?: () => void;
  onSwipeEnd?: () => void;
  onSwipeStart?: () => void;
  preventSwipeRight?: boolean;
  shouldBounceOnMount?: boolean;
  slideoutView?: React.ReactNode;
  swipeThreshold?: number;
}>;

type GestureState = {
  dx: number;
  dy: number;
  vx: number;
};

const emptyFunction = () => {};

/**
 * Creates a swipable row that allows taps on the main item and a custom View
 * on the item hidden behind the row. Typically this should be used in
 * conjunction with SwipeableListView for additional functionality, but can be
 * used in a normal ListView. See the renderRow for SwipeableListView to see how
 * to use this component separately.
 */

export const SwipeableRow = ({
  children,
  isOpen = false,
  maxSwipeDistance = 0,
  onClose = emptyFunction,
  onOpen = emptyFunction,
  onSwipeEnd = emptyFunction,
  onSwipeStart = emptyFunction,
  preventSwipeRight = false,
  shouldBounceOnMount,
  slideoutView,
  swipeThreshold = 30,
}: Props) => {
  const [isSwipeableViewRendered, setSwipeableViewRendered] = useState(false);
  const [rowHeight, setRowHeight] = useState(0);

  const _previousLeft = useRef<number>(0);

  const currentLeft = new Animated.Value(_previousLeft.current);

  const _animateTo = useCallback(
    (
      toValue: number,
      duration: number = SWIPE_DURATION,
      callback: Function = emptyFunction,
    ): void => {
      Animated.timing(currentLeft, {
        duration,
        toValue,
        useNativeDriver: true,
      }).start(() => {
        _previousLeft.current = toValue;
        callback();
      });
    },
    [currentLeft],
  );

  const _animateToOpenPositionWith = useCallback(
    (speed: number, distMoved: number): void => {
      /**
       * Ensure the speed is at least the set speed threshold to prevent a slow
       * swiping animation
       */
      speed =
        speed > HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD
          ? speed
          : HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD;
      /**
       * Calculate the duration the row should take to swipe the remaining distance
       * at the same speed the user swiped (or the speed threshold)
       */
      const duration = Math.abs(
        (maxSwipeDistance - Math.abs(distMoved)) / speed,
      );
      const distance = IS_RTL ? -maxSwipeDistance : maxSwipeDistance;
      _animateTo(-distance, duration);
    },
    [_animateTo, maxSwipeDistance],
  );

  const _shouldAnimateRemainder = useCallback(
    (gestureState: GestureState): boolean => {
      /**
       * If user has swiped past a certain distance, animate the rest of the way
       * if they let go
       */
      return (
        Math.abs(gestureState.dx) > swipeThreshold ||
        gestureState.vx > HORIZONTAL_FULL_SWIPE_SPEED_THRESHOLD
      );
    },
    [swipeThreshold],
  );

  const _animateToClosedPosition = useCallback(
    (duration: number = SWIPE_DURATION): void => {
      _animateTo(CLOSED_LEFT_POSITION, duration);
    },
    [_animateTo],
  );

  const _animateToClosedPositionDuringBounce = useCallback((): void => {
    _animateToClosedPosition(RIGHT_SWIPE_BOUNCE_BACK_DURATION);
  }, [_animateToClosedPosition]);

  const _swipeFullSpeed = useCallback(
    (gestureState: GestureState): void => {
      currentLeft.setValue(_previousLeft.current + gestureState.dx);
    },
    [currentLeft],
  );

  const _swipeSlowSpeed = useCallback(
    (gestureState: GestureState): void => {
      currentLeft.setValue(
        _previousLeft.current + gestureState.dx / SLOW_SPEED_SWIPE_FACTOR,
      );
    },
    [currentLeft],
  );

  const _isSwipingRightFromClosed = useCallback(
    (gestureState: GestureState): boolean => {
      const gestureStateDx = IS_RTL ? -gestureState.dx : gestureState.dx;
      return (
        _previousLeft.current === CLOSED_LEFT_POSITION && gestureStateDx > 0
      );
    },
    [],
  );

  const _isSwipingExcessivelyRightFromClosedPosition = useCallback(
    (gestureState: GestureState): boolean => {
      /**
       * We want to allow a BIT of right swipe, to allow users to know that
       * swiping is available, but swiping right does not do anything
       * functionally.
       */
      const gestureStateDx = IS_RTL ? -gestureState.dx : gestureState.dx;
      return (
        _isSwipingRightFromClosed(gestureState) &&
        gestureStateDx > RIGHT_SWIPE_THRESHOLD
      );
    },
    [_isSwipingRightFromClosed],
  );

  const _handlePanResponderMove = useCallback(
    (_event: Object, gestureState: GestureState): void => {
      if (_isSwipingExcessivelyRightFromClosedPosition(gestureState)) {
        return;
      }

      onSwipeStart();

      if (_isSwipingRightFromClosed(gestureState)) {
        _swipeSlowSpeed(gestureState);
      } else {
        _swipeFullSpeed(gestureState);
      }
    },
    [
      _isSwipingExcessivelyRightFromClosedPosition,
      _isSwipingRightFromClosed,
      _swipeFullSpeed,
      _swipeSlowSpeed,
      onSwipeStart,
    ],
  );

  // Ignore swipes due to user's finger moving slightly when tapping
  const _isValidSwipe = useCallback(
    (gestureState: GestureState): boolean => {
      if (
        preventSwipeRight &&
        _previousLeft.current === CLOSED_LEFT_POSITION &&
        gestureState.dx > 0
      ) {
        return false;
      }

      return Math.abs(gestureState.dx) > HORIZONTAL_SWIPE_DISTANCE_THRESHOLD;
    },
    [_previousLeft, preventSwipeRight],
  );

  const _handleMoveShouldSetPanResponderCapture = useCallback(
    (_event: Object, gestureState: GestureState): boolean => {
      // Decides whether a swipe is responded to by this component or its child
      return gestureState.dy < 10 && _isValidSwipe(gestureState);
    },
    [_isValidSwipe],
  );

  const _onSwipeableViewLayout = (
    event: NativeSyntheticEvent<{ layout: { height: number } }>,
  ): void => {
    setSwipeableViewRendered(true);
    setRowHeight(event.nativeEvent.layout.height);
  };

  const _animateBounceBack = useCallback(
    (duration: number): void => {
      /**
       * When swiping right, we want to bounce back past closed position on release
       * so users know they should swipe right to get content.
       */
      const swipeBounceBackDistance = IS_RTL
        ? -RIGHT_SWIPE_BOUNCE_BACK_DISTANCE
        : RIGHT_SWIPE_BOUNCE_BACK_DISTANCE;
      _animateTo(
        -swipeBounceBackDistance,
        duration,
        _animateToClosedPositionDuringBounce,
      );
    },
    [_animateTo, _animateToClosedPositionDuringBounce],
  );

  const _animateToOpenPosition = useCallback((): void => {
    const distance = IS_RTL ? -maxSwipeDistance : maxSwipeDistance;
    _animateTo(-distance);
  }, [_animateTo, maxSwipeDistance]);

  const _handlePanResponderEnd = useCallback(
    (_event: Object, gestureState: GestureState): void => {
      const horizontalDistance = IS_RTL ? -gestureState.dx : gestureState.dx;
      if (_isSwipingRightFromClosed(gestureState)) {
        onOpen();
        _animateBounceBack(RIGHT_SWIPE_BOUNCE_BACK_DURATION);
      } else if (_shouldAnimateRemainder(gestureState)) {
        if (horizontalDistance < 0) {
          // Swiped left
          onOpen();
          _animateToOpenPositionWith(gestureState.vx, horizontalDistance);
        } else {
          // Swiped right
          onClose();
          _animateToClosedPosition();
        }
      } else {
        if (_previousLeft.current === CLOSED_LEFT_POSITION) {
          _animateToClosedPosition();
        } else {
          _animateToOpenPosition();
        }
      }
      onSwipeEnd();
    },
    [
      _animateBounceBack,
      _animateToClosedPosition,
      _animateToOpenPosition,
      _animateToOpenPositionWith,
      _isSwipingRightFromClosed,
      _previousLeft,
      _shouldAnimateRemainder,
      onClose,
      onOpen,
      onSwipeEnd,
    ],
  );

  let slideOutView;
  if (isSwipeableViewRendered && rowHeight) {
    slideOutView = (
      <View style={[styles.slideOutContainer, { height: rowHeight }]}>
        {slideoutView}
      </View>
    );
  }

  // The swipeable item
  const swipeableView = (
    <Animated.View
      onLayout={_onSwipeableViewLayout}
      style={{ transform: [{ translateX: currentLeft }] }}
    >
      {children}
    </Animated.View>
  );

  const _panResponder = useMemo<PanResponderInstance>(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: _handleMoveShouldSetPanResponderCapture,
        onPanResponderGrant: () => ({}),
        onPanResponderMove: _handlePanResponderMove,
        onPanResponderRelease: _handlePanResponderEnd,
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: _handlePanResponderEnd,
        onShouldBlockNativeResponder: () => false,
      }),
    [
      _handleMoveShouldSetPanResponderCapture,
      _handlePanResponderEnd,
      _handlePanResponderMove,
    ],
  );

  useEffect(() => {
    if (shouldBounceOnMount) {
      /**
       * Do the on mount bounce after a delay because if we animate when other
       * components are loading, the animation will be laggy
       */
      setTimeout(() => {
        _animateBounceBack(ON_MOUNT_BOUNCE_DURATION);
      }, ON_MOUNT_BOUNCE_DELAY);
    }
  }, [_animateBounceBack, shouldBounceOnMount]);

  useEffect(() => {
    if (!isOpen) {
      _animateToClosedPosition();
    } else {
      _animateToOpenPosition();
    }
  }, [_animateToClosedPosition, _animateToOpenPosition, isOpen]);

  return (
    <View {..._panResponder.panHandlers}>
      {slideOutView}
      {swipeableView}
    </View>
  );
};

const styles = StyleSheet.create({
  slideOutContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
