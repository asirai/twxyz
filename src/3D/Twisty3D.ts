interface Twisty3D {
  object: THREE.Object3D
  rotate(move:string, animation: boolean): Promise<any>
  reset(): void
  getEnableMove(): string[]
  speed(speed: number): void
  easing(easing: (t: number) => number): void
  hover(hover: boolean): void
  dispose(): void
}

export default Twisty3D