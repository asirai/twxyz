import { CommonConfig, CommonConfigDefault } from '../Config/CommonConfig'
import twisty3D from '../twisty3D'
import Twisty3D from '../3D/Twisty3D'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

class InteractivePlayer {
  public domElement: HTMLElement
  private _resizeObserver: ResizeObserver
  // three.js
  private _camera: THREE.PerspectiveCamera
  private _scene: THREE.Scene
  private _renderer: THREE.WebGLRenderer
  private _controls: OrbitControls
  // Twisty3D
  private _twisty3D: Twisty3D
  // Animtation
  private _isPlaying: boolean
  private _currentPosition: number
  // config
  private _config: CommonConfig
  // algorithm
  private _algorithm: string[]

  constructor(config?: Object) {
    this._config = this._parseConfig(config)
    // domElement
    this.domElement = document.createElement('div')
    // three.js
    this._camera = new THREE.PerspectiveCamera(20, 1, 1, 100)
    this._scene = new THREE.Scene()
    this._renderer = new THREE.WebGLRenderer({antialias: true})
    this._renderer.setClearColor(this._config.background)
    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._controls = new OrbitControls(this._camera, this._renderer.domElement)
    this._controls.enableRotate = this._config.control
    this._controls.enableZoom = false
    this._controls.enablePan = false
    this._renderer.setAnimationLoop(() => {
      this._controls.update()
      this._renderer.render(this._scene, this._camera)
    })
    // resize observer
    this._resizeObserver = new ResizeObserver(() => this._resize())
    this._resizeObserver.observe(this.domElement)
    // twisty3D
    this._twisty3D = twisty3D(this._config.puzzle, this._config.speed, this._config.easing, this._config.hover)
    this._scene.add(this._twisty3D.object)
    // rotate camera
    this._rotateCamera(this._camera, this._config.rotation[0], this._config.rotation[1], this._config.rotation[2])
    // make tree
    this.domElement.appendChild(this._renderer.domElement)
    // set style
    this.domElement.style.width = '100%'
    this.domElement.style.height = '100%'
  }

  _parseConfig(config: Object): CommonConfig {
    const _config: CommonConfig = {...CommonConfigDefault, ...config}
    return _config
  }

  _resize(): void {
    const width = (this.domElement.parentNode as HTMLElement).clientWidth
    const height = (this.domElement.parentNode as HTMLElement).clientHeight

    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._renderer.setSize(width, height)

    this._camera.aspect = width / height
    this._camera.updateProjectionMatrix()
  }

  _rotateCamera(camera: THREE.PerspectiveCamera, x: number, y: number, z: number): void {
    const r = 18
    const _x = x % 360 + (x < 0 ? 360 : 0)
    const _y = y % 360 + (y < 0 ? 360 : 0)
    const _z = z % 360 + (z < 0 ? 360 : 0)
    const rx = _x * Math.PI / 180
    const ry = _y * Math.PI / 180
    const rz = _z * Math.PI / 180
    const _r = _x === 90 || _x === 270 ? 0 : r * Math.cos(rx)
    // rx
    camera.position.y = _x === 180 ? 0 : r * Math.sin(rx)
    // ry
    camera.position.x = _y === 180 ? 0 : _r * Math.sin(ry)
    camera.position.z = _y === 90 || _y === 270 ? 0 : _r * Math.cos(ry)

    camera.up.set(
      _z === 180 ? 0 : Math.sin(rz),
      _z === 90 || _z === 270 ? 0 : Math.cos(rz),
      0
    )

    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }

  // public methods

  reposition(): void {
    this._controls.reset()
  }

  reset(): void {
    if (this._isPlaying) return

    this._twisty3D.reset()
  }

  play(algorithm: string, animation: boolean=true): Promise<any> {
    if (this._isPlaying) return

    this._isPlaying = true

    this._algorithm = this._parseAlgorithm(algorithm, this._config.puzzle)
    this._currentPosition = 0

    let p = new Promise(resolve => resolve(true))
    const _alg = this._algorithm.slice(this._currentPosition)
    for (const move of _alg) p = p.then(() => {
      this._currentPosition++
      return this._twisty3D.rotate(move, animation)
    })
    p = p.then(() => this._isPlaying = false)

    return p
  }

  setPuzzle(puzzle: string): void {
    this._scene.remove(this._twisty3D.object)
    this._twisty3D.dispose()

    this._config.puzzle = puzzle
    this._twisty3D = twisty3D(this._config.puzzle, this._config.speed, this._config.easing, this._config.hover)
    this._scene.add(this._twisty3D.object)
  }

  setSpeed(speed: number): void {
    this._config.speed = speed
    this._twisty3D.speed(speed)
  }

  setEasing(easing: (t: number) => number): void {
    this._config.easing = easing
    this._twisty3D.easing(easing)
  }

  setHover(hover: boolean): void {
    this._twisty3D.hover(hover)
    this._config.hover = hover
  }

  setBackground(color: number): void {
    this._renderer.setClearColor(color)
    this._config.background = color
  }

  setControl(control: boolean): void {
    this._controls.enableRotate = control
    this.reposition()
    this._config.control = control
  }

  setRotation(x: number, y: number, z: number): void {
    this._rotateCamera(this._camera, x, y, z)
    this._config.rotation = [x, y, z]
  }

  // util
  _parseAlgorithm(algorithmRaw: string, puzzle: string): string[] {
    let algorithmPreprocessed: string = algorithmRaw.replace(/\s+/g, '')
    if (puzzle !== 'square') algorithmPreprocessed = algorithmPreprocessed.replace(/2'/g, '\'2').replace(/3'/g, '\'3')

    const algorithm: string[] = []
    const moves = twisty3D(puzzle).getEnableMove().sort((a, b) => b.length - a.length)

    while (algorithmPreprocessed.length > 0) {
      for (let i = 0; i < moves.length; ++i) {
        const move = moves[i]
        if (algorithmPreprocessed.startsWith(move)) {
          algorithm.push(move)
          algorithmPreprocessed = algorithmPreprocessed.slice(move.length)
          break
        }
        if (i == moves.length - 1) {
          algorithmPreprocessed = algorithmPreprocessed.slice(1)
        }
      }
    }

    return algorithm
  }
}

export default InteractivePlayer