import React from "react";

export const SortableContext = (props: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, props.children);

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

export const rectSortingStrategy = () => null;

export const sortableKeyboardCoordinates = () => ({});

export const useSortable = () => ({
  attributes: {},
  listeners: {},
  setNodeRef: () => {},
  transform: null,
  transition: undefined,
  isDragging: false,
});
