import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles } from '@react-three/drei';
import { Sidebar } from './Sidebar';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

// 3D Abstract Audio Wave Component
const AudioWave = () => {
  const groupRef = useRef();
  const count = 30;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((mesh, i) => {
        // Create a sine wave effect based on time and position
        const scaleY = 1 + Math.sin(time * 2 + i * 0.3) * 2.5;
        mesh.scale.y = Math.max(0.1, scaleY);
        // Add subtle color pulsation
        const hue = (Math.sin(time * 0.5) * 0.1 + 0.65) * 360; // Blue/Purple range
        mesh.material.color.setHSL(hue / 360, 0.8, 0.6);
      });
    }
  });

  return (
    <group ref={groupRef} position={[-count * 0.15, -1, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[i * 0.3, 0, 0]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color="#38BDF8" emissive="#14B8A6" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

export const NewSession = ({ user, setUser }) => {
  const [category, setCategory] = useState('Technology');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startSession = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ category, difficulty })
    });
    const sessionData = await res.json();
    setLoading(false);
    if (sessionData.id) {
      navigate(`/session/${sessionData.id}`, { state: { session: sessionData } });
    } else {
      alert(sessionData.error || 'Failed to create session');
    }
  };

  return (
    <div className="split-layout">
      <Sidebar user={user} setUser={setUser} />
      
      <div className="split-main">
        <div className="split-left">
          <div className="new-session-header">
            <h1>Impromptu Practice</h1>
            <p>Customize your next speaking challenge. We'll generate a random topic instantly based on your selections.</p>
          </div>
          
          <div className="new-session-form" style={{ marginTop: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-medium)' }}>Topic Category</label>
              <select className="input-field" value={category} onChange={e=>setCategory(e.target.value)}>
                <option>Technology</option>
                <option>Education</option>
                <option>Current Affairs</option>
                <option>Personal Experience</option>
                <option>Business & Entrepreneurship</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-medium)' }}>Difficulty Level</label>
              <select className="input-field" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                <option value="easy">Easy (General knowledge)</option>
                <option value="medium">Medium (Specific scenarios)</option>
                <option value="hard">Hard (Abstract concepts)</option>
              </select>
            </div>
            
            <button className="btn-primary" onClick={startSession} disabled={loading} style={{ marginTop: '1rem', padding: '1rem' }}>
              {loading ? 'Generating Topic...' : 'Start Session Now'}
            </button>
          </div>
        </div>
        
        <div className="split-right">
          <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
            <color attach="background" args={['#FFFBF5']} />
            <fog attach="fog" args={['#FFFBF5', 5, 15]} />
            
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#38BDF8" />
            
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
              <AudioWave />
            </Float>
            
            <Sparkles count={100} scale={10} size={4} speed={0.4} opacity={0.3} color="#38BDF8" />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            <Environment preset="city" />
          </Canvas>
        </div>
      </div>
    </div>
  );
};