import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { cowSpaceship } from 'src/images/Images'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { goToNextOnboardingScreen, onboardingPropsSelector } from 'src/onboarding/steps'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function OnboardingSuccessScreen() {
  const onboardingProps = useSelector(onboardingPropsSelector)
  useEffect(() => {
    const timeout = setTimeout(
      () =>
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.VerificationStartScreen,
          onboardingProps,
        }),
      3000
    )

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
