import { type SerializedError } from '@reduxjs/toolkit'
import { type FetchBaseQueryError } from '@reduxjs/toolkit/query'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { beefyCow } from 'src/images/Images'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
interface Props {
  loading?: boolean
  error?: Error | FetchBaseQueryError | SerializedError | undefined
}

function NoActivity({ loading, error }: Props) {
  const { t } = useTranslation()

  if (error) {
    return (
      <View style={styles.container} testID="NoActivity/error">
        <Text style={styles.text}>{t('errorLoadingActivity.0')}</Text>
        <Text style={styles.text}>{t('errorLoadingActivity.1')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.zeroStateContainer}>
      <Image style={styles.image} source={beefyCow} />
      <Text style={styles.title}>{t('transactionFeed.noActiviy')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 32,
  },
  text: {
    ...typeScale.bodyLarge,
    color: colors.lightBlue,
  },
  zeroStateContainer: {
    marginTop: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
  },
  image: {
    height: 104,
    width: 136,
  },
  title: {
    ...typeScale.titleMedium,
    marginTop: Spacing.Regular16,
    textAlign: 'center',
  },
})

export default NoActivity
