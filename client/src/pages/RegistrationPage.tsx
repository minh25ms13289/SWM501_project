import React, { useState } from 'react';
import { Steps, Form, Input, Select, Upload, Button, DatePicker, Card, Result, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import api from '../services/api';

const RegistrationPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = ['Personal Details', 'Documents', 'Review & Submit'];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue(true);
      const { data } = await api.post('/registrations', {
        ...values, dob: values.dob?.format('YYYY-MM-DD')
      });
      setReferenceNumber(data.referenceNumber);
      setStep(3);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  if (step === 3) {
    return <Result status="success" title="Registration Submitted!"
      subTitle={`Reference: ${referenceNumber}. Check your email for confirmation.`} />;
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <Steps current={step} items={steps.map(s => ({ title: s }))} style={{ marginBottom: 32 }} />
      <Card>
        <Form form={form} layout="vertical">
          {step === 0 && <>
            <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
              <Input placeholder="Nguyen Van A" />
            </Form.Item>
            <Form.Item name="dob" label="Date of Birth" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="cccd" label="CCCD (12 digits)" rules={[{ required: true, pattern: /^\d{12}$/, message: 'Must be 12 digits' }]}>
              <Input placeholder="012345678901" maxLength={12} />
            </Form.Item>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
              <Input placeholder="0901234567" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="email@example.com" />
            </Form.Item>
            <Form.Item name="licenceCategory" label="Licence Category" rules={[{ required: true }]}>
              <Select options={[{ value: 'B1', label: 'B1' }, { value: 'B2', label: 'B2' }, { value: 'C', label: 'C' }]} />
            </Form.Item>
          </>}
          {step === 1 && <>
            <Form.Item label="ID Card (PDF/JPG, max 5MB)">
              <Upload maxCount={1} accept=".pdf,.jpg,.jpeg" beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Upload ID Card</Button>
              </Upload>
            </Form.Item>
            <Form.Item label="Medical Certificate">
              <Upload maxCount={1} accept=".pdf,.jpg,.jpeg" beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Upload Medical Cert</Button>
              </Upload>
            </Form.Item>
          </>}
          {step === 2 && <div>
            <p><strong>Name:</strong> {form.getFieldValue('fullName')}</p>
            <p><strong>CCCD:</strong> {form.getFieldValue('cccd')}</p>
            <p><strong>Category:</strong> {form.getFieldValue('licenceCategory')}</p>
            <p><strong>Email:</strong> {form.getFieldValue('email')}</p>
          </div>}
        </Form>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          {step > 0 && <Button onClick={() => setStep(s => s - 1)}>Back</Button>}
          {step < 2 ? <Button type="primary" onClick={() => setStep(s => s + 1)}>Next</Button>
            : <Button type="primary" onClick={handleSubmit} loading={loading}>Submit Registration</Button>}
        </div>
      </Card>
    </div>
  );
};

export default RegistrationPage;
