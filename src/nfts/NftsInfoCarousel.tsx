import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import NftMedia from 'src/nfts/NftMedia'
import NftsLoadError from 'src/nfts/NftsLoadError'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { NetworkId } from 'src/transactions/types'
import { blockExplorerUrls } from 'src/web3/networkConfig'

const DEFAULT_HEIGHT = 360

interface NftThumbnailProps {
  nft: Nft
  isActive: boolean
  onPress: () => void
}

function NftThumbnail({ nft, isActive, onPress }: NftThumbnailProps) {
  return (
    <Touchable
      style={[
        isActive ? styles.nftThumbnailSelected : styles.nftThumbnailUnselected,
        !nft.metadata && styles.errorThumbnail,
      ]}
      hitSlop={variables.iconHitslop}
      borderless={false}
      onPress={onPress}
      testID={`NftsInfoCarousel/NftThumbnail/${nft.contractAddress}-${nft.tokenId}`}
    >
      <NftMedia
        nft={nft}
        ErrorComponent={
          <View style={styles.nftImageLoadingErrorContainer}>
            <ImageErrorIcon
              // The thumbnails are 20% larger when selected vs unselected
              size={isActive ? 24 : 20}
              testID="NftsInfoCarousel/ImageErrorIcon"
            />
          </View>
        }
        width={40}
        height={40}
        borderRadius={8}
        testID="NftsInfoCarousel/ThumbnailImage"
        origin={NftOrigin.NftsInfoCarouselThumbnail}
        mediaType="image"
      />
    </Touchable>
  )
}

interface NftImageCarouselProps {
  nfts: Nft[]
  handleOnPress: (nft: Nft) => void
  activeNft: Nft
}

