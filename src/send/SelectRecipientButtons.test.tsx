import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Platform } from 'react-native'
import { RESULTS, check, request } from 'react-native-permissions'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { JumpstartEvents, SendEvents } from 'src/analytics/Events'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SelectRecipientButtons from 'src/send/SelectRecipientButtons'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

function renderComponent(phoneNumberVerified: boolean = false, defaultTokenIdOverride?: string) {
  const onPermissionsGranted = jest.fn()
  const tree = render(
    <Provider store={createMockStore({ app: { phoneNumberVerified } })}>
      <SelectRecipientButtons
        onContactsPermissionGranted={onPermissionsGranted}
        defaultTokenIdOverride={defaultTokenIdOverride}
      />
    </Provider>
  )
  return { ...tree, onPermissionsGranted }
}

describe('SelectRecipientButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(check).mockResolvedValue(RESULTS.DENIED)
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showBalances: ['celo-alfajores'],
      jumpstartContracts: {},
    })
  })

  it('renders the jumpstart button if it is enabled', async () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_JUMPSTART_SEND)
    const { getByText, findByTestId } = renderComponent()

    expect(await findByTestId('SelectRecipient/QR')).toBeTruthy()
    fireEvent.press(getByText('sendSelectRecipient.jumpstart.title'))

    expect(AppAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.send_select_recipient_jumpstart)
    expect(navigate).toHaveBeenCalledWith(Screens.JumpstartEnterAmount)
  })

  it('renders QR button', async () => {
    const { findByTestId } = renderComponent()
    // using findByTestId for first assertion in all tests to ensure rendering is finished after useAsync
    expect(await findByTestId('SelectRecipient/QR')).toBeTruthy()
  })
  // TODO(mobilestack): Un-skip these tests if CPV is ever enabled
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('renders QR and contacts button with no check mark on contacts if phone number is verified but contact permission is not granted', async () => {
    const { getByTestId, queryByTestId, findByTestId } = renderComponent(true)
    expect(await findByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/Contacts/checkmark')).toBeFalsy()
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('renders QR and contacts button with check mark on contacts if phone number is verified and contact permission is granted', async () => {
    jest.mocked(check).mockResolvedValue(RESULTS.GRANTED)

    const { getByTestId, findByTestId } = renderComponent(true)
    expect(await findByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    expect(getByTestId('SelectRecipient/Contacts/checkmark')).toBeTruthy()
  })
  it('navigates to QR screen when QR button is pressed', async () => {
    const { findByTestId } = renderComponent()
    fireEvent.press(await findByTestId('SelectRecipient/QR'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_scan_qr)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      params: {
        defaultTokenIdOverride: undefined,
      },
    })
  })
  it('navigates to QR screen with an override when QR button is pressed', async () => {
    const { findByTestId } = renderComponent(false, 'some-token-id')
    fireEvent.press(await findByTestId('SelectRecipient/QR'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_scan_qr)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      params: {
        defaultTokenIdOverride: 'some-token-id',
      },
    })
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('invokes permissions granted callback when contacts button is pressed with phone verified and contacts permission granted', async () => {
    jest.mocked(check).mockResolvedValue(RESULTS.GRANTED)
    const { findByTestId, onPermissionsGranted } = renderComponent(true)
    await act(async () => {
      fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.GRANTED,
    })
    expect(onPermissionsGranted).toHaveBeenCalledWith()
    expect(check).toHaveBeenCalledTimes(2) // one on load and one when pressing the button
    expect(request).not.toHaveBeenCalled()
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('shows connect phone number modal if phone is not verified', async () => {
    const { findByTestId, getByTestId, onPermissionsGranted } = renderComponent(false)
    await act(async () => {
      fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: false,
      contactsPermissionStatus: RESULTS.DENIED,
    })
    expect(onPermissionsGranted).not.toHaveBeenCalled()
    expect(check).toHaveBeenCalledTimes(2)
    expect(request).not.toHaveBeenCalled()
    expect(getByTestId('SelectRecipient/PhoneNumberModal')).toBeVisible()

    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/PhoneNumberModal/SecondaryAction'))
    })
    await waitFor(() => {
      expect(getByTestId('SelectRecipient/PhoneNumberModal')).not.toBeVisible()
    })
    await act(async () => {
      fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
    })
    expect(getByTestId('SelectRecipient/PhoneNumberModal')).toBeVisible()
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/PhoneNumberModal/PrimaryAction'))
    })
    await waitFor(() => {
      expect(getByTestId('SelectRecipient/PhoneNumberModal')).not.toBeVisible()
    })
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen, { hasOnboarded: true })
    })
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('shows enable contacts modal if phone verified but contacts permission is blocked', async () => {
    jest.mocked(check).mockResolvedValue(RESULTS.BLOCKED)
    const { findByTestId, getByTestId, onPermissionsGranted } = renderComponent(true)
    await act(async () => {
      fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.BLOCKED,
    })
    expect(onPermissionsGranted).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
    expect(getByTestId('SelectRecipient/ContactsModal')).toBeVisible()

    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/ContactsModal/SecondaryAction'))
    })
    await waitFor(() => {
      expect(getByTestId('SelectRecipient/ContactsModal')).not.toBeVisible()
    })
    await act(async () => {
      fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
    })
    expect(getByTestId('SelectRecipient/ContactsModal')).toBeVisible()
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/ContactsModal/PrimaryAction'))
    })
    expect(navigateToPhoneSettings).toHaveBeenCalled()
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('requests permission if phone is verified but contacts permission is denied and invokes callback if request is granted', async () => {
    jest.mocked(request).mockResolvedValue(RESULTS.GRANTED)
    const { findByTestId, onPermissionsGranted } = renderComponent(true)
    await act(async () => {
      fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.DENIED,
    })
    expect(request).toHaveBeenCalled()
    expect(onPermissionsGranted).toHaveBeenCalled()
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.request_contacts_permission_started)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      SendEvents.request_contacts_permission_completed,
      { permissionStatus: RESULTS.GRANTED }
    )
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('requests permission if phone is verified but contacts permission is denied and does nothing if request is denied', async () => {
    jest.mocked(request).mockResolvedValue(RESULTS.DENIED)
    const { findByTestId, getByTestId, onPermissionsGranted } = renderComponent(true)
    await act(async () => {
      fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.DENIED,
    })
    expect(request).toHaveBeenCalled()
    expect(onPermissionsGranted).not.toHaveBeenCalled()
    expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.request_contacts_permission_started)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      SendEvents.request_contacts_permission_completed,
      { permissionStatus: RESULTS.DENIED }
    )
    expect(getByTestId('SelectRecipient/ContactsModal')).not.toBeVisible()
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip.each([
    { os: 'ios' as const, showsModal: false, testName: 'does nothing' },
    { os: 'android' as const, showsModal: true, testName: 'shows modal' },
  ])(
    'requests permission if phone is verified but contacts permission is denied and $testName if request is blocked on $os',
    async ({ os, showsModal }) => {
      Platform.OS = os
      jest.mocked(request).mockResolvedValue(RESULTS.BLOCKED)
      const { findByTestId, getByTestId, onPermissionsGranted } = renderComponent(true)
      await act(async () => {
        fireEvent.press(await findByTestId('SelectRecipient/Contacts'))
      })
      expect(AppAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
        phoneNumberVerified: true,
        contactsPermissionStatus: RESULTS.DENIED,
      })
      expect(request).toHaveBeenCalled()
      expect(onPermissionsGranted).not.toHaveBeenCalled()
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        SendEvents.request_contacts_permission_started
      )
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        SendEvents.request_contacts_permission_completed,
        { permissionStatus: RESULTS.BLOCKED }
      )
      expect(getByTestId('SelectRecipient/ContactsModal').props.visible).toEqual(showsModal)
    }
  )
})
