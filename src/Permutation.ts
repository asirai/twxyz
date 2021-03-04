class Permutation {
  constructor(private _sequence: number[]) {}

  sequence(): number[] {
    return [...this._sequence]
  }

  apply(permutation: Permutation): Permutation {
    const newSeq: number[] = this._sequence.map((_, idx, arr) => arr[permutation.sequence()[idx]])
    return new Permutation(newSeq)
  }
}

export default Permutation