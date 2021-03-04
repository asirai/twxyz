import Easing from '../Easing'

interface CommonConfig {
  puzzle: string // パズルの種類
  speed: number // 再生速度
  easing: (t: number) => number // イージング関数
  hover: boolean // ホバーステッカーの有無
  background: number // 背景色
  control: boolean // orbitcontrols
  rotation: number[] // カメラの回転
}

const CommonConfigDefault: CommonConfig = {
  puzzle: '3x3x3',
  speed: 500,
  easing: Easing.easeInOutQuad,
  hover: false,
  background: 0x000000,
  control: false,
  rotation: [30, 30, 0]
}

export { CommonConfig, CommonConfigDefault }