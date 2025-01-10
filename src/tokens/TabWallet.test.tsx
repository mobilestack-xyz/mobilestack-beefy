import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import TabWallet from 'src/tokens/TabWallet'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCeurAddress, mockCeurTokenId, mockCusdAddress, mockCusdTokenId } from 'test/values'

jest.mock('src/statsig')

function getStore({ zeroBalance = false }: { zeroBalance?: boolean } = {}) {
  return {
    tokens: {
      tokenBalances: {
        [mockCeurTokenId]: {
          tokenId: mockCeurTokenId,
          priceUsd: '1.16',
          address: mockCeurAddress,
          symbol: 'cEUR',
          imageUrl:
            'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
          name: 'Celo Euro',
          decimals: 18,
          balance: zeroBalance ? '0' : '5',
          isFeeCurrency: true,
          canTransferWithComment: true,
          priceFetchedAt: Date.now(),
          networkId: NetworkId['celo-alfajores'],
        },
        [mockCusdTokenId]: {
          tokenId: mockCusdTokenId,
          priceUsd: '1.001',
          address: mockCusdAddress,
          symbol: 'cUSD',
          imageUrl:
            'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png',
          name: 'Celo Dollar',
          decimals: 18,
          balance: zeroBalance ? '0' : '10',
          isFeeCurrency: true,
          canTransferWithComment: true,
          priceFetchedAt: Date.now(),
          networkId: NetworkId['celo-alfajores'],
        },
      },
    },
  }
}

describe('TabWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockRestore()
    jest.mocked(getMultichainFeatures).mockReturnValue({
      showBalances: [NetworkId['celo-alfajores']],
    })
  })
  it('shows correct total balance, cEUR and cUSD line items when tokens have balance', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore(getStore())}>
        <MockedNavigator component={TabWallet} />
      </Provider>
    )
    expect(getByTestId('TotalTokenBalance')).toHaveTextContent('₱21.03')
    expect(getByTestId('cEURBalance')).toHaveTextContent('5.00 cEUR')
    expect(getByTestId('cUSDBalance')).toHaveTextContent('10.00 cUSD')

    expect(getByTestId('BuyTokens')).toBeTruthy()
    fireEvent.press(getByTestId('BuyTokens'))
    expect(navigate).toHaveBeenCalledWith('FiatExchangeCurrencyBottomSheet', {
      flow: 'CashIn',
    })
  })
  it('shows cEUR and cUSD line items when tokens do not have balance', () => {
    const { getByTestId, getByText } = render(
      <Provider store={createMockStore(getStore({ zeroBalance: true }))}>
        <MockedNavigator component={TabWallet} />
      </Provider>
    )
    expect(getByText('assets.noTokensTitle')).toBeTruthy()
    expect(getByText('assets.noTokensDescription')).toBeTruthy()
    expect(getByTestId('ZeroStateBuyTokens')).toBeTruthy()
    fireEvent.press(getByTestId('ZeroStateBuyTokens'))
    expect(navigate).toHaveBeenCalledWith('FiatExchangeCurrencyBottomSheet', {
      flow: 'CashIn',
    })
  })
  it('tapping asset navigates to TokenDetails screen', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore(getStore())}>
        <MockedNavigator component={TabWallet} />
      </Provider>
    )
    fireEvent.press(getByTestId('cEURSymbol'))
    expect(navigate).toHaveBeenCalledWith('TokenDetails', { tokenId: mockCeurTokenId })
  })
})
