import React, { memo, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  type Connection,
  type Edge,
  type Node,
  type NodeDragHandler,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './role-graph-editor.css';

type GraphMode = 'move' | 'remove-link';

type TaskNodeModel = {
  id: string;
  kind: 'task';
  position: { x: number; y: number };
  taskId: string;
  title: string;
  sourceLabel: string;
  baselineShare: number;
  shareOverride: string;
  taskLinkCount: number;
  functionLabels: Array<{ functionId: string; label: string; isCustom: boolean }>;
};

type FunctionNodeModel = {
  id: string;
  kind: 'function';
  position: { x: number; y: number };
  functionId: string;
  title: string;
  supportCount: number;
};

type GraphEdgeModel = {
  id: string;
  source: string;
  target: string;
  kind: 'task' | 'function';
  custom: boolean;
};

type RoleGraphRenderState = {
  nodes: Array<TaskNodeModel | FunctionNodeModel>;
  edges: GraphEdgeModel[];
  mode: GraphMode;
};

type RoleGraphCallbacks = {
  onTaskRemove: (taskId: string) => void;
  onFunctionRemove: (functionId: string) => void;
  onTaskShareChange: (taskId: string, value: string) => void;
  onConnect: (connection: Connection) => void;
  onCustomEdgeRemove: (edgeId: string) => void;
  onNodePositionChange: (nodeId: string, position: { x: number; y: number }) => void;
};

type TaskNodeData = TaskNodeModel & Pick<RoleGraphCallbacks, 'onTaskRemove' | 'onTaskShareChange'>;
type FunctionNodeData = FunctionNodeModel & Pick<RoleGraphCallbacks, 'onFunctionRemove'>;

const truncate = (value: string, maxLength: number) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'Unknown';
  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
};

const TaskNode = memo(({ data }: NodeProps<Node<TaskNodeData>>) => {
  return (
    <div className="v2-rf-node v2-rf-node--task">
      <Handle className="v2-rf-handle" type="target" position={Position.Left} />
      <Handle className="v2-rf-handle" type="source" position={Position.Right} />
      <div className="v2-rf-node-header">
        <div className="v2-flow-badge">{data.sourceLabel || 'Task'}</div>
        <button type="button" className="v2-rf-remove" onClick={() => data.onTaskRemove(data.taskId)}>
          Remove
        </button>
      </div>
      <div className="v2-rf-node-title" title={data.title}>
        {truncate(data.title, 92)}
      </div>
      <div className="v2-rf-node-stats">
        {data.taskLinkCount} task link{data.taskLinkCount === 1 ? '' : 's'} · {data.functionLabels.length} function link
        {data.functionLabels.length === 1 ? '' : 's'}
      </div>
      <label className="v2-rf-share">
        <span>Share</span>
        <select
          className="v2-rf-select"
          value={data.shareOverride}
          onChange={(event) => data.onTaskShareChange(data.taskId, event.target.value)}
        >
          <option value="">Baseline ({data.baselineShare}%)</option>
          <option value="0.05">5%</option>
          <option value="0.10">10%</option>
          <option value="0.15">15%</option>
          <option value="0.20">20%</option>
          <option value="0.25">25%</option>
          <option value="0.30">30%</option>
        </select>
      </label>
      <div className="v2-rf-links">
        {data.functionLabels.length ? (
          data.functionLabels.map((entry) => (
            <div className="v2-rf-link-pill" key={`${data.taskId}:${entry.functionId}`}>
              {truncate(entry.label, 32)}
            </div>
          ))
        ) : (
          <div className="v2-rf-node-hint">No function link yet.</div>
        )}
      </div>
    </div>
  );
});

const FunctionNode = memo(({ data }: NodeProps<Node<FunctionNodeData>>) => {
  return (
    <div className="v2-rf-node v2-rf-node--function">
      <Handle className="v2-rf-handle" type="target" position={Position.Left} />
      <div className="v2-rf-node-header">
        <div className="v2-rf-node-chip">Function</div>
        <button type="button" className="v2-rf-remove" onClick={() => data.onFunctionRemove(data.functionId)}>
          Remove
        </button>
      </div>
      <div className="v2-rf-node-title" title={data.title}>
        {truncate(data.title, 74)}
      </div>
      <div className="v2-rf-node-hint">
        {data.supportCount} supporting task{data.supportCount === 1 ? '' : 's'}
      </div>
    </div>
  );
});

const nodeTypes = {
  task: TaskNode,
  function: FunctionNode,
};

function RoleGraphCanvas({
  state,
  callbacks,
}: {
  state: RoleGraphRenderState;
  callbacks: RoleGraphCallbacks;
}) {
  const nodes = useMemo<Array<Node>>(
    () =>
      state.nodes.map((node) => {
        if (node.kind === 'task') {
          return {
            id: node.id,
            type: 'task',
            position: node.position,
            data: {
              ...node,
              onTaskRemove: callbacks.onTaskRemove,
              onTaskShareChange: callbacks.onTaskShareChange,
            },
          };
        }
        return {
          id: node.id,
          type: 'function',
          position: node.position,
          data: {
            ...node,
            onFunctionRemove: callbacks.onFunctionRemove,
          },
        };
      }),
    [callbacks.onFunctionRemove, callbacks.onTaskRemove, callbacks.onTaskShareChange, state.nodes]
  );

  const edges = useMemo<Array<Edge>>(
    () =>
      state.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        markerEnd: { type: MarkerType.ArrowClosed },
        className: edge.kind === 'task'
          ? edge.custom ? 'v2-rf-edge--custom-task' : 'v2-rf-edge--default-task'
          : edge.custom ? 'v2-rf-edge--custom-function' : 'v2-rf-edge--default-function',
        data: {
          custom: edge.custom,
        },
      })),
    [state.edges]
  );

  const onNodeDragStop: NodeDragHandler = (_event, node) => {
    callbacks.onNodePositionChange(node.id, node.position);
  };

  if (!nodes.length) {
    return <div className="v2-rf-empty">Waiting for a mapped role.</div>;
  }

  return (
    <div className="v2-rf-shell">
      <ReactFlow
        className="v2-rf"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={callbacks.onConnect}
        onEdgeClick={(_event, edge) => {
          if (state.mode === 'remove-link' && edge.data?.custom) {
            callbacks.onCustomEdgeRemove(edge.id);
          }
        }}
        onNodeDragStop={onNodeDragStop}
        fitView
        minZoom={0.4}
        maxZoom={1.6}
        nodesConnectable
        nodesDraggable
        panOnDrag
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} color="rgba(83, 102, 126, 0.08)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

type RoleGraphController = {
  render: (state: RoleGraphRenderState) => void;
  destroy: () => void;
};

export function mountRoleGraphEditor(container: HTMLElement, callbacks: RoleGraphCallbacks): RoleGraphController {
  let root: Root | null = createRoot(container);

  return {
    render(state: RoleGraphRenderState) {
      root?.render(<RoleGraphCanvas state={state} callbacks={callbacks} />);
    },
    destroy() {
      root?.unmount();
      root = null;
    },
  };
}
