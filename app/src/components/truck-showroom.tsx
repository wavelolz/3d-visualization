"use client";

import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type BeamPoint = {
  anchor: [number, number, number];
  name: string;
  target: [number, number, number];
};

const HIGHBEAM_Y_OFFSET = -0.11;

function extractHighbeamPoints(model: THREE.Object3D, box: THREE.Box3): BeamPoint[] {
  const anchors = new Map<string, { name: string; position: THREE.Vector3 }>();
  const targets = new Map<string, { name: string; position: THREE.Vector3 }>();

  model.updateMatrixWorld(true);
  model.traverse((child) => {
    const anchorMatch = child.name.match(/^highbeam_anchor_(.+)$/i);
    const targetMatch = child.name.match(/^highbeam_target_(.+)$/i);

    if (anchorMatch) {
      anchors.set(anchorMatch[1].toLowerCase(), {
        name: anchorMatch[1],
        position: child.getWorldPosition(new THREE.Vector3()),
      });
    }

    if (targetMatch) {
      targets.set(targetMatch[1].toLowerCase(), {
        name: targetMatch[1],
        position: child.getWorldPosition(new THREE.Vector3()),
      });
    }
  });

  const embeddedBeams: BeamPoint[] = [];
  anchors.forEach((anchorEntry, key) => {
    const target = targets.get(key);
    if (!target) {
      return;
    }

    embeddedBeams.push({
      anchor: [
        anchorEntry.position.x,
        anchorEntry.position.y,
        anchorEntry.position.z,
      ],
      name: anchorEntry.name,
      target: [target.position.x, target.position.y, target.position.z],
    });
  });

  if (embeddedBeams.length > 0) {
    return embeddedBeams.sort((left, right) => left.name.localeCompare(right.name));
  }

  const size = box.getSize(new THREE.Vector3());
  const frontX = box.max.x - size.x * 0.05;
  const beamHeight = box.min.y + size.y * 0.48;
  const spread = Math.max(size.z * 0.28, 0.12);
  const targetX = box.max.x + size.x * 0.8;
  const targetHeight = beamHeight + size.y * 0.02;

  return [
    {
      anchor: [frontX, beamHeight, spread] as [number, number, number],
      name: "fallback-left",
      target: [targetX, targetHeight, spread * 0.82] as [number, number, number],
    },
    {
      anchor: [frontX, beamHeight, -spread] as [number, number, number],
      name: "fallback-right",
      target: [targetX, targetHeight, -spread * 0.82] as [number, number, number],
    },
  ];
}

function HighbeamLight({
  anchor,
  anchorName,
  enabled,
  model,
  target,
}: {
  anchor: [number, number, number];
  anchorName: string;
  enabled: boolean;
  model: THREE.Object3D;
  target: [number, number, number];
}) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const beamGroupRef = useRef<THREE.Group>(null);
  const beamVisual = useMemo(() => {
    const start = new THREE.Vector3(...anchor);
    const end = new THREE.Vector3(...target);
    const direction = end.clone().sub(start).normalize();
    const length = Math.max(start.distanceTo(end) * 6.5, 3);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction,
    );

    return {
      length,
      quaternion,
    };
  }, [anchor, target]);

  useFrame(() => {
    if (!lightRef.current || !targetRef.current) {
      return;
    }

    lightRef.current.target = targetRef.current;
    const anchorNode = model.getObjectByName(`highbeam_anchor_${anchorName}`);
    const targetNode = model.getObjectByName(`highbeam_target_${anchorName}`);
    const anchorPosition = new THREE.Vector3();
    const targetPosition = new THREE.Vector3();
    const direction = new THREE.Vector3();

    model.updateWorldMatrix(true, true);

    if (anchorNode && targetNode) {
      anchorNode.getWorldPosition(anchorPosition);
      targetNode.getWorldPosition(targetPosition);
    } else {
      anchorPosition.set(...anchor);
      targetPosition.set(...target);
      model.localToWorld(anchorPosition);
      model.localToWorld(targetPosition);
    }

    anchorPosition.y += HIGHBEAM_Y_OFFSET;
    targetPosition.y += HIGHBEAM_Y_OFFSET;

    direction.subVectors(targetPosition, anchorPosition).normalize();

    lightRef.current.position.copy(anchorPosition);
    targetRef.current.position.copy(targetPosition);
    lightRef.current.target.updateMatrixWorld();

    if (beamGroupRef.current) {
      beamGroupRef.current.position.copy(anchorPosition);
      beamGroupRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction,
      );
    }
  });

  return (
    <>
      <object3D ref={targetRef} position={target} />
      <spotLight
        ref={lightRef}
        castShadow={enabled}
        angle={0.16}
        color="#fef2b4"
        decay={1.2}
        distance={36}
        intensity={enabled ? 120 : 0}
        penumbra={0.28}
        shadow-bias={-0.00008}
      />
      {enabled ? (
        <group ref={beamGroupRef} quaternion={beamVisual.quaternion}>
          <mesh position={[0, beamVisual.length * 0.5, 0]}>
            <cylinderGeometry args={[0.2, 0.035, beamVisual.length, 24, 1, true]} />
            <meshBasicMaterial
              color="#fff1a8"
              depthWrite={false}
              opacity={0.14}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.028, 16, 16]} />
            <meshBasicMaterial color="#fff8cf" />
          </mesh>
        </group>
      ) : null}
    </>
  );
}

function TruckModel({ highbeamOn }: { highbeamOn: boolean }) {
  const { scene } = useGLTF("/truck-model");
  const wrapperRef = useRef<THREE.Group>(null);
  const model = useMemo(() => scene.clone(true), [scene]);
  const clearance = 0.45;
  const highbeamPoints = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    return extractHighbeamPoints(model, box);
  }, [model]);

  useLayoutEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    wrapperRef.current.position.set(
      -center.x,
      -box.min.y + clearance,
      -center.z,
    );

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clearance, model]);

  return (
    <>
      <group ref={wrapperRef}>
        <primitive object={model} />
      </group>
      {highbeamPoints.map((beam) => (
        <HighbeamLight
          key={beam.name}
          anchor={beam.anchor}
          anchorName={beam.name}
          enabled={highbeamOn}
          model={model}
          target={beam.target}
        />
      ))}
    </>
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
  const [highbeamOn, setHighbeamOn] = useState(false);

  return (
    <div className="showroom-frame">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [2.8, 1.85, 3.1], fov: 34, near: 0.1, far: 100 }}
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
          <TruckModel highbeamOn={highbeamOn} />
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.32}
            scale={5.5}
            blur={2.8}
            far={2.4}
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
          minDistance={1.4}
          maxDistance={6}
          minPolarAngle={0.08}
          maxPolarAngle={Math.PI - 0.08}
          target={[0, 0.62, 0]}
        />
      </Canvas>

      <div className="absolute left-4 top-4 z-10 flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setHighbeamOn((current) => !current)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            highbeamOn
              ? "bg-accent text-white shadow-[0_10px_24px_rgba(191,93,45,0.32)]"
              : "bg-ink text-white"
          }`}
        >
          Highbeam {highbeamOn ? "On" : "Off"}
        </button>
        <p className="max-w-[14rem] text-xs leading-5 text-ink/70">
          Toggle the truck lights and inspect the beam direction in real time.
        </p>
      </div>

      <div className="scene-caption">
        Rotate, pan, zoom, and test the highbeam from any angle.
      </div>
    </div>
  );
}

useGLTF.preload("/truck-model");
