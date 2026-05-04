'use client'

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'

// ─── Navier-Stokes fluid ──────────────────────────────────────────────────
class Fluid {
  N: number; sz: number; dt: number; diff: number; visc: number
  s: Float32Array; density: Float32Array
  Vx: Float32Array; Vy: Float32Array; Vx0: Float32Array; Vy0: Float32Array

  constructor(N: number, dt: number, diff: number, visc: number) {
    this.N = N; this.sz = (N+2)*(N+2)
    this.dt = dt; this.diff = diff; this.visc = visc
    this.s       = new Float32Array(this.sz)
    this.density = new Float32Array(this.sz)
    this.Vx  = new Float32Array(this.sz); this.Vy  = new Float32Array(this.sz)
    this.Vx0 = new Float32Array(this.sz); this.Vy0 = new Float32Array(this.sz)
  }

  IX(x: number, y: number) {
    return Math.max(0, Math.min(this.N+1, x)) +
           Math.max(0, Math.min(this.N+1, y)) * (this.N+2)
  }

  addDensity(x: number, y: number, a: number)  { this.density[this.IX(x,y)] += a }
  addVelocity(x: number, y: number, vx: number, vy: number) {
    const i = this.IX(x,y); this.Vx[i] += vx; this.Vy[i] += vy
  }

  _bnd(b: number, x: Float32Array) {
    const N = this.N
    for (let i = 1; i <= N; i++) {
      x[this.IX(0,   i)] = x[this.IX(1, i)]
      x[this.IX(N+1, i)] = x[this.IX(N, i)]
      x[this.IX(i, 0  )] = b === 2 ? -x[this.IX(i, 1)] : x[this.IX(i, 1)]
      x[this.IX(i, N+1)] = b === 2 ? -x[this.IX(i, N)] : x[this.IX(i, N)]
    }
    x[this.IX(0,   0  )] = .5*(x[this.IX(1,0)]   + x[this.IX(0,1)])
    x[this.IX(0,   N+1)] = .5*(x[this.IX(1,N+1)] + x[this.IX(0,N)])
    x[this.IX(N+1, 0  )] = .5*(x[this.IX(N,0)]   + x[this.IX(N+1,1)])
    x[this.IX(N+1, N+1)] = .5*(x[this.IX(N,N+1)] + x[this.IX(N+1,N)])
  }

  _linSolve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number, it = 10) {
    const r = 1/c, N = this.N
    for (let k = 0; k < it; k++) {
      for (let j = 1; j <= N; j++)
        for (let i = 1; i <= N; i++)
          x[this.IX(i,j)] = (x0[this.IX(i,j)] + a*(
            x[this.IX(i+1,j)] + x[this.IX(i-1,j)] +
            x[this.IX(i,j+1)] + x[this.IX(i,j-1)]
          )) * r
      this._bnd(b, x)
    }
  }

  _project(vx: Float32Array, vy: Float32Array, p: Float32Array, div: Float32Array) {
    const N = this.N, h = 1/N
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++) {
        div[this.IX(i,j)] = -.5*h*(
          vx[this.IX(i+1,j)] - vx[this.IX(i-1,j)] +
          vy[this.IX(i,j+1)] - vy[this.IX(i,j-1)]
        )
        p[this.IX(i,j)] = 0
      }
    this._bnd(0, div); this._bnd(0, p)
    this._linSolve(0, p, div, 1, 4, 14)
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++) {
        vx[this.IX(i,j)] -= .5*(p[this.IX(i+1,j)] - p[this.IX(i-1,j)])/h
        vy[this.IX(i,j)] -= .5*(p[this.IX(i,j+1)] - p[this.IX(i,j-1)])/h
      }
    this._bnd(1, vx); this._bnd(2, vy)
  }

  _advect(b: number, d: Float32Array, d0: Float32Array, vx: Float32Array, vy: Float32Array) {
    const N = this.N, dt0 = this.dt * N
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++) {
        const x = Math.max(.5, Math.min(N+.5, i - dt0*vx[this.IX(i,j)]))
        const y = Math.max(.5, Math.min(N+.5, j - dt0*vy[this.IX(i,j)]))
        const i0 = Math.floor(x), i1 = i0+1
        const j0 = Math.floor(y), j1 = j0+1
        const s1 = x-i0, s0 = 1-s1
        const t1 = y-j0, t0 = 1-t1
        d[this.IX(i,j)] =
          s0*(t0*d0[this.IX(i0,j0)] + t1*d0[this.IX(i0,j1)]) +
          s1*(t0*d0[this.IX(i1,j0)] + t1*d0[this.IX(i1,j1)])
      }
    this._bnd(b, d)
  }

  step() {
    const {Vx,Vy,Vx0,Vy0,N,dt,visc} = this
    const a = dt*visc*N*N, c = 1+4*a
    this._linSolve(1, Vx0, Vx, a, c)
    this._linSolve(2, Vy0, Vy, a, c)
    this._project(Vx0, Vy0, Vx, Vy)
    this._advect(1, Vx, Vx0, Vx0, Vy0)
    this._advect(2, Vy, Vy0, Vx0, Vy0)
    this._project(Vx, Vy, Vx0, Vy0)
    const ad = dt*this.diff*N*N, cd = 1+4*ad
    this._linSolve(0, this.s, this.density, ad, cd)
    this._advect(0, this.density, this.s, Vx, Vy)
  }
}

