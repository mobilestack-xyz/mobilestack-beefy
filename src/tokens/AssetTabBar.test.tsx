import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
import Colors from 'src/styles/colors'
import AssetTabBar from 'src/tokens/AssetTabBar'
import { AssetTabType } from 'src/tokens/types'

describe('AssetTabBar', () => {
  const onChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all items if positions is enabled', () => {
    const { getAllByTestId } = render(
      <AssetTabBar activeTab={AssetTabType.Tokens} onChange={onChange} displayPositions={true} />
    )

    const tabItems = getAllByTestId('Assets/TabBarItem')
    expect(tabItems).toHaveLength(2)
    expect(tabItems[0]).toHaveTextContent('tokens')
    expect(tabItems[0].children[0]).toHaveStyle({ color: Colors.white })
    expect(tabItems[1]).toHaveTextContent('dappPositions')
    expect(tabItems[1].children[0]).toHaveStyle({ color: Colors.lightBlue })
  })

  it.each([
    { tab: AssetTabType.Tokens, event: AssetsEvents.view_wallet_assets },
    { tab: AssetTabType.Positions, event: AssetsEvents.view_dapp_positions },
  ])('selecting tab $tab fires analytics events and invokes on change', ({ tab, event }) => {
    const { getAllByTestId } = render(
      <AssetTabBar activeTab={AssetTabType.Tokens} onChange={onChange} displayPositions={true} />
    )

    fireEvent.press(getAllByTestId('Assets/TabBarItem')[tab])
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(event)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(tab)
  })
})
