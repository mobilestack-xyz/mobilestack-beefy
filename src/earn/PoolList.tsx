import React from 'react'
import {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import PoolCard from 'src/earn/PoolCard'
import { EarnPosition } from 'src/positions/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<EarnPosition>>(FlatList)

export default function PoolList({
  handleScroll,
  listHeaderHeight,
  paddingBottom,
  displayPools,
  onPressLearnMore,
}: {
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  listHeaderHeight: number
  paddingBottom: number
  displayPools: EarnPosition[]
  onPressLearnMore: () => void
}) {
  return (
    <AnimatedFlatList
      data={displayPools}
      renderItem={({ item }) => <PoolCard pool={item} testID={`PoolCard/${item.positionId}`} />}
      keyExtractor={(item) => item.positionId}
      onScroll={handleScroll}
      // Workaround iOS setting an incorrect automatic inset at the top
      scrollIndicatorInsets={{ top: 0.01 }}
      scrollEventThrottle={16}
      ListHeaderComponent={<View style={{ height: listHeaderHeight }} />}
      style={styles.sectionList}
      contentContainerStyle={[
        styles.sectionListContentContainer,
        { paddingBottom: Math.max(paddingBottom, Spacing.Regular16) },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  sectionListContentContainer: {
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Smallest8,
    gap: Spacing.Regular16,
    flexGrow: 1,
  },
  sectionList: {
    flex: 1,
  },
  learnMore: {
    ...typeScale.bodySmall,
    color: Colors.white,
    textAlign: 'center',
  },
  learnMoreLink: {
    ...typeScale.bodySmall,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
