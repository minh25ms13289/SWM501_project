import React, { useState, useEffect } from 'react';
import { Card, Button, Radio, Progress, Tag, Result, Typography, Space } from 'antd';
import { ClockCircleOutlined, StarFilled } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface Question {
  id: number; text: string; options: string[]; isCritical: boolean;
}

const TheoryTestPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1140); // 19 minutes
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [testId, setTestId] = useState<number | null>(null);

  const startTest = async () => {
    const { data } = await api.post('/theory-tests/start', { licenceCategory: 'B2' });
    setTestId(data.testId);
    setQuestions(data.questions);
    setTimeLeft(data.timeLimit);
  };

  useEffect(() => {
    if (timeLeft <= 0 && questions.length > 0 && !submitted) handleSubmit();
    if (questions.length === 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, questions, submitted]);

  const handleSubmit = async () => {
    const answerList = Object.entries(answers).map(([qId, opt]) => ({
      questionId: parseInt(qId), selectedOption: opt
    }));
    const { data } = await api.post(`/theory-tests/${testId}/submit`, { answers: answerList });
    setResults(data);
    setSubmitted(true);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (questions.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Title level={3}>Theory Practice Test</Title>
        <p>25 questions, 19 minutes (B2 format)</p>
        <Button type="primary" size="large" onClick={startTest}>Start Test</Button>
      </div>
    );
  }

  if (submitted && results) {
    return (
      <div style={{ padding: 24 }}>
        <Result status={results.passed ? 'success' : 'error'}
          title={results.passed ? 'Passed!' : 'Failed'}
          subTitle={`Score: ${results.score}/${results.totalQuestions}`} />
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Tag color={timeLeft < 120 ? 'red' : 'blue'} icon={<ClockCircleOutlined />}>
          {formatTime(timeLeft)}
        </Tag>
        <Text>{currentIdx + 1} / {questions.length}</Text>
      </div>

      <Card title={<>{q.isCritical && <StarFilled style={{ color: 'red', marginRight: 8 }} />}Question {currentIdx + 1}</>}>
        <p>{q.text}</p>
        <Radio.Group value={answers[q.id]} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}>
          <Space direction="vertical">
            {q.options.map((opt, i) => <Radio key={i} value={String.fromCharCode(65 + i)}>{opt}</Radio>)}
          </Space>
        </Radio.Group>
      </Card>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {questions.map((_, i) => (
          <Button key={i} size="small" type={i === currentIdx ? 'primary' : answers[questions[i].id] ? 'default' : 'dashed'}
            onClick={() => setCurrentIdx(i)}>{i + 1}</Button>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>Previous</Button>
        {currentIdx < questions.length - 1
          ? <Button type="primary" onClick={() => setCurrentIdx(i => i + 1)}>Next</Button>
          : <Button type="primary" danger onClick={handleSubmit}>Submit Test</Button>
        }
      </div>
    </div>
  );
};

export default TheoryTestPage;
