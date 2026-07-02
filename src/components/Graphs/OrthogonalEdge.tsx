import { BaseEdge, EdgeProps } from '@xyflow/react';
import { EdgePoint } from './useGraph';

interface OrthData {
  points?: EdgePoint[];
}

export function OrthogonalEdge(props: EdgeProps & { data?: OrthData }) {
  const { sourceX, sourceY, targetX, targetY, markerStart, markerEnd, style, data } = props;
  const points: EdgePoint[] =
    data?.points && data.points.length >= 2
      ? data.points
      : [
          { x: sourceX, y: sourceY },
          { x: targetX, y: targetY },
        ];
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return <BaseEdge id={props.id} path={path} markerStart={markerStart} markerEnd={markerEnd} style={style} />;
}
