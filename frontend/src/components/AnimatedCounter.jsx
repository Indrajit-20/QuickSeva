import { useEffect, useRef, useState } from "react";

const AnimatedCounter = ({
  target,
  duration = 1500,
  steps = 60,
  formatter,
  className = "",
}) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const safeTarget = Number(target || 0);
    const increment = safeTarget / steps;
    const interval = Math.max(1, Math.floor(duration / steps));

    let current = 0;
    let i = 0;

    const tick = () => {
      i += 1;
      current += increment;

      if (i >= steps || current >= safeTarget) {
        setCount(safeTarget);
        return;
      }

      setCount(Math.floor(current));

      timeoutRef.current = setTimeout(tick, interval);
    };

    setCount(0);
    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [target, duration, steps]);

  const rendered = formatter ? formatter(count) : count;
  return <span className={className}>{rendered}</span>;
};

export default AnimatedCounter;
