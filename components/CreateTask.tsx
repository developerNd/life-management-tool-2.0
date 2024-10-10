import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createTask, getUsers, Task as ApiTask } from '../utils/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Clock, User as UserIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
}

interface CreateTaskProps {
  parentTaskId?: number;
  onTaskCreated: (newTask: ApiTask) => void;
  onCancel: () => void;
}

const CreateTask: React.FC<CreateTaskProps> = ({ parentTaskId, onTaskCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'days'>('minutes');
  const [assignedUserName, setAssignedUserName] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    estimatedTime: '',
    assignedUserName: '',
    startDate: '',
    startTime: '',
    deadlineDate: '',
    deadlineTime: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      description: '',
      estimatedTime: '',
      assignedUserName: '',
      startDate: '',
      startTime: '',
      deadlineDate: '',
      deadlineTime: '',
    };

    if (!title.trim()) {
      newErrors.title = 'Task title is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Task description is required';
      isValid = false;
    }

    if (estimatedTime <= 0) {
      newErrors.estimatedTime = 'Estimated time must be greater than 0';
      isValid = false;
    }

    if (!assignedUserName) {
      newErrors.assignedUserName = 'Please assign the task to a user';
      isValid = false;
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
      isValid = false;
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
      isValid = false;
    }

    if (!deadlineDate) {
      newErrors.deadlineDate = 'Deadline date is required';
      isValid = false;
    }
    if (!deadlineTime) {
      newErrors.deadlineTime = 'Deadline time is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isCreating) return;

    if (!validateForm()) return;

    setIsCreating(true);
    const assignedUser = users.find(u => u.name === assignedUserName);

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${deadlineDate}T${deadlineTime}`);

    try {
      const newTask = await createTask({
        title,
        description,
        estimated_time: timeUnit === 'days' ? estimatedTime * 24 * 60 : estimatedTime,
        assigned_user_name: assignedUserName,
        assigned_user_id: assignedUser?.id,
        parent_task_id: parentTaskId,
        status: 'in_progress',
        user_id: user.id,
        start_date: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
        end_date: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
      });
      
      onTaskCreated(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
              className="w-full"
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Task Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              required
              className="w-full"
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Input
                  id="estimatedTime"
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
                  placeholder="Estimated Time"
                  required
                  className="flex-grow"
                />
                <Select onValueChange={(value: 'minutes' | 'days') => setTimeUnit(value)} value={timeUnit}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.estimatedTime && <p className="text-red-500 text-sm">{errors.estimatedTime}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedUser">Assign To</Label>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Select onValueChange={setAssignedUserName} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assign to" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.assignedUserName && <p className="text-red-500 text-sm">{errors.assignedUserName}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="flex-grow"
                />
              </div>
              {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="flex-grow"
                />
              </div>
              {errors.startTime && <p className="text-red-500 text-sm">{errors.startTime}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadlineDate">Deadline Date</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Input
                  id="deadlineDate"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                  className="flex-grow"
                />
              </div>
              {errors.deadlineDate && <p className="text-red-500 text-sm">{errors.deadlineDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadlineTime">Deadline Time</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Input
                  id="deadlineTime"
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  required
                  className="flex-grow"
                />
              </div>
              {errors.deadlineTime && <p className="text-red-500 text-sm">{errors.deadlineTime}</p>}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isCreating} onClick={handleSubmit}>
          {isCreating ? 'Creating...' : 'Create Task'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateTask;