'use client'

/**
 * src/components/simulation/Canvas.tsx
 *
 * React Flow canvas - the drag-and-drop architecture builder.
 *
 * WHY THIS EXISTS:
 * This is where the user physically constructs their architecture.
 * It renders nodes and edges using React Flow, and handles drag-and-drop
 * interactions from the component palette.
 */

import {
  useCallback,
  useMemo,
  useRef,
  type ComponentType,
  type DragEvent,
} from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnConnect,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Database,
  DatabaseZap,
  Globe,
  MessageSquare,
  Network,
  Server,
  Shield,
  Zap,
} from 'lucide-react'
import { getComponentByType } from '@/config/components'
import type {
  CanvasEdge,
  CanvasNode,
  ComponentCategory,
  ComponentDefinition,
} from '@/types'

interface CanvasProps {
  /** Nodes currently on the canvas - managed by parent state */
  nodes: CanvasNode[]
  /** Edges connecting nodes - managed by parent state */
  edges: CanvasEdge[]
  /** Called when user drops, moves, or deletes nodes */
  onNodesChange: (nodes: CanvasNode[]) => void
  /** Called when user connects or deletes edges */
  onEdgesChange: (edges: CanvasEdge[]) => void
  /** Whether simulation is running - prevents structural changes during sim */
  disabled: boolean
}

interface SimulationNodeData {
  /** Infrastructure component definition rendered in this node */
  component: ComponentDefinition
  /** Current load percentage shown in the node load bar */
  loadPercent: number
  /** Whether the load bar should be visible */
  showLoad: boolean
  /** Runtime status used for visual state */
  status: CanvasNode['status']
}

const categoryBorderStyles: Record<ComponentCategory, string> = {
  network: 'border-blue-400',
  compute: 'border-green-400',
  cache: 'border-red-400',
  database: 'border-purple-400',
  cdn: 'border-amber-400',
  queue: 'border-orange-400',
  security: 'border-pink-400',
}

const iconMap: Record<string, ComponentType<{ size?: number }>> = {
  'load-balancer': Network,
  'api-server': Server,
  'redis-cache': Zap,
  'sql-database': Database,
  'nosql-database': DatabaseZap,
  cdn: Globe,
  'message-queue': MessageSquare,
  'rate-limiter': Shield,
}

function loadBarColor(loadPercent: number): string {
  if (loadPercent >= 90) return 'bg-red-500'
  if (loadPercent >= 61) return 'bg-amber-400'
  return 'bg-green-400'
}

/**
 * SimulationNode - custom React Flow node renderer.
 * Renders an infrastructure component with icon, label, category border,
 * and a load percentage bar.
 */
function SimulationNode({ data }: NodeProps<SimulationNodeData>) {
  const Icon = iconMap[data.component.type]

  return (
    <div
      className={`min-w-[140px] rounded-xl border-2 bg-white p-3 shadow-sm dark:bg-slate-800 ${categoryBorderStyles[data.component.category]}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-300">
          {Icon ? <Icon size={16} /> : null}
        </span>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {data.component.label}
        </span>
      </div>
      {data.showLoad ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-1.5 rounded-full ${loadBarColor(data.loadPercent)}`}
              style={{ width: `${Math.min(100, Math.max(0, data.loadPercent))}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs text-[var(--text-secondary)]">
            {Math.round(data.loadPercent)}%
          </span>
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = {
  simulation: SimulationNode,
}

function toCanvasEdge(edge: Edge): CanvasEdge {
  return {
    id: edge.id,
    fromInstanceId: edge.source,
    toInstanceId: edge.target,
  }
}

function toReactFlowNode(node: CanvasNode): Node<SimulationNodeData> | null {
  const component = getComponentByType(node.type)
  if (!component) return null

  return {
    id: node.instanceId,
    type: 'simulation',
    position: node.position,
    data: {
      component,
      loadPercent: node.loadPercent,
      showLoad: node.status !== 'idle',
      status: node.status,
    },
  }
}

function toReactFlowEdge(edge: CanvasEdge): Edge {
  return {
    id: edge.id,
    source: edge.fromInstanceId,
    target: edge.toInstanceId,
    markerEnd: { type: MarkerType.ArrowClosed },
  }
}

function CanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  disabled,
}: CanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  const flowNodes = useMemo(
    () => nodes.map(toReactFlowNode).filter((node): node is Node<SimulationNodeData> => Boolean(node)),
    [nodes],
  )
  const flowEdges = useMemo(() => edges.map(toReactFlowEdge), [edges])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (disabled) return

      const changedNodes = applyNodeChanges(changes, flowNodes)
      const nextNodes = changedNodes
        .map((flowNode) => {
          const current = nodes.find((node) => node.instanceId === flowNode.id)
          if (!current) return null

          return {
            ...current,
            position: flowNode.position,
          }
        })
        .filter((node): node is CanvasNode => Boolean(node))

      const keptIds = new Set(nextNodes.map((node) => node.instanceId))
      onNodesChange(nextNodes)
      onEdgesChange(
        edges.filter(
          (edge) =>
            keptIds.has(edge.fromInstanceId) && keptIds.has(edge.toInstanceId),
        ),
      )
    },
    [disabled, edges, flowNodes, nodes, onEdgesChange, onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (disabled) return

      const changedEdges = applyEdgeChanges(changes, flowEdges)
      onEdgesChange(changedEdges.map(toCanvasEdge))
    },
    [disabled, flowEdges, onEdgesChange],
  )

  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (disabled || !connection.source || !connection.target) return

      const nextEdges = addEdge(
        {
          ...connection,
          id: `${connection.source}-${connection.target}-${Date.now()}`,
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        flowEdges,
      )

      onEdgesChange(nextEdges.map(toCanvasEdge))
    },
    [disabled, flowEdges, onEdgesChange],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (disabled) return

      const componentType = event.dataTransfer.getData('componentType')
      if (!componentType) return

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newNode: CanvasNode = {
        instanceId: `${componentType}-${Date.now()}`,
        type: componentType,
        position,
        currentLoadRps: 0,
        loadPercent: 0,
        status: 'idle',
      }

      onNodesChange([...nodes, newNode])
    },
    [disabled, nodes, onNodesChange, reactFlowInstance],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div
      ref={reactFlowWrapper}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="h-full flex-1 bg-slate-100 dark:bg-slate-900"
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={!disabled}
        nodesConnectable={!disabled}
        elementsSelectable={!disabled}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = (node.data as SimulationNodeData | undefined)?.status
            if (status === 'warning') return '#fbbf24'
            if (status === 'overloaded') return '#f87171'
            return '#4ade80'
          }}
        />
      </ReactFlow>
    </div>
  )
}

export default function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
