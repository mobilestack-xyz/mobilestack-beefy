import React from 'react'
import { View } from 'react-native'

export default function ({ testID }: { testID: string }) {
  return <View testID={testID}></View>
}
