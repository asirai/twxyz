import { CommonConfigDefault } from './Config/CommonConfig'
import Twisty3D from './3D/Twisty3D'
import Cube3D from './3D/Cube3D'
import Skewb3D from './3D/Skewb3D'
import Square3D from './3D/Square3D'

const twisty3D = (puzzle: string, 
  speed: number=CommonConfigDefault.speed,
  easing: (t: number) => number=CommonConfigDefault.easing,
  hover: boolean=CommonConfigDefault.hover): Twisty3D => {
let model: Twisty3D

if (puzzle === '3x3x3') {
model = new Cube3D(speed, easing, hover)
}
else if (puzzle === 'skewb') {
  model = new Skewb3D(speed, easing, hover)
}
else if (puzzle === 'square') {
  model = new Square3D(speed, easing, hover)
}
else {
model = new Cube3D(speed, easing, hover)
}

return model
}

export default twisty3D