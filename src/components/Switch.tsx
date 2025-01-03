import * as React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'
import colors from 'src/styles/colors'

export default function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={SWITCH_TRACK}
      thumbColor={colors.blue200}
      ios_backgroundColor={colors.lightBlue}
      {...props}
    />
  )
}

const SWITCH_TRACK = {
  false: colors.lightBlue,
  true: colors.accent,
}
