import { Result } from '@badrap/result'
import { FiatAccountType, TransferStatus } from '@fiatconnect/fiatconnect-types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matches from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { fetchQuotes, FiatConnectQuoteSuccess, getFiatConnectProviders } from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import {
  handleCreateFiatConnectTransfer,
  handleFetchFiatConnectProviders,
  handleFetchFiatConnectQuotes,
} from 'src/fiatconnect/saga'
import { fiatConnectProvidersSelector } from 'src/fiatconnect/selectors'
import {
  createFiatConnectTransfer,
  createFiatConnectTransferCompleted,
  createFiatConnectTransferFailed,
  fetchFiatConnectProvidersCompleted,
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
} from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { buildAndSendPayment } from 'src/send/saga'
import { tokensListSelector } from 'src/tokens/selectors'
import { CiCoCurrency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  emptyFees,
  mockFiatConnectProviderInfo,
  mockFiatConnectQuotes,
  mockTokenBalances,
} from 'test/values'
import { mocked } from 'ts-jest/utils'
import { v4 as uuidv4 } from 'uuid'

jest.mock('src/fiatconnect')
jest.mock('uuid')
jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Fiatconnect saga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('Handles fetching quotes', () => {
    it('saves quotes when fetch is successful', async () => {
      mocked(fetchQuotes).mockImplementation(() => Promise.resolve(mockFiatConnectQuotes))
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
        ])
        .put(fetchFiatConnectQuotesCompleted({ quotes: mockFiatConnectQuotes }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        country: 'MX',
        cryptoAmount: 3,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        fiatConnectProviders: mockFiatConnectProviderInfo,
      })
    })

    it('saves an error', async () => {
      mocked(fetchQuotes).mockRejectedValue({})
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
        ])
        .put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        country: 'MX',
        cryptoAmount: 3,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        fiatConnectProviders: mockFiatConnectProviderInfo,
      })
    })
    it('saves an error when providers is null', async () => {
      mocked(fetchQuotes).mockResolvedValue(mockFiatConnectQuotes)
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), null],
        ])
        .put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
        .run()

      expect(fetchQuotes).not.toHaveBeenCalled()
    })
  })

  describe('handles fetching providers', () => {
    it('saves on success', async () => {
      mocked(getFiatConnectProviders).mockResolvedValue(mockFiatConnectProviderInfo)
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(currentAccountSelector), '0xabc']])
        .put(fetchFiatConnectProvidersCompleted({ providers: mockFiatConnectProviderInfo }))
        .run()
      expect(getFiatConnectProviders).toHaveBeenCalledWith('0xabc')
    })
    it('fails when account is null', async () => {
      mocked(getFiatConnectProviders).mockResolvedValue(mockFiatConnectProviderInfo)
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(currentAccountSelector), null]])
        .run()
      expect(getFiatConnectProviders).not.toHaveBeenCalled()
      expect(Logger.error).toHaveBeenCalled()
    })
    it('fails when getProviders fails', async () => {
      mocked(getFiatConnectProviders).mockRejectedValue(new Error('error'))
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(currentAccountSelector), '0xabc']])
        .run()
      expect(getFiatConnectProviders).toHaveBeenCalledWith('0xabc')
      expect(Logger.error).toHaveBeenCalled()
    })
  })

  describe('handles fiat connect transfer', () => {
    const transferOutFcQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
    })

    const quoteId = transferOutFcQuote.getQuoteId()
    const providerId = transferOutFcQuote.getProviderId()
    const providerBaseUrl = transferOutFcQuote.getProviderBaseUrl()

    const mockTransferOut = jest.fn()
    const mockFcClient = {
      transferOut: mockTransferOut,
    }
    mocked(uuidv4).mockReturnValue('mock-uuidv4')

    it('calls transfer out and sends payment to provider', async () => {
      mockTransferOut.mockResolvedValueOnce(
        Result.ok({
          transferId: 'transfer1',
          transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
          transferAddress: '0xabc',
        })
      )
      await expectSaga(
        handleCreateFiatConnectTransfer,
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [call(getFiatConnectClient, providerId, providerBaseUrl), mockFcClient],
          [matches.call.fn(buildAndSendPayment), { receipt: { transactionHash: '0x12345' } }],
        ])
        .put(
          createFiatConnectTransferCompleted({
            flow: CICOFlow.CashOut,
            quoteId,
            txHash: '0x12345',
          })
        )
        .run()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
    })

    it('returns failed event on transfer out failure', async () => {
      mockTransferOut.mockResolvedValueOnce(Result.err(new Error('transfer error')))
      await expectSaga(
        handleCreateFiatConnectTransfer,
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [call(getFiatConnectClient, providerId, providerBaseUrl), mockFcClient],
        ])
        .put(
          createFiatConnectTransferFailed({
            flow: CICOFlow.CashOut,
            quoteId,
          })
        )
        .run()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
    })

    it('returns failed event on transaction failure', async () => {
      mockTransferOut.mockResolvedValueOnce(
        Result.ok({
          transferId: 'transfer1',
          transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
          transferAddress: '0xabc',
        })
      )
      await expectSaga(
        handleCreateFiatConnectTransfer,
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [call(getFiatConnectClient, providerId, providerBaseUrl), mockFcClient],
          [matches.call.fn(buildAndSendPayment), { error: 'tx error' }],
        ])
        .put(
          createFiatConnectTransferFailed({
            flow: CICOFlow.CashOut,
            quoteId,
          })
        )
        .run()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
    })
  })
})