'use client';

import React from 'react';
import { Card, Result, Button, Typography } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface ComingSoonProps {
  title: string;
  description?: string;
  features?: string[];
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title, 
  description = "This feature is currently under development and will be available soon.", 
  features = [] 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="max-w-2xl w-full">
        <Result
          icon={<ToolOutlined className="text-blue-500" />}
          title={<Title level={3}>{title}</Title>}
          subTitle={description}
          extra={
            <div className="space-y-4">
              {features.length > 0 && (
                <div className="text-left">
                  <Title level={5}>Planned Features:</Title>
                  <ul className="list-disc list-inside space-y-1">
                    {features.map((feature, index) => (
                      <li key={index} className="text-gray-600">{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button type="primary" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default ComingSoon;
