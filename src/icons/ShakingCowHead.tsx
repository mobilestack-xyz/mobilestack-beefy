import * as React from 'react'
import Svg, { ClipPath, Defs, G, Mask, Path } from 'react-native-svg'

export interface Props {
  size?: number
}

function ShakingCowHead({ size }: Props) {
  return (
    <Svg height={size} width={size} viewBox="0 0 112 112" fill="none" testID="ShakingCowHead">
      <G clipPath="url(#a)">
        <Mask
          id="b"
          width={size}
          height={size}
          x={0}
          y={0}
          maskUnits="userSpaceOnUse"
          style={{
            maskType: 'luminance',
          }}
        >
          <Path fill="#fff" d="M0 0h112v112H0V0Z" />
        </Mask>
        <G mask="url(#b)">
          <Mask
            id="c"
            width={size}
            height={size}
            x={0}
            y={0}
            maskUnits="userSpaceOnUse"
            style={{
              maskType: 'luminance',
            }}
          >
            <Path fill="#fff" d="M112 0H0v112h112V0Z" />
          </Mask>
          <G fill="#4EB258" mask="url(#c)">
            <Path d="m47.37 30.024 1.413-3.88c1.142-3.138 4.124-4.942 7.416-4.362 2.488.439 4.49 1.662 5.558 4.077.701 1.582.767 3.21.197 4.845-.471 1.357-.978 2.701-1.476 4.07l7.098 2.583c.036-.082.077-.168.11-.258l1.34-3.681c1.278-3.483 5.035-5.234 8.532-3.998 1.206.425 2.331.97 3.19 1.939 1.762 1.99 2.236 4.262 1.389 6.782-.448 1.33-.955 2.64-1.451 4.004l9.225 3.358c1.725.628 2.447 2.19 1.979 3.965-.4 1.518-1.266 2.72-2.241 3.887a14.612 14.612 0 0 1-3.54 3.076c-1.058.656-2.183 1.215-3.316 1.731-1.469.667-2.973 1.258-4.47 1.862-.818.33-1.59.726-2.219 1.353-.18.18-.357.398-.442.633-2.069 5.65-4.104 11.313-6.19 16.957-2.506 6.783-9.737 11.013-16.876 9.875a18.95 18.95 0 0 1-3.237-.83c-2.947-1.028-5.87-2.121-8.802-3.189-7.156-2.605-11.376-9.667-10.226-17.184.168-1.037.435-2.054.798-3.04 1.98-5.518 3.998-11.02 5.998-16.532.059-.173.083-.356.072-.538-.07-1.203-.58-2.253-1.133-3.295a207.314 207.314 0 0 1-2.185-4.246c-.831-1.659-1.489-3.389-1.75-5.23-.297-2.072-.43-4.158.308-6.184.163-.458.38-.895.644-1.302.78-1.17 2.234-1.628 3.569-1.144 3.453 1.252 6.906 2.508 10.356 3.77l.363.126Zm7.929 9.948-11.285-4.107c-.726-.265-1.527-.004-1.879.673-.21.389-.357.81-.434 1.245-.21 1.354-.078 2.697.46 3.956.539 1.259 1.192 2.442 1.754 3.677.425.932.556 1.905.189 2.91-2.253 6.172-4.5 12.345-6.74 18.52a9.529 9.529 0 0 0-.395 1.335c-.918 4.465 1.523 8.822 5.806 10.38 2.942 1.072 5.885 2.141 8.828 3.21.435.163.88.297 1.333.4a9.038 9.038 0 0 0 10.394-5.733c.374-1.029.74-2.062 1.13-3.084.087-.24.055-.362-.147-.515a28.059 28.059 0 0 1-5.152-5.049c-3.428-4.364-5.48-9.285-5.95-14.836-.225-2.663-.082-5.308.573-7.9.43-1.697.997-3.362 1.515-5.082Zm12.359 23.24a2.976 2.976 0 1 0-5.57-2.102 2.976 2.976 0 0 0 1.734 3.836l.007.002c1.53.58 3.242-.19 3.823-1.72l.006-.016Z" />
            <Path d="M51.03 55.966a2.978 2.978 0 1 1-2.966-2.988h.01a2.965 2.965 0 0 1 2.956 2.975v.013Z" />
          </G>
        </G>
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h112v112H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

ShakingCowHead.defaultProps = {
  size: 112,
}

export default ShakingCowHead
