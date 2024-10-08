import { useState, useEffect, useRef, useCallback } from 'react';
import { Sitting, PomodoroSettings, saveSitting } from '@/utils/api';

export const useWorkTimer = (taskId: number) => {
  const [isWorking, setIsWorking] = useState(false);
  const [isUsingPomodoro, setIsUsingPomodoro] = useState(false);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workTime: 25 * 60,
    breakTime: 5 * 60,
    isBreak: false,
  });
  const pomodoroTimeRef = useRef(pomodoroSettings.workTime);
  const currentSittingTimeRef = useRef(0);
  const [sittings, setSittings] = useState<Sitting[]>([]);
  const [totalSittingTime, setTotalSittingTime] = useState(0);

  const timerIdRef = useRef<number | null>(null);
  const workStartTimeRef = useRef<Date | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const saveState = useCallback(() => {
    localStorage.setItem(`workTimer_${taskId}`, JSON.stringify({
      isWorking,
      isUsingPomodoro,
      pomodoroSettings,
      pomodoroTime: pomodoroTimeRef.current,
      currentSittingTime: currentSittingTimeRef.current,
      workStartTime: workStartTimeRef.current?.toISOString(),
      lastTick: lastTickRef.current,
    }));
  }, [taskId, isWorking, isUsingPomodoro, pomodoroSettings]);

  const timerTick = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastTickRef.current) / 1000);
    lastTickRef.current = now;

    if (isUsingPomodoro) {
      pomodoroTimeRef.current -= elapsed;
      if (pomodoroTimeRef.current <= 0) {
        if (pomodoroSettings.isBreak) {
          savePomodoroSitting();
          setPomodoroSettings((prev) => ({ ...prev, isBreak: false }));
          pomodoroTimeRef.current = pomodoroSettings.workTime;
        } else {
          setPomodoroSettings((prev) => ({ ...prev, isBreak: true }));
          pomodoroTimeRef.current = pomodoroSettings.breakTime;
        }
      }
    } else {
      currentSittingTimeRef.current += elapsed;
    }
    saveState();
  }, [isUsingPomodoro, pomodoroSettings, saveState]);

  const startTimer = useCallback((usePomodoro: boolean) => {
    console.log('startTimer called with usePomodoro:', usePomodoro);
    if (timerIdRef.current) {
      console.log('Clearing existing timer');
      window.clearInterval(timerIdRef.current);
    }

    setIsWorking(true);
    setIsUsingPomodoro(usePomodoro);
    workStartTimeRef.current = new Date();
    lastTickRef.current = Date.now();
    pomodoroTimeRef.current = pomodoroSettings.workTime;
    currentSittingTimeRef.current = 0;

    console.log('Setting up new timer');
    timerIdRef.current = window.setInterval(() => {
      console.log('Timer tick');
      timerTick();
    }, 1000);
    saveState();
  }, [timerTick, saveState, pomodoroSettings.workTime]);

  const stopTimer = useCallback(() => {
    console.log('stopTimer called');
    if (timerIdRef.current) {
      console.log('Clearing timer');
      window.clearInterval(timerIdRef.current);
    }

    if (isWorking && workStartTimeRef.current) {
      if (isUsingPomodoro && !pomodoroSettings.isBreak) {
        savePomodoroSitting();
      } else if (!isUsingPomodoro) {
        saveRegularSitting();
      }
    }

    setIsWorking(false);
    setIsUsingPomodoro(false);
    pomodoroTimeRef.current = pomodoroSettings.workTime;
    currentSittingTimeRef.current = 0;
    workStartTimeRef.current = null;
    lastTickRef.current = Date.now();

    localStorage.removeItem(`workTimer_${taskId}`);
  }, [isWorking, isUsingPomodoro, pomodoroSettings, taskId]);

  const savePomodoroSitting = useCallback(() => {
    if (workStartTimeRef.current) {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - workStartTimeRef.current.getTime()) / 1000);
      const newSitting: Sitting = {
        startTime: workStartTimeRef.current,
        endTime,
        duration,
      };
      setSittings((prev) => [...prev, newSitting]);
      setTotalSittingTime((prev) => prev + duration);
      saveSitting(taskId, newSitting);
      workStartTimeRef.current = new Date();
    }
  }, [taskId]);

  const saveRegularSitting = useCallback(() => {
    if (workStartTimeRef.current) {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - workStartTimeRef.current.getTime()) / 1000);
      const newSitting: Sitting = {
        startTime: workStartTimeRef.current,
        endTime,
        duration,
      };
      setSittings((prev) => [...prev, newSitting]);
      setTotalSittingTime((prev) => prev + duration);
      saveSitting(taskId, newSitting);
    }
  }, [taskId]);

  useEffect(() => {
    console.log('useWorkTimer effect running');
    const storedState = localStorage.getItem(`workTimer_${taskId}`);
    if (storedState) {
      console.log('Found stored state:', storedState);
      const { isWorking, isUsingPomodoro, pomodoroSettings, pomodoroTime, currentSittingTime, workStartTime, lastTick } = JSON.parse(storedState);
      setIsWorking(isWorking);
      setIsUsingPomodoro(isUsingPomodoro);
      setPomodoroSettings(pomodoroSettings);
      pomodoroTimeRef.current = pomodoroTime;
      currentSittingTimeRef.current = currentSittingTime;
      workStartTimeRef.current = workStartTime ? new Date(workStartTime) : null;
      lastTickRef.current = lastTick || Date.now();

      if (isWorking) {
        startTimer(isUsingPomodoro);
      }
    }
  }, [taskId, startTimer]);

  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
      }
    };
  }, []);

  return {
    isWorking,
    isUsingPomodoro,
    pomodoroSettings,
    pomodoroTime: pomodoroTimeRef.current,
    currentSittingTime: currentSittingTimeRef.current,
    sittings,
    setSittings,
    totalSittingTime,
    setTotalSittingTime,
    startWork: startTimer,
    stopWork: stopTimer,
    setPomodoroSettings,
  };
};