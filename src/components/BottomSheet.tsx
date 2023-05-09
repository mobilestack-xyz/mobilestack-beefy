import GorhomBottomSheet, {
  BottomSheetBackdrop,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import React, { useCallback, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  title: string
  buttonLabel: string
  buttonOnPress: () => void
  buttonType?: BtnTypes
  description?: string
  children?: React.ReactNode
  testId: string
}

const BottomSheet = ({
  forwardedRef,
  title,
  buttonLabel,
  buttonOnPress,
  buttonType = BtnTypes.PRIMARY,
  description,
  children,
  testId,
}: Props) => {
  const insets = useSafeAreaInsets()
  const paddingBottom = Math.max(insets.bottom, Spacing.Thick24)

  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], [])
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(initialSnapPoints)

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  )

  return (
    <GorhomBottomSheet
      ref={forwardedRef}
      index={-1}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
    >
      <View
        style={[styles.container, { paddingBottom }]}
        onLayout={handleContentLayout}
        testID={testId}
      >
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        {children}
        <Button
          text={buttonLabel}
          onPress={buttonOnPress}
          size={BtnSizes.FULL}
          type={buttonType}
          testID={`${testId}/PrimaryAction`}
        />
      </View>
    </GorhomBottomSheet>
  )
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: Colors.gray3,
  },
  container: {
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: Spacing.Regular16,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  description: {
    ...fontStyles.small,
    marginBottom: Spacing.Large32,
  },
})

export default BottomSheet
