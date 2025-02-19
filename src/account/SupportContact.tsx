import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { e164NumberSelector, nameSelector } from 'src/account/selectors'
import { sendSupportRequest } from 'src/account/zendesk'
import { showMessage } from 'src/alert/actions'
import { phoneNumberVerifiedSelector, sessionIdSelector } from 'src/app/selectors'
import Button, { BtnTypes } from 'src/components/Button'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import Switch from 'src/components/Switch'
import TextInput from 'src/components/TextInput'
import { APP_NAME, DEFAULT_TESTNET } from 'src/config'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { hooksPreviewApiUrlSelector } from 'src/positions/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { anonymizedPhone } from 'src/utils/phoneNumbers'
import { currentAccountSelector } from 'src/web3/selectors'
type Props = NativeStackScreenProps<StackParamList, Screens.SupportContact>

// Language agnostic loose regex for email validation
const tester =
  /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~\u0E00-\u0E7F](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~\u0E00-\u0E7F])*@[A-Za-z0-9\u0E00-\u0E7F](-*\.?[A-Za-z0-9\u0E00-\u0E7F])*\.[A-Za-z\u0E00-\u0E7F](-?[A-Za-z0-9\u0E00-\u0E7F])+$/
// Validate email function - https://github.com/manishsaraan/email-validator
export function validateEmail(email: string) {
  if (!email) return false
  if (email.length > 360) return false
  const emailParts = email.split('@')
  if (emailParts.length !== 2) return false
  const account = emailParts[0]
  const address = emailParts[1]
  if (account.length > 64) return false
  else if (address.length > 255) return false
  const domainParts = address.split('.')
  if (!domainParts[1] || domainParts[1].length < 2) return false
  if (
    domainParts.some((part) => {
      return part.length > 63
    })
  ) {
    return false
  }

  return tester.test(email)
}

function SupportContact({ route }: Props) {
  const { t } = useTranslation()
  const cachedName = useSelector(nameSelector)

  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState(cachedName ?? '')
  const [attachLogs, setAttachLogs] = useState(true)
  const [inProgress, setInProgress] = useState(false)

  const e164PhoneNumber = useSelector(e164NumberSelector)
  const currentAccount = useSelector(currentAccountSelector)
  const sessionId = useSelector(sessionIdSelector)
  const numberVerifiedCentralized = useSelector(phoneNumberVerifiedSelector)
  const { countryCodeAlpha2: country, region } = useSelector(userLocationDataSelector)
  const hooksPreviewApiUrl = useSelector(hooksPreviewApiUrlSelector)
  const dispatch = useDispatch()

  const prefilledText = route.params?.prefilledText
  useEffect(() => {
    if (prefilledText) {
      setMessage(prefilledText)
    }
  }, [prefilledText])

  const navigateBackAndToast = () => {
    navigateBack()
    dispatch(showMessage(t('contactSuccess')))
  }

  const onPressSendEmail = useCallback(async () => {
    setInProgress(true)
    const userProperties = {
      appName: APP_NAME,
      version: DeviceInfo.getVersion(),
      systemVersion: DeviceInfo.getSystemVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      apiLevel: DeviceInfo.getApiLevelSync(),
      os: Platform.OS,
      country,
      region,
      deviceId: DeviceInfo.getDeviceId(),
      deviceBrand: DeviceInfo.getBrand(),
      deviceModel: DeviceInfo.getModel(),
      address: currentAccount,
      sessionId,
      numberVerifiedCentralized,
      hooksPreviewEnabled: !!hooksPreviewApiUrl,
      network: DEFAULT_TESTNET,
    }
    const userId = e164PhoneNumber ? anonymizedPhone(e164PhoneNumber) : t('unknown')
    const attachments = attachLogs ? await Logger.getLogsToAttach() : []
    try {
      await sendSupportRequest({
        message,
        userProperties,
        logFiles: attachments,
        userEmail: email,
        userName: name,
        subject: t('supportEmailSubject', { appName: APP_NAME, user: userId }),
      })
      // Used to prevent flickering of the activity indicator on quick uploads
      // Also navigateBackAndToast is a bit slow, so the timeout helps ensure that the loadingSpinner stays until the user is redirected
      setTimeout(() => setInProgress(false), 1000)
      navigateBackAndToast()
    } catch (error) {
      Logger.error('SupportContact', 'Error while sending logs to support', error)
    }
  }, [message, attachLogs, e164PhoneNumber, email, name])

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <Text style={styles.title} testID={'ContactTitle'}>
          {t('contact')}
        </Text>
        <Text style={styles.headerText}>{t('message')}</Text>
        <TextInput
          onChangeText={setMessage}
          value={message}
          multiline={true}
          style={styles.messageTextInput}
          placeholderTextColor={colors.lightBlue}
          underlineColorAndroid="transparent"
          numberOfLines={10}
          placeholder={t('contactMessagePlaceholder') ?? undefined}
          showClearButton={false}
          testID={'MessageEntry'}
        />
        <Text style={styles.headerText}>{t('Name')}</Text>
        <TextInput
          onChangeText={setName}
          multiline={false}
          value={name}
          style={styles.singleLineTextInput}
          showClearButton={false}
          testID={'NameEntry'}
        />
        <Text style={styles.headerText}>{t('Email')}</Text>
        <TextInput
          textContentType="emailAddress"
          keyboardType="email-address"
          autoComplete="email"
          onChangeText={setEmail}
          multiline={false}
          value={email}
          style={styles.singleLineTextInput}
          placeholderTextColor={colors.lightBlue}
          placeholder={t('Email') ?? undefined}
          showClearButton={false}
          testID={'EmailEntry'}
        />

        <View style={styles.attachLogs}>
          <Text style={typeScale.labelSemiBoldMedium}>{t('attachLogs')}</Text>
          <Switch
            testID="SwitchLogs"
            style={styles.logsSwitch}
            value={attachLogs}
            onValueChange={setAttachLogs}
          />
        </View>
        {inProgress && (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text testID="Legal" style={styles.disclaimerText}>
            {t('supportLegalCheckbox')}
          </Text>
        </View>
        <Button
          disabled={!message || inProgress || !name || !email || !validateEmail(email)}
          onPress={onPressSendEmail}
          text={t('submit')}
          type={BtnTypes.PRIMARY}
          testID="SubmitContactForm"
        />
      </ScrollView>
      <KeyboardSpacer />
    </View>
  )
}

const styles = StyleSheet.create({
  disclaimer: {
    marginBottom: 24,
  },
  disclaimerText: {
    ...typeScale.bodyMedium,
    color: colors.lightBlue,
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  attachLogs: {
    flexShrink: 0,
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    marginTop: 4,
  },
  logsSwitch: {
    marginBottom: 3,
    marginRight: 10,
  },
  messageTextInput: {
    ...typeScale.bodyMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    alignItems: 'flex-start',
    borderColor: colors.lightBlue,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    color: colors.white,
    height: 80,
    maxHeight: 150,
  },
  singleLineTextInput: {
    ...typeScale.bodyMedium,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'flex-start',
    borderColor: colors.lightBlue,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    color: colors.white,
    maxHeight: 50,
  },
  headerText: {
    ...typeScale.labelSemiBoldSmall,
  },
  loadingSpinnerContainer: {
    marginVertical: 20,
  },
  title: {
    ...typeScale.titleMedium,
    marginVertical: 16,
  },
})

export default SupportContact