const N = 150

// ─── Handle exposto via ref ───────────────────────────────────────────────
export interface SmokeBackgroundHandle {
  addVelocity: (u: number, v: number, vx: number, vy: number) => void
}

export const SmokeBackground = forwardRef<SmokeBackgroundHandle, { className?: string }>(
  function SmokeBackground({ className = '' }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fluidRef  = useRef<Fluid | null>(null)
    const mouseRef  = useRef({ x: -1, y: -1, px: -1, py: -1 })
    const rafRef    = useRef(0)
    const frameRef  = useRef(0)
    const dimRef    = useRef({ w: 1, h: 1 })

    // ── Expõe addVelocity para o HeroSection chamar no impacto do charuto ──
    useImperativeHandle(ref, () => ({
      addVelocity(u: number, v: number, vx: number, vy: number) {
        const fluid = fluidRef.current
        if (!fluid) return
        // Converte UV [0,1] para coordenadas da grade [1, N]
        const gx = Math.max(1, Math.min(N, Math.floor(u * N)))
        const gy = Math.max(1, Math.min(N, Math.floor(v * N)))
        // Injeta um raio de perturbação ao redor do ponto de impacto
        const R = 8
        for (let di = -R; di <= R; di++) {
          for (let dj = -R; dj <= R; dj++) {
            const dist = Math.sqrt(di*di + dj*dj)
            if (dist > R) continue
            const str = (1 - dist / R)
            fluid.addVelocity(gx + di, gy + dj, vx * str, vy * str)
            // Adiciona densidade para visualizar o deslocamento
            fluid.addDensity(gx + di, gy + dj, 0.3 * str)
          }
        }
      },
    }))

    const init = useCallback(() => {
      const f = new Fluid(N, 0.0025, .0000012, 0.00001)
      fluidRef.current = f
      for (let i = 0; i < 400; i++) {
        const x = 1 + Math.floor(Math.random() * N)
        const y = 1 + Math.floor(Math.random() * N)
        f.addDensity(x, y, 0.15 + Math.random() * 0.25)
        f.addVelocity(x, y, (Math.random()-.5)*0.04, -(Math.random()*0.06))
      }
    }, [])

    const draw = useCallback(() => {
      const canvas = canvasRef.current
      const fluid  = fluidRef.current
      if (!canvas || !fluid) return
      frameRef.current++

      const { w: W, h: H } = dimRef.current
      const m = mouseRef.current

      if (m.x > 0 && m.px > 0) {
        const gx  = Math.floor((m.x / W) * N) + 1
        const gy  = Math.floor((m.y / H) * N) + 1
        const dvx = (m.x - m.px) * 0.4
        const dvy = (m.y - m.py) * 0.4
        const spd = Math.sqrt(dvx*dvx + dvy*dvy)
        if (spd > 0.05) {
          const R = 7
          for (let di = -R; di <= R; di++) {
            for (let dj = -R; dj <= R; dj++) {
              const dist = Math.sqrt(di*di + dj*dj)
              if (dist < 0.5 || dist > R) continue
              const str = (1 - dist/R) * 1.2
              const nx = di/dist, ny = dj/dist
              const tx = -ny,    ty =  nx
              fluid.addVelocity(gx+di, gy+dj,
                (tx*1.8 + dvx*0.1) * str,
                (ty*1.8 + dvy*0.1) * str
              )
            }
          }
        }
      }
      m.px = m.x; m.py = m.y

      if (frameRef.current % 4 === 0) {
        for (let i = 1; i <= N; i++) {
          if (Math.random() > 0.12) continue
          const row = N - 1 + Math.floor(Math.random() * 2)
          fluid.addDensity(i, row, 0.2 + Math.random() * 0.25)
          fluid.addVelocity(i, row,
            (Math.random() - 0.5) * 0.10,
            -(0.30 + Math.random() * 0.15)
          )
        }
      }

      for (let k = 0; k < 4; k++) {
        const rx = 1 + Math.floor(Math.random() * N)
        const ry = 1 + Math.floor(Math.random() * N)
        if (fluid.density[fluid.IX(rx, ry)] > 0.5) {
          fluid.addVelocity(rx, ry,
            (Math.random() - 0.5) * 0.06,
            (Math.random() - 0.5) * 0.06
          )
        }
      }

      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          const d = fluid.density[fluid.IX(i, j)]
          if (d > 0.01) {
            fluid.Vy[fluid.IX(i, j)] -= d * 0.18
            fluid.Vx[fluid.IX(i, j)] += (Math.random() - 0.5) * d * 0.00002
          }
        }
      }

      fluid.step()

      for (let i = 0; i < fluid.sz; i++) {
        fluid.density[i] *= 0.991
        if (fluid.density[i] > 0.9) fluid.density[i] = 0.9
        fluid.Vx[i] *= 0.993
        fluid.Vy[i] *= 0.993
      }

      const ctx  = canvas.getContext('2d')!
      const img  = ctx.createImageData(N+2, N+2)
      const data = img.data

      for (let i = 0; i < fluid.sz; i++) {
        const d   = Math.min(1, fluid.density[i])
        const idx = i * 4
        const val = Math.round(Math.pow(d, 0.4) * 200)
        data[idx]   = 238
        data[idx+1] = 244
        data[idx+2] = 255
        data[idx+3] = val
      }

      ctx.putImageData(img, 0, 0)
      rafRef.current = requestAnimationFrame(draw)
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const resize = () => {
        canvas.width  = N + 2
        canvas.height = N + 2
        dimRef.current = { w: window.innerWidth, h: window.innerHeight }
        init()
      }
      resize()
      window.addEventListener('resize', resize)
      rafRef.current = requestAnimationFrame(draw)
      return () => {
        window.removeEventListener('resize', resize)
        cancelAnimationFrame(rafRef.current)
      }
    }, [draw, init])

    useEffect(() => {
      const mv = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY }
      const ml = () => { mouseRef.current.x = -1; mouseRef.current.y = -1 }
      window.addEventListener('mousemove', mv)
      window.addEventListener('mouseleave', ml)
      return () => {
        window.removeEventListener('mousemove', mv)
        window.removeEventListener('mouseleave', ml)
      }
    }, [])

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          position:      'fixed',
          inset:         0,
          width:         '100vw',
          height:        '100vh',
          zIndex:        0,
          pointerEvents: 'none',
          display:       'block',
          filter:        'blur(5px) contrast(2.2) brightness(1.1)',
          opacity:       0.65,
          mixBlendMode:  'screen',
        }}
      />
    )
  }
)