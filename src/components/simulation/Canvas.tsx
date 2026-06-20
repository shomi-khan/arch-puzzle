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
  network: '#378ADD',
  compute: '#4ade80',
  cache: '#ef4444',
  database: '#a78bfa',
  cdn: '#f59e0b',
  queue: '#fb923c',
  security: '#ec4899',
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
  if (loadPercent >= 90) return '#ef4444'
  if (loadPercent >= 61) return '#fbbf24'
  return '#4ade80'
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
  const borderColor = categoryBorderStyles[component.category]

  return (
    <div
      style={{
        minWidth: '120px',
        borderRadius: '0.375rem',
        backgroundColor: '#0f172a',
        border: `1.5px solid ${borderColor}`,
        padding: '0.75rem',
        fontFamily: 'monospace',
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>
          {Icon ? <Icon size={13} /> : null}
        </span>
        <span style={{ fontSize: '11px', color: '#e2e8f0', textTransform: 'lowercase' }}>
          {component.label}
        </span>
      </div>
      {data.node.status !== 'idle' && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ height: '0.25rem', borderRadius: '9999px', backgroundColor: '#1e293b', overflow: 'hidden' }}>
            <div
              style={{
                height: '0.25rem',
                borderRadius: '9999px',
                backgroundColor: loadBarColor(data.node.loadPercent),
                width: `${Math.min(100, Math.max(0, data.node.loadPercent))}%`,
                transition: 'width 500ms',
              }}
            />
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
            {Math.round(data.node.loadPercent)}% · {data.node.status}
          </span>
        </div>
      )}
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
      style={{
        height: '100%',
        flex: 1,
        backgroundColor: '#060b14',
      }}
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
        defaultEdgeOptions={{
          style: { stroke: '#334155', strokeWidth: 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
        }}
      >
        <Background color="#1e293b" />
        <Controls />
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
