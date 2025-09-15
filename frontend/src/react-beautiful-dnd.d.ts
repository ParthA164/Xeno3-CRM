declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  // DragDropContext
  export interface DragDropContextProps {
    onDragEnd: (result: DropResult) => void;
    onDragStart?: (initial: DragStart) => void;
    onDragUpdate?: (update: DragUpdate) => void;
    children: React.ReactNode;
  }
  
  export class DragDropContext extends React.Component<DragDropContextProps> {}

  // Draggable
  export interface DraggableProps {
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
    isDragDisabled?: boolean;
  }

  export class Draggable extends React.Component<DraggableProps> {}

  export interface DraggableProvided {
    draggableProps: React.CSSProperties & {
      'data-rbd-draggable-context-id': string;
      'data-rbd-draggable-id': string;
    };
    dragHandleProps: React.CSSProperties & {
      'data-rbd-drag-handle-draggable-id': string;
      'data-rbd-drag-handle-context-id': string;
      'aria-describedby': string;
    } | null;
    innerRef: React.RefCallback<HTMLElement>;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    draggingOver: string | null;
  }

  // Droppable
  export interface DroppableProps {
    droppableId: string;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
    type?: string;
    isDropDisabled?: boolean;
  }

  export class Droppable extends React.Component<DroppableProps> {}

  export interface DroppableProvided {
    innerRef: React.RefCallback<HTMLElement>;
    droppableProps: React.CSSProperties & {
      'data-rbd-droppable-context-id': string;
      'data-rbd-droppable-id': string;
    };
    placeholder: React.ReactNode | null;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith: string | null;
  }

  // Results
  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
    destination: {
      droppableId: string;
      index: number;
    } | null;
    reason: 'DROP' | 'CANCEL';
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
  }

  export interface DragUpdate extends DragStart {
    destination: {
      droppableId: string;
      index: number;
    } | null;
  }
}