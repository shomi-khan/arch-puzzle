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
  useEffect,
  useMemo,
  useRef,
  useState,
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
} from '@/types'

interface CanvasProps {
  /** Nodes currently on the canvas - managed by parent state */
  nodes: CanvasNode[]
  /** Edges connecting nodes - managed by parent state */
  edges: CanvasEdge[]
  /** Called with the full node array on real architecture edits */
  onNodesChange: (nodes: CanvasNode[]) => void
  /** Called when user connects or deletes edges */
  onEdgesChange: (edges: CanvasEdge[]) => void
  /** Whether simulation is running - prevents structural changes during sim */
  disabled: boolean
}

interface SimulationNodeData {
  /** Canvas node state rendered by the custom React Flow node */
  node: CanvasNode
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
  const component = getComponentByType(data.node.type)
  if (!component) return null

  const Icon = iconMap[component.type]

  return (
    <div
      className={`min-w-[140px] rounded-xl border-2 bg-white p-3 shadow-sm dark:bg-slate-800 ${categoryBorderStyles[component.category]}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-300">
          {Icon ? <Icon size={16} /> : null}
        </span>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {component.label}
        </span>
      </div>
      {data.node.status !== 'idle' ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-1.5 rounded-full ${loadBarColor(data.node.loadPercent)}`}
              style={{
                width: `${Math.min(100, Math.max(0, data.node.loadPercent))}%`,
              }}
            />
          </div>
          <span className="w-8 text-right text-xs text-[var(--text-secondary)]">
            {Math.round(data.node.loadPercent)}%
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

function toFlowNode(node: CanvasNode): Node<SimulationNodeData> | null {
  const component = getComponentByType(node.type)
  if (!component) return null

  return {
    id: node.instanceId,
    type: 'simulation',
    position: node.position,
    data: { node },
  }
}

function toFlowNodes(nodes: CanvasNode[]): Node<SimulationNodeData>[] {
  return nodes
    .map(toFlowNode)
    .filter((node): node is Node<SimulationNodeData> => Boolean(node))
}

function toCanvasNodes(nodes: Node<SimulationNodeData>[]): CanvasNode[] {
  return nodes.map((node) => ({
    ...node.data.node,
    position: node.position,
  }))
}

/**
 * hasRuntimeNodeChanges - detects engine-driven visual updates from parent state.
 */
function hasRuntimeNodeChanges(
  flowNodes: Node<SimulationNodeData>[],
  nodes: CanvasNode[],
): boolean {
  if (flowNodes.length !== nodes.length) return false

  return flowNodes.some((flowNode) => {
    const nextNode = nodes.find((node) => node.instanceId === flowNode.id)
    if (!nextNode) return false

    return (
      nextNode.loadPercent !== flowNode.data.node.loadPercent ||
      nextNode.currentLoadRps !== flowNode.data.node.currentLoadRps ||
      nextNode.status !== flowNode.data.node.status
    )
  })
}

/**
 * mergeRuntimeNodeState - keeps React Flow positions while refreshing node data.
 */
function mergeRuntimeNodeState(
  flowNodes: Node<SimulationNodeData>[],
  nodes: CanvasNode[],
): Node<SimulationNodeData>[] {
  return flowNodes.map((flowNode) => {
    const nextNode = nodes.find((node) => node.instanceId === flowNode.id)
    if (!nextNode) return flowNode

    return {
      ...flowNode,
      data: {
        node: {
          ...nextNode,
          position: flowNode.position,
        },
      },
    }
  })
}

function toReactFlowEdge(edge: CanvasEdge): Edge {
  return {
    id: edge.id,
    source: edge.fromInstanceId,
    target: edge.toInstanceId,
    markerEnd: { type: MarkerType.ArrowClosed },
  }
}

/**
 * CanvasInner - React Flow canvas implementation that owns local node state.
 */
function CanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  disabled,
}: CanvasProps) {
  const reactFlowInstance = useReactFlow()
  const [flowNodes, setFlowNodes] =
    useState<Node<SimulationNodeData>[]>(() => toFlowNodes(nodes))
  const flowNodesRef = useRef<Node<SimulationNodeData>[]>(flowNodes)

  const flowEdges = useMemo(() => edges.map(toReactFlowEdge), [edges])

  useEffect(() => {
    if (nodes.length === 0 && flowNodes.length > 0) {
      flowNodesRef.current = []
      setFlowNodes([])
      return
    }

    if (hasRuntimeNodeChanges(flowNodes, nodes)) {
      const updated = mergeRuntimeNodeState(flowNodes, nodes)
      flowNodesRef.current = updated
      setFlowNodes(updated)
    }
  }, [flowNodes, nodes])

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (disabled) return

      const updated = applyNodeChanges(changes, flowNodesRef.current)
      flowNodesRef.current = updated
      setFlowNodes(updated)

      const isArchitectureChange = changes.some(
        (change) =>
          change.type === 'remove' ||
          (change.type === 'position' && change.dragging === false),
      )
      if (!isArchitectureChange) return

      const nextNodes = toCanvasNodes(updated)
      const keptIds = new Set(nextNodes.map((node) => node.instanceId))

      onNodesChange(nextNodes)
      onEdgesChange(
        edges.filter(
          (edge) =>
            keptIds.has(edge.fromInstanceId) && keptIds.has(edge.toInstanceId),
        ),
      )
    },
    [disabled, edges, onEdgesChange, onNodesChange],
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

      const component = getComponentByType(componentType)
      if (!component) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: CanvasNode = {
        instanceId: `${componentType}-${Date.now()}`,
        type: componentType,
        position,
        currentLoadRps: 0,
        loadPercent: 0,
        status: 'idle',
      }

      const newFlowNode = toFlowNode(newNode)
      if (!newFlowNode) return

      const updated = [...flowNodesRef.current, newFlowNode]
      flowNodesRef.current = updated
      setFlowNodes(updated)
      onNodesChange(toCanvasNodes(updated))
    },
    [disabled, onNodesChange, reactFlowInstance],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div
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
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = (node.data as SimulationNodeData | undefined)?.node
              .status
            if (status === 'warning') return '#fbbf24'
            if (status === 'overloaded') return '#f87171'
            return '#4ade80'
          }}
        />
      </ReactFlow>
    </div>
  )
}

/**
 * Canvas - provider wrapper for the React Flow architecture builder.
 */
export default function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
