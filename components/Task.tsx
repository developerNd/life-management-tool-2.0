import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, User as UserIcon, ChevronDown, ChevronRight, Plus, Check, X, RotateCcw, CheckCircle2, Trash2, Play, Pause, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, Task as ApiTask } from '../utils/api';  // Import Task as ApiTask
import CreateTask from './CreateTask';
import { requestApproval, approveTask, rejectTask, markTaskCompleted, deleteTask, updateTask as apiUpdateTask, revertTaskToInProgress } from '../utils/api';
import { format, parseISO, addMinutes, differenceInSeconds, isPast } from 'date-fns';
import { savePomodoroSettings, saveSitting, getSittings, PomodoroSettings, Sitting, getPomodoroSettings } from '@/utils/api';

interface TaskProps {
  task: ApiTask;
  members: string[];
  onUpdate: (task: ApiTask) => void;
  onDelete: (id: number) => void;
  onAddSubtask: (parentTaskId: number, subtaskData: Partial<ApiTask>) => Promise<void>;
  currentUser: User;
  depth: number;
}

// At the top of the file, replace the isValidDate function with this:
const isValidDate = (date: Date | string | number): boolean => {
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
};

const Task: React.FC<TaskProps> = ({ task, members, onUpdate, onDelete, onAddSubtask, currentUser, depth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [localTask, setLocalTask] = useState<ApiTask>(task);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [showDescription, setShowDescription] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(task.estimated_time);
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'days'>('minutes');
  const [isMinimized, setIsMinimized] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);
  const [sittings, setSittings] = useState<Sitting[]>([]);
  const [totalSittingTime, setTotalSittingTime] = useState(0);
  const [isUsingPomodoro, setIsUsingPomodoro] = useState(false);
  const [currentSittingTime, setCurrentSittingTime] = useState(0);
  const sittingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workTime: 25 * 60,
    breakTime: 5 * 60,
    isBreak: false,
  });
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [pomodoroTimer, setPomodoroTimer] = useState<NodeJS.Timeout | null>(null);
  const [pomodoroSettingsError, setPomodoroSettingsError] = useState<string | null>(null);
  const [workTimeError, setWorkTimeError] = useState<string | null>(null);
  const [breakTimeError, setBreakTimeError] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState<number>(pomodoroSettings.workTime);

  const isCreator = task.user_id === currentUser.id;
  const canEdit = (isCreator) && task.status === 'in_progress';

  useEffect(() => {
    setLocalTask(task);
    setEditedTask(task);
    setEstimatedTime(task.estimated_time);
  }, [task]);

  useEffect(() => {
    const updateCountdown = () => {
      if (localTask.start_date) {
        const startTime = parseISO(localTask.start_date);
        const now = new Date();
        const estimatedEndTime = addMinutes(startTime, localTask.estimated_time);

        if (isPast(startTime)) {
          // Task has started
          const remainingTime = differenceInSeconds(estimatedEndTime, now);
          if (remainingTime > 0) {
            const hours = Math.floor(remainingTime / 3600);
            const minutes = Math.floor((remainingTime % 3600) / 60);
            const seconds = remainingTime % 60;
            setCountdown(`Time remaining: ${hours}h ${minutes}m ${seconds}s`);
          } else {
            setCountdown('Time is up!');
          }
        } else {
          // Task hasn't started yet
          const timeToStart = differenceInSeconds(startTime, now);
          const days = Math.floor(timeToStart / 86400); // Calculate days
          const hours = Math.floor((timeToStart % 86400) / 3600);
          const minutes = Math.floor((timeToStart % 3600) / 60);
          const seconds = timeToStart % 60;
          setCountdown(`Starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }
    };

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call to set the countdown immediately

    return () => clearInterval(timer);
  }, [localTask.start_date, localTask.estimated_time]);

  const handleUpdate = useCallback((updatedFields: Partial<ApiTask>) => {
    if (!canEdit) {
      console.warn('You do not have permission to edit this task.');
      return;
    }
    const updatedTask = { ...localTask, ...updatedFields };
    setLocalTask(updatedTask);
    onUpdate(updatedTask);
  }, [canEdit, localTask, onUpdate]);

  // Add this function to update the parent task time
  const updateParentTaskTime = (updatedTask: ApiTask) => {
    onUpdate(updatedTask);
  };

  // New function to calculate total time recursively
  const calculateTotalTime = (t: ApiTask): number => {
    if (t.subtasks && t.subtasks.length > 0) {
      return t.subtasks.reduce((acc, subtask) => acc + calculateTotalTime(subtask), 0);
    }
    return t.estimated_time;
  };


  // Update the existing handlers to use the new handleUpdate function
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTask({ ...editedTask, title: e.target.value });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEstimatedTime = parseInt(e.target.value) || 0;
    setEstimatedTime(newEstimatedTime);
    handleUpdate({ estimated_time: newEstimatedTime });
  };

  const handleTimeUnitChange = (value: 'minutes' | 'days') => {
    setTimeUnit(value);
    // Convert the estimated time when changing units
    if (value === 'days' && timeUnit === 'minutes') {
      const days = Math.ceil(estimatedTime / (24 * 60));
      setEstimatedTime(days);
      handleUpdate({ estimated_time: days * 24 * 60 }); // Store as minutes in the backend
    } else if (value === 'minutes' && timeUnit === 'days') {
      const minutes = estimatedTime * 24 * 60;
      setEstimatedTime(minutes);
      handleUpdate({ estimated_time: minutes });
    }
  };

  const handleAssignMember = (memberId: string) => {
    setEditedTask({ ...editedTask, assigned_user_name: memberId });
  };

  const handleStatusChange = async (newStatus: ApiTask['status']) => {
    if (newStatus === 'in_progress' && localTask.status === 'pending_approval') {
      setIsReverting(true);
      try {
        const updatedTask = await revertTaskToInProgress(localTask.id);
        setLocalTask(updatedTask);
        onUpdate(updatedTask); // Add this line to update the parent component
      } catch (error) {
        console.error('Error reverting task to in progress:', error);
      } finally {
        setIsReverting(false);
      }
    } else {
      const updatedTask = { ...localTask, status: newStatus };
      setLocalTask(updatedTask);
      onUpdate(updatedTask);
    }
  };

  const isAssigned = localTask.assigned_user_name === currentUser.name;

  const getStatusColor = (status: ApiTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'pending_approval':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-blue-100 border-blue-300';
    }
  };

  const getTaskStyle = (task: ApiTask, isSubtask: boolean, depth: number, isMinimized: boolean) => {
    const baseStyle = "border rounded-lg p-4 transition-all duration-300 ease-in-out mb-4";
    
    // Status colors
    const statusColor = getStatusColor(task.status);
    
    if (!isSubtask) {
      return `${baseStyle} ${statusColor}`;
    } else {
      // Hierarchy colors (more subtle)
      const hierarchyColors = [
        'bg-gray-50 border-gray-200',
        'bg-blue-50 border-blue-200',
        'bg-green-50 border-green-200',
        'bg-purple-50 border-purple-200',
        'bg-pink-50 border-pink-200'
      ];
      const colorIndex = (depth - 1) % hierarchyColors.length;
      const hierarchyColor = hierarchyColors[colorIndex];
      
      // Use a slightly darker background for minimized subtasks
      const minimizedColor = isMinimized ? 'bg-gray-100' : hierarchyColor;
      
      return `${baseStyle} ${minimizedColor} ${statusColor.replace('bg-', 'bg-opacity-30 ')}`;
    }
  };

  const handleSubtaskCreated = (newSubtask: ApiTask) => {
    const updatedSubtasks = [...(localTask.subtasks || []), newSubtask];
    const updatedTask = {
      ...localTask,
      subtasks: updatedSubtasks,
      estimated_time: updatedSubtasks.reduce((acc, subtask) => acc + calculateTotalTime(subtask), 0)
    };
    setLocalTask(updatedTask);
    updateParentTaskTime(updatedTask);
    setShowAddSubtaskForm(false);
  };

  const handleAddSubtask = () => {
    setShowAddSubtaskForm(true);
    setIsExpanded(true);
    setIsExpanded(true);
  };

  const renderLevelIndicator = (depth: number) => {
    return (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6">
        <div className="w-5 h-5 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
          {depth}
        </div>
      </div>
    );
  };

  const renderSubtasks = (subtasks: ApiTask[], depth: number = 1) => {
    return subtasks.map(subtask => (
      <div key={subtask.id} className={depth === 1 ? 'pl-8' : ''}>
        <Task
          task={subtask}
          members={members}
          onUpdate={(updatedSubtask) => {
            if (localTask.subtasks) {
              const updatedSubtasks = localTask.subtasks.map(st => 
                st.id === updatedSubtask.id ? updatedSubtask : st
              );
              const updatedTask = {
                ...localTask,
                subtasks: updatedSubtasks,
                estimated_time: updatedSubtasks.reduce((acc, st) => acc + calculateTotalTime(st), 0)
              };
              setLocalTask(updatedTask);
              onUpdate(updatedTask);
            }
          }}
          onDelete={(subtaskId) => {
            if (localTask.subtasks) {
              const updatedSubtasks = localTask.subtasks.filter(st => st.id !== subtaskId);
              const updatedTask = {
                ...localTask,
                subtasks: updatedSubtasks,
                estimated_time: updatedSubtasks.reduce((acc, st) => acc + calculateTotalTime(st), 0)
              };
              setLocalTask(updatedTask);
              onUpdate(updatedTask);
            }
          }}
          onAddSubtask={onAddSubtask}
          currentUser={currentUser}
          depth={depth + 1}
        />
      </div>
    ));
  };

  const handleRequestApproval = async () => {
    if (isRequestingApproval) return;
    setIsRequestingApproval(true);
    try {
      const updatedTask = await requestApproval(task.id);
      setLocalTask(updatedTask);
      onUpdate(updatedTask); // Add this line to update the parent component
    } catch (error) {
      console.error('Error requesting approval:', error);
    } finally {
      setIsRequestingApproval(false);
    }
  };

  const handleApprove = async () => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      const updatedTask = await approveTask(localTask.id);
      setLocalTask(updatedTask);
      // onUpdate(updatedTask); // Commented out
    } catch (error) {
      console.error('Error approving task:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;
    setIsRejecting(true);
    try {
      const updatedTask = await rejectTask(localTask.id);
      setLocalTask(updatedTask);
      // onUpdate(updatedTask); // This line is commented out as per your solution
    } catch (error) {
      console.error('Error rejecting task:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (isMarkingCompleted) return;
    setIsMarkingCompleted(true);
    try {
      const updatedTask = await markTaskCompleted(localTask.id);
      setLocalTask(updatedTask);
      // onUpdate(updatedTask); // Commented out
    } catch (error) {
      console.error('Error marking task as completed:', error);
    } finally {
      setIsMarkingCompleted(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteTask(localTask.id);
      if (result.success) {
        onDelete(localTask.id);
      } else {
        console.error('Failed to delete task:', result.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedTask(localTask);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTask(localTask);
  };

  const handleUpdateTask = async () => {
    if (!canEdit) {
      console.warn('You do not have permission to edit this task.');
      return;
    }

    // Check if all required fields are filled
    if (!editedTask.title || !editedTask.estimated_time || !editedTask.assigned_user_name) {
      console.warn('Please fill in all required fields.');
      return;
    }

    try {
      // Call the API to update the task
      const updatedTask = await apiUpdateTask(editedTask.id, {
        title: editedTask.title,
        estimated_time: editedTask.estimated_time,
        assigned_user_name: editedTask.assigned_user_name,
        description: editedTask.description,
      });
      
      // Update local state
      setLocalTask(updatedTask);
      
      // Notify parent component
      onUpdate(updatedTask);
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTask({ ...editedTask, description: e.target.value });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(!isExpanded);
  };

  const formatDateTime = (dateTimeString: string | undefined) => {
    if (!dateTimeString) return 'Not set';
    try {
      const date = parseISO(dateTimeString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    const loadSittings = async () => {
      try {
        const loadedSittings = await getSittings(task.id);
        setSittings(loadedSittings);
        setTotalSittingTime(loadedSittings.reduce((total: number, sitting: Sitting) => total + sitting.duration, 0));
      } catch (error) {
        console.error('Error loading sittings:', error);
      }
    };

    loadSittings();
  }, [task.id]);

  useEffect(() => {
    const loadPomodoroSettings = async () => {
      try {
        const settings = await getPomodoroSettings(task.id);
        console.log('Loaded Pomodoro settings:', settings);
        setPomodoroSettings(prevSettings => ({
          ...prevSettings,
          workTime: settings.workTime || 25 * 60,  // Default to 25 minutes if empty
          breakTime: settings.breakTime || 5 * 60, // Default to 5 minutes if empty
          isBreak: false, // Reset isBreak when loading settings
        }));
        setPomodoroTime(settings.workTime || 25 * 60);  // Set default here too
      } catch (error) {
        console.error('Error loading Pomodoro settings:', error);
        // Set default values if there's an error
        setPomodoroSettings(prevSettings => ({
          ...prevSettings,
          workTime: 25 * 60,
          breakTime: 5 * 60,
          isBreak: false,
        }));
        setPomodoroTime(25 * 60);
      }
    };

    loadPomodoroSettings();
  }, [task.id]);

  const updatePomodoroSettings = async (workTime: number, breakTime: number) => {
    setWorkTimeError(null);
    setBreakTimeError(null);
    let hasError = false;

    if (!workTime) {
      setWorkTimeError("Work time cannot be empty.");
      hasError = true;
    }

    if (!breakTime) {
      setBreakTimeError("Break time cannot be empty.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const newSettings: PomodoroSettings = {
      workTime: workTime * 60,
      breakTime: breakTime * 60,
      isBreak: false, // Reset isBreak when updating settings
    };
    setPomodoroSettings(newSettings);
    setPomodoroTime(newSettings.workTime);
    setShowPomodoroSettings(false);

    try {
      await savePomodoroSettings(task.id, {
        workTime: newSettings.workTime,
        breakTime: newSettings.breakTime,
      });
    } catch (error) {
      console.error('Error saving Pomodoro settings:', error);
      setPomodoroSettingsError("Failed to save settings. Please try again.");
    }
  };

  const saveSittingToDatabase = async (sitting: Sitting) => {
    try {
      await saveSitting(task.id, sitting);
    } catch (error) {
      console.error('Error saving sitting:', error);
    }
  };

  const startWorkTimer = () => {
    const workTime = pomodoroSettings.workTime;
    setPomodoroTime(workTime);
    setPomodoroSettings(prev => ({ ...prev, isBreak: false }));
    if (pomodoroTimer) clearInterval(pomodoroTimer);
    const startTime = Date.now();
    const endTime = startTime + workTime * 1000;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setPomodoroTime(Math.ceil(remaining / 1000));
      
      if (remaining <= 0) {
        clearInterval(timer);
        const actualDuration = Math.floor((now - startTime) / 1000);
        const newSitting: Sitting = { 
          startTime: new Date(startTime),
          endTime: new Date(now),
          duration: actualDuration
        };
        setSittings(prev => [...prev, newSitting]);
        setTotalSittingTime(prev => prev + actualDuration);
        saveSittingToDatabase(newSitting);
        startBreakTimer();
      }
    }, 100); // Update more frequently for smoother countdown
    
    setPomodoroTimer(timer);
  };

  const startBreakTimer = () => {
    const breakTime = pomodoroSettings.breakTime;
    setPomodoroTime(breakTime);
    setPomodoroSettings(prev => ({ ...prev, isBreak: true }));
    if (pomodoroTimer) clearInterval(pomodoroTimer);
    const startTime = Date.now();
    const endTime = startTime + breakTime * 1000;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setPomodoroTime(Math.ceil(remaining / 1000));
      
      if (remaining <= 0) {
        clearInterval(timer);
        const actualDuration = Math.floor((now - startTime) / 1000);
        console.log(`Break time completed: ${actualDuration} seconds`);
        startWorkTimer();
      }
    }, 100); // Update more frequently for smoother countdown
    
    setPomodoroTimer(timer);
  };

  const startWork = (usePomodoro: boolean) => {
    setIsWorking(true);
    setWorkStartTime(new Date());
    setIsUsingPomodoro(usePomodoro);
    setCurrentSittingTime(0);
    if (usePomodoro) {
      startWorkTimer();
    } else {
      // Start the regular timer
      if (sittingTimerRef.current) clearInterval(sittingTimerRef.current);
      sittingTimerRef.current = setInterval(() => {
        setCurrentSittingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopWork = () => {
    if (workStartTime && isWorking) {
      const endTime = Date.now();
      let duration: number;
      if (isUsingPomodoro && !pomodoroSettings.isBreak) {
        // For Pomodoro, only save the time of the current work session
        duration = Math.floor((endTime - workStartTime.getTime()) / 1000);
        // Only save if the duration is significant
        if (duration > 1) {
          const newSitting: Sitting = { 
            startTime: new Date(workStartTime),
            endTime: new Date(endTime),
            duration 
          };
          setSittings(prev => [...prev, newSitting]);
          setTotalSittingTime(prev => prev + duration);
          saveSitting(task.id, newSitting);
        }
      } else if (!isUsingPomodoro) {
        duration = Math.floor((endTime - workStartTime.getTime()) / 1000);
        const newSitting: Sitting = { 
          startTime: new Date(workStartTime),
          endTime: new Date(endTime),
          duration 
        };
        setSittings(prev => [...prev, newSitting]);
        setTotalSittingTime(prev => prev + duration);
        saveSitting(task.id, newSitting);
      }
    }
    setIsWorking(false);
    setWorkStartTime(null);
    setCurrentSittingTime(0);
    setIsUsingPomodoro(false);
    setPomodoroTime(pomodoroSettings.workTime);
    setPomodoroSettings(prev => ({ ...prev, isBreak: false }));
    if (pomodoroTimer) {
      clearInterval(pomodoroTimer);
      setPomodoroTimer(null);
    }
    if (sittingTimerRef.current) {
      clearInterval(sittingTimerRef.current);
      sittingTimerRef.current = null;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSittingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // Build the formatted time string conditionally
    const timeParts = [];
    if (hours > 0) timeParts.push(`${hours}h`);
    if (minutes > 0) timeParts.push(`${minutes}m`);
    if (remainingSeconds > 0) timeParts.push(`${remainingSeconds}s`);

    return timeParts.join(' ') || '0s'; // Return '0s' if no time parts are present
  };

  const renderSittings = () => {
    return (
      <div className="mt-2">
        <h5 className="text-xs font-semibold text-gray-600">All Sittings:</h5>
        <div className="max-h-40 overflow-y-auto">
          <ul className="text-xs text-gray-500">
            {sittings.slice().reverse().map((sitting, index) => (
              <li key={index} className="mb-1">
                {isValidDate(sitting.startTime) && isValidDate(sitting.endTime) ? (
                  <>
                    {format(sitting.startTime, "MMM d, hh:mm a")} - {format(sitting.endTime, "hh:mm a")}: {formatSittingTime(sitting.duration)}
                  </>
                ) : (
                  `Invalid date: ${sitting.startTime} - ${sitting.endTime}`
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4 relative"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className={`${getTaskStyle(localTask, task.parent_task_id !== null, depth, isMinimized)} ${depth > 0 ? 'pl-8' : ''} relative`}>
        {depth > 0 && renderLevelIndicator(depth)}
        {/* Task header (always visible) */}
        <div className="flex items-center space-x-2">
          {localTask.subtasks && localTask.subtasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="p-1"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </Button>
          )}
          <Input
            value={isEditing ? editedTask.title : localTask.title}
            onChange={handleTitleChange}
            className="flex-grow bg-white"
            disabled={!isEditing || !canEdit}
            required
          />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isCreator ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
            {isCreator ? 'Creator' : 'Member'}
          </span>
        </div>

        {/* Task details (hidden when minimized) */}
        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="mt-4 space-y-4">
                {/* Main task content */}
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        value={estimatedTime}
                        onChange={handleTimeChange}
                        className="w-20 bg-white" 
                        placeholder="Time"
                        min="0"
                        disabled={!isEditing || !canEdit || (localTask.subtasks && localTask.subtasks.length > 0)}
                        required
                      />
                      <Select 
                        onValueChange={handleTimeUnitChange} 
                        value={timeUnit}
                        disabled={!isEditing || !canEdit}
                      >
                        <SelectTrigger className="w-[100px] bg-white">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <Select 
                        onValueChange={handleAssignMember} 
                        value={isEditing ? editedTask.assigned_user_name : localTask.assigned_user_name} 
                        disabled={!isEditing || !canEdit}
                        required
                      >
                        <SelectTrigger className="w-[140px] bg-white">
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member, index) => (
                            <SelectItem key={index} value={member}>{member}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Total: {calculateTotalTime(localTask)} min</span>
                    {/* Time Information Section */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Time Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500">Start Time</span>
                          <span className="text-sm text-gray-700">{formatDateTime(localTask.start_date)}</span>
                        </div>
                        {localTask.end_date && (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500">End Time</span>
                            <span className="text-sm text-gray-700">{formatDateTime(localTask.end_date)}</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500">Created At</span>
                          <span className="text-sm text-gray-700">{formatDateTime(localTask.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDescription(!showDescription)}
                      className="self-start"
                    >
                      {showDescription ? 'Hide Description' : 'Show Description'}
                    </Button>
                    {showDescription && (
                      <textarea
                        value={isEditing ? editedTask.description : localTask.description}
                        onChange={handleDescriptionChange}
                        className="w-full p-2 border rounded-md bg-white"
                        placeholder="Task Description"
                        rows={3}
                        disabled={!isEditing || !canEdit}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEdit && (
                      isEditing ? (
                        <>
                          <Button onClick={handleUpdateTask} size="sm" variant="outline" disabled={!canEdit}>
                            Update
                          </Button>
                          <Button onClick={handleCancelEdit} size="sm" variant="outline">
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={handleEdit} size="sm" variant="outline">
                          Edit
                        </Button>
                      )
                    )}
                    {isCreator ? (
                      <>
                        {localTask.status !== 'completed' && (
                          <Button 
                            onClick={handleMarkCompleted} 
                            size="sm" 
                            variant="outline"
                            disabled={isMarkingCompleted}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" /> 
                            {isMarkingCompleted ? 'Marking...' : 'Mark Completed'}
                          </Button>
                        )}
                        {localTask.status === 'pending_approval' && (
                          <>
                            <Button 
                              onClick={handleApprove} 
                              size="sm" 
                              variant="outline"
                              disabled={isApproving}
                            >
                              <Check className="mr-1 h-4 w-4" /> 
                              {isApproving ? 'Approving...' : 'Approve'}
                            </Button>
                            <Button 
                              onClick={handleReject} 
                              size="sm" 
                              variant="outline"
                              disabled={isRejecting}
                            >
                              <X className="mr-1 h-4 w-4" /> 
                              {isRejecting ? 'Rejecting...' : 'Reject'}
                            </Button>
                          </>
                        )}
                        {localTask.status !== 'completed'  && (
                          <Button onClick={handleAddSubtask} size="sm" variant="outline">
                            <Plus className="mr-1 h-4 w-4" /> Add Subtask
                          </Button>
                        )}
                        <Button onClick={handleDelete} variant="destructive" size="sm" disabled={isDeleting}>
                          <Trash2 className="mr-1 h-4 w-4" /> 
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                      </>
                    ) : isAssigned ? (
                      <>
                        {localTask.status === 'in_progress' && (
                          <Button 
                            onClick={handleRequestApproval} 
                            size="sm" 
                            variant="outline"
                            disabled={isRequestingApproval}
                          >
                            {isRequestingApproval ? 'Requesting...' : 'Request Approval'}
                          </Button>
                        )}
                        {localTask.status === 'pending_approval' && (
                          <Button 
                            onClick={() => handleStatusChange('in_progress')} 
                            size="sm" 
                            variant="outline"
                            disabled={isReverting}
                          >
                            <RotateCcw className="mr-1 h-4 w-4" /> 
                            {isReverting ? 'Reverting...' : 'Revert to In Progress'}
                          </Button>
                        )}
                      </>
                    ) : null}
                  </div>
                  {/* Countdown timer */}
                  {countdown && (
                    <div className="bg-blue-50 rounded-lg p-3 mt-2">
                      <span className="text-sm font-medium text-blue-700">{countdown}</span>
                    </div>
                  )}
                </div>
                {showAddSubtaskForm && (
                  <div className="mt-4">
                    <CreateTask
                      parentTaskId={localTask.id}
                      onTaskCreated={handleSubtaskCreated}
                      onCancel={() => setShowAddSubtaskForm(false)}
                    />
                  </div>
                )}
                {/* Work Session Controls */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Work Sessions</h4>
                  {!isWorking ? (
                    <div className="flex space-x-2">
                      <Button onClick={() => startWork(false)} size="sm" variant="outline">
                        <Play className="mr-1 h-4 w-4" /> Start Work
                      </Button>
                      <Button onClick={() => startWork(true)} size="sm" variant="outline">
                        <Clock className="mr-1 h-4 w-4" /> Start with Pomodoro
                      </Button>
                      <Button onClick={() => setShowPomodoroSettings(true)} size="sm" variant="outline">
                        <Settings className="mr-1 h-4 w-4" /> Pomodoro Settings
                      </Button>
                    </div>
                  ) : (
                    <div className="flex space-x-2 items-center">
                      <Button onClick={stopWork} size="sm" variant="outline">
                        <Pause className="mr-1 h-4 w-4" /> Stop Work
                      </Button>
                      {isUsingPomodoro ? (
                        <span className="text-sm font-medium">
                          {pomodoroSettings.isBreak ? 'Break' : 'Work'}: {formatTime(pomodoroTime)}
                        </span>
                      ) : (
                        <span className="text-sm font-medium">
                          Current sitting: {formatSittingTime(currentSittingTime)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Pomodoro Settings Modal */}
                {showPomodoroSettings && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Pomodoro Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Work Time (minutes)</label>
                          <Input
                            type="number"
                            value={Math.floor(pomodoroSettings.workTime / 60)}
                            onChange={(e) => {
                              setPomodoroSettings(prev => ({ ...prev, workTime: parseInt(e.target.value) * 60 }));
                              setWorkTimeError(null);
                            }}
                            min="1"
                            className="mt-1"
                            required
                          />
                          {workTimeError && <div className="text-red-500 text-sm mt-1">{workTimeError}</div>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Break Time (minutes)</label>
                          <Input
                            type="number"
                            value={Math.floor(pomodoroSettings.breakTime / 60)}
                            onChange={(e) => {
                              setPomodoroSettings(prev => ({ ...prev, breakTime: parseInt(e.target.value) * 60 }));
                              setBreakTimeError(null);
                            }}
                            min="1"
                            className="mt-1"
                            required
                          />
                          {breakTimeError && <div className="text-red-500 text-sm mt-1">{breakTimeError}</div>}
                        </div>
                        {pomodoroSettingsError && (
                          <div className="text-red-500 text-sm">{pomodoroSettingsError}</div>
                        )}
                      </div>
                      <div className="mt-6 flex justify-end space-x-2">
                        <Button onClick={() => {
                          setShowPomodoroSettings(false);
                          setPomodoroSettingsError(null);
                          setWorkTimeError(null);
                          setBreakTimeError(null);
                        }} variant="outline">
                          Cancel
                        </Button>
                        <Button onClick={() => updatePomodoroSettings(Math.floor(pomodoroSettings.workTime / 60), Math.floor(pomodoroSettings.breakTime / 60))}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sitting Information */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700">Sitting Information</h4>
                  <p className="text-sm text-gray-600">
                    Total sittings: {sittings.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total sitting time: {formatSittingTime(totalSittingTime)}
                  </p>
                  {sittings.length > 0 && renderSittings()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Subtasks */}
      <AnimatePresence initial={false}>
        {isExpanded && localTask.subtasks && localTask.subtasks.length > 0 && (
          <motion.div
            key="subtasks"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="mt-2 space-y-4 relative">
              {depth === 0 && (
                <div className="absolute top-0 bottom-0 left-3 w-px bg-gray-300"></div>
              )}
              {renderSubtasks(localTask.subtasks, depth + 1)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


export default Task;