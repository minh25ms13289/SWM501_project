import React, { useEffect, useState } from 'react';
import { Card, Progress, Row, Col, Tag, Button, List, Typography, Badge } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface ProgressData {
  theoryHours: { completed: number; required: number };
  cabinHours: { completed: number; required: number };
  practicalHours: { completed: number; required: number };
  examReady: boolean;
}

const LearnerDashboard: React.FC = () => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);

  useEffect(() => {
    loadProgress();
    loadRecommendations();
    loadWeakAreas();
  }, []);

  const loadProgress = async () => {
    try {
      const { data } = await api.get('/learners/me/progress');
      setProgress(data);
    } catch {}
  };

  const loadRecommendations = async () => {
    try {
      const { data } = await api.get('/learners/me/recommendations');
      setRecommendations(data.recommendations?.nextSessions || []);
    } catch {}
  };

  const loadWeakAreas = async () => {
    try {
      const { data } = await api.get('/learners/me/theory/weak-areas');
      setWeakAreas(data.weakAreas || []);
    } catch {}
  };

  const pct = (c: number, r: number) => Math.round((c / r) * 100);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Learner Dashboard</Title>

      {/* Progress Section */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {progress && (
          <>
            <Col span={6}>
              <Card><Text>Theory Hours</Text>
                <Progress percent={pct(progress.theoryHours.completed, progress.theoryHours.required)}
                  format={() => `${progress.theoryHours.completed}/${progress.theoryHours.required}h`} />
              </Card>
            </Col>
            <Col span={6}>
              <Card><Text>Cabin Hours</Text>
                <Progress percent={pct(progress.cabinHours.completed, progress.cabinHours.required)}
                  format={() => `${progress.cabinHours.completed}/${progress.cabinHours.required}h`} />
              </Card>
            </Col>
            <Col span={6}>
              <Card><Text>Practical Hours</Text>
                <Progress percent={pct(progress.practicalHours.completed, progress.practicalHours.required)}
                  format={() => `${progress.practicalHours.completed}/${progress.practicalHours.required}h`} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                {progress.examReady
                  ? <Badge status="success" text={<Text strong style={{ color: '#52c41a' }}>San sang thi</Text>} />
                  : <Badge status="warning" text={<Text>Not ready</Text>} />
                }
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* AI Recommendations */}
      <Card title="Recommended for You" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {recommendations.map((rec, i) => (
            <Col span={8} key={i}>
              <Card size="small" actions={[<Button type="primary" size="small">Book Now</Button>]}>
                <p><strong>{rec.date}</strong> {rec.time}</p>
                <p>{rec.instructorName}</p>
                <Tag color="blue">Match: {Math.round(rec.matchScore * 100)}%</Tag>
                <p><small>{rec.reason}</small></p>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Weak Areas */}
      <Card title="Areas to Improve">
        <List dataSource={weakAreas} renderItem={(area: any) => (
          <List.Item actions={[<Button size="small">Practice Now</Button>]}>
            <List.Item.Meta title={area.category}
              description={<Progress percent={Math.round(area.accuracy * 100)} status={area.accuracy < 0.5 ? 'exception' : 'normal'} />} />
          </List.Item>
        )} />
      </Card>
    </div>
  );
};

export default LearnerDashboard;
