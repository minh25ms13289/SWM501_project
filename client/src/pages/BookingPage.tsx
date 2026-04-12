import React, { useState, useEffect } from 'react';
import { Card, Calendar, Badge, Modal, Select, Button, message, List, Tag } from 'antd';
import api from '../services/api';
import dayjs from 'dayjs';

interface Slot {
  date: string; time: string; instructorId: number; instructorName: string;
  currentBookings: number; maxBookings: number; vehiclePlate: string; available: boolean;
}

const BookingPage: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSlots();
    loadMyBookings();
  }, []);

  const loadSlots = async () => {
    const { data } = await api.get('/sessions/available', { params: { weekStart: dayjs().startOf('week').format('YYYY-MM-DD') } });
    setSlots(data.slots || []);
  };

  const loadMyBookings = async () => {
    const { data } = await api.get('/bookings/my', { params: { status: 'upcoming', limit: 5 } });
    setMyBookings(data || []);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      await api.post('/bookings', {
        date: selectedSlot.date, time: selectedSlot.time, instructorId: selectedSlot.instructorId
      });
      message.success('Session booked successfully!');
      setSelectedSlot(null);
      loadSlots();
      loadMyBookings();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Booking failed');
    }
    setLoading(false);
  };

  const handleCancel = async (bookingId: number) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      message.success('Booking cancelled');
      loadMyBookings();
      loadSlots();
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Cannot cancel');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <Card title="Weekly Schedule" style={{ flex: 3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} style={{ fontWeight: 'bold', textAlign: 'center', padding: 8 }}>{day}</div>
          ))}
          {slots.map((slot, i) => (
            <div key={i} onClick={() => slot.available && setSelectedSlot(slot)}
              style={{
                padding: 8, borderRadius: 6, textAlign: 'center', cursor: slot.available ? 'pointer' : 'default',
                background: slot.available ? '#f6ffed' : slot.currentBookings >= 3 ? '#fff2f0' : '#f5f5f5',
                border: `1px solid ${slot.available ? '#b7eb8f' : '#ffa39e'}`,
              }}>
              <div>{slot.time}</div>
              <Badge count={`${slot.currentBookings}/${slot.maxBookings}`}
                style={{ backgroundColor: slot.available ? '#52c41a' : '#ff4d4f' }} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="My Upcoming Bookings" style={{ flex: 1 }}>
        <List dataSource={myBookings} renderItem={(b: any) => (
          <List.Item actions={[<Button danger size="small" onClick={() => handleCancel(b.id)}>Cancel</Button>]}>
            <div>{b.date} {b.time}<br/><Tag>{b.instructorName}</Tag></div>
          </List.Item>
        )} />
      </Card>

      <Modal title="Confirm Booking" open={!!selectedSlot} onOk={handleBook} onCancel={() => setSelectedSlot(null)} confirmLoading={loading}>
        {selectedSlot && (
          <div>
            <p><strong>Date:</strong> {selectedSlot.date}</p>
            <p><strong>Time:</strong> {selectedSlot.time}</p>
            <p><strong>Instructor:</strong> {selectedSlot.instructorName}</p>
            <p><strong>Vehicle:</strong> {selectedSlot.vehiclePlate}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingPage;
