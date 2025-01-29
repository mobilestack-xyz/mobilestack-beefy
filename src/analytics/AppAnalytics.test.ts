import { createClient } from '@segment/analytics-react-native'
import { PincodeType } from 'src/account/reducer'
import AppAnalyticsModule from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { store } from 'src/redux/store'
import { getDefaultStatsigUser, getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { Statsig } from 'statsig-react-native'
import { getMockStoreData } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockPositions,
  mockTestTokenAddress,
  mockTestTokenTokenId,
} from 'test/values'

jest.mock('@segment/analytics-react-native')
jest.mock('@segment/analytics-react-native-plugin-adjust')
jest.mock('@segment/analytics-react-native-plugin-clevertap')
jest.mock('@segment/analytics-react-native-plugin-firebase')
jest.mock('@sentry/react-native', () => ({ init: jest.fn() }))
jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
jest.mock('src/config', () => ({
  ...(jest.requireActual('src/config') as any),
  STATSIG_API_KEY: 'statsig-key',
}))
jest.mock('statsig-react-native')
jest.mock('src/statsig')
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockWalletAddress = '0x12AE66CDc592e10B60f9097a7b0D3C59fce29876' // deliberately using checksummed version here

const mockCreateSegmentClient = jest.mocked(createClient)

const mockStore = jest.mocked(store)
const state = getMockStoreData({
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        priceUsd: '1',
        balance: '10',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
      [mockCeurTokenId]: {
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cEUR',
        priceUsd: '1.2',
        balance: '20',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
      [mockCeloTokenId]: {
        address: mockCeloAddress,
        tokenId: mockCeloTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'CELO',
        priceUsd: '5',
        balance: '0',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
      [mockTestTokenTokenId]: {
        address: mockTestTokenAddress,
        tokenId: mockTestTokenTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'TT',
        balance: '10',
        priceFetchedAt: Date.now(),
      },
      'celo-alfajores:0xMOO': {
        address: '0xMOO',
        tokenId: 'celo-alfajores:0xMOO',
        networkId: NetworkId['celo-alfajores'],
        symbol: 'MOO',
        priceUsd: '4',
        balance: '0',
        priceFetchedAt: Date.now(),
      },
      'celo-alfajores:0xUBE': {
        address: '0xUBE',
        tokenId: 'celo-alfajores:0xUBE',
        networkId: NetworkId['celo-alfajores'],
        symbol: 'UBE',
        priceUsd: '2',
        balance: '1',
        priceFetchedAt: Date.now(),
      },
    },
  },
  positions: {
    positions: mockPositions,
  },
  web3: {
    account: mockWalletAddress,
  },
  account: {
    pincodeType: PincodeType.CustomPin,
  },
  app: {
    phoneNumberVerified: true,
  },
  points: {
    pointsBalance: '50',
  },
})

// Disable __DEV__ so analytics is enabled
// @ts-ignore
global.__DEV__ = false

beforeAll(() => {
  jest.useFakeTimers({ now: 1482363367071 })
})

describe('AppAnalytics', () => {
  let AppAnalytics: typeof AppAnalyticsModule
  const mockSegmentClient = {
    identify: jest.fn().mockResolvedValue(undefined),
    track: jest.fn().mockResolvedValue(undefined),
    screen: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn().mockResolvedValue(undefined),
    userInfo: {
      get: jest.fn().mockReturnValue({ anonymousId: 'anonId' }),
      set: jest.fn().mockReturnValue(undefined),
    },
    reset: jest.fn(),
    add: jest.fn(),
  }
  mockCreateSegmentClient.mockReturnValue(mockSegmentClient as any)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.unmock('src/analytics/AppAnalytics')
    jest.isolateModules(() => {
      AppAnalytics = require('src/analytics/AppAnalytics').default
    })
    mockStore.getState.mockImplementation(() => state)
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest.mocked(getMultichainFeatures).mockReturnValue({
      showBalances: [NetworkId['celo-alfajores']],
    })
  })

  it('creates statsig client on initialization with default statsig user', async () => {
    jest.mocked(getDefaultStatsigUser).mockReturnValue({ userID: 'someUserId' })
    await AppAnalytics.init()
    expect(Statsig.initialize).toHaveBeenCalledWith(
      'statsig-key',
      { userID: 'someUserId' },
      { environment: { tier: 'development' }, overrideStableID: 'anonId', localMode: false }
    )
  })

  it('calls identify', async () => {
    AppAnalytics.identify('0xUSER', { someUserProp: 'testValue' })
    expect(mockSegmentClient.identify).not.toHaveBeenCalled()

    await AppAnalytics.init()
    // Now that init has finished identify should have been called
    expect(mockSegmentClient.identify).toHaveBeenCalled()
  })

  it('calls track', async () => {
    AppAnalytics.track(OnboardingEvents.pin_invalid, { error: 'some error' })
    expect(mockSegmentClient.track).not.toHaveBeenCalled()

    await AppAnalytics.init()
    // Now that init has finished track should have been called
    expect(mockSegmentClient.track).toHaveBeenCalled()
  })

  it('calls screen', async () => {
    AppAnalytics.page('Some Page', { someProp: 'testValue' })
    expect(mockSegmentClient.screen).not.toHaveBeenCalled()

    await AppAnalytics.init()
    // Now that init has finished identify should have been called
    expect(mockSegmentClient.screen).toHaveBeenCalled()
  })
})
