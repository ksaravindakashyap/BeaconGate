"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface ShaderPlaneProps {
  vertexShader: string;
  fragmentShader: string;
  uniforms: { [key: string]: { value: unknown } };
}

const ShaderPlane = ({
  vertexShader,
  fragmentShader,
  uniforms,
}: ShaderPlaneProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.u_time.value = state.clock.elapsedTime * 0.5;
      material.uniforms.u_resolution.value.set(size.width, size.height, 1.0);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float u_time;
  uniform vec3 u_resolution;

  vec2 toPolar(vec2 p) {
      float r = length(p);
      float a = atan(p.y, p.x);
      return vec2(r, a);
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 p = 6.0 * ((fragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y);
      vec2 polar = toPolar(p);
      float r = polar.x;

      vec2 i = p;
      float c = 0.0;
      float rot = r + u_time + p.x * 0.100;
      for (float n = 0.0; n < 4.0; n++) {
          float rr = r + 0.15 * sin(u_time*0.7 + float(n) + r*2.0);
          p *= mat2(
              cos(rot - sin(u_time / 10.0)), sin(rot),
              -sin(cos(rot) - u_time / 10.0), cos(rot)
          ) * -0.25;
          float t = r - u_time / (n + 30.0);
          i -= p + sin(t - i.y) + rr;
          c += 2.2 / length(vec2(
              (sin(i.x + t) / 0.15),
              (cos(i.y + t) / 0.15)
          ));
      }
      c /= 8.0;
      vec3 baseColor = vec3(0.2, 0.7, 0.5);
      vec3 finalColor = baseColor * smoothstep(0.0, 1.0, c * 0.6);
      fragColor = vec4(finalColor, 1.0);
  }

  void main() {
      vec4 fragColor;
      vec2 fragCoord = vUv * u_resolution.xy;
      mainImage(fragColor, fragCoord);
      gl_FragColor = fragColor;
  }
`;

/** Base gradient + emerald/teal glow blobs + navy→black (single layer) */
const BASE_GRADIENT_CLASS =
  "absolute inset-0 pointer-events-none bg-[radial-gradient(1200px_circle_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(900px_circle_at_80%_30%,rgba(45,212,191,0.14),transparent_55%),linear-gradient(to_bottom,rgba(3,7,18,0.92),rgba(0,0,0,0.98))]";

/** Wavy texture via repeating gradients + blur */
const WAVY_LAYER_STYLE = {
  mixBlendMode: "soft-light" as const,
  opacity: 0.08,
  background:
    "repeating-radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08)_0_1px,transparent_1px_14px),repeating-linear-gradient(115deg,rgba(45,212,191,0.06)_0_1px,transparent_1px_18px)",
};

/** CSS-based grain (no asset) */
const NOISE_LAYER_STYLE = {
  opacity: 0.05,
  backgroundImage:
    "repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px),repeating-linear-gradient(90deg,transparent_0px,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px),repeating-linear-gradient(45deg,transparent_0px,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)",
};

export function SiteBackdrop() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const shaderUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector3(1, 1, 1) },
    }),
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden
    >
      {/* Optional: WebGL shader (disabled when prefers-reduced-motion) */}
      {!prefersReducedMotion && (
        <Canvas
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 2]}
          className="!block w-full h-full"
        >
          <ShaderPlane
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={shaderUniforms}
          />
        </Canvas>
      )}

      {/* Base: navy→black + emerald/teal glow blobs */}
      <div className={BASE_GRADIENT_CLASS} aria-hidden />

      {/* Subtle wavy/organic texture (CSS-only) */}
      <div
        className="absolute inset-0 pointer-events-none blur-2xl"
        style={WAVY_LAYER_STYLE}
        aria-hidden
      />

      {/* Very subtle noise/grain (CSS-only, no asset) */}
      <div
        className="absolute inset-0 pointer-events-none bg-repeat"
        style={NOISE_LAYER_STYLE}
        aria-hidden
      />
    </div>
  );
}
