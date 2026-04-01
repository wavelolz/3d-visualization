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

type BeamRigConfig = {
  anchorPrefix: string;
  targetPrefix: string;
  beamColor: string;
  distance: number;
  floorColor: string;
  intensity: number;
  label: string;
  lengthMultiplier: number;
  visualOpacity: number;
  visualRadii: [number, number];
  yOffset: number;
  angle: number;
  penumbra: number;
};

type NamedNode = {
  name: string;
  position: THREE.Vector3;
};

const HIGHBEAM_CONFIG: BeamRigConfig = {
  anchorPrefix: "highbeam_anchor_",
  targetPrefix: "highbeam_target_",
  angle: 0.16,
  beamColor: "#fef2b4",
  distance: 36,
  floorColor: "#fff1a8",
  intensity: 120,
  label: "Highbeam",
  lengthMultiplier: 6.5,
  penumbra: 0.28,
  visualOpacity: 0.14,
  visualRadii: [0.2, 0.035],
  yOffset: -0.11,
};

const LOWBEAM_CONFIG: BeamRigConfig = {
  ...HIGHBEAM_CONFIG,
  label: "Lowbeam",
  targetPrefix: "lowbeam_target_",
};

function extractBeamPoints(
  model: THREE.Object3D,
  box: THREE.Box3,
  config: Pick<BeamRigConfig, "anchorPrefix" | "targetPrefix">,
): BeamPoint[] {
  const anchors = new Map<string, { name: string; position: THREE.Vector3 }>();
  const targets = new Map<string, NamedNode>();

  model.updateMatrixWorld(true);
  model.traverse((child) => {
    const anchorMatch = child.name.match(
      new RegExp(`^${config.anchorPrefix}(.+)$`, "i"),
    );
    const targetMatch = child.name.match(
      new RegExp(`^${config.targetPrefix}(.+)$`, "i"),
    );

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
  const isLowbeam = config.targetPrefix.toLowerCase().includes("lowbeam");
  const targetHeight = beamHeight + size.y * (isLowbeam ? -0.12 : 0.02);
  const spreadBias = isLowbeam ? 0.72 : 0.82;

  return [
    {
      anchor: [frontX, beamHeight, spread] as [number, number, number],
      name: "fallback-left",
      target: [targetX, targetHeight, spread * spreadBias] as [number, number, number],
    },
    {
      anchor: [frontX, beamHeight, -spread] as [number, number, number],
      name: "fallback-right",
      target: [targetX, targetHeight, -spread * spreadBias] as [number, number, number],
    },
  ];
}

function BeamLight({
  anchor,
  anchorName,
  config,
  enabled,
  model,
  target,
}: {
  anchor: [number, number, number];
  anchorName: string;
  config: BeamRigConfig;
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
    const length = Math.max(start.distanceTo(end) * config.lengthMultiplier, 2.2);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction,
    );

    return {
      length,
      quaternion,
    };
  }, [anchor, config.lengthMultiplier, target]);

  useFrame(() => {
    if (!lightRef.current || !targetRef.current) {
      return;
    }

    lightRef.current.target = targetRef.current;
    const anchorNode = model.getObjectByName(`${config.anchorPrefix}${anchorName}`);
    const targetNode = model.getObjectByName(`${config.targetPrefix}${anchorName}`);
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

    anchorPosition.y += config.yOffset;
    targetPosition.y += config.yOffset;

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
        angle={config.angle}
        color={config.beamColor}
        decay={1.2}
        distance={config.distance}
        intensity={enabled ? config.intensity : 0}
        penumbra={config.penumbra}
        shadow-bias={-0.00008}
      />
      {enabled ? (
        <group ref={beamGroupRef} quaternion={beamVisual.quaternion}>
          <mesh position={[0, beamVisual.length * 0.5, 0]}>
            <cylinderGeometry
              args={[
                config.visualRadii[0],
                config.visualRadii[1],
                beamVisual.length,
                24,
                1,
                true,
              ]}
            />
            <meshBasicMaterial
              color={config.floorColor}
              depthWrite={false}
              opacity={config.visualOpacity}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.028, 16, 16]} />
            <meshBasicMaterial color={config.beamColor} />
          </mesh>
        </group>
      ) : null}
    </>
  );
}

function TruckModel({
  highbeamOn,
  lowbeamOn,
}: {
  highbeamOn: boolean;
  lowbeamOn: boolean;
}) {
  const { scene } = useGLTF("/truck-model");
  const wrapperRef = useRef<THREE.Group>(null);
  const model = useMemo(() => scene.clone(true), [scene]);
  const clearance = 0.45;
  const highbeamPoints = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    return extractBeamPoints(model, box, HIGHBEAM_CONFIG);
  }, [model]);
  const lowbeamPoints = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    return extractBeamPoints(model, box, LOWBEAM_CONFIG);
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
        <BeamLight
          key={`highbeam-${beam.name}`}
          anchor={beam.anchor}
          anchorName={beam.name}
          config={HIGHBEAM_CONFIG}
          enabled={highbeamOn}
          model={model}
          target={beam.target}
        />
      ))}
      {lowbeamPoints.map((beam) => (
        <BeamLight
          key={`lowbeam-${beam.name}`}
          anchor={beam.anchor}
          anchorName={beam.name}
          config={LOWBEAM_CONFIG}
          enabled={lowbeamOn}
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
  const [lowbeamOn, setLowbeamOn] = useState(false);

  function toggleLowbeam() {
    setLowbeamOn((current) => {
      const next = !current;
      if (next) {
        setHighbeamOn(false);
      }
      return next;
    });
  }

  function toggleHighbeam() {
    setHighbeamOn((current) => {
      const next = !current;
      if (next) {
        setLowbeamOn(false);
      }
      return next;
    });
  }

  return (
    <div className="showroom-frame">
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [2.8, 1.85, 3.1], fov: 34, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#0b1020"]} />
        <fog attach="fog" args={["#0b1020", 8, 24]} />
        <ambientLight intensity={0.28} />
        <hemisphereLight
          intensity={0.38}
          color="#b9cbff"
          groundColor="#0d111d"
        />
        <directionalLight
          castShadow
          intensity={1.7}
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
          <TruckModel highbeamOn={highbeamOn} lowbeamOn={lowbeamOn} />
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
          <meshStandardMaterial color="#0f1522" roughness={0.97} metalness={0} />
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

      <div className="absolute left-4 top-4 z-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1020]/74 px-4 py-3 text-white backdrop-blur">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleLowbeam}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              lowbeamOn
                ? "bg-[#d9b85d] text-[#111726] shadow-[0_10px_24px_rgba(217,184,93,0.26)]"
                : "bg-white/14 text-white"
            }`}
          >
            Lowbeam {lowbeamOn ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={toggleHighbeam}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              highbeamOn
                ? "bg-accent text-white shadow-[0_10px_24px_rgba(191,93,45,0.32)]"
                : "bg-white/14 text-white"
            }`}
          >
            Highbeam {highbeamOn ? "On" : "Off"}
          </button>
        </div>
        <p className="max-w-[14rem] text-xs leading-5 text-white/72">
          Toggle the lowbeam or highbeam and inspect how each pattern hits the road.
        </p>
      </div>

      <div className="scene-caption">
        Rotate, pan, zoom, and compare lowbeam versus highbeam from any angle.
      </div>
    </div>
  );
}

useGLTF.preload("/truck-model");
