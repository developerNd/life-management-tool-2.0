import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Props {
  members: string[];
  onAddMember: (member: string) => void;
  onRemoveMember: (member: string) => void;
}

const MemberManagement = ({ members, onAddMember, onRemoveMember }: Props) => {
  const [newMember, setNewMember] = useState('');

  const handleAddMember = () => {
    if (newMember.trim()) {
      onAddMember(newMember.trim());
      setNewMember('');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Team Member Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row mb-4">
          <Input
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder="Enter member name"
            className="mb-2 sm:mb-0 sm:mr-2"
          />
          <Button onClick={handleAddMember}>Add Member</Button>
        </div>
        <ul className="space-y-2">
          {members.map((member, index) => (
            <li key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
              <span className="font-medium">{member}</span>
              <Button onClick={() => onRemoveMember(member)} variant="destructive" size="sm">
                <Trash2 size={16} />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MemberManagement;