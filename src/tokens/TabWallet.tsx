import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import { FiatExchangeFlow } from 'src/fiatExchanges/types'
import ActionsCarousel from 'src/home/ActionsCarousel'
import { cowSpaceship } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import {
  positionsWithBalanceSelector,
  positionsWithClaimableRewardsSelector,
} from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import AssetList from 'src/tokens/AssetList'
import AssetTabBar from 'src/tokens/AssetTabBar'
import { sortedTokensWithBalanceSelector } from 'src/tokens/selectors'
import { AssetTabType } from 'src/tokens/types'
import { getSupportedNetworkIdsForTokenBalances } from 'src/tokens/utils'

type Props = NativeStackScreenProps<StackParamList, Screens.TabWallet>

// offset relative to the bottom of the non sticky header component, where the
// screen header opacity animation starts
const HEADER_OPACITY_ANIMATION_START_OFFSET = 44
// distance in points over which the screen header opacity animation is applied
const HEADER_OPACITY_ANIMATION_DISTANCE = 20

function TabWallet({ navigation, route }: Props) {
  const { t } = useTranslation()

  const activeTab = route.params?.activeAssetTab ?? AssetTabType.Tokens

  // TODO: Update this to filter out unsupported networks once positions support non-Celo chains
  const positions = useSelector(positionsWithBalanceSelector)
  const showPositions = getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)
  const displayPositions = showPositions && positions.length > 0

  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  const tokens = useSelector((state) => sortedTokensWithBalanceSelector(state, supportedNetworkIds))

  const dappShortcutsEnabled = getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)
  const showClaimRewards =
    dappShortcutsEnabled &&
    positionsWithClaimableRewards.length > 0 &&
    activeTab !== AssetTabType.Collectibles

  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)
  const [listHeaderHeight, setListHeaderHeight] = useState(0)
  const [listFooterHeight, setListFooterHeight] = useState(0)

  const scrollPosition = useSharedValue(0)
  const footerPosition = useSharedValue(0)
  const handleScroll = useAnimatedScrollHandler<{ prevScrollY: number }>(
    {
      onScroll: (event, ctx) => {
        const scrollY = event.contentOffset.y
        scrollPosition.value = scrollY

        function clamp(value: number, min: number, max: number) {
          return Math.min(Math.max(value, min), max)
        }

        // Omit overscroll in the calculation
        const clampedScrollY = clamp(
          scrollY,
          0,
          event.contentSize.height - event.layoutMeasurement.height
        )

        // This does the same as React Native's Animated.diffClamp
        const diff = clampedScrollY - ctx.prevScrollY
        footerPosition.value = clamp(footerPosition.value + diff, 0, listFooterHeight)
        ctx.prevScrollY = clampedScrollY
      },
      onBeginDrag: (event, ctx) => {
        ctx.prevScrollY = event.contentOffset.y
      },
    },
    [listFooterHeight]
  )

  const animatedListHeaderStyles = useAnimatedStyle(() => {
    if (nonStickyHeaderHeight === 0) {
      return {
        shadowColor: 'transparent',
        transform: [
          {
            translateY: -scrollPosition.value,
          },
        ],
      }
    }

    return {
      transform: [
        {
          translateY:
            scrollPosition.value > nonStickyHeaderHeight
              ? -nonStickyHeaderHeight
              : -scrollPosition.value,
        },
      ],
      shadowColor: interpolateColor(
        scrollPosition.value,
        [nonStickyHeaderHeight - 10, nonStickyHeaderHeight + 10],
        ['transparent', Colors.blue100]
      ),
    }
  }, [scrollPosition.value, nonStickyHeaderHeight])

  const animatedFooterStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: footerPosition.value,
        },
      ],
    }
  }, [footerPosition.value])

  useScrollAwareHeader({
    navigation,
    title: t('bottomTabsNavigator.wallet.title'),
    scrollPosition,
    startFadeInPosition: nonStickyHeaderHeight - HEADER_OPACITY_ANIMATION_START_OFFSET,
    animationDistance: HEADER_OPACITY_ANIMATION_DISTANCE,
  })

  const handleMeasureNonStickyHeaderHeight = (event: LayoutChangeEvent) => {
    setNonStickyHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleMeasureListHeaderHeight = (event: LayoutChangeEvent) => {
    setListHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleMeasureListFooterHeight = (event: LayoutChangeEvent) => {
    setListFooterHeight(event.nativeEvent.layout.height)
  }

  const handleChangeActiveView = (selectedTab: AssetTabType) => {
    navigation.setParams({ activeAssetTab: selectedTab })
  }

  if (tokens.length === 0) {
    return (
      <View style={styles.zeroStateContainer}>
        <Image style={styles.image} source={cowSpaceship} />
        <Text style={styles.title}>{t('assets.noTokensTitle')}</Text>
        <Text style={styles.body}>{t('assets.noTokensDescription')}</Text>
        <Button
          testID="ZeroStateBuyTokens"
          style={{ ...styles.button, width: '100%' }}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          onPress={() => {
            navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
          }}
          text={t('assets.buyTokens')}
        />
      </View>
    )
  }

  return (
    // Transparency issue on Android present when a fragment is used - Nested Animated.View prevents it
    <Animated.View>
      <Animated.View
        style={[styles.listHeaderContainer, animatedListHeaderStyles]}
        onLayout={handleMeasureListHeaderHeight}
      >
        <View
          style={[styles.nonStickyHeaderContainer]}
          onLayout={handleMeasureNonStickyHeaderHeight}
        >
          <View style={styles.balanceSection}>
            <AssetsTokenBalance showInfo={false} />
          </View>
          <ActionsCarousel key={'ActionsCarousel'} />
        </View>
        <AssetTabBar
          activeTab={activeTab}
          onChange={handleChangeActiveView}
          displayPositions={displayPositions}
        />
      </Animated.View>

      <AssetList
        activeTab={activeTab}
        listHeaderHeight={listHeaderHeight}
        handleScroll={handleScroll}
      />
      {showClaimRewards && (
        <Animated.View
          style={[styles.footerContainer, animatedFooterStyles]}
          onLayout={handleMeasureListFooterHeight}
        >
          <Button
            type={BtnTypes.SECONDARY}
            size={BtnSizes.FULL}
            text={t('assets.claimRewards')}
            onPress={() => {
              AppAnalytics.track(AssetsEvents.tap_claim_rewards)
              navigate(Screens.DappShortcutsRewards)
            }}
          />
        </Animated.View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  listHeaderContainer: {
    ...getShadowStyle(Shadow.SoftLight),
    paddingBottom: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    backgroundColor: Colors.darkBlue,
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  nonStickyHeaderContainer: {
    zIndex: 1,
    paddingBottom: Spacing.Thick24,
  },
  footerContainer: {
    backgroundColor: Colors.darkBlue,
    position: 'absolute',
    bottom: 0,
    left: 10, // so the scroll bar is still visible
    right: 10,
    paddingHorizontal: Spacing.Thick24 - 10,
    paddingVertical: Spacing.Regular16,
  },
  balanceSection: {
    paddingBottom: Spacing.Regular16,
  },
  zeroStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
  },
  button: {
    marginTop: Spacing.Regular16,
    marginHorizontal: Spacing.Regular16,
  },
  image: {
    height: 120,
    width: 120,
  },
  title: {
    ...typeScale.titleMedium,
    marginTop: Spacing.Regular16,
    textAlign: 'center',
  },
  body: {
    ...typeScale.bodyMedium,
    marginTop: Spacing.Regular16,
    textAlign: 'center',
    paddingHorizontal: Spacing.Regular16,
  },
})

export default TabWallet