function NftImageCarousel({ nfts, handleOnPress, activeNft }: NftImageCarouselProps) {
  return (
    <View style={styles.nftImageCarouselContainer}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        horizontal={true}
        contentContainerStyle={styles.carouselScrollViewContentContainer}
        style={styles.nftImageCarousel}
        testID="NftsInfoCarousel/NftImageCarousel"
      >
        {nfts.map((nft) => {
          return (
            <View
              // Use contractAddress and tokenId for a unique key
              key={`${nft.contractAddress}-${nft.tokenId}`}
              style={styles.nftThumbnailSharedContainer}
            >
              <NftThumbnail
                onPress={() => handleOnPress(nft)}
                isActive={
                  `${activeNft.contractAddress}-${activeNft.tokenId}` ===
                  `${nft.contractAddress}-${nft.tokenId}`
                }
                nft={nft}
              />
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.NftsInfoCarousel>

export default function NftsInfoCarousel({ route }: Props) {
  const { nfts, networkId } = route.params
  const [activeNft, setActiveNft] = useState<Nft | null>(nfts[0] ?? null)
  const { t } = useTranslation()
  const headerHeight = useHeaderHeight()

  const blockExplorerUri = useMemo(() => {
    if (
      !activeNft?.tokenId ||
      !activeNft.contractAddress ||
      !/^(0|[1-9]\d*|0x[0-9a-fA-F]+)$/.test(activeNft.tokenId)
    ) {
      return null
    }
    // tokenId could be decimal or hex string of 256 bit integers, parse it as a
    // BigInt and convert back to string
    const tokenId = BigInt(activeNft.tokenId).toString()
    switch (networkId) {
      case NetworkId['celo-mainnet']:
      case NetworkId['celo-alfajores']:
        return `${blockExplorerUrls[networkId].baseNftUrl}${activeNft.contractAddress}/instance/${tokenId}/metadata`
      case NetworkId['ethereum-mainnet']:
      case NetworkId['ethereum-sepolia']:
        return `${blockExplorerUrls[networkId].baseNftUrl}${activeNft.contractAddress}/${tokenId}`
      default:
        return `${blockExplorerUrls[networkId].baseNftUrl}${activeNft.contractAddress}?a=${tokenId}`
    }
  }, [activeNft, networkId])

  function pressExplorerLink() {
    if (blockExplorerUri) {
      navigate(Screens.WebViewScreen, { uri: blockExplorerUri })
    }
  }

  function handleThumbnailPress(nft: Nft) {
    setActiveNft(nft)
  }

  // Full page error screen shown when ntfs === []
  if (!activeNft) {
    return <NftsLoadError testID="NftsInfoCarousel/NftsLoadErrorScreen" />
  }

  const networkIdToExplorerString: Record<NetworkId, string> = {
    [NetworkId['celo-mainnet']]: t('nftInfoCarousel.viewOnCeloExplorer'),
    [NetworkId['celo-alfajores']]: t('nftInfoCarousel.viewOnCeloExplorer'),
    [NetworkId['ethereum-mainnet']]: t('viewOnEthereumBlockExplorer'),
    [NetworkId['ethereum-sepolia']]: t('viewOnEthereumBlockExplorer'),
    [NetworkId['arbitrum-one']]: t('viewOnArbiscan'),
    [NetworkId['arbitrum-sepolia']]: t('viewOnArbiscan'),
    [NetworkId['op-mainnet']]: t('viewOnOPMainnetExplorer'),
    [NetworkId['op-sepolia']]: t('viewOnOPSepoliaExplorer'),
    [NetworkId['polygon-pos-mainnet']]: t('viewOnPolygonPoSScan'),
    [NetworkId['polygon-pos-amoy']]: t('viewOnPolygonPoSScan'),
    [NetworkId['base-mainnet']]: t('viewOnBaseScan'),
    [NetworkId['base-sepolia']]: t('viewOnBaseScan'),
  }

  return (
    <SafeAreaView
      style={[styles.safeAreaView, { paddingTop: headerHeight }]}
      edges={[]}
      testID="NftsInfoCarousel"
    >
      <ScrollView>
        {/* Main Nft Video or Image */}
        <NftMedia
          shouldAutoScaleHeight
          height={DEFAULT_HEIGHT}
          nft={activeNft}
          mediaType={activeNft.metadata?.animation_url ? 'video' : 'image'}
          origin={NftOrigin.NftsInfoCarouselMain}
          ErrorComponent={
            <View style={styles.nftImageLoadingErrorContainer}>
              <ImageErrorIcon />
              <Text style={styles.errorImageText}>{t('nftInfoCarousel.nftImageLoadError')}</Text>
            </View>
          }
          testID={
            activeNft.metadata?.animation_url
              ? 'NftsInfoCarousel/MainVideo'
              : 'NftsInfoCarousel/MainImage'
          }
        />
        {/* Display a carousel selection if multiple images */}
        {nfts.length > 1 && (
          <NftImageCarousel
            nfts={nfts}
            activeNft={activeNft}
            handleOnPress={handleThumbnailPress}
          />
        )}
        {/* Nft Details */}
        {activeNft.metadata && (
          <>
            {!!activeNft.metadata?.name && (
              <View style={styles.sectionContainer}>
                <Text style={styles.title}>{activeNft.metadata?.name}</Text>
              </View>
            )}
            {!!activeNft.metadata?.description && (
              <View style={styles.sectionContainer}>
                <Text style={styles.subSectionTitle}>{t('nftInfoCarousel.description')}</Text>
                <Text style={styles.text}>{activeNft.metadata?.description}</Text>
              </View>
            )}
            {activeNft.metadata?.attributes && (
              <View style={styles.sectionContainer}>
                <Text style={styles.subSectionTitle}>{t('nftInfoCarousel.attributes')}</Text>
                {activeNft.metadata?.attributes.map((attribute, index) => (
                  <View key={index} style={styles.attributesContainer}>
                    <Text style={styles.attributeTitle}>{attribute.trait_type}</Text>
                    <Text style={styles.attributeText}>{attribute.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {/* Nft Explorer Link */}
        {!!blockExplorerUri && (
          <View style={[styles.sectionContainer, styles.sectionContainerLast]}>
            <Touchable onPress={pressExplorerLink} testID="ViewOnExplorer">
              <View style={styles.explorerLinkContainer}>
                <Text style={styles.explorerLink}>{networkIdToExplorerString[networkId]}</Text>
                <OpenLinkIcon color={colors.successDark} />
              </View>
            </Touchable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

NftsInfoCarousel.navigationOptions = () => ({
  ...headerWithBackButton,
  headerTransparent: true,
  headerShown: true,
  headerStyle: {
    backgroundColor: 'transparent',
  },
  animation: 'slide_from_right',
  animationDuration: 130,
})

const styles = StyleSheet.create({
  attributeText: {
    ...typeScale.bodyMedium,
    color: colors.white,
  },
  attributeTitle: {
    ...typeScale.labelSmall,
    color: colors.lightBlue,
  },
  attributesContainer: {
    paddingBottom: Spacing.Thick24,
  },
  carouselScrollViewContentContainer: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    marginLeft: Spacing.Regular16,
  },
  errorThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue200,
  },
  errorImageText: {
    marginTop: Spacing.Regular16,
    ...typeScale.bodyMedium,
    color: colors.lightBlue,
  },
  explorerLink: {
    ...typeScale.labelSmall,
    color: colors.successDark,
    paddingRight: Spacing.Smallest8,
  },
  explorerLinkContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  nftImageCarousel: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.Regular16,
    paddingTop: Spacing.Smallest8,
  },
  nftImageCarouselContainer: {
    flex: 1,
  },
  nftImageLoadingErrorContainer: {
    width: '100%',
    height: DEFAULT_HEIGHT,
    backgroundColor: colors.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  nftThumbnailSelected: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftThumbnailSharedContainer: {
    borderRadius: Spacing.Smallest8,
    marginRight: Spacing.Smallest8,
    overflow: 'hidden',
  },
  nftThumbnailUnselected: {
    height: 32,
    opacity: 0.5,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeAreaView: {
    flex: 1,
  },
  sectionContainer: {
    marginHorizontal: Spacing.Thick24,
    marginTop: Spacing.Regular16,
  },
  sectionContainerLast: {
    marginBottom: Spacing.Large32,
  },
  subSectionTitle: {
    ...typeScale.labelSemiBoldLarge,
    marginBottom: Spacing.Regular16,
  },
  text: {
    ...typeScale.bodyMedium,
  },
  title: {
    ...typeScale.titleMedium,
  },
})
