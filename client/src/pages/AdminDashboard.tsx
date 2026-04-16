import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../services/api';

const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any>({});
  const [forecast, setForecast] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
    loadForecast();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard/sessions/today');
      setKpis(data.kpis || {});
      setSessions(data.sessions || []);
    } catch {}
  };

  const loadForecast = async () => {
    try {
      const { data } = await api.get('/admin/forecast');
      setForecast(data.forecast || []);
    } catch {}
  };

  const chartData = forecast.map((f, i) => ({
    week: `Week ${i + 1}`,
    sessions: f.totalSessions,
    instructors: f.recommendedInstructors,
  }));

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Admin Dashboard</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Total Sessions Today" value={kpis.totalSessions || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Learners Served" value={kpis.totalLearners || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Instructor Utilisation" value={kpis.instructorUtilisation || 0} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="Cancelled" value={kpis.cancelledSessions || 0} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>

      <Card title="AI Demand Forecast (Next 4 Weeks)" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sessions" fill="#1890ff" name="Predicted Sessions" />
            <Bar dataKey="instructors" fill="#52c41a" name="Recommended Instructors" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Today's Sessions">
        <Table dataSource={sessions} rowKey="id" columns={[
          { title: 'Time', dataIndex: 'startTime' },
          { title: 'Instructor', dataIndex: 'instructor' },
          { title: 'Learners', dataIndex: 'learnerCount' },
          { title: 'Status', dataIndex: 'status', render: (s: string) => (
            <Tag color={s === 'completed' ? 'green' : s === 'in_progress' ? 'blue' : s === 'cancelled' ? 'red' : 'default'}>{s}</Tag>
          )},
        ]} />
      </Card>
    </div>
  );
};

export default AdminDashboard;
