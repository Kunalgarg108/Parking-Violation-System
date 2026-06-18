import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PriorityDistributionData } from '../../types';

interface PriorityDistributionProps {
  data: PriorityDistributionData;
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
};

export const PriorityDistribution: React.FC<PriorityDistributionProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = [
    { level: 'Low', count: data.low },
    { level: 'Medium', count: data.medium },
    { level: 'High', count: data.high },
    { level: 'Critical', count: data.critical },
  ];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Priority Level Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="level" label={{ value: 'Priority Level', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Zone Count', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="count" name="Zones">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.level]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriorityDistribution;
