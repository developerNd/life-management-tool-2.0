import React, { useState, useEffect } from 'react';
import Login from './Login';
import MemberManagement from './MemberManagement';
import Task from './Task';
import { Button } from './ui/button';
import { LogOut, Plus, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import CreateTask from './CreateTask';
import { getTasks, getUsers, Task as TaskType, createTask, User as ApiUser, deleteTask } from '../utils/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const ProductivityApp: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedTasks, fetchedUsers] = await Promise.all([getTasks(), getUsers()]);
        console.log('Fetched tasks:', fetchedTasks);
        setTasks(sortTasksByRecent(fetchedTasks));
        setMembers(fetchedUsers.map((user: ApiUser) => user.name));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    loadData();
  }, []);

  const sortTasksByRecent = (taskList: TaskType[]): TaskType[] => {
    return taskList.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  };

  const filterTasks = (taskList: TaskType[]): TaskType[] => {
    if (filterStatus === 'all') return taskList;
    return taskList.filter(task => task.status === filterStatus);
  };

  const handleUpdateTask = async (updatedTask: TaskType) => {
    setTasks(prevTasks => {
      const updateTaskRecursively = (tasks: TaskType[]): TaskType[] => {
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
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      const result = await deleteTask(taskId);
      if (result.success) {
        setTasks(prevTasks => {
          const removeTask = (tasks: TaskType[]): TaskType[] => {
            return tasks.filter(task => {
              if (task.id === taskId) {
                return false;
              }
              if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks = removeTask(task.subtasks);
              }
              return true;
            });
          };
          return removeTask(prevTasks);
        });
      } else {
        console.error('Failed to delete task:', result.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  const handleAddSubtask = async (parentTaskId: number, subtaskData: Partial<TaskType>) => {
    if (!user) return;
    try {
      const newSubtask = await createTask({
        ...subtaskData,
        parent_task_id: parentTaskId,
        user_id: user.id,
      });

      setTasks(prevTasks => {
        const updateSubtasks = (tasks: TaskType[]): TaskType[] => {
          return tasks.map(task => {
            if (task.id === parentTaskId) {
              return {
                ...task,
                subtasks: [...(task.subtasks || []), newSubtask as TaskType]
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
  };

  const addMember = (newMember: string) => {
    setMembers([...members, newMember])
  }

  const removeMember = (memberToRemove: string) => {
    setMembers(members.filter(member => member !== memberToRemove))
  }

  const calculateTotalTime = (t: TaskType): number => {
    if (t.subtasks && t.subtasks.length > 0) {
      return t.subtasks.reduce((acc, subtask) => acc + calculateTotalTime(subtask), 0)
    }
    return t.estimated_time
  }

  const handleTaskCreated = (newTask: TaskType) => {
    setTasks(prevTasks => sortTasksByRecent([...prevTasks, newTask]));
    setShowCreateTaskForm(false);
  }

  if (!user) {
    return <Login />
  }

  const filteredTasks = filterTasks(
    user.role === 'admin' 
      ? tasks 
      : tasks.filter(task => 
          task.assigned_user_name === user.name || 
          task.subtasks?.some(subtask => subtask.assigned_user_name === user.name)
        )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Task Management</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user.name} ({user.role})</span>
            <Button onClick={logout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
        
        {user.role === 'admin' && (
          <MemberManagement
            members={members}
            onAddMember={addMember}
            onRemoveMember={removeMember}
          />
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              {user.role === 'admin' && (
                <Button onClick={() => setShowCreateTaskForm(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Task
                </Button>
              )}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <Select onValueChange={setFilterStatus} value={filterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {showCreateTaskForm && (
              <CreateTask 
                onTaskCreated={handleTaskCreated} 
                onCancel={() => setShowCreateTaskForm(false)}
              />
            )}

            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="pending_approval">Pending Approval</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <AnimatePresence>
                  {filteredTasks.map(task => (
                    <Task
                      key={task.id}
                      task={task}
                      members={members}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      onAddSubtask={handleAddSubtask}
                      currentUser={{
                        id: user.id,
                        name: user.name,
                        role: user.role
                      }}
                      depth={0}  // Add this line to provide the depth prop
                    />
                  ))}
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="in_progress">
                <AnimatePresence>
                  {filteredTasks.filter(task => task.status === 'in_progress').map(task => (
                    <Task
                      key={task.id}
                      task={task}
                      members={members}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      onAddSubtask={handleAddSubtask}
                      currentUser={{
                        id: user.id,
                        name: user.name,
                        role: user.role
                      }}
                      depth={0}  // Add this line
                    />
                  ))}
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="pending_approval">
                <AnimatePresence>
                  {filteredTasks.filter(task => task.status === 'pending_approval').map(task => (
                    <Task
                      key={task.id}
                      task={task}
                      members={members}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      onAddSubtask={handleAddSubtask}
                      currentUser={{
                        id: user.id,
                        name: user.name,
                        role: user.role
                      }}
                      depth={0}  // Add this line
                    />
                  ))}
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="completed">
                <AnimatePresence>
                  {filteredTasks.filter(task => task.status === 'completed').map(task => (
                    <Task
                      key={task.id}
                      task={task}
                      members={members}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      onAddSubtask={handleAddSubtask}
                      currentUser={{
                        id: user.id,
                        name: user.name,
                        role: user.role
                      }}
                      depth={0}  // Add this line
                    />
                  ))}
                </AnimatePresence>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-right">
              <span className="text-lg font-semibold">
                Total Estimated Time: {filteredTasks.reduce((acc, task) => acc + calculateTotalTime(task), 0)} minutes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductivityApp;