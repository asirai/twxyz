const Easing: {[s: string]: (t: number) => number} = {
  // domain: 0-1
  // range: 0-1
  linear: (t: number): number => t,

  easeInOutQuint: (t: number): number => t<0.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2,

  easeInOutQuad: (x: number): number => x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2,
}

export default Easing