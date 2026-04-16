import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Checkbox, Modal, Input, message, Typography, Badge } from 'antd';
import api from '../services/api';

const { Title } = Typography;

interface Session {
  sessionId: number; date: string; startTime: string; endTime: string;
  location: string; learners: { id: number; name: string }[];
  vehiclePlate: string; status: string;
}

const InstructorDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceModal, setAttendanceModal] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    try {
      const { data } = await api.get('/instructors/me/schedule');
      setSessions(data || []);
    } catch {}
  };

  const handleComplete = async () => {
    if (!attendanceModal) return;
    const attendanceList = Object.entries(attendance).map(([id, present]) => ({
      learnerId: parseInt(id), present
    }));
    try {
      await api.put(`/sessions/${attendanceModal.sessionId}/complete`, { attendance: attendanceList });
      message.success('Session marked as completed');
      setAttendanceModal(null);
      loadSchedule();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed');
    }
  };

  const statusColor = (s: string) => ({ scheduled: 'blue', in_progress: 'processing', completed: 'green', cancelled: 'red' }[s] || 'default');

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>My Schedule</Title>
      <List dataSource={sessions} renderItem={(s) => (
        <Card style={{ marginBottom: 12, borderLeft: `4px solid ${s.status === 'completed' ? '#52c41a' : '#1890ff'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Tag color={statusColor(s.status) as any}>{s.status}</Tag>
              <strong>{s.date} {s.startTime}–{s.endTime}</strong> | {s.location} | {s.vehiclePlate}
              <div style={{ marginTop: 8 }}>
                Learners: {s.learners.map(l => <Tag key={l.id}>{l.name}</Tag>)}
              </div>
            </div>
            {s.status === 'scheduled' && (
              <Button type="primary" onClick={() => {
                setAttendanceModal(s);
                setAttendance(Object.fromEntries(s.learners.map(l => [l.id, true])));
              }}>Mark Complete</Button>
            )}
          </div>
        </Card>
      )} />

      <Modal title="Mark Attendance" open={!!attendanceModal} onOk={handleComplete} onCancel={() => setAttendanceModal(null)}>
        {attendanceModal?.learners.map(l => (
          <div key={l.id} style={{ marginBottom: 8 }}>
            <Checkbox checked={attendance[l.id]} onChange={e => setAttendance({ ...attendance, [l.id]: e.target.checked })}>
              {l.name}
            </Checkbox>
          </div>
        ))}
      </Modal>
    </div>
  );
};

export default InstructorDashboard;
