import React from 'react';
import { Button } from './ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Task } from '../utils/api';  // Adjust the import path if necessary

interface TaskItemProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  // Add other props as needed
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate }) => {
  return (
    <div className={`task-item p-4 border rounded-lg mb-4`}>
      <h3 className="text-lg font-semibold">{task.title}</h3>
      <p className="text-gray-600">{task.description}</p>
      <p className="text-sm text-gray-500">
        Estimated Time: {task.estimated_time} minutes
      </p>
      <div className="mt-2 flex space-x-2">
        <Button onClick={() => onUpdate(task)} variant="outline">
          {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
        </Button>
        <Button onClick={() => onUpdate(task)} variant="outline">
          <Edit className="w-4 h-4 mr-2" /> Edit
        </Button>
        <Button onClick={() => onUpdate(task)} variant="destructive">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
      </div>
    </div>
  );
};

export default TaskItem;