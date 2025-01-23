import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { cowSpaceship } from 'src/images/Images'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function OnboardingSuccessScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => navigateHome(), 3000)

    return () => clearTimeout(timeout)
  }, [])

  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Image source={cowSpaceship} />
      <Text style={styles.text}>{t('success.message')}</Text>
    </View>
  )
}

OnboardingSuccessScreen.navigationOptions = nuxNavigationOptionsNoBackButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typeScale.titleLarge,
    color: colors.accent,
    marginTop: Spacing.Regular16,
    marginBottom: 30,
    textAlign: 'center',
  },
})

export default OnboardingSuccessScreen
