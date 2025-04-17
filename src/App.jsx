import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

function UploadedModel({ url }) {
  const ref = useRef();
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!url) return;

    // Reset the scene by clearing the existing model
    ref.current.clear();

    new GLTFLoader().load(url, (gltf) => {
      const scene = gltf.scene;
      const box = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      // Center and scale the model
      scene.position.sub(center);
      const maxSize = 2; // target max dimension
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = maxSize / maxDim;
      scene.scale.setScalar(scaleFactor);

      // Add to scene
      ref.current.add(scene);

      // Adjust camera
      const fov = camera.fov * (Math.PI / 180);
      const distance = (maxSize / 2 / Math.tan(fov / 2)) * 1.4;
      const startZ = distance * 2;
      camera.position.set(0, 0, startZ);
      controls.target.set(0, 0, 0);
      controls.update();

      // Smooth camera zoom
      let p = 0;
      const zoom = () => {
        if (p >= 1) return;
        p += 0.02;
        camera.position.z = startZ + (distance - startZ) * p;
        camera.lookAt(0, 0, 0);
        controls.update();
        requestAnimationFrame(zoom);
      };
      zoom();
    });
  }, [url, camera, controls]);

  return <group ref={ref} />;
}

function CameraTracker({ onUpdate }) {
  const { camera } = useThree();
  useFrame(() => {
    onUpdate({
      x: camera.position.x.toFixed(2),
      y: camera.position.y.toFixed(2),
      z: camera.position.z.toFixed(2),
    });
  });
  return null;
}

export default function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0, z: 0 });

  // Light settings
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.6);
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState(1);
  const [directionalLightPosition, setDirectionalLightPosition] = useState([
    5, 10, 7.5,
  ]);
  const [directionalLightColor, setDirectionalLightColor] = useState("#ffffff");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear the previous model by resetting the state
      setModelUrl(null);
      setTimeout(() => {
        setModelUrl(URL.createObjectURL(file));
      }, 0); // Introduce a small delay to ensure the canvas clears before the new model loads
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileChange}
        className="absolute top-5 left-5 z-50 bg-white p-2 rounded shadow-md"
      />

      {/* Lighting Control Panel */}
      <div className="absolute top-5 right-5 z-50 bg-white p-4 rounded shadow-md">
        <h3 className="text-xl">Lighting Controls</h3>

        <div>
          <label>Ambient Light Intensity</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={ambientLightIntensity}
            onChange={(e) =>
              setAmbientLightIntensity(parseFloat(e.target.value))
            }
            className="w-full"
          />
          <span>{ambientLightIntensity.toFixed(2)}</span>
        </div>

        <div className="mt-4">
          <label>Directional Light Intensity</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={directionalLightIntensity}
            onChange={(e) =>
              setDirectionalLightIntensity(parseFloat(e.target.value))
            }
            className="w-full"
          />
          <span>{directionalLightIntensity.toFixed(2)}</span>
        </div>

        <div className="mt-4">
          <label>Directional Light Position</label>
          <div>
            <input
              type="number"
              value={directionalLightPosition[0]}
              onChange={(e) =>
                setDirectionalLightPosition([
                  parseFloat(e.target.value),
                  directionalLightPosition[1],
                  directionalLightPosition[2],
                ])
              }
              className="w-16"
            />
            <input
              type="number"
              value={directionalLightPosition[1]}
              onChange={(e) =>
                setDirectionalLightPosition([
                  directionalLightPosition[0],
                  parseFloat(e.target.value),
                  directionalLightPosition[2],
                ])
              }
              className="w-16"
            />
            <input
              type="number"
              value={directionalLightPosition[2]}
              onChange={(e) =>
                setDirectionalLightPosition([
                  directionalLightPosition[0],
                  directionalLightPosition[1],
                  parseFloat(e.target.value),
                ])
              }
              className="w-16"
            />
          </div>
        </div>

        <div className="mt-4">
          <label>Directional Light Color</label>
          <input
            type="color"
            value={directionalLightColor}
            onChange={(e) => setDirectionalLightColor(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        style={{ height: "100vh", width: "100vw" }}
      >
        <ambientLight intensity={ambientLightIntensity} />
        <directionalLight
          position={directionalLightPosition}
          intensity={directionalLightIntensity}
          color={new THREE.Color(directionalLightColor)}
        />
        <Suspense fallback={null}>
          {modelUrl && <UploadedModel url={modelUrl} />}
          <OrbitControls enablePan enableZoom enableRotate />
          <CameraTracker onUpdate={setCameraPos} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-5 left-5 text-white font-mono bg-black/70 p-3 rounded z-50">
        <div>
          <strong>Camera Position</strong>
        </div>
        <div>X: {cameraPos.x}</div>
        <div>Y: {cameraPos.y}</div>
        <div>Z: {cameraPos.z}</div>
      </div>
    </>
  );
}
