import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Task } from '../utils/api';  // Adjust the import path if necessary

interface TaskFormProps {
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
  initialData?: Partial<Task>;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, initialData = {} }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [estimatedTime, setEstimatedTime] = useState(initialData?.estimated_time || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      estimated_time: estimatedTime,
    });
    // Reset form fields if needed
    setTitle('');
    setDescription('');
    setEstimatedTime(0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
        <Input
          id="estimatedTime"
          type="number"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update Task' : 'Add Task'}</Button>
      </div>
    </form>
  );
};

export default TaskForm;