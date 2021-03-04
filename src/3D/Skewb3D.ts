import { CommonConfigDefault } from '../Config/CommonConfig'
import Twisty3D from './Twisty3D'
import Permutation from '../Permutation'
import Tween from '../Tween'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'

const faceToNum: {[f: string]: number} = {U: 0, F: 1, R: 2, D: 3, B: 4, L: 5}
const suffixToNum: {[f: string]: number} = {'': 1, '\'': -1, '2': 2, '\'2': -2, '3': 3, '\'3': -3}

const faceToAxis: {[f: string]: THREE.Vector3} = {
  F: new THREE.Vector3(-1, -1, -1).normalize(),
  L: new THREE.Vector3(1, -1, -1).normalize(),
  B: new THREE.Vector3(1, -1, 1).normalize(),
  R: new THREE.Vector3(-1, -1, 1).normalize(),
  f: new THREE.Vector3(-1, 1, -1).normalize(),
  l: new THREE.Vector3(1, 1, -1).normalize(),
  b: new THREE.Vector3(1, 1, 1).normalize(),
  r: new THREE.Vector3(-1, 1, 1).normalize(),
  x: new THREE.Vector3(-1, 0, 0).normalize(),
  y: new THREE.Vector3(0, -1, 0).normalize(),
  z: new THREE.Vector3(0, 0, -1).normalize()
}

const faceToRad: {[f: string]: number} = {
  F: Math.PI * 2 / 3,
  L: Math.PI * 2 / 3,
  B: Math.PI * 2 / 3,
  R: Math.PI * 2 / 3,
  f: Math.PI * 2 / 3,
  l: Math.PI * 2 / 3,
  b: Math.PI * 2 / 3,
  r: Math.PI * 2 / 3,
  x: Math.PI * 1 / 2,
  y: Math.PI * 1 / 2,
  z: Math.PI * 1 / 2
}

const faceToMask: {[f: string]: {[f: string]: number[]}} = {
  F: {center: [1, 1, 1, 0, 0, 0], corner: [1, 1, 0, 1, 1, 0, 0, 0]},
  L: {center: [1, 1, 0, 0, 0, 1], corner: [1, 1, 1, 0, 0, 0, 0, 1]},
  B: {center: [1, 0, 0, 0, 1, 1], corner: [0, 1, 1, 1, 0, 0, 1, 0]},
  R: {center: [1, 0, 1, 0, 1, 0], corner: [1, 0, 1, 1, 0, 1, 0, 0]},
  f: {center: [0, 1, 1, 1, 0, 0], corner: [1, 0, 0, 0, 1, 1, 0, 1]},
  l: {center: [0, 1, 0, 1, 0, 1], corner: [0, 1, 0, 0, 1, 0, 1, 1]},
  b: {center: [0, 0, 0, 1, 1, 1], corner: [0, 0, 1, 0, 0, 1, 1, 1]},
  r: {center: [0, 0, 1, 1, 1, 0], corner: [0, 0, 0, 1, 1, 1, 1, 0]},
  x: {center: [1, 1, 1, 1, 1, 1], corner: [1, 1, 1, 1, 1, 1, 1, 1]},
  y: {center: [1, 1, 1, 1, 1, 1], corner: [1, 1, 1, 1, 1, 1, 1, 1]},
  z: {center: [1, 1, 1, 1, 1, 1], corner: [1, 1, 1, 1, 1, 1, 1, 1]},
}

class State {
  public readonly center: Permutation
  public readonly corner: Permutation

  constructor(
    center: Permutation | number[],
    corner: Permutation | number[]
  ) {
    this.center = Array.isArray(center) ? new Permutation(center) : center
    this.corner = Array.isArray(corner) ? new Permutation(corner) : corner
  }

  apply(state: State): State {
    const newCenter: Permutation = this.center.apply(state.center)
    const newCorner: Permutation = this.corner.apply(state.corner)
    return new State(newCenter, newCorner)
  }
}

class Center {
  constructor(
    public readonly rotation: THREE.Euler,
    public readonly sticker: string
  ) {}
}

class Corner {
  public readonly rotation: THREE.Euler
  public readonly sticker: string[]
  constructor(
    rotation: THREE.Euler,
    sticker: string | string[]
  ) {
    this.rotation = rotation
    this.sticker = []
    const stickerFacesArr: string[] = typeof sticker === 'string' ? sticker.split('') : sticker
    for (let i = 0; i < stickerFacesArr.length; i++) this.sticker.push(stickerFacesArr[i])
  }
}

const centerDefinitions: Center[] = [
  new Center(new THREE.Euler(0, 0, 0), 'U'),
  new Center(new THREE.Euler(Math.PI / 2, 0, 0), 'F'),
  new Center(new THREE.Euler(0, 0, -Math.PI / 2), 'R'),
  new Center(new THREE.Euler(Math.PI, 0, 0), 'D'),
  new Center(new THREE.Euler(-Math.PI / 2, 0, 0), 'B'),
  new Center(new THREE.Euler(0, 0, Math.PI / 2), 'L')
]

const cornerDefinitions: Corner[] = [
  new Corner(new THREE.Euler(0, 0, 0), 'UFR'),
  new Corner(new THREE.Euler(0, -Math.PI / 2, 0), 'ULF'),
  new Corner(new THREE.Euler(0, Math.PI, 0), 'UBL'),
  new Corner(new THREE.Euler(0, Math.PI / 2, 0), 'URB'),
  new Corner(new THREE.Euler(Math.PI, Math.PI / 2, 0), 'DRF'),
  new Corner(new THREE.Euler(Math.PI, 0, 0), 'DBR'),
  new Corner(new THREE.Euler(Math.PI, -Math.PI / 2, 0), 'DLB'),
  new Corner(new THREE.Euler(Math.PI, Math.PI, 0), 'DFL')
]

class Skewb3D implements Twisty3D {
  public object: THREE.Object3D
  private _object3D: {[s: string]: THREE.Object3D[]}
  private _geometry: (ConvexGeometry|THREE.PlaneGeometry|THREE.ShapeGeometry)[] = []
  private _material: THREE.MeshBasicMaterial[] = []
  private _state: State
  private _colorScheme: number[]
  private _bodyColor: number
  private _moveState: {[s: string]: State}
  private _tween: Tween
  private _isPlaying: boolean
  // hover
  private _hoverStickers: THREE.Mesh[]

  constructor(private _speed: number=CommonConfigDefault.speed,
    private _easing: (t: number) => number=CommonConfigDefault.easing,
    private _hover: boolean=CommonConfigDefault.hover) {

    this._colorScheme = [0xffffff,0x00ff00,0xff0000,0xffff00,0x0000ff,0xff8000]
    this._bodyColor = 0x000000

    this.object = new THREE.Object3D()
    this._object3D = {center: [], corner: []}

    this._hoverStickers = []
    for (let i = 0; i < 6; i++) {
      const c = this.createCenterPiece(centerDefinitions[i])
      this.object.add(c)
      this._object3D.center.push(c)
    }
    for (let i = 0; i < 8; i++) {
      const c = this.createCornerPiece(cornerDefinitions[i])
      this.object.add(c)
      this._object3D.corner.push(c)
    }

    this.hover(this._hover)

    this._state = new State([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5, 6, 7])
    
    this._moveState = {}
    this._moveState.F = new State([1,2,0,3,4,5], [0,4,2,1,3,5,6,7])
    this._moveState.L = new State([5,0,2,3,4,1], [2,1,7,3,4,5,6,0])
    this._moveState.B = new State([4,1,2,3,5,0], [0,3,2,6,4,5,1,7])
    this._moveState.R = new State([2,1,4,3,0,5], [5,1,0,3,4,2,6,7])
    this._moveState.f = new State([0,3,1,2,4,5], [7,1,2,3,4,0,6,5])
    this._moveState.l = new State([0,5,2,1,4,3], [0,6,2,3,1,5,4,7])
    this._moveState.b = new State([0,1,2,5,3,4], [0,1,5,3,4,7,6,2])
    this._moveState.r = new State([0,1,3,4,2,5], [0,1,2,4,6,5,3,7])
    for (const move in this._moveState) {
      this._moveState[move + '\''] = this._moveState[move].apply(this._moveState[move])
      this._moveState[move + '2'] = this._moveState[move + '\'']
      this._moveState[move + '\'2'] = this._moveState[move]
    }
    this._moveState.x = new State([1,3,2,4,0,5], [4,7,1,0,5,3,2,6])
    this._moveState.y = new State([0,2,4,3,5,1], [3,0,1,2,5,6,7,4])
    this._moveState.z = new State([5,1,0,2,4,3], [1,7,6,2,0,3,5,4])
    for (const move of ['x', 'y', 'z']) {
      this._moveState[move + '2'] = this._moveState[move].apply(this._moveState[move])
      this._moveState[move + '\''] = this._moveState[move + '2'].apply(this._moveState[move])
      this._moveState[move + '\'2'] = this._moveState[move + '2']
      this._moveState[move + '3'] = this._moveState[move + '\'']
      this._moveState[move + '\'3'] = this._moveState[move]
    }

    this._isPlaying = false
  }

