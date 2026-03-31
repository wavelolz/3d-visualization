"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function TruckModel() {
  const { scene } = useGLTF("/truck-model");
  const wrapperRef = useRef<THREE.Group>(null);
  const model = useMemo(() => scene.clone(true), [scene]);
  const clearance = 0.45;

  useLayoutEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const targetSize = 7;
    const scale = targetSize / maxAxis;

    wrapperRef.current.scale.setScalar(scale);
    wrapperRef.current.position.set(
      -center.x * scale,
      -box.min.y * scale + clearance,
      -center.z * scale,
    );

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clearance, model]);

  return (
    <group ref={wrapperRef}>
      <primitive object={model} />
    </group>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="scene-loading">Loading truck model</div>
    </Html>
  );
}

export function TruckShowroom() {
  return (
    <div className="showroom-frame">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [8, 4.5, 8.5], fov: 34, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#f7f1e6"]} />
        <fog attach="fog" args={["#f7f1e6", 10, 28]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight
          intensity={0.7}
          color="#fff6e8"
          groundColor="#bda57d"
        />
        <directionalLight
          castShadow
          intensity={2.6}
          position={[9, 12, 7]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-camera-near={1}
          shadow-camera-far={35}
        />

        <Suspense fallback={<Loader />}>
          <Environment preset="city" />
          <TruckModel />
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.32}
            scale={18}
            blur={2.8}
            far={8}
          />
        </Suspense>

        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.18, 0]}
        >
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#d8cfbf" roughness={0.97} metalness={0} />
        </mesh>

        <OrbitControls
          makeDefault
          enableDamping
          enablePan
          minDistance={4}
          maxDistance={15}
          minPolarAngle={0.08}
          maxPolarAngle={Math.PI - 0.08}
          target={[0, 1.2, 0]}
        />
      </Canvas>

      <div className="scene-caption">
        Rotate, pan, and zoom around or underneath the truck.
      </div>
    </div>
  );
}

useGLTF.preload("/truck-model");
