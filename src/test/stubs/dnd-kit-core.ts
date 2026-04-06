import React from "react";

export const closestCenter = () => null;

export const DndContext = (props: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, props.children);

export class PointerSensor {
  constructor() {}
}

export class KeyboardSensor {
  constructor() {}
}

export const useSensor = () => ({});

export const useSensors = () => [];

export type DragEndEvent = {
  active: { id: string | number };
  over: { id: string | number } | null;
};
