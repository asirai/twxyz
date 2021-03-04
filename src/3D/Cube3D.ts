import { CommonConfigDefault } from '../Config/CommonConfig'
import Twisty3D from './Twisty3D'
import Permutation from '../Permutation'
import Tween from '../Tween'
import * as THREE from 'three'

const faceToNum: {[s: string]: number} = {U: 0, F: 1, R: 2, D: 3, B: 4, L: 5}
const suffixToNum: {[f: string]: number} = {'': 1, '\'': -1, '2': 2, '\'2': -2, '3': 3, '\'3': -3}

const faceToAxis: {[s: string]: THREE.Vector3} = {
  U: new THREE.Vector3(0, 1, 0),
  F: new THREE.Vector3(0, 0, 1),
  R: new THREE.Vector3(1, 0, 0),
  D: new THREE.Vector3(0, -1, 0),
  B: new THREE.Vector3(0, 0, -1),
  L: new THREE.Vector3(-1, 0, 0),
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
  u: new THREE.Vector3(0, 1, 0),
  f: new THREE.Vector3(0, 0, 1),
  r: new THREE.Vector3(1, 0, 0),
  d: new THREE.Vector3(0, -1, 0),
  b: new THREE.Vector3(0, 0, -1),
  l: new THREE.Vector3(-1, 0, 0),
  M: new THREE.Vector3(-1, 0, 0),
  E: new THREE.Vector3(0, -1, 0),
  S: new THREE.Vector3(0, 0, 1)
}

const faceToMask: {[s: string]: {[s: string]: number[]}} = {
  U: {center: [1, 0, 0, 0, 0, 0], corner: [1, 1, 1, 1, 0, 0, 0, 0], edge: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]},
  F: {center: [0, 1, 0, 0, 0, 0], corner: [1, 1, 0, 0, 1, 0, 0, 1], edge: [1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0]},
  R: {center: [0, 0, 1, 0, 0, 0], corner: [1, 0, 0, 1, 1, 1, 0, 0], edge: [0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]},
  D: {center: [0, 0, 0, 1, 0, 0], corner: [0, 0, 0, 0, 1, 1, 1, 1], edge: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]},
  B: {center: [0, 0, 0, 0, 1, 0], corner: [0, 0, 1, 1, 0, 1, 1, 0], edge: [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0]},
  L: {center: [0, 0, 0, 0, 0, 1], corner: [0, 1, 1, 0, 0, 0, 1, 1], edge: [0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1]},
  x: {center: [1, 1, 1, 1, 1, 1], corner: [1, 1, 1, 1, 1, 1, 1, 1], edge: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]},
  y: {center: [1, 1, 1, 1, 1, 1], corner: [1, 1, 1, 1, 1, 1, 1, 1], edge: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]},
  z: {center: [1, 1, 1, 1, 1, 1], corner: [1, 1, 1, 1, 1, 1, 1, 1], edge: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]},
  u: {center: [1, 1, 1, 0, 1, 1], corner: [1, 1, 1, 1, 0, 0, 0, 0], edge: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]},
  f: {center: [1, 1, 1, 1, 0, 1], corner: [1, 1, 0, 0, 1, 0, 0, 1], edge: [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1]},
  r: {center: [1, 1, 1, 1, 1, 0], corner: [1, 0, 0, 1, 1, 1, 0, 0], edge: [1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0]},
  d: {center: [0, 1, 1, 1, 1, 1], corner: [0, 0, 0, 0, 1, 1, 1, 1], edge: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]},
  b: {center: [1, 0, 1, 1, 1, 1], corner: [0, 0, 1, 1, 0, 1, 1, 0], edge: [0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1]},
  l: {center: [1, 1, 0, 1, 1, 1], corner: [0, 1, 1, 0, 0, 0, 1, 1], edge: [1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1]},
  M: {center: [1, 1, 0, 1, 1, 0], corner: [0, 0, 0, 0, 0, 0, 0, 0], edge: [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0]},
  E: {center: [0, 1, 1, 0, 1, 1], corner: [0, 0, 0, 0, 0, 0, 0, 0], edge: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0]},
  S: {center: [1, 0, 1, 1, 0, 1], corner: [0, 0, 0, 0, 0, 0, 0, 0], edge: [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1]}
}

