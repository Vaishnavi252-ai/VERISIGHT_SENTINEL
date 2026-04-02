import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';

// 3D Model Component
const RobotModel = ({ modelPath, ...props }) => {
  const modelRef = useRef();
  const { scene } = useGLTF(modelPath);
  
  // Rotate the model slowly
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005; // Slow rotation
      // Add subtle floating animation
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={[1.5, 1.5, 1.5]} 
      position={[0, -0.5, 0]}
      {...props} 
    />
  );
};

// Loading fallback component
const ModelLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-purple-500/20 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Main Model Viewer Component
const ModelViewer = ({ 
  modelPath = "/models/robot_playground.glb",
  className = "",
  ...props 
}) => {
  return (
    <div className={`relative w-full h-full ${className}`} {...props}>
      <Canvas
        camera={{ 
          position: [0, 0, 5], 
          fov: 50,
          near: 0.1,
          far: 1000 
        }}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        {/* Lighting Setup */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#a855f7" />
        
        {/* Environment for better reflections */}
        <Environment preset="studio" />
        
        {/* 3D Model with Suspense for loading */}
        <Suspense fallback={null}>
          <RobotModel modelPath={modelPath} />
        </Suspense>
        
        {/* Optional: Enable orbit controls for interaction */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      {/* Loading overlay */}
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm rounded-2xl">
          <ModelLoader />
        </div>
      }>
        <div style={{ display: 'none' }}>
          <RobotModel modelPath={modelPath} />
        </div>
      </Suspense>
    </div>
  );
};

// Preload the model for better performance
useGLTF.preload("/models/robot_playground.glb");

export default ModelViewer;