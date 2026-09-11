"use client";
/* eslint-disable react-hooks/immutability -- uniforms are written imperatively every frame through the material ref; that is how a GPU shader is driven. */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { tapeRows, changePct } from "@/lib/tape";
import { heroBus } from "@/lib/heroBus";

/**
 * The market as a field. One GPU point per tick, tinted by its symbol's real
 * day move (up olive, down brick, flat ink), drifting on a curl-noise flow at
 * a speed set by that symbol's day range. The cursor pushes the field aside;
 * a tile ticking in the mosaic ripples outward from that tile. One draw
 * call, simulation entirely in the vertex shader, device pixel ratio capped
 * at 1.5, and no frames rendered while the hero is off-screen.
 */

const COUNT = 12000;
const RIPPLES = 6;

const vertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSpeed;
  attribute float aTint;
  attribute float aSize;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uMouse;
  uniform float uMouseOn;
  uniform vec3 uRipples[${RIPPLES}];
  uniform vec2 uHole;
  uniform float uDpr;
  varying float vTint;
  varying float vAlpha;

  // Ashima 3D simplex noise (public domain).
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    // Base lane: drift right at the symbol's speed, wrap across the width.
    float w = uAspect * 2.0 + 0.4;
    float x = mod(position.x + uTime * aSpeed * 0.05 + aSeed * 7.0, w) - uAspect - 0.2;
    float y = position.y;
    vec2 p = vec2(x, y);

    // Curl-ish flow from two noise samples.
    float n1 = snoise(vec3(p * 1.6, uTime * 0.08 + aSeed));
    float n2 = snoise(vec3(p * 1.6 + 31.7, uTime * 0.08 - aSeed));
    p += vec2(n2, -n1) * 0.09;

    // Cursor pushes the field aside.
    vec2 dm = p - uMouse;
    float md = length(dm);
    float push = uMouseOn * smoothstep(0.34, 0.0, md);
    p += normalize(dm + 0.0001) * push * 0.16;

    // Ripples from ticking tiles: an expanding ring that fades.
    float ring = 0.0;
    for (int i = 0; i < ${RIPPLES}; i++) {
      vec3 r = uRipples[i];
      float age = uTime - r.z;
      if (age > 0.0 && age < 1.6) {
        float d = length(p - r.xy);
        float radius = age * 0.55;
        float band = exp(-pow((d - radius) * 14.0, 2.0)) * (1.0 - age / 1.6);
        p += normalize(p - r.xy + 0.0001) * band * 0.05;
        ring += band;
      }
    }

    // Quieter under the headline so the copy stays clean.
    float hole = smoothstep(0.0, 0.9, length((p - uHole) * vec2(0.8, 1.3)));

    vTint = aTint;
    vAlpha = (0.13 + 0.16 * hole + ring * 0.5) * (0.6 + 0.4 * aSize);
    gl_Position = vec4(p.x / uAspect, p.y, 0.0, 1.0);
    gl_PointSize = (1.2 + aSize * 1.6 + ring * 2.0) * uDpr;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uInk;
  uniform vec3 uUp;
  uniform vec3 uDown;
  varying float vTint;
  varying float vAlpha;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float soft = smoothstep(0.25, 0.08, d);
    vec3 col = vTint > 1.5 ? uDown : (vTint > 0.5 ? uUp : uInk);
    gl_FragColor = vec4(col, vAlpha * soft);
  }
`;

function cssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
}

function Field({ activeRef }: { activeRef: React.RefObject<boolean> }) {
  const { size, gl } = useThree();
  const mouse = useRef({ x: 0, y: 0, on: 0 });
  const rippleSlot = useRef(0);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    const speed = new Float32Array(COUNT);
    const tint = new Float32Array(COUNT);
    const psize = new Float32Array(COUNT);
    // Deterministic pseudo-random so every load looks the same.
    let s = 20260907;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    const ranges = tapeRows.map((r) => (r.h - r.l) / r.p);
    const maxRange = Math.max(...ranges);
    for (let i = 0; i < COUNT; i++) {
      const sym = i % tapeRows.length;
      const r = tapeRows[sym];
      pos[i * 3] = rnd() * 4 - 2;
      pos[i * 3 + 1] = rnd() * 2.2 - 1.1;
      pos[i * 3 + 2] = 0;
      seed[i] = rnd();
      speed[i] = 0.35 + (ranges[sym] / maxRange) * 1.3;
      const chg = changePct(r.c, r);
      tint[i] = chg > 0.4 ? 1 : chg < -0.4 ? 2 : 0;
      psize[i] = rnd();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(psize, 1));
    return g;
  }, []);

  const matRef = useRef<THREE.ShaderMaterial>(null);
  // Initial uniform values; the frame loop mutates them through the material ref.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseOn: { value: 0 },
      uRipples: { value: Array.from({ length: RIPPLES }, () => new THREE.Vector3(0, 0, -10)) },
      uHole: { value: new THREE.Vector2(-0.6, 0.2) },
      uDpr: { value: 1 },
      uInk: { value: cssColor("--fg", "#141413") },
      uUp: { value: cssColor("--up", "#4a6634") },
      uDown: { value: cssColor("--down", "#a3362f") },
    }),
    [],
  );

  // Pointer in field coordinates (x in ±aspect, y in ±1).
  useEffect(() => {
    const el = gl.domElement;
    const toField = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      const aspect = r.width / r.height;
      return { x: ((clientX - r.left) / r.width) * 2 * aspect - aspect, y: 1 - ((clientY - r.top) / r.height) * 2 };
    };
    const onMove = (e: PointerEvent) => {
      const p = toField(e.clientX, e.clientY);
      mouse.current.x = p.x;
      mouse.current.y = p.y;
      mouse.current.on = 1;
    };
    const onLeave = () => (mouse.current.on = 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    const off = heroBus.on((t) => {
      const p = toField(t.x, t.y);
      const slot = rippleSlot.current++ % RIPPLES;
      const u = matRef.current?.uniforms;
      if (!u) return;
      (u.uRipples.value as THREE.Vector3[])[slot].set(p.x, p.y, u.uTime.value as number);
    });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      off();
    };
  }, [gl]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!activeRef.current) return;
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uTime.value = (u.uTime.value as number) + Math.min(delta, 0.05);
    u.uAspect.value = size.width / size.height;
    u.uDpr.value = state.gl.getPixelRatio();
    const mu = u.uMouse.value as THREE.Vector2;
    mu.x += (mouse.current.x - mu.x) * 0.12;
    mu.y += (mouse.current.y - mu.y) * 0.12;
    u.uMouseOn.value = (u.uMouseOn.value as number) + (mouse.current.on - (u.uMouseOn.value as number)) * 0.08;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export default function HeroField({ active }: { active: boolean }) {
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  return (
    <Canvas
      className="hero-field"
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1, near: 0, far: 2 }}
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power", stencil: false, depth: false }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      aria-hidden="true"
    >
      <Field activeRef={activeRef} />
    </Canvas>
  );
}
