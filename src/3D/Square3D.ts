import { CommonConfigDefault } from '../Config/CommonConfig'
import Twisty3D from './Twisty3D'
import Permutation from '../Permutation'
import Tween from '../Tween'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'

const faceToNum: {[f: string]: number} = {U: 0, F: 1, R: 2, D: 3, B: 4, L: 5}

const moveToXY = (move: string): [number, number] => {
  if (move === '/' || move === '\\') return [0, 0]

  const strXwithBrackets = move.match(/\(.*?,/)[0]
  const strYwithBrackets = move.match(/,.*?\)/)[0]
  const strX = strXwithBrackets.substring(1, strXwithBrackets.length - 1)
  const strY = strYwithBrackets.substring(1, strYwithBrackets.length - 1)
  
  if (strX !== null && strY !== null) return [parseInt(strX), parseInt(strY)]

  return null
}

class State {
  public readonly core: Permutation
  public readonly cornerAndEdge: Permutation

  constructor(
    core: Permutation | number[],
    cornerAndEdge: Permutation | number[]
  ) {
    this.core = Array.isArray(core) ? new Permutation(core) : core
    this.cornerAndEdge = Array.isArray(cornerAndEdge) ? new Permutation(cornerAndEdge) : cornerAndEdge
  }

  apply(state: State): State {
    const newCore: Permutation = this.core.apply(state.core)
    const newCornerAndEdge: Permutation = this.cornerAndEdge.apply(state.cornerAndEdge)
    return new State(newCore, newCornerAndEdge)
  }

  isSlashable(): boolean {
    if (this.cornerAndEdge[0] === this.cornerAndEdge[11] || this.cornerAndEdge[12] === this.cornerAndEdge[23]) return false
    return true
  }
}

class Core {
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

class Edge {
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

const coreDefinitions: Core[] = [
  new Core(new THREE.Euler(0, 0, 0), 'FRB'),
  new Core(new THREE.Euler(0, Math.PI, 0), 'BLF')
]

const cornerAndEdgeDefinitions: (Corner | Edge)[] = [
  new Corner(new THREE.Euler(0, -Math.PI / 2, 0), 'ULF'),
  new Edge(new THREE.Euler(0, -Math.PI / 2, 0), 'UL'),
  new Corner(new THREE.Euler(0, Math.PI, 0), 'UBL'),
  new Edge(new THREE.Euler(0, Math.PI, 0), 'UB'),
  new Corner(new THREE.Euler(0, Math.PI / 2, 0), 'URB'),
  new Edge(new THREE.Euler(0, Math.PI / 2, 0), 'UR'),
  new Corner(new THREE.Euler(0, 0, 0), 'UFR'),
  new Edge(new THREE.Euler(0, 0, 0), 'UF'),
  new Corner(new THREE.Euler(Math.PI, Math.PI, 0), 'DFL'),
  new Edge(new THREE.Euler(Math.PI, -Math.PI / 2, 0), 'DL'),
  new Corner(new THREE.Euler(Math.PI, -Math.PI / 2, 0), 'DLB'),
  new Edge(new THREE.Euler(Math.PI, 0, 0), 'DB'),
  new Corner(new THREE.Euler(Math.PI, 0, 0), 'DBR'),
  new Edge(new THREE.Euler(Math.PI, Math.PI / 2, 0), 'DR'),
  new Corner(new THREE.Euler(Math.PI, Math.PI / 2, 0), 'DRF'),
  new Edge(new THREE.Euler(Math.PI, Math.PI, 0), 'DF'),
]

const edgeDefinitions: Edge[] = [
  new Edge(new THREE.Euler(0, -Math.PI / 2, 0), 'UL'),
  new Edge(new THREE.Euler(0, Math.PI, 0), 'UB'),
  new Edge(new THREE.Euler(0, Math.PI / 2, 0), 'UR'),
  new Edge(new THREE.Euler(0, 0, 0), 'UF'),
  new Edge(new THREE.Euler(Math.PI, Math.PI, 0), 'DF'),
  new Edge(new THREE.Euler(Math.PI, Math.PI / 2, 0), 'DR'),
  new Edge(new THREE.Euler(Math.PI, 0, 0), 'DB'),
  new Edge(new THREE.Euler(Math.PI, -Math.PI / 2, 0), 'DL')
]

class Square3D implements Twisty3D {
  public object: THREE.Object3D
  private _object3D: {[s: string]: THREE.Object3D[]}
  private _geometry: (ConvexGeometry|THREE.ShapeGeometry)[] = []
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

