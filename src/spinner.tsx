import { useEffect, useState } from "react";

import { Text } from "ink";

// taken from clis-spinnies
const interval = 80;
const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

export function Spinner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((previous) => (previous == frames.length - 1 ? 0 : previous + 1));
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, frames);

  return <Text>{frames[count]}</Text>;
}