  createCenterPiece(def: Center): THREE.Object3D {
    const wrapper = new THREE.Object3D()

    const p = new THREE.Object3D()
    const b = this.createCenterBody()
    p.add(b)
    const s = this.createCenterSticker(def.sticker)
    p.add(s)
    
    p.setRotationFromEuler(def.rotation)

    wrapper.add(p)

    return wrapper
  }

  createCenterBody(): THREE.Object3D {
    const geometry = new ConvexGeometry([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.5, 1.5, 0),
      new THREE.Vector3(0, 1.5, 1.5),
      new THREE.Vector3(-1.5, 1.5, 0),
      new THREE.Vector3(0, 1.5, -1.5)
    ])
    const material = new THREE.MeshBasicMaterial({color: this._bodyColor})
    this._geometry.push(geometry)
    this._material.push(material)
    const mesh = new THREE.Mesh(geometry, material)

    return mesh
  }

  createCenterSticker(sticker: string): THREE.Object3D {
    let geometry: THREE.PlaneGeometry
    let material: THREE.MeshBasicMaterial
    let mesh: THREE.Mesh

    const s = new THREE.Object3D()
    geometry = new THREE.PlaneGeometry(1.5 * Math.sqrt(2) - 2 * 0.05, 1.5 * Math.sqrt(2) - 2 * 0.05)
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 4))
    mesh.position.copy(new THREE.Vector3(0, 1.51, 0))
    s.add(mesh)
    
    //hover
    geometry = new THREE.PlaneGeometry(1.5 * Math.sqrt(2) - 2 * 0.05, 1.5 * Math.sqrt(2) - 2 * 0.05)
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI / 4))
    mesh.position.copy(new THREE.Vector3(0, 2.5, 0))
    this._hoverStickers.push(mesh)
    s.add(mesh)
  
    return s
  }

  createCornerPiece(def: Corner): THREE.Object3D {
    const wrapper = new THREE.Object3D()

    const p = new THREE.Object3D()
    const b = this.createCornerBody()
    p.add(b)
    const s = this.createCornerSticker(def.sticker)
    p.add(s)
    
    p.setRotationFromEuler(def.rotation)

    wrapper.add(p)

    return wrapper
  }

  createCornerBody(): THREE.Object3D {
    const geometry = new ConvexGeometry([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.5, 1.5, 0),
      new THREE.Vector3(0, 1.5, 1.5),
      new THREE.Vector3(1.5, 0, 1.5),
      new THREE.Vector3(1.5, 1.5, 1.5)
    ])
    const material = new THREE.MeshBasicMaterial({color: this._bodyColor})
    this._geometry.push(geometry)
    this._material.push(material)
    const mesh = new THREE.Mesh(geometry, material)

    return mesh
  }

  createCornerSticker(sticker: string[]): THREE.Object3D {
    const rotation = [
      new THREE.Euler(-Math.PI / 2, 0, 0),
      new THREE.Euler(0, 0, Math.PI / 2),
      new THREE.Euler(Math.PI, Math.PI / 2, 0),
    ]
    const position = [
      new THREE.Vector3(1.5 - 0.05, 1.51, 1.5 - 0.05),
      new THREE.Vector3(1.5 - 0.05, 1.5 - 0.05, 1.51),
      new THREE.Vector3(1.51, 1.5 - 0.05, 1.5 - 0.05),
    ]
    const rotationHover = [
      new THREE.Euler(Math.PI / 2, 0, Math.PI / 2),
      new THREE.Euler(Math.PI, 0, 0),
      new THREE.Euler(0, -Math.PI / 2, Math.PI / 2),
    ]
    const positionHover = [
      new THREE.Vector3(1.5 - 0.05, 2.5, 1.5 - 0.05),
      new THREE.Vector3(1.5 - 0.05, 1.5 - 0.05, 2.5),
      new THREE.Vector3(2.5, 1.5 - 0.05, 1.5 - 0.05),
    ]
    const s = new THREE.Object3D()

    for (let i = 0; i < 3; i++) {
      let shape: THREE.Shape
      let geometry: THREE.ShapeGeometry
      let material: THREE.MeshBasicMaterial
      let mesh: THREE.Mesh

      shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.lineTo(-(1.5 - (2 + Math.sqrt(2)) * 0.05), 0)
      shape.lineTo(0, 1.5 - (2 + Math.sqrt(2)) * 0.05)
      shape.lineTo(0, 0)
      geometry = new THREE.ShapeGeometry(shape);
      material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[i]]]})
      this._geometry.push(geometry)
      this._material.push(material)
      mesh = new THREE.Mesh(geometry, material)
      mesh.setRotationFromEuler(rotation[i])
      mesh.position.copy(position[i])
      s.add(mesh)
      
      // hover
      shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.lineTo(-(1.5 - (2 + Math.sqrt(2)) * 0.05), 0)
      shape.lineTo(0, 1.5 - (2 + Math.sqrt(2)) * 0.05)
      shape.lineTo(0, 0)
      geometry = new THREE.ShapeGeometry(shape);
      material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[i]]]})
      this._geometry.push(geometry)
      this._material.push(material)
      mesh = new THREE.Mesh(geometry, material)
      mesh.setRotationFromEuler(rotationHover[i])
      mesh.position.copy(positionHover[i])
      this._hoverStickers.push(mesh)
      s.add(mesh)
    }

    return s
  }

  rotate(move: string, animation: boolean=false): Promise<any> {
    if (this._isPlaying) return new Promise((resolve) => resolve(true))

    this._isPlaying = true
    const face = move[0]
    const suffix = suffixToNum[move.substr(1)]
    const axis = faceToAxis[face]
    const rad = faceToRad[face] * suffix
    const mask = faceToMask[face]
    const idxs: {[s: string]: number[]} = {center: [], corner: []}
    for (const cat in idxs) {
      const m = mask[cat]
      const p = this._state[cat].sequence()
      for (let i = 0; i < m.length; i++) {
        if (m[i] === 1) idxs[cat].push(p[i])
      }
    }

    this._state = this._state.apply(this._moveState[move])

    if (animation) {
      return new Promise((resolve) => {
        const coords: {[s: string]: number} = {x: 0}
        let cur: number = 0
        this._tween = new Tween(coords)
        .to({x: rad})
        .duration(this._speed)
        .easing(this._easing)
        .onUpdate(() => {
          const d: number = coords.x - cur
          for (const cat in idxs) {
            const idx = idxs[cat]
            for (let i = 0; i < idx.length; i++) this._object3D[cat][idx[i]].rotateOnWorldAxis(axis, d)
          }
          cur = coords.x
        })
        .onComplete(() => {
          this._isPlaying = false
          resolve(true)
        })
        .start()
      })
    }

    // No animtation
    for (const cat in idxs) {
      const idx = idxs[cat]
      for (let i = 0; i < idx.length; i++) this._object3D[cat][idx[i]].rotateOnWorldAxis(axis, rad)
    }
    this._isPlaying = false

    return new Promise((resolve) => resolve(true))
  }
  
  reset(): void {
    if (this._isPlaying) return
    for (const cat in this._object3D) for (let i = 0; i < this._object3D[cat].length; i++) this._object3D[cat][i].rotation.set(0, 0, 0)
    this._state = new State([0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5, 6, 7])
  }

  getEnableMove(): string[] {
    return Object.keys(this._moveState)
  }

  speed(speed: number): void {
    this._speed = speed
  }

  easing(easing: (t: number) => number): void {
    this._easing = easing
  }

  hover(hover: boolean) {
    for (const hs of this._hoverStickers) {
      hs.visible = hover
    }
    this._hover = hover
  }

  dispose(): void {
    for (const g of this._geometry) g.dispose()
    for (const m of this._material) m.dispose()
  }
}

export default Skewb3D