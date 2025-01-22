import { render } from '@testing-library/react-native'
import React from 'react'
import NoActivity from './NoActivity'

describe('NoActivity Component', () => {
  it('renders an image and text', () => {
    const { getByText, getByTestId } = render(<NoActivity loading={false} error={undefined} />)

    expect(getByText('transactionFeed.noActivity')).toBeTruthy()
    expect(getByTestId('NoActivity/Image')).toBeTruthy()
  })

  it('renders error message when error exists', () => {
    const { getByText, queryByText, queryByTestId } = render(
      <NoActivity error={new Error('Something went wrong')} loading />
    )

    expect(queryByTestId('NoActivity/loading')).toBeFalsy()
    expect(queryByText('transactionFeed.noTransactions')).toBeFalsy()
    expect(getByText('errorLoadingActivity.0')).toBeTruthy()
    expect(getByText('errorLoadingActivity.1')).toBeTruthy()
  })
})