    this._colorScheme = [0xffff00,0xff0000,0x00ff00,0xffffff,0xff8000,0x0000ff]
    this._bodyColor = 0x000000

    this.object = new THREE.Object3D()
    this._object3D = {core: [], cornerAndEdge: []}
    this._hoverStickers = []

    for (let i = 0; i < 2; i++) {
      const c = this.createCorePiece(coreDefinitions[i])
      this.object.add(c)
      this._object3D.core.push(c)
    }

    for (let i = 0; i < 16; i++) {
      const c = i % 2 === 0 ? this.createCornerPiece(cornerAndEdgeDefinitions[i]) : this.createEdgePiece(cornerAndEdgeDefinitions[i])
      this.object.add(c)
      this._object3D.cornerAndEdge.push(c)
    }

    this.hover(this._hover)

    this._state = new State([0, 1], [0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 14, 15])
    
    this._moveState = {}

    this._moveState.x = new State([0, 1], [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
    this._moveState.y = new State([0, 1], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 12])
    this._moveState['/'] = new State([0, 1], [0, 1, 2, 3, 4, 5, 23, 22, 21, 20, 19, 18, 12, 13, 14, 15, 16, 17, 11, 10, 9, 8, 7, 6])

    this._isPlaying = false
  }

  createCorePiece(def: Core): THREE.Object3D {
    const wrapper = new THREE.Object3D()

    const p = new THREE.Object3D()
    const b = this.createCoreBody()
    p.add(b)
    const s = this.createCoreSticker(def.sticker)
    p.add(s)
    
    p.setRotationFromEuler(def.rotation)

    wrapper.add(p)

    return wrapper
  }

  createCoreBody(): THREE.Object3D {
    const geometry = new ConvexGeometry([
      new THREE.Vector3(1.5 * (2 - Math.sqrt(3)), 0.5, -1.5),
      new THREE.Vector3(1.5, 0.5, -1.5),
      new THREE.Vector3(1.5, 0.5, 1.5),
      new THREE.Vector3(-1.5 * (2 - Math.sqrt(3)), 0.5, 1.5),
      new THREE.Vector3(1.5 * (2 - Math.sqrt(3)), -0.5, -1.5),
      new THREE.Vector3(1.5, -0.5, -1.5),
      new THREE.Vector3(1.5, -0.5, 1.5),
      new THREE.Vector3(-1.5 * (2 - Math.sqrt(3)), -0.5, 1.5),
    ])
    const material = new THREE.MeshBasicMaterial({color: this._bodyColor})
    this._geometry.push(geometry)
    this._material.push(material)
    const mesh = new THREE.Mesh(geometry, material)

    return mesh
  }

  createCoreSticker(sticker: string[]): THREE.Object3D {
    const s = new THREE.Object3D()
    let shape: THREE.Shape
    let geometry: THREE.ShapeGeometry
    let material: THREE.MeshBasicMaterial
    let mesh: THREE.Mesh

    shape = new THREE.Shape()
    shape.moveTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, -(0.5 - 0.05))
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, -(0.5 - 0.05))
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[0]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(0, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, 1.51))
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(-(1.5 - 0.05), 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, -(0.5 - 0.05))
    shape.lineTo(-(1.5 - 0.05), -(0.5 - 0.05))
    shape.lineTo(-(1.5 - 0.05), 0.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[1]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(0, Math.PI / 2, 0))
    mesh.position.copy(new THREE.Vector3(1.51, 0, 0))
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, -(0.5 - 0.05))
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, -(0.5 - 0.05))
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[2]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, -1.51))
    s.add(mesh)

    // hover
    shape = new THREE.Shape()
    shape.moveTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, -(0.5 - 0.05))
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, -(0.5 - 0.05))
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[0]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, 2.5))
    this._hoverStickers.push(mesh)
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(-(1.5 - 0.05), 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, -(0.5 - 0.05))
    shape.lineTo(-(1.5 - 0.05), -(0.5 - 0.05))
    shape.lineTo(-(1.5 - 0.05), 0.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[1]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(0, -Math.PI / 2, 0))
    mesh.position.copy(new THREE.Vector3(2.5, 0, 0))
    this._hoverStickers.push(mesh)
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 - 0.05)
    shape.lineTo(1.5 - 0.05, -(0.5 - 0.05))
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, -(0.5 - 0.05))
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[2]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(0, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, -2.5))
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
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(1.5, 0.5, 1.5 * (2 - Math.sqrt(3))),
      new THREE.Vector3(1.5, 0.5, 1.5),
      new THREE.Vector3(1.5 * (2 - Math.sqrt(3)), 0.5, 1.5),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(1.5, 1.5, 1.5 * (2 - Math.sqrt(3))),
      new THREE.Vector3(1.5, 1.5, 1.5),
      new THREE.Vector3(1.5 * (2 - Math.sqrt(3)), 1.5, 1.5),
    ])
    const material = new THREE.MeshBasicMaterial({color: this._bodyColor})
    this._geometry.push(geometry)
    this._material.push(material)
    const mesh = new THREE.Mesh(geometry, material)

    return mesh
  }

  createCornerSticker(sticker: string[]): THREE.Object3D {
    const s = new THREE.Object3D()
    let shape: THREE.Shape
    let geometry: THREE.ShapeGeometry
    let material: THREE.MeshBasicMaterial
    let mesh: THREE.Mesh
    let scale: number

    shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.5, 1.5 * (2 - Math.sqrt(3)))
    shape.lineTo(1.5, 1.5)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)), 1.5)
    shape.lineTo(0, 0)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[0]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    scale = 1 - 0.05 * (1 + Math.sqrt(2)) / 1.5
    mesh.scale.set(scale, scale, 1)
    mesh.setRotationFromEuler(new THREE.Euler(-Math.PI / 2, 0, -Math.PI / 2))
    mesh.position.copy(new THREE.Vector3(0.05 * Math.sqrt(2), 1.51, 0.05 * Math.sqrt(2)))
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 + 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 + 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[1]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(0, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, 1.51))
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(-(1.5 - 0.05), 1.5 - 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) - 0.05, 1.5 - 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) - 0.05, 0.5 + 0.05)
    shape.lineTo(-(1.5 - 0.05), 0.5 + 0.05)
    shape.lineTo(-(1.5 - 0.05), 1.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[2]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(0, Math.PI / 2, 0))
    mesh.position.copy(new THREE.Vector3(1.51, 0, 0))
    s.add(mesh)

    // hover
    shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.5, 1.5 * (2 - Math.sqrt(3)))
    shape.lineTo(1.5, 1.5)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)), 1.5)
    shape.lineTo(0, 0)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[0]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    scale = 1 - 0.05 * (1 + Math.sqrt(2)) / 1.5
    mesh.scale.set(scale, scale, 1)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))
    mesh.position.copy(new THREE.Vector3(0.05 * Math.sqrt(2), 2.5, 0.05 * Math.sqrt(2)))
    this._hoverStickers.push(mesh)
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 - 0.05, 0.5 + 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 + 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[1]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, 2.5))
    this._hoverStickers.push(mesh)
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(-(1.5 - 0.05), 1.5 - 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) - 0.05, 1.5 - 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) - 0.05, 0.5 + 0.05)
    shape.lineTo(-(1.5 - 0.05), 0.5 + 0.05)
    shape.lineTo(-(1.5 - 0.05), 1.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[2]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI, -Math.PI / 2, 0))
    mesh.position.copy(new THREE.Vector3(2.5, 0, 0))
    this._hoverStickers.push(mesh)
    s.add(mesh)

    return s
  }

  createEdgePiece(def: Edge): THREE.Object3D {
    const wrapper = new THREE.Object3D()

    const p = new THREE.Object3D()
    const b = this.createEdgeBody()
    p.add(b)
    const s = this.createEdgeSticker(def.sticker)
    p.add(s)
    
    p.setRotationFromEuler(def.rotation)

    wrapper.add(p)

    return wrapper
  }

  createEdgeBody(): THREE.Object3D {
    const geometry = new ConvexGeometry([
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(1.5 * (2 - Math.sqrt(3)), 0.5, 1.5),
      new THREE.Vector3(-1.5 * (2 - Math.sqrt(3)), 0.5, 1.5),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(1.5 * (2 - Math.sqrt(3)), 1.5, 1.5),
      new THREE.Vector3(-1.5 * (2 - Math.sqrt(3)), 1.5, 1.5),
    ])
    const material = new THREE.MeshBasicMaterial({color: this._bodyColor})
    this._geometry.push(geometry)
    this._material.push(material)
    const mesh = new THREE.Mesh(geometry, material)

    return mesh
  }

  createEdgeSticker(sticker: string[]): THREE.Object3D {
    const s = new THREE.Object3D()
    let shape: THREE.Shape
    let geometry: THREE.ShapeGeometry
    let material: THREE.MeshBasicMaterial
    let mesh: THREE.Mesh
    let scale: number

    shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)), 1.5)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)), 1.5)
    shape.lineTo(0, 0)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[0]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    scale = 1 - 0.05 * (1 + Math.sqrt(2) + Math.sqrt(6)) / 1.5
    mesh.scale.set(scale, scale, 1)
    mesh.setRotationFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI))
    mesh.position.copy(new THREE.Vector3(0, 1.51, 0.05 * (Math.sqrt(2) + Math.sqrt(6))))
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) - 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) - 0.05, 0.5 + 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 + 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[1]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(0, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, 1.51))
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)), 1.5)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)), 1.5)
    shape.lineTo(0, 0)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[0]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    scale = 1 - 0.05 * (1 + Math.sqrt(2) + Math.sqrt(6)) / 1.5
    mesh.scale.set(scale, scale, 1)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 2.5, 0.05 * (Math.sqrt(2) + Math.sqrt(6))))
    this._hoverStickers.push(mesh)
    s.add(mesh)

    shape = new THREE.Shape()
    shape.moveTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) - 0.05, 1.5 - 0.05)
    shape.lineTo(1.5 * (2 - Math.sqrt(3)) - 0.05, 0.5 + 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 0.5 + 0.05)
    shape.lineTo(-1.5 * (2 - Math.sqrt(3)) + 0.05, 1.5 - 0.05)
    geometry = new THREE.ShapeGeometry(shape);
    material = new THREE.MeshBasicMaterial({color: this._colorScheme[faceToNum[sticker[1]]]})
    this._geometry.push(geometry)
    this._material.push(material)
    mesh = new THREE.Mesh(geometry, material)
    mesh.setRotationFromEuler(new THREE.Euler(Math.PI, 0, 0))
    mesh.position.copy(new THREE.Vector3(0, 0, 2.5))
    this._hoverStickers.push(mesh)
    s.add(mesh)

    return s
  }

  rotate(move: string, animation: boolean=false): Promise<any> {
    if (this._isPlaying) return new Promise((resolve) => resolve(true))
    this._isPlaying = true

    const [x, y] = moveToXY(move)

    if (x === 0 && y === 0 ) {
      // if (!this._state.isSlashable()) return new Promise((resolve) => resolve(true))
      const axis = new THREE.Vector3(1, 0, 2 - Math.sqrt(3)).normalize()
      const rad = move === '/' ? -Math.PI : Math.PI

      const layerX = Array.from(new Set(this._state.cornerAndEdge.sequence().slice(6, 12)))
      const layerY = Array.from(new Set(this._state.cornerAndEdge.sequence().slice(18)))

      if (animation) {
        return new Promise((resolve) => {
          const coords: {[s: string]: number} = {x: 0}
          let cx: number = 0
          this._tween = new Tween(coords)
          .to({x: rad})
          .duration(this._speed)
          .easing(this._easing)
          .onUpdate(() => {
            const dx: number = coords.x - cx
  
            for (let i = 0; i < layerX.length; i++) this._object3D.cornerAndEdge[layerX[i]].rotateOnWorldAxis(axis, dx)
            for (let i = 0; i < layerY.length; i++) this._object3D.cornerAndEdge[layerY[i]].rotateOnWorldAxis(axis, dx)
            this._object3D.core[0].rotateOnWorldAxis(axis, dx)
            
            cx = coords.x
          })
          .onComplete(() => {
            this._state = this._state.apply(this._moveState['/'])
            this._isPlaying = false
            resolve(true)
          })
          .start()
        })
      }
      
      for (let i = 0; i < layerX.length; i++) this._object3D.cornerAndEdge[layerX[i]].rotateOnWorldAxis(axis, rad)
      for (let i = 0; i < layerY.length; i++) this._object3D.cornerAndEdge[layerY[i]].rotateOnWorldAxis(axis, rad)
      this._object3D.core[0].rotateOnWorldAxis(axis, rad)

      this._state = this._state.apply(this._moveState['/'])

      this._isPlaying = false
      return new Promise((resolve) => resolve(true))
    }

    const ax = new THREE.Vector3(0, 1, 0)
    const rx = x * -Math.PI / 6

    const ay = new THREE.Vector3(0, -1, 0)
    const ry = y * -Math.PI / 6

    const layerX = Array.from(new Set(this._state.cornerAndEdge.sequence().slice(0, 12)))
    const layerY = Array.from(new Set(this._state.cornerAndEdge.sequence().slice(12)))

    if (animation) {
      return new Promise((resolve) => {
        const coords: {[s: string]: number} = {x: 0, y: 0}
        let cx: number = 0
        let cy: number = 0
        this._tween = new Tween(coords)
        .to({x: rx, y: ry})
        .duration(this._speed)
        .easing(this._easing)
        .onUpdate(() => {
          const dx: number = coords.x - cx
          const dy: number = coords.y - cy

          for (let i = 0; i < layerX.length; i++) this._object3D.cornerAndEdge[layerX[i]].rotateOnWorldAxis(ax, dx)
          for (let i = 0; i < layerY.length; i++) this._object3D.cornerAndEdge[layerY[i]].rotateOnWorldAxis(ay, dy)

          cx = coords.x
          cy = coords.y
        })
        .onComplete(() => {
          for (let i = 0; i < 12 + x; i++) this._state = this._state.apply(this._moveState.x)
          for (let i = 0; i < 12 + y; i++) this._state = this._state.apply(this._moveState.y)

          this._isPlaying = false
          resolve(true)
        })
        .start()
      })
    }

    // No animtation
    for (let i = 0; i < layerX.length; i++) this._object3D.cornerAndEdge[layerX[i]].rotateOnWorldAxis(ax, rx)
    for (let i = 0; i < layerY.length; i++) this._object3D.cornerAndEdge[layerY[i]].rotateOnWorldAxis(ay, ry)

    for (let i = 0; i < 12 + x; i++) this._state = this._state.apply(this._moveState.x)
    for (let i = 0; i < 12 + y; i++) this._state = this._state.apply(this._moveState.y)
    
    this._isPlaying = false
    return new Promise((resolve) => resolve(true))

  }
  
  reset(): void {
    if (this._isPlaying) return
    for (const cat in this._object3D) for (let i = 0; i < this._object3D[cat].length; i++) this._object3D[cat][i].rotation.set(0, 0, 0)
    this._state = new State([0, 1], [0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 14, 15])
  }

  getEnableMove(): string[] {
    const em: string[] = ['/', '\\']
    for (let x = -6; x < 7; x++) for (let y = -6; y < 7; y++) em.push(`(${x},${y})`)
    return em
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

export default Square3D