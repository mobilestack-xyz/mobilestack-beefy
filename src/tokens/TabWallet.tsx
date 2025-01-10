import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
import { hideWalletBalancesSelector } from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { HideBalanceButton } from 'src/components/TokenBalance'
import { FiatExchangeFlow } from 'src/fiatExchanges/types'
import { cowSpaceship } from 'src/images/Images'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTotalTokenBalance } from 'src/tokens/hooks'
import { sortedTokensWithBalanceSelector } from 'src/tokens/selectors'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { getSupportedNetworkIdsForTokenBalances, getTokenAnalyticsProps } from 'src/tokens/utils'

function TabWallet() {
  const { t } = useTranslation()
  const hideWalletBalances = useSelector(hideWalletBalancesSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { decimalSeparator } = getNumberFormatSettings()

  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  const tokens = useSelector((state) => sortedTokensWithBalanceSelector(state, supportedNetworkIds))
  const totalTokenBalanceLocal = useTotalTokenBalance()
  const balanceDisplay = hideWalletBalances
    ? `XX${decimalSeparator}XX`
    : totalTokenBalanceLocal?.toFormat(2)

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
    <View style={styles.container} testID="TabWallet">
      <View style={styles.row}>
        <Text style={styles.totalBalance} testID={'TotalTokenBalance'}>
          {!hideWalletBalances && localCurrencySymbol}
          {balanceDisplay}
        </Text>
        <HideBalanceButton hideBalance={hideWalletBalances} />
      </View>
      <ScrollView contentContainerStyle={styles.contentContainerStyle}>
        {tokens.map((token, index) => (
          <TokenBalanceItem
            containerStyle={{ marginHorizontal: Spacing.Regular16 }}
            token={token}
            key={index}
            onPress={() => {
              navigate(Screens.TokenDetails, { tokenId: token.tokenId })
              AppAnalytics.track(AssetsEvents.tap_asset, {
                ...getTokenAnalyticsProps(token),
                title: token.symbol,
                description: token.name,
                assetType: 'token',
              })
            }}
            hideBalances={hideWalletBalances}
          />
        ))}
        <Button
          testID="BuyTokens"
          style={{ ...styles.button, marginBottom: Spacing.XLarge48 }}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          onPress={() => {
            navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
          }}
          text={t('assets.buyTokens')}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  zeroStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.Smallest8,
    marginTop: Spacing.Smallest8,
  },
  totalBalance: {
    ...typeScale.titleLarge,
  },
  contentContainerStyle: { marginTop: Spacing.Large32 },
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