class Piece {
  public sticker: Sticker[]

  constructor(
    public position: THREE.Vector3,
    sticker: string
  ) {
    this.sticker = []
    const stickerArr: number[] = sticker.split('').map(val => faceToNum[val])
    for (let i = 0; i < stickerArr.length; i++) this.sticker.push(new Sticker(stickerArr[i]))
  }
}

class Sticker {
  public position: THREE.Vector3
  public rotation: THREE.Euler
  public hoverPosition: THREE.Vector3
  public hoverRotation: THREE.Euler

  constructor(public face: number) {
    this.position = [
      new THREE.Vector3(0, 0.51, 0),
      new THREE.Vector3(0, 0, 0.51),
      new THREE.Vector3(0.51, 0, 0),
      new THREE.Vector3(0, -0.51, 0),
      new THREE.Vector3(0, 0, -0.51),
      new THREE.Vector3(-0.51, 0, 0)
    ][face]
    this.rotation = [
      new THREE.Euler(-Math.PI / 2, 0, 0),
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(0, Math.PI / 2, 0),
      new THREE.Euler(Math.PI / 2, 0, 0),
      new THREE.Euler(Math.PI, 0, 0),
      new THREE.Euler(0, -Math.PI / 2, 0)
    ][face]
    this.hoverPosition = [
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, 0, 1.5),
      new THREE.Vector3(1.5, 0, 0),
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, 0, -1.5),
      new THREE.Vector3(-1.5, 0, 0)
    ][face]
    this.hoverRotation = [
      new THREE.Euler(Math.PI / 2, 0, 0),
      new THREE.Euler(Math.PI, 0, 0),
      new THREE.Euler(0, -Math.PI / 2, 0),
      new THREE.Euler(-Math.PI / 2, 0, 0),
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(0, Math.PI / 2, 0)
    ][face]
  }
}

const PieceDefinitions: {[s: string]: Piece[]} = {
  center: [
    new Piece(new THREE.Vector3(0, 1, 0), 'U'),
    new Piece(new THREE.Vector3(0, 0, 1), 'F'),
    new Piece(new THREE.Vector3(1, 0, 0), 'R'),
    new Piece(new THREE.Vector3(0, -1, 0), 'D'),
    new Piece(new THREE.Vector3(0, 0, -1), 'B'),
    new Piece(new THREE.Vector3(-1, 0, 0), 'L')
  ],
  corner: [
    new Piece(new THREE.Vector3(1, 1, 1), 'UFR'),
    new Piece(new THREE.Vector3(-1, 1, 1), 'UFL'),
    new Piece(new THREE.Vector3(-1, 1, -1), 'UBL'),
    new Piece(new THREE.Vector3(1, 1, -1), 'UBR'),
    new Piece(new THREE.Vector3(1, -1, 1), 'DFR'),
    new Piece(new THREE.Vector3(1, -1, -1), 'DBR'),
    new Piece(new THREE.Vector3(-1, -1, -1), 'DBL'),
    new Piece(new THREE.Vector3(-1, -1, 1), 'DFL')
  ],
  edge: [
    new Piece(new THREE.Vector3(0, 1, 1), 'UF'),
    new Piece(new THREE.Vector3(-1, 1, 0), 'UL'),
    new Piece(new THREE.Vector3(0, 1, -1), 'UB'),
    new Piece(new THREE.Vector3(1, 1, 0), 'UR'),
    new Piece(new THREE.Vector3(1, 0, 1), 'FR'),
    new Piece(new THREE.Vector3(-1, 0, 1), 'FL'),
    new Piece(new THREE.Vector3(-1, 0, -1), 'BL'),
    new Piece(new THREE.Vector3(1, 0, -1), 'BR'),
    new Piece(new THREE.Vector3(0, -1, 1), 'DF'),
    new Piece(new THREE.Vector3(1, -1, 0), 'DR'),
    new Piece(new THREE.Vector3(0, -1, -1), 'DB'),
    new Piece(new THREE.Vector3(-1, -1, 0), 'DL')
  ]
}

