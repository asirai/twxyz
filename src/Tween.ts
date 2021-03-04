class Tween {
  private _easingFunction: (t: number) => number
  private _onStartCallback: () => void
  private _onUpdateCallback: () => void
  private _onCompleteCallback: () => void

  private _value: {[s: string]: number}
  private _valueStart: {[s: string]: number}
  private _valueEnd: {[s: string]: number}
  private _valueSubtraction: {[s: string]: number}
  private _duration: number = 1000
  private _startTime: number
  private _isPlaying: boolean = false

  constructor(coords: {[s: string]: number}) {
    this._value = coords

    this._valueStart = {...coords}
  }

  to(coords: {[s: string]: number}): this {
    this._valueEnd = coords

    this._valueSubtraction = {}
    for (const property in this._value) {
      this._valueSubtraction[property] = this._valueEnd[property] - this._valueStart[property]
    }

    return this
  }

  duration(duration: number): this {
    this._duration = duration
    return this
  }

  easing(easingFunction: (t: number) => number): this {
    this._easingFunction = easingFunction
    return this
  }

  onStart(callback: () => void): this {
    this._onStartCallback = callback
    return this
  }

  onUpdate(callback: () => void): this {
    this._onUpdateCallback = callback
    return this
  }

  onComplete(callback: () => void): this {
    this._onCompleteCallback = callback
    return this
  }

  start(): this {
    if (this._isPlaying) return this

    this._isPlaying = true
    
    if (this._onStartCallback) this._onStartCallback()

    window.requestAnimationFrame(this.update.bind(this))

    return this
  }

  update(timestamp: number): void {
    if (!this._startTime) this._startTime = timestamp
    const elapsed = timestamp - this._startTime

    if (elapsed >= this._duration) {
      for (const property in this._valueSubtraction) {
        this._value[property] = this._valueEnd[property]
      }

      if (this._onUpdateCallback) this._onUpdateCallback()

      this.complete()
    }
    else {
      const t = elapsed / this._duration // 0~1
      const y = this._easingFunction(t) // 0~1
      for (const property in this._valueSubtraction) {
        this._value[property] = this._valueStart[property] + this._valueSubtraction[property] * y
      }

      if (this._onUpdateCallback) this._onUpdateCallback()

      window.requestAnimationFrame(this.update.bind(this))
    }
  }

  complete(): void {
    if (this._onCompleteCallback) this._onCompleteCallback()

    this._isPlaying = false
  }
}

export default Tween