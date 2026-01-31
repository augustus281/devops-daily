'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Server, Users, ArrowRight, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DeploymentStrategy = 'recreate' | 'rolling' | 'blue-green' | 'canary' | 'feature-toggle';

interface PodState {
  id: number;
  version: 'v1' | 'v2';
  status: 'running' | 'terminating' | 'starting' | 'healthy' | 'unhealthy';
  featureFlag?: boolean;
}

interface RequestPacket {
  id: string;
  targetPod: number;
  version: 'v1' | 'v2';
  phase: 'incoming' | 'routed' | 'completed';
}

const STRATEGIES: Record<DeploymentStrategy, { name: string; description: string; pros: string[]; cons: string[]; useCase: string }> = {
  'recreate': {
    name: 'Recreate',
    description: 'Terminate all v1 pods, then start all v2 pods. Simple but causes downtime.',
    pros: ['Simple to implement', 'Clean state - no version mixing', 'Lower resource cost'],
    cons: ['Downtime during deployment', 'No rollback without redeployment', 'All-or-nothing risk'],
    useCase: 'Development environments, stateful apps requiring clean restarts',
  },
  'rolling': {
    name: 'Rolling Update',
    description: 'Gradually replace v1 pods with v2, one at a time. Zero downtime.',
    pros: ['Zero downtime', 'Gradual rollout', 'Easy rollback'],
    cons: ['Temporary version mixing', 'Slower deployment', 'Requires backward compatibility'],
    useCase: 'Most production deployments, Kubernetes default strategy',
  },
  'blue-green': {
    name: 'Blue-Green',
    description: 'Run two identical environments. Switch traffic instantly from blue (v1) to green (v2).',
    pros: ['Instant rollback', 'Zero downtime', 'Full testing before switch'],
    cons: ['Double infrastructure cost', 'Database migrations complex', 'Resource intensive'],
    useCase: 'Critical applications, when instant rollback is essential',
  },
  'canary': {
    name: 'Canary',
    description: 'Route a small percentage of traffic to v2, gradually increase if healthy.',
    pros: ['Minimal blast radius', 'Real user testing', 'Data-driven rollout'],
    cons: ['Complex traffic management', 'Longer deployment time', 'Requires good monitoring'],
    useCase: 'High-traffic services, A/B testing, gradual feature rollout',
  },
  'feature-toggle': {
    name: 'Feature Toggles',
    description: 'Deploy code with features disabled, enable via configuration flags.',
    pros: ['Decouple deploy from release', 'Per-user/segment targeting', 'Instant toggle'],
    cons: ['Technical debt if not cleaned', 'Testing complexity', 'Code branching overhead'],
    useCase: 'Trunk-based development, gradual feature rollout, A/B testing',
  },
};

const VERSION_COLORS = {
  v1: { bg: 'bg-blue-500', hex: '#3b82f6', label: 'V1 (Blue)' },
  v2: { bg: 'bg-green-500', hex: '#22c55e', label: 'V2 (Green)' },
};

const STATUS_COLORS = {
  running: 'border-emerald-500',
  healthy: 'border-emerald-500',
  starting: 'border-amber-500',
  terminating: 'border-red-500',
  unhealthy: 'border-red-500',
};

export default function DeploymentStrategiesSimulator() {
  const [strategy, setStrategy] = useState<DeploymentStrategy>('rolling');
  const [isRunning, setIsRunning] = useState(false);
  const [deploymentPhase, setDeploymentPhase] = useState<'idle' | 'deploying' | 'complete'>('idle');
  const [pods, setPods] = useState<PodState[]>([
    { id: 1, version: 'v1', status: 'running' },
    { id: 2, version: 'v1', status: 'running' },
    { id: 3, version: 'v1', status: 'running' },
    { id: 4, version: 'v1', status: 'running' },
  ]);
  const [requests, setRequests] = useState<RequestPacket[]>([]);
  const [canaryPercentage, setCanaryPercentage] = useState(0);
  const [blueGreenActive, setBlueGreenActive] = useState<'blue' | 'green'>('blue');
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [stats, setStats] = useState({ v1Requests: 0, v2Requests: 0, errors: 0 });

  // Count pods by version and status
  const podCounts = useMemo(() => {
    const v1Running = pods.filter(p => p.version === 'v1' && (p.status === 'running' || p.status === 'healthy')).length;
    const v2Running = pods.filter(p => p.version === 'v2' && (p.status === 'running' || p.status === 'healthy')).length;
    const starting = pods.filter(p => p.status === 'starting').length;
    const terminating = pods.filter(p => p.status === 'terminating').length;
    return { v1Running, v2Running, starting, terminating };
  }, [pods]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setDeploymentPhase('idle');
    setDeploymentStep(0);
    setCanaryPercentage(0);
    setBlueGreenActive('blue');
    setFeatureEnabled(false);
    setPods([
      { id: 1, version: 'v1', status: 'running' },
      { id: 2, version: 'v1', status: 'running' },
      { id: 3, version: 'v1', status: 'running' },
      { id: 4, version: 'v1', status: 'running' },
    ]);
    setRequests([]);
    setStats({ v1Requests: 0, v2Requests: 0, errors: 0 });
  }, []);

  // Reset when strategy changes
  useEffect(() => {
    reset();
  }, [strategy, reset]);

  // Deployment logic for each strategy
  const executeDeploymentStep = useCallback(() => {
    if (deploymentPhase !== 'deploying') return;

    switch (strategy) {
      case 'recreate': {
        if (deploymentStep === 0) {
          // Step 1: Terminate all v1 pods
          setPods(prev => prev.map(p => ({ ...p, status: 'terminating' as const })));
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          // Step 2: All pods terminated
          setPods([]);
          setDeploymentStep(2);
        } else if (deploymentStep === 2) {
          // Step 3: Start v2 pods
          setPods([
            { id: 5, version: 'v2', status: 'starting' },
            { id: 6, version: 'v2', status: 'starting' },
            { id: 7, version: 'v2', status: 'starting' },
            { id: 8, version: 'v2', status: 'starting' },
          ]);
          setDeploymentStep(3);
        } else if (deploymentStep === 3) {
          // Step 4: All pods healthy
          setPods(prev => prev.map(p => ({ ...p, status: 'running' as const })));
          setDeploymentPhase('complete');
        }
        break;
      }

      case 'rolling': {
        const v1Pods = pods.filter(p => p.version === 'v1' && p.status !== 'terminating');
        const v2Pods = pods.filter(p => p.version === 'v2');
        
        if (v1Pods.length === 0 && v2Pods.every(p => p.status === 'running')) {
          setDeploymentPhase('complete');
        } else if (v1Pods.length > 0) {
          // Replace one v1 pod with v2
          const podToReplace = v1Pods[0];
          setPods(prev => {
            const updated = prev.map(p => 
              p.id === podToReplace.id ? { ...p, status: 'terminating' as const } : p
            );
            // Add new v2 pod
            const newId = Math.max(...prev.map(p => p.id)) + 1;
            return [...updated, { id: newId, version: 'v2' as const, status: 'starting' as const }];
          });
          setDeploymentStep(prev => prev + 1);
        } else {
          // Clean up terminating pods and mark starting as running
          setPods(prev => prev
            .filter(p => p.status !== 'terminating')
            .map(p => p.status === 'starting' ? { ...p, status: 'running' as const } : p)
          );
        }
        break;
      }

      case 'blue-green': {
        if (deploymentStep === 0) {
          // Step 1: Spin up green environment
          setPods(prev => [
            ...prev,
            { id: 5, version: 'v2', status: 'starting' },
            { id: 6, version: 'v2', status: 'starting' },
            { id: 7, version: 'v2', status: 'starting' },
            { id: 8, version: 'v2', status: 'starting' },
          ]);
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          // Step 2: Green ready
          setPods(prev => prev.map(p => 
            p.version === 'v2' ? { ...p, status: 'running' as const } : p
          ));
          setDeploymentStep(2);
        } else if (deploymentStep === 2) {
          // Step 3: Switch traffic to green
          setBlueGreenActive('green');
          setDeploymentStep(3);
        } else if (deploymentStep === 3) {
          // Step 4: Terminate blue (optional, keep for rollback demo)
          setPods(prev => prev.map(p => 
            p.version === 'v1' ? { ...p, status: 'terminating' as const } : p
          ));
          setDeploymentStep(4);
        } else if (deploymentStep === 4) {
          setPods(prev => prev.filter(p => p.version === 'v2'));
          setDeploymentPhase('complete');
        }
        break;
      }

      case 'canary': {
        if (deploymentStep === 0) {
          // Step 1: Deploy 1 canary pod
          setPods(prev => [...prev, { id: 5, version: 'v2', status: 'starting' }]);
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          setPods(prev => prev.map(p => p.id === 5 ? { ...p, status: 'running' as const } : p));
          setCanaryPercentage(25);
          setDeploymentStep(2);
        } else if (deploymentStep === 2) {
          // Step 2: Increase to 50%
          const podToReplace = pods.find(p => p.version === 'v1' && p.status === 'running');
          if (podToReplace) {
            setPods(prev => {
              const updated = prev.map(p => 
                p.id === podToReplace.id ? { ...p, status: 'terminating' as const } : p
              );
              return [...updated, { id: 6, version: 'v2' as const, status: 'starting' as const }];
            });
          }
          setCanaryPercentage(50);
          setDeploymentStep(3);
        } else if (deploymentStep === 3) {
          // Clean up and prepare for 75%
          setPods(prev => prev
            .filter(p => p.status !== 'terminating')
            .map(p => p.status === 'starting' ? { ...p, status: 'running' as const } : p)
          );
          setCanaryPercentage(75);
          setDeploymentStep(4);
        } else if (deploymentStep === 4) {
          // Replace remaining v1 pods
          const v1Pods = pods.filter(p => p.version === 'v1' && p.status === 'running');
          if (v1Pods.length > 0) {
            setPods(prev => {
              let updated = prev.map(p => 
                p.version === 'v1' ? { ...p, status: 'terminating' as const } : p
              );
              // Add remaining v2 pods
              v1Pods.forEach((_, idx) => {
                updated = [...updated, { id: 7 + idx, version: 'v2' as const, status: 'starting' as const }];
              });
              return updated;
            });
          }
          setDeploymentStep(5);
        } else if (deploymentStep === 5) {
          setPods(prev => prev
            .filter(p => p.status !== 'terminating')
            .map(p => ({ ...p, status: 'running' as const }))
          );
          setCanaryPercentage(100);
          setDeploymentPhase('complete');
        }
        break;
      }

      case 'feature-toggle': {
        if (deploymentStep === 0) {
          // Deploy v2 with feature disabled
          setPods([
            { id: 1, version: 'v2', status: 'running', featureFlag: false },
            { id: 2, version: 'v2', status: 'running', featureFlag: false },
            { id: 3, version: 'v2', status: 'running', featureFlag: false },
            { id: 4, version: 'v2', status: 'running', featureFlag: false },
          ]);
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          // Enable feature flag
          setFeatureEnabled(true);
          setPods(prev => prev.map(p => ({ ...p, featureFlag: true })));
          setDeploymentPhase('complete');
        }
        break;
      }
    }
  }, [strategy, deploymentPhase, deploymentStep, pods]);

  // Run deployment steps
  useEffect(() => {
    if (!isRunning || deploymentPhase !== 'deploying') return;
    
    const interval = setInterval(() => {
      executeDeploymentStep();
    }, strategy === 'feature-toggle' ? 1500 : 1200);

    return () => clearInterval(interval);
  }, [isRunning, deploymentPhase, executeDeploymentStep, strategy]);

  // Traffic simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const healthyPods = pods.filter(p => p.status === 'running' || p.status === 'healthy');
      if (healthyPods.length === 0) {
        // No healthy pods - request fails
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        return;
      }

      let targetPod: PodState;

      if (strategy === 'blue-green') {
        // Route based on active environment
        const activePods = healthyPods.filter(p => 
          blueGreenActive === 'blue' ? p.version === 'v1' : p.version === 'v2'
        );
        if (activePods.length === 0) {
          setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          return;
        }
        targetPod = activePods[Math.floor(Math.random() * activePods.length)];
      } else if (strategy === 'canary') {
        // Route based on canary percentage
        const v2Pods = healthyPods.filter(p => p.version === 'v2');
        const v1Pods = healthyPods.filter(p => p.version === 'v1');
        if (Math.random() * 100 < canaryPercentage && v2Pods.length > 0) {
          targetPod = v2Pods[Math.floor(Math.random() * v2Pods.length)];
        } else if (v1Pods.length > 0) {
          targetPod = v1Pods[Math.floor(Math.random() * v1Pods.length)];
        } else {
          targetPod = healthyPods[Math.floor(Math.random() * healthyPods.length)];
        }
      } else {
        // Round robin for other strategies
        targetPod = healthyPods[Math.floor(Math.random() * healthyPods.length)];
      }

      const packetId = `req-${Date.now()}-${Math.random()}`;
      setRequests(prev => [...prev.slice(-10), { 
        id: packetId, 
        targetPod: targetPod.id, 
        version: targetPod.version,
        phase: 'incoming' 
      }]);

      // Update stats
      setStats(prev => ({
        ...prev,
        v1Requests: targetPod.version === 'v1' ? prev.v1Requests + 1 : prev.v1Requests,
        v2Requests: targetPod.version === 'v2' ? prev.v2Requests + 1 : prev.v2Requests,
      }));

      // Animate packet
      setTimeout(() => {
        setRequests(prev => prev.map(r => r.id === packetId ? { ...r, phase: 'routed' } : r));
      }, 200);

      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== packetId));
      }, 600);
    }, 400);

    return () => clearInterval(interval);
  }, [isRunning, pods, strategy, blueGreenActive, canaryPercentage]);

  const startDeployment = () => {
    setIsRunning(true);
    setDeploymentPhase('deploying');
  };

  const toggleRunning = () => {
    if (deploymentPhase === 'idle') {
      startDeployment();
    } else {
      setIsRunning(!isRunning);
    }
  };

  const currentStrategy = STRATEGIES[strategy];
  const v1Pods = pods.filter(p => p.version === 'v1');
  const v2Pods = pods.filter(p => p.version === 'v2');

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Deployment Strategies Simulator</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={isRunning ? 'destructive' : 'default'}
              size="sm"
              onClick={toggleRunning}
              disabled={deploymentPhase === 'complete'}
            >
              {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {deploymentPhase === 'idle' ? 'Deploy' : isRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Strategy Selector */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STRATEGIES) as DeploymentStrategy[]).map((s) => (
            <Button
              key={s}
              variant={strategy === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStrategy(s)}
              disabled={isRunning}
            >
              {STRATEGIES[s].name}
            </Button>
          ))}
        </div>

        {/* Strategy Description */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-1">{currentStrategy.name}</h3>
          <p className="text-sm text-muted-foreground">{currentStrategy.description}</p>
        </div>

        {/* Main Visualization */}
        <div className="relative h-64 rounded-xl bg-slate-900 overflow-hidden">
          {/* Users */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-1">
              <Users className="w-8 h-8 text-slate-400" />
              <span className="text-xs text-slate-400">Traffic</span>
            </div>
          </div>

          {/* Load Balancer */}
          <div className="absolute left-24 top-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-lg bg-purple-600 flex items-center justify-center">
              <span className="text-xs text-white font-medium text-center">Load<br/>Balancer</span>
            </div>
            {strategy === 'canary' && canaryPercentage > 0 && (
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-xs text-amber-400">{canaryPercentage}% → v2</span>
              </div>
            )}
            {strategy === 'blue-green' && (
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className={`text-xs ${blueGreenActive === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>
                  → {blueGreenActive === 'blue' ? 'Blue (v1)' : 'Green (v2)'}
                </span>
              </div>
            )}
          </div>

          {/* Pods Grid */}
          <div className="absolute right-4 top-4 bottom-4 left-48 flex gap-8">
            {/* V1 Pods (Blue) */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs text-blue-400 mb-2 font-medium">
                {strategy === 'blue-green' ? 'Blue Environment' : 'V1 Pods'}
              </span>
              <div className="flex-1 grid grid-cols-2 gap-2 content-start">
                <AnimatePresence mode="popLayout">
                  {v1Pods.map((pod) => (
                    <motion.div
                      key={pod.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`h-14 rounded-lg border-2 ${STATUS_COLORS[pod.status]} bg-blue-500/20 flex flex-col items-center justify-center`}
                    >
                      <Server className="w-5 h-5 text-blue-400" />
                      <span className="text-[10px] text-blue-300">Pod {pod.id}</span>
                      {pod.status === 'terminating' && (
                        <XCircle className="w-3 h-3 text-red-400 absolute" />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* V2 Pods (Green) */}
            <div className="flex-1 flex flex-col">
              <span className="text-xs text-green-400 mb-2 font-medium">
                {strategy === 'blue-green' ? 'Green Environment' : strategy === 'feature-toggle' ? 'V2 Pods (Feature Toggle)' : 'V2 Pods'}
              </span>
              <div className="flex-1 grid grid-cols-2 gap-2 content-start">
                <AnimatePresence mode="popLayout">
                  {v2Pods.map((pod) => (
                    <motion.div
                      key={pod.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`h-14 rounded-lg border-2 ${STATUS_COLORS[pod.status]} bg-green-500/20 flex flex-col items-center justify-center relative`}
                    >
                      <Server className="w-5 h-5 text-green-400" />
                      <span className="text-[10px] text-green-300">Pod {pod.id}</span>
                      {pod.status === 'starting' && (
                        <motion.div 
                          className="absolute inset-0 rounded-lg bg-amber-400/20"
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      )}
                      {strategy === 'feature-toggle' && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${pod.featureFlag ? 'bg-green-500' : 'bg-gray-500'} flex items-center justify-center`}>
                          <Zap className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Request Animation */}
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ x: 60, y: 120, opacity: 1 }}
                animate={{ 
                  x: req.phase === 'incoming' ? 100 : req.phase === 'routed' ? 300 : 300,
                  opacity: req.phase === 'routed' ? 0.5 : 1
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`absolute w-3 h-3 rounded-full ${req.version === 'v1' ? 'bg-blue-400' : 'bg-green-400'}`}
              />
            ))}
          </AnimatePresence>

          {/* Downtime Indicator for Recreate */}
          {strategy === 'recreate' && deploymentPhase === 'deploying' && pods.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-red-900/50 flex items-center justify-center"
            >
              <div className="flex items-center gap-2 text-red-200">
                <AlertCircle className="w-6 h-6" />
                <span className="font-medium">DOWNTIME - No pods available</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-4">
            <span className="text-blue-400">V1 Requests: {stats.v1Requests}</span>
            <span className="text-green-400">V2 Requests: {stats.v2Requests}</span>
            {stats.errors > 0 && <span className="text-red-400">Errors: {stats.errors}</span>}
          </div>
          <div className="flex items-center gap-2">
            {deploymentPhase === 'complete' && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" /> Deployment Complete
              </span>
            )}
            {deploymentPhase === 'deploying' && (
              <span className="flex items-center gap-1 text-amber-400">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
                Deploying...
              </span>
            )}
          </div>
        </div>

        {/* Strategy Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <h4 className="font-medium text-green-400 mb-2">✓ Pros</h4>
            <ul className="space-y-1 text-muted-foreground">
              {currentStrategy.pros.map((pro, i) => (
                <li key={i}>• {pro}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <h4 className="font-medium text-red-400 mb-2">✗ Cons</h4>
            <ul className="space-y-1 text-muted-foreground">
              {currentStrategy.cons.map((con, i) => (
                <li key={i}>• {con}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-medium text-blue-400 mb-2">📌 Use Case</h4>
            <p className="text-muted-foreground">{currentStrategy.useCase}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
