'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  RotateCcw,
  Server,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DeploymentStrategy =
  | 'recreate'
  | 'rolling'
  | 'blue-green'
  | 'canary'
  | 'feature-toggle';

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
  phase: 'to-lb' | 'to-pod' | 'done';
}

const STRATEGIES: Record<
  DeploymentStrategy,
  {
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    useCase: string;
  }
> = {
  recreate: {
    name: 'Recreate',
    description:
      'Terminate all v1 pods, then start all v2 pods. Simple but causes downtime.',
    pros: [
      'Simple to implement',
      'Clean state - no version mixing',
      'Lower resource cost',
    ],
    cons: [
      'Downtime during deployment',
      'No rollback without redeployment',
      'All-or-nothing risk',
    ],
    useCase: 'Development environments, stateful apps requiring clean restarts',
  },
  rolling: {
    name: 'Rolling Update',
    description:
      'Gradually replace v1 pods with v2, one at a time. Zero downtime.',
    pros: ['Zero downtime', 'Gradual rollout', 'Easy rollback'],
    cons: [
      'Temporary version mixing',
      'Slower deployment',
      'Requires backward compatibility',
    ],
    useCase: 'Most production deployments, Kubernetes default strategy',
  },
  'blue-green': {
    name: 'Blue-Green',
    description:
      'Run two identical environments. Switch traffic instantly from blue (v1) to green (v2).',
    pros: ['Instant rollback', 'Zero downtime', 'Full testing before switch'],
    cons: [
      'Double infrastructure cost',
      'Database migrations complex',
      'Resource intensive',
    ],
    useCase: 'Critical applications, when instant rollback is essential',
  },
  canary: {
    name: 'Canary',
    description:
      'Route a small percentage of traffic to v2, gradually increase if healthy.',
    pros: ['Minimal blast radius', 'Real user testing', 'Data-driven rollout'],
    cons: [
      'Complex traffic management',
      'Longer deployment time',
      'Requires good monitoring',
    ],
    useCase: 'High-traffic services, A/B testing, gradual feature rollout',
  },
  'feature-toggle': {
    name: 'Feature Toggles',
    description:
      'Deploy code with features disabled, enable via configuration flags.',
    pros: [
      'Decouple deploy from release',
      'Per-user/segment targeting',
      'Instant toggle',
    ],
    cons: [
      'Technical debt if not cleaned',
      'Testing complexity',
      'Code branching overhead',
    ],
    useCase: 'Trunk-based development, gradual feature rollout, A/B testing',
  },
};

const STATUS_COLORS: Record<string, string> = {
  running: 'border-emerald-500',
  healthy: 'border-emerald-500',
  starting: 'border-amber-500',
  terminating: 'border-red-500',
  unhealthy: 'border-red-500',
};

// Pod positions as percentages - used for both pod rendering AND request animation
// This ensures packets always animate to the exact pod location
const getPodPosition = (idx: number): { x: number; y: number } => {
  // Grid layout: 2 rows, 4 columns max
  // Pods area spans from ~40% to ~95% horizontally
  // Row 0 at ~30%, Row 1 at ~70%
  const col = idx % 4;
  const row = Math.floor(idx / 4);
  const x = 48 + col * 13; // 48%, 61%, 74%, 87%
  const y = row === 0 ? 30 : 70;
  return { x, y };
};

