import * as React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'
import colors from 'src/styles/colors'

export default function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={SWITCH_TRACK}
      thumbColor={colors.darkBlue}
      ios_backgroundColor={colors.white}
      {...props}
    />
  )
}

const SWITCH_TRACK = {
  false: colors.white,
  true: colors.accent,
}
