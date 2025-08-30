import { useRef } from "react";

export function useSafeTap(onSafeTap: () => void) {
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;

    const touchEndY = e.changedTouches[0].clientY;
    const distance = Math.abs(touchEndY - touchStartY.current);

    if (distance < 10) {
      onSafeTap();
    }
    touchStartY.current = null;
  }

  function handleClick() {
    onSafeTap();
  }

  return {
    handleTouchStart,
    handleTouchEnd,
    handleClick,
  };
}
