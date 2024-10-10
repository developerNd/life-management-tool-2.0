import { useState, useEffect, useRef } from 'react';

export function useWorker(workerScript: string) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const newWorker = new Worker(workerScript);
    setWorker(newWorker);
    workerRef.current = newWorker;

    return () => {
      newWorker.terminate();
    };
  }, [workerScript]);

  const postMessage = (message: any) => {
    if (workerRef.current) {
      workerRef.current.postMessage(message);
    }
  };

  return { worker, postMessage };
}