class State {
  public readonly center: Permutation
  public readonly corner: Permutation
  public readonly edge: Permutation

  constructor(
    center: Permutation | number[],
    corner: Permutation | number[],
    edge: Permutation | number[]
  ) {
    this.center = Array.isArray(center) ? new Permutation(center) : center
    this.corner = Array.isArray(corner) ? new Permutation(corner) : corner
    this.edge = Array.isArray(edge) ? new Permutation(edge) : edge
  }

  apply(state: State): State {
    const newCenter: Permutation = this.center.apply(state.center)
    const newCorner: Permutation = this.corner.apply(state.corner)
    const newEdge: Permutation = this.edge.apply(state.edge)
    return new State(newCenter, newCorner, newEdge)
  }
}

class Cube3D implements Twisty3D {
  public object: THREE.Object3D
  // 3D Object(three.js)
  private _object3D: {[s: string]: THREE.Object3D[]}
  private _colorScheme: number[]
  private _bodyColor: number
  private _geometry: (THREE.BoxGeometry|THREE.PlaneGeometry)[] = []
  private _material: THREE.MeshBasicMaterial[] = []
  // State
  private _state: State
  private _move: {[s: string]: State}
  // Animation
  private _isPlaying: boolean
  // hover
  private _hoverStickers: THREE.Mesh[]

  constructor(private _speed: number=CommonConfigDefault.speed,
              private _easing: (t: number) => number=CommonConfigDefault.easing,
              private _hover: boolean=CommonConfigDefault.hover) {
    // 3D Object(three.js)
    this._colorScheme = [0xffffff,0x00ff00,0xff0000,0xffff00,0x0000ff,0xff8000]
    this._bodyColor = 0x000000
    this._object3D = {center: [], corner: [], edge: []} // THREE.Object3D
    this._hoverStickers = []
    this.object = new THREE.Object3D()
    for (const cat in PieceDefinitions) {
      const defs = PieceDefinitions[cat]
      for (const def of defs) {
        const p = this._createPiece(def)
        this._object3D[cat].push(p)
        this.object.add(p)
      }
    }
    this.hover(this._hover)

    // State
    this._state = new State(
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 4, 5, 6, 7],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    )

    this._move = {
      U: new State([0,1,2,3,4,5],[3,0,1,2,4,5,6,7],[3,0,1,2,4,5,6,7,8,9,10,11]),
      F: new State([0,1,2,3,4,5],[1,7,2,3,0,5,6,4],[5,1,2,3,0,8,6,7,4,9,10,11]),
      R: new State([0,1,2,3,4,5],[4,1,2,0,5,3,6,7],[0,1,2,4,9,5,6,3,8,7,10,11]),
      D: new State([0,1,2,3,4,5],[0,1,2,3,7,4,5,6],[0,1,2,3,4,5,6,7,11,8,9,10]),
      B: new State([0,1,2,3,4,5],[0,1,3,5,4,6,2,7],[0,1,7,3,4,5,2,10,8,9,6,11]),
      L: new State([0,1,2,3,4,5],[0,2,6,3,4,5,7,1],[0,6,2,3,4,1,11,7,8,9,10,5]),
      u: new State([0,2,4,3,5,1],[3,0,1,2,4,5,6,7],[3,0,1,2,7,4,5,6,8,9,10,11]),
      f: new State([5,1,0,2,4,3],[1,7,2,3,0,5,6,4],[5,11,2,1,0,8,6,7,4,3,10,9]),
      r: new State([1,3,2,4,0,5],[4,1,2,0,5,3,6,7],[8,1,0,4,9,5,6,3,10,7,2,11]),
      d: new State([0,5,1,3,2,4],[0,1,2,3,7,4,5,6],[0,1,2,3,5,6,7,4,11,8,9,10]),
      b: new State([2,1,3,5,4,0],[0,1,3,5,4,6,2,7],[0,3,7,9,4,5,2,10,8,11,6,1]),
      l: new State([4,0,2,1,3,5],[0,2,6,3,4,5,7,1],[2,6,10,3,4,1,11,7,0,9,8,5]),
      M: new State([4,0,2,1,3,5],[0,1,2,3,4,5,6,7],[2,1,10,3,4,5,6,7,0,9,8,11]),
      E: new State([0,5,1,3,2,4],[0,1,2,3,4,5,6,7],[0,1,2,3,5,6,7,4,8,9,10,11]),
      S: new State([5,1,0,2,4,3],[0,1,2,3,4,5,6,7],[0,11,2,1,4,5,6,7,8,3,10,9]),
      x: new State([1,3,2,4,0,5],[4,7,1,0,5,3,2,6],[8,5,0,4,9,11,1,3,10,7,2,6]),
      y: new State([0,2,4,3,5,1],[3,0,1,2,5,6,7,4],[3,0,1,2,7,4,5,6,9,10,11,8]),
      z: new State([5,1,0,2,4,3],[1,7,6,2,0,3,5,4],[5,11,6,1,0,8,10,2,4,3,7,9])
    }

    for (const name in this._move) {
      this._move[name + '2'] = this._move[name].apply(this._move[name])
      this._move[name + '\''] = this._move[name + '2'].apply(this._move[name])
      this._move[name + '\'2'] = this._move[name + '2']
      this._move[name + '3'] = this._move[name + '\'']
      this._move[name + '\'3'] = this._move[name]
    }

    this._isPlaying = false
  }

  _createPiece(def: Piece): THREE.Object3D {
    const wrapper= new THREE.Object3D()
    const p = new THREE.Object3D()
    const c = this._createCube()
    p.add(c)
    for (const sticker of def.sticker) {
      const s = this._createSticker(sticker)
      p.add(s)
    }
    p.position.copy(def.position)
    wrapper.add(p)
    return wrapper
  }

  _createCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({color: this._bodyColor})
    this._geometry.push(geometry)
    this._material.push(material)
    const mesh = new THREE.Mesh(geometry, material)
    return mesh
  }

  _createSticker(def: Sticker) {
    const s = new THREE.Object3D()
    let geometry: THREE.PlaneGeometry
    let material: THREE.MeshBasicMaterial
    let mesh: THREE.Mesh
    geometry = new THREE.PlaneGeometry(0.9, 0.9)
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[def.face]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(def.position)
    mesh.setRotationFromEuler(def.rotation)
    s.add(mesh)
    // hover
    geometry = new THREE.PlaneGeometry(0.9, 0.9)
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[def.face]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(def.hoverPosition)
    mesh.setRotationFromEuler(def.hoverRotation)
    this._hoverStickers.push(mesh)
    s.add(mesh)
    
    return s
  }

  rotate(move: string, animation: boolean=false): Promise<any> {
    if (this._isPlaying) return

    this._isPlaying = true
    
    const face = move[0]
    const suffix = suffixToNum[move.substr(1)]
    const axis = faceToAxis[face]
    const rad = (-Math.PI / 2) * suffix
    const mask = faceToMask[face]
    const idxs: {[s: string]: number[]} = {center: [], corner: [], edge: []}
    for (const cat in idxs) {
      const m = mask[cat]
      const p = this._state[cat].sequence()
      for (let i = 0; i < m.length; i++) {
        if (m[i] === 1) idxs[cat].push(p[i])
      }
    }

    this._state = this._state.apply(this._move[move])

    if (animation) {
      return new Promise((resolve) => {
        const coords: {[s: string]: number} = {x: 0}
        let cur: number = 0
        new Tween(coords)
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
    this._state = new State(
      new Permutation([0, 1, 2, 3, 4, 5]),
      new Permutation([0, 1, 2, 3, 4, 5, 6, 7]),
      new Permutation([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    )
  }

  getEnableMove(): string[] {
    return Object.keys(this._move)
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

  // すべてのgeometryとmaterialを消去
  dispose(): void {
    for (const g of this._geometry) g.dispose()
    for (const m of this._material) m.dispose()
  }
}

export default Cube3D