export default function DeploymentStrategiesSimulator() {
  const [strategy, setStrategy] = useState<DeploymentStrategy>('rolling');
  const [isRunning, setIsRunning] = useState(false);
  const [deploymentPhase, setDeploymentPhase] = useState<
    'idle' | 'deploying' | 'complete'
  >('idle');
  const [pods, setPods] = useState<PodState[]>([
    { id: 1, version: 'v1', status: 'running' },
    { id: 2, version: 'v1', status: 'running' },
    { id: 3, version: 'v1', status: 'running' },
    { id: 4, version: 'v1', status: 'running' },
  ]);
  const [requests, setRequests] = useState<RequestPacket[]>([]);
  const [canaryPercentage, setCanaryPercentage] = useState(0);
  const [blueGreenActive, setBlueGreenActive] = useState<'blue' | 'green'>(
    'blue'
  );
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [stats, setStats] = useState({ v1Requests: 0, v2Requests: 0, errors: 0 });

  const reset = useCallback(() => {
    setIsRunning(false);
    setDeploymentPhase('idle');
    setDeploymentStep(0);
    setCanaryPercentage(0);
    setBlueGreenActive('blue');
    setPods([
      { id: 1, version: 'v1', status: 'running' },
      { id: 2, version: 'v1', status: 'running' },
      { id: 3, version: 'v1', status: 'running' },
      { id: 4, version: 'v1', status: 'running' },
    ]);
    setRequests([]);
    setStats({ v1Requests: 0, v2Requests: 0, errors: 0 });
  }, []);

  useEffect(() => {
    reset();
  }, [strategy, reset]);

  // Deployment logic for each strategy
  const executeDeploymentStep = useCallback(() => {
    if (deploymentPhase !== 'deploying') return;

    switch (strategy) {
      case 'recreate': {
        if (deploymentStep === 0) {
          setPods((prev) =>
            prev.map((p) => ({ ...p, status: 'terminating' as const }))
          );
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          setPods([]);
          setDeploymentStep(2);
        } else if (deploymentStep === 2) {
          setPods([
            { id: 5, version: 'v2', status: 'starting' },
            { id: 6, version: 'v2', status: 'starting' },
            { id: 7, version: 'v2', status: 'starting' },
            { id: 8, version: 'v2', status: 'starting' },
          ]);
          setDeploymentStep(3);
        } else if (deploymentStep === 3) {
          setPods((prev) =>
            prev.map((p) => ({ ...p, status: 'running' as const }))
          );
          setDeploymentPhase('complete');
        }
        break;
      }

      case 'rolling': {
        const v1Pods = pods.filter(
          (p) => p.version === 'v1' && p.status !== 'terminating'
        );
        const v2Pods = pods.filter((p) => p.version === 'v2');

        if (v1Pods.length === 0 && v2Pods.every((p) => p.status === 'running')) {
          setDeploymentPhase('complete');
        } else if (v1Pods.length > 0) {
          const podToReplace = v1Pods[0];
          setPods((prev) => {
            const updated = prev.map((p) =>
              p.id === podToReplace.id
                ? { ...p, status: 'terminating' as const }
                : p
            );
            const newId = Math.max(...prev.map((p) => p.id)) + 1;
            return [
              ...updated,
              { id: newId, version: 'v2' as const, status: 'starting' as const },
            ];
          });
          setDeploymentStep((prev) => prev + 1);
        } else {
          setPods((prev) =>
            prev
              .filter((p) => p.status !== 'terminating')
              .map((p) =>
                p.status === 'starting'
                  ? { ...p, status: 'running' as const }
                  : p
              )
          );
        }
        break;
      }

      case 'blue-green': {
        if (deploymentStep === 0) {
          setPods((prev) => [
            ...prev,
            { id: 5, version: 'v2', status: 'starting' },
            { id: 6, version: 'v2', status: 'starting' },
            { id: 7, version: 'v2', status: 'starting' },
            { id: 8, version: 'v2', status: 'starting' },
          ]);
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          setPods((prev) =>
            prev.map((p) =>
              p.version === 'v2' ? { ...p, status: 'running' as const } : p
            )
          );
          setDeploymentStep(2);
        } else if (deploymentStep === 2) {
          setBlueGreenActive('green');
          setDeploymentStep(3);
        } else if (deploymentStep === 3) {
          setPods((prev) =>
            prev.map((p) =>
              p.version === 'v1' ? { ...p, status: 'terminating' as const } : p
            )
          );
          setDeploymentStep(4);
        } else if (deploymentStep === 4) {
          setPods((prev) => prev.filter((p) => p.version === 'v2'));
          setDeploymentPhase('complete');
        }
        break;
      }

      case 'canary': {
        if (deploymentStep === 0) {
          setPods((prev) => [
            ...prev,
            { id: 5, version: 'v2', status: 'starting' },
          ]);
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          setPods((prev) =>
            prev.map((p) =>
              p.id === 5 ? { ...p, status: 'running' as const } : p
            )
          );
          setCanaryPercentage(25);
          setDeploymentStep(2);
        } else if (deploymentStep === 2) {
          const podToReplace = pods.find(
            (p) => p.version === 'v1' && p.status === 'running'
          );
          if (podToReplace) {
            setPods((prev) => {
              const updated = prev.map((p) =>
                p.id === podToReplace.id
                  ? { ...p, status: 'terminating' as const }
                  : p
              );
              return [
                ...updated,
                { id: 6, version: 'v2' as const, status: 'starting' as const },
              ];
            });
          }
          setCanaryPercentage(50);
          setDeploymentStep(3);
        } else if (deploymentStep === 3) {
          setPods((prev) =>
            prev
              .filter((p) => p.status !== 'terminating')
              .map((p) =>
                p.status === 'starting'
                  ? { ...p, status: 'running' as const }
                  : p
              )
          );
          setCanaryPercentage(75);
          setDeploymentStep(4);
        } else if (deploymentStep === 4) {
          const v1Pods = pods.filter(
            (p) => p.version === 'v1' && p.status === 'running'
          );
          if (v1Pods.length > 0) {
            setPods((prev) => {
              let updated = prev.map((p) =>
                p.version === 'v1' ? { ...p, status: 'terminating' as const } : p
              );
              v1Pods.forEach((_, idx) => {
                updated = [
                  ...updated,
                  {
                    id: 7 + idx,
                    version: 'v2' as const,
                    status: 'starting' as const,
                  },
                ];
              });
              return updated;
            });
          }
          setDeploymentStep(5);
        } else if (deploymentStep === 5) {
          setPods((prev) =>
            prev
              .filter((p) => p.status !== 'terminating')
              .map((p) => ({ ...p, status: 'running' as const }))
          );
          setCanaryPercentage(100);
          setDeploymentPhase('complete');
        }
        break;
      }

      case 'feature-toggle': {
        if (deploymentStep === 0) {
          setPods([
            { id: 1, version: 'v2', status: 'running', featureFlag: false },
            { id: 2, version: 'v2', status: 'running', featureFlag: false },
            { id: 3, version: 'v2', status: 'running', featureFlag: false },
            { id: 4, version: 'v2', status: 'running', featureFlag: false },
          ]);
          setDeploymentStep(1);
        } else if (deploymentStep === 1) {
          setPods((prev) => prev.map((p) => ({ ...p, featureFlag: true })));
          setDeploymentPhase('complete');
        }
        break;
      }
    }
  }, [strategy, deploymentPhase, deploymentStep, pods]);

  useEffect(() => {
    if (!isRunning || deploymentPhase !== 'deploying') return;

    const interval = setInterval(
      () => {
        executeDeploymentStep();
      },
      strategy === 'feature-toggle' ? 1500 : 1200
    );

    return () => clearInterval(interval);
  }, [isRunning, deploymentPhase, executeDeploymentStep, strategy]);

  // Create stable pod index mapping so requests can find their target
  const podIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    pods.forEach((pod, idx) => {
      map.set(pod.id, idx);
    });
    return map;
  }, [pods]);

  // Traffic simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const healthyPods = pods.filter(
        (p) => p.status === 'running' || p.status === 'healthy'
      );
      if (healthyPods.length === 0) {
        setStats((prev) => ({ ...prev, errors: prev.errors + 1 }));
        return;
      }

      let targetPod: PodState;

      if (strategy === 'blue-green') {
        const activePods = healthyPods.filter((p) =>
          blueGreenActive === 'blue' ? p.version === 'v1' : p.version === 'v2'
        );
        if (activePods.length === 0) {
          setStats((prev) => ({ ...prev, errors: prev.errors + 1 }));
          return;
        }
        targetPod = activePods[Math.floor(Math.random() * activePods.length)];
      } else if (strategy === 'canary') {
        const v2Pods = healthyPods.filter((p) => p.version === 'v2');
        const v1Pods = healthyPods.filter((p) => p.version === 'v1');
        if (Math.random() * 100 < canaryPercentage && v2Pods.length > 0) {
          targetPod = v2Pods[Math.floor(Math.random() * v2Pods.length)];
        } else if (v1Pods.length > 0) {
          targetPod = v1Pods[Math.floor(Math.random() * v1Pods.length)];
        } else {
          targetPod = healthyPods[Math.floor(Math.random() * healthyPods.length)];
        }
      } else {
        targetPod = healthyPods[Math.floor(Math.random() * healthyPods.length)];
      }

      const packetId = `req-${Date.now()}-${Math.random()}`;
      setRequests((prev) => [
        ...prev.slice(-8),
        {
          id: packetId,
          targetPod: targetPod.id,
          version: targetPod.version,
          phase: 'to-lb',
        },
      ]);

      setStats((prev) => ({
        ...prev,
        v1Requests:
          targetPod.version === 'v1' ? prev.v1Requests + 1 : prev.v1Requests,
        v2Requests:
          targetPod.version === 'v2' ? prev.v2Requests + 1 : prev.v2Requests,
      }));

      setTimeout(() => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === packetId ? { ...r, phase: 'to-pod' as const } : r
          )
        );
      }, 150);

      setTimeout(() => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === packetId ? { ...r, phase: 'done' as const } : r
          )
        );
      }, 350);

      setTimeout(() => {
        setRequests((prev) => prev.filter((r) => r.id !== packetId));
      }, 500);
    }, 350);

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

  // Calculate positions for request animation - uses same function as pod rendering
  const getRequestPosition = useCallback(
    (req: RequestPacket) => {
      const podIndex = podIndexMap.get(req.targetPod) ?? 0;
      const podPos = getPodPosition(podIndex);

      switch (req.phase) {
        case 'to-lb':
          return { x: 22, y: 50 };
        case 'to-pod':
          return { x: podPos.x, y: podPos.y };
        case 'done':
          return { x: podPos.x + 2, y: podPos.y };
        default:
          return { x: 5, y: 50 };
      }
    },
    [podIndexMap]
  );

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            Deployment Strategies Simulator
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={isRunning ? 'destructive' : 'default'}
              size="sm"
              onClick={toggleRunning}
              disabled={deploymentPhase === 'complete'}
            >
              {isRunning ? (
                <Pause className="w-4 h-4 mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {deploymentPhase === 'idle'
                ? 'Deploy'
                : isRunning
                  ? 'Pause'
                  : 'Resume'}
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
          <p className="text-sm text-muted-foreground">
            {currentStrategy.description}
          </p>
        </div>

        {/* Main Visualization */}
        <div className="relative h-56 rounded-xl bg-slate-900 overflow-hidden">
          {/* Users */}
          <div className="absolute left-[3%] top-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-1">
              <Users className="w-7 h-7 text-slate-400" />
              <span className="text-[10px] text-slate-500">Traffic</span>
            </div>
          </div>

          {/* Load Balancer */}
          <div className="absolute left-[15%] top-1/2 -translate-y-1/2">
            <div className="w-14 h-14 rounded-lg bg-purple-600 flex items-center justify-center">
              <span className="text-[10px] text-white font-medium text-center">
                Load
                <br />
                Balancer
              </span>
            </div>
            {strategy === 'canary' && canaryPercentage > 0 && (
              <div className="absolute -bottom-5 left-0 right-0 text-center">
                <span className="text-[10px] text-amber-400">
                  {canaryPercentage}% → v2
                </span>
              </div>
            )}
            {strategy === 'blue-green' && (
              <div className="absolute -bottom-5 left-0 right-0 text-center">
                <span
                  className={`text-[10px] ${
                    blueGreenActive === 'blue'
                      ? 'text-blue-400'
                      : 'text-green-400'
                  }`}
                >
                  → {blueGreenActive === 'blue' ? 'Blue' : 'Green'}
                </span>
              </div>
            )}
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* User to LB */}
            <line
              x1="10%"
              y1="50%"
              x2="15%"
              y2="50%"
              stroke="#475569"
              strokeWidth="2"
              strokeDasharray="4"
            />
            {/* LB to pods - use same getPodPosition function */}
            {pods.map((pod, idx) => {
              const pos = getPodPosition(idx);
              return (
                <line
                  key={pod.id}
                  x1="27%"
                  y1="50%"
                  x2={`${pos.x}%`}
                  y2={`${pos.y}%`}
                  stroke={pod.version === 'v1' ? '#3b82f6' : '#22c55e'}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
              );
            })}
          </svg>

          {/* Pods - positioned using getPodPosition */}
          <AnimatePresence mode="popLayout">
            {pods.map((pod, idx) => {
              const pos = getPodPosition(idx);
              return (
                <motion.div
                  key={pod.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-lg border-2 ${STATUS_COLORS[pod.status]}
                    ${pod.version === 'v1' ? 'bg-blue-500/20' : 'bg-green-500/20'}
                    flex flex-col items-center justify-center`}
                >
                  <Server
                    className={`w-4 h-4 ${
                      pod.version === 'v1' ? 'text-blue-400' : 'text-green-400'
                    }`}
                  />
                  <span
                    className={`text-[9px] ${
                      pod.version === 'v1' ? 'text-blue-300' : 'text-green-300'
                    }`}
                  >
                    {pod.version.toUpperCase()}
                  </span>
                  {pod.status === 'terminating' && (
                    <XCircle className="w-3 h-3 text-red-400 absolute -top-1 -right-1" />
                  )}
                  {pod.status === 'starting' && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-amber-400/30"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  )}
                  {strategy === 'feature-toggle' && (
                    <div
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        pod.featureFlag ? 'bg-green-500' : 'bg-gray-500'
                      } flex items-center justify-center`}
                    >
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Request Animation */}
          <AnimatePresence>
            {requests.map((req) => {
              const pos = getRequestPosition(req);
              return (
                <motion.div
                  key={req.id}
                  initial={{ left: '5%', top: '50%', opacity: 1 }}
                  animate={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    opacity: req.phase === 'done' ? 0.3 : 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2
                    ${req.version === 'v1' ? 'bg-blue-400 shadow-blue-400/50' : 'bg-green-400 shadow-green-400/50'}
                    shadow-lg`}
                />
              );
            })}
          </AnimatePresence>

          {/* Downtime Indicator */}
          {strategy === 'recreate' &&
            deploymentPhase === 'deploying' &&
            pods.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-red-900/60 flex items-center justify-center"
              >
                <div className="flex items-center gap-2 text-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium text-sm">DOWNTIME</span>
                </div>
              </motion.div>
            )}

          {/* Legend */}
          <div className="absolute bottom-2 right-2 flex gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-blue-400">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> V1
            </span>
            <span className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> V2
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-4">
            <span className="text-blue-400">V1: {stats.v1Requests}</span>
            <span className="text-green-400">V2: {stats.v2Requests}</span>
            {stats.errors > 0 && (
              <span className="text-red-400">Errors: {stats.errors}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {deploymentPhase === 'complete' && (
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Complete
              </span>
            )}
            {deploymentPhase === 'deploying' && (
              <span className="flex items-center gap-1 text-amber-400 text-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
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
            <ul className="space-y-1 text-muted-foreground text-xs">
              {currentStrategy.pros.map((pro, i) => (
                <li key={i}>• {pro}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <h4 className="font-medium text-red-400 mb-2">✗ Cons</h4>
            <ul className="space-y-1 text-muted-foreground text-xs">
              {currentStrategy.cons.map((con, i) => (
                <li key={i}>• {con}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-medium text-blue-400 mb-2">📌 Use Case</h4>
            <p className="text-muted-foreground text-xs">
              {currentStrategy.useCase}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
