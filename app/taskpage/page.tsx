'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import Login from '@/components/Login'
import CreateTask from '@/components/CreateTask'
import Task from '@/components/Task'
import Loader from '@/components/ui/loader'
import TaskLoader from '@/components/ui/taskLoader'
import { fetchTasks, createTask, deleteTask as apiDeleteTask, getUsers, Task as ApiTask } from '@/utils/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, isToday, isYesterday, isSameWeek, isSameMonth } from 'date-fns'

// Add this interface if AuthUser is not imported from AuthContext
interface AuthUser {
  user: {
    id: number;
    name: string;
    role: string;
  };
  token: string;
}

const calculateTotalTime = (tasks: ApiTask[]): number => {
  return tasks.reduce((acc, task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      return acc + calculateTotalTime(task.subtasks);
    }
    return acc + task.estimated_time;
  }, 0);
};

const formatEstimatedTime = (minutes: number): string => {
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const remainingMinutes = minutes % 60;

  let formattedTime = '';
  if (days > 0) formattedTime += `${days}d `;
  if (hours > 0) formattedTime += `${hours}h `;
  if (remainingMinutes > 0) formattedTime += `${remainingMinutes}m`;

  return formattedTime.trim() || '0m';
};

export default function ProductivityApp() {
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [members, setMembers] = useState<string[]>([])
  const { user, logout } = useAuth() as { user: AuthUser | null, logout: () => void }
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false)
  const [currentTab, setCurrentTab] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isTasksLoading, setIsTasksLoading] = useState(true)

  const sortTasksByRecent = useCallback((taskList: ApiTask[]): ApiTask[] => {
    return [...taskList].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, []);


  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setIsTasksLoading(true);
        try {
          const [fetchedTasks, fetchedUsers] = await Promise.all([fetchTasks(), getUsers()]);
          setTasks(sortTasksByRecent(fetchedTasks as ApiTask[]));
          setMembers(fetchedUsers.map((user: { name: string }) => user.name));
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsTasksLoading(false);
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [user, sortTasksByRecent]);

  const handleUpdateTask = useCallback((updatedTask: ApiTask) => {
    setTasks(prevTasks => {
      const updateTaskRecursively = (tasks: ApiTask[]): ApiTask[] => {
        return tasks.map(task => {
          if (task.id === updatedTask.id) {
            return updatedTask;
          } else if (task.subtasks && task.subtasks.length > 0) {
            return {
              ...task,
              subtasks: updateTaskRecursively(task.subtasks)
            };
          }
          return task;
        });
      };
      return sortTasksByRecent(updateTaskRecursively(prevTasks));
    });
  }, [sortTasksByRecent]);

  const handleDeleteTask = useCallback(async (taskId: number) => {
    try {
      const result = await apiDeleteTask(taskId);
      if (result.success) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      } else {
        console.error('Failed to delete task:', result.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, []);

  const handleTaskCreated = useCallback((newTask: ApiTask) => {
    setTasks(prevTasks => sortTasksByRecent([...prevTasks, newTask]));
    setShowCreateTaskForm(false);
  }, [sortTasksByRecent]);

  const handleAddSubtask = useCallback(async (parentTaskId: number, subtaskData: Partial<ApiTask>) => {
    if (!user) return;
    try {
      const newSubtask = await createTask({
        ...subtaskData,
        parent_task_id: parentTaskId,
        user_id: user.user.id,
      });

      setTasks(prevTasks => {
        const updateSubtasks = (tasks: ApiTask[]): ApiTask[] => {
          return tasks.map(task => {
            if (task.id === parentTaskId) {
              return {
                ...task,
                subtasks: [...(task.subtasks || []), newSubtask as ApiTask]
              };
            } else if (task.subtasks && task.subtasks.length > 0) {
              return {
                ...task,
                subtasks: updateSubtasks(task.subtasks)
              };
            }
            return task;
          });
        };

        return sortTasksByRecent(updateSubtasks(prevTasks));
      });
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  }, [user, sortTasksByRecent]);

  const sortAndGroupTasks = useCallback((tasks: ApiTask[]): { [key: string]: ApiTask[] } => {
    const sortedTasks = tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const groupedTasks: { [key: string]: ApiTask[] } = {};

    sortedTasks.forEach(task => {
      const createdDate = new Date(task.created_at);
      let groupKey: string;

      if (isToday(createdDate)) {
        groupKey = 'Today';
      } else if (isYesterday(createdDate)) {
        groupKey = 'Yesterday';
      } else if (isSameWeek(createdDate, new Date(), { weekStartsOn: 1 })) {
        groupKey = 'This Week';
      } else if (isSameMonth(createdDate, new Date())) {
        groupKey = 'This Month';
      } else {
        groupKey = format(createdDate, 'MMMM yyyy');
      }

      if (!groupedTasks[groupKey]) {
        groupedTasks[groupKey] = [];
      }
      groupedTasks[groupKey].push(task);
    });

    return groupedTasks;
  }, []);

  const memoizedMembers = useMemo(() => members, [members]);
  const memoizedCurrentUser = useMemo(() => user ? {
    id: user.user.id,
    name: user.user.name,
    role: user.user.role
  } : null, [user]);

  const renderTaskList = useCallback((tasks: ApiTask[]) => {
    if (isTasksLoading) {
      return <TaskLoader />;
    }

    const groupedTasks = sortAndGroupTasks(tasks);

    return (
      <>
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName} className="mb-8">
            <h3 className="text-xl font-semibold mb-4">{groupName}</h3>
            <AnimatePresence>
              {groupTasks.map(task => (
                memoizedCurrentUser && (
                  <Task
                    key={task.id}
                    task={task}
                    members={memoizedMembers}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    currentUser={memoizedCurrentUser}
                    depth={0}
                  />
                )
              ))}
            </AnimatePresence>
          </div>
        ))}
      </>
    );
  }, [isTasksLoading, memoizedMembers, handleUpdateTask, handleDeleteTask, handleAddSubtask, memoizedCurrentUser, sortAndGroupTasks]);

  const userTasks = useMemo(() => {
    if (!user) return [];
    return user.user.role === 'admin' 
      ? tasks 
      : tasks.filter(task => 
          task.assigned_user_name === user.user.name || 
          task.subtasks?.some(subtask => subtask.assigned_user_name === user.user.name)
        );
  }, [user, tasks]);

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-0">Task Management</h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-sm sm:text-base text-gray-600">Welcome, {user.user.name} ({user.user.role})</span>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
        
        <Card className="mb-4 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-semibold">Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              {user.user.role === 'admin' && (
                <Button onClick={() => setShowCreateTaskForm(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add New Task
                </Button>
              )}
            </div>
            {showCreateTaskForm && (
              <CreateTask 
                onTaskCreated={handleTaskCreated} 
                onCancel={() => setShowCreateTaskForm(false)}
              />
            )}

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="mb-4 flex flex-wrap justify-start gap-2">
                <TabsTrigger value="all" className="px-2 py-1 text-xs sm:text-sm">All Tasks</TabsTrigger>
                <TabsTrigger value="in_progress" className="px-2 py-1 text-xs sm:text-sm">In Progress</TabsTrigger>
                <TabsTrigger value="pending_approval" className="px-2 py-1 text-xs sm:text-sm">Pending Approval</TabsTrigger>
                <TabsTrigger value="completed" className="px-2 py-1 text-xs sm:text-sm">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {renderTaskList(userTasks)}
              </TabsContent>
              <TabsContent value="in_progress">
                {renderTaskList(userTasks.filter(task => task.status === 'in_progress'))}
                {!isTasksLoading && (
                  <div className="mt-4 sm:mt-6 text-right">
                    <span className="text-sm sm:text-base font-semibold">
                      Total Estimated Time: {formatEstimatedTime(calculateTotalTime(userTasks.filter(task => task.status === 'in_progress')))}
                    </span>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="pending_approval">
                {renderTaskList(userTasks.filter(task => task.status === 'pending_approval'))}
                {!isTasksLoading && (
                  <div className="mt-4 sm:mt-6 text-right">
                    <span className="text-sm sm:text-base font-semibold">
                      Total Estimated Time: {formatEstimatedTime(calculateTotalTime(userTasks.filter(task => task.status === 'pending_approval')))}
                    </span>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="completed">
                {renderTaskList(userTasks.filter(task => task.status === 'completed'))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}