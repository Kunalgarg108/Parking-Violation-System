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
import { HistogramBin } from '../../types';

interface RiskHistogramProps {
  data: HistogramBin[];
}

function getBinColor(binStart: number): string {
  if (binStart >= 80) return '#ef4444';   // red
  if (binStart >= 60) return '#f97316';   // orange
  if (binStart >= 40) return '#eab308';   // yellow
  return '#22c55e';                        // green
}

export const RiskHistogram: React.FC<RiskHistogramProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data.map((bin) => ({
    label: `${bin.binStart}-${bin.binEnd}`,
    count: bin.count,
    binStart: bin.binStart,
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Risk Score Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" label={{ value: 'Risk Score Range', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Zone Count', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="count" name="Zones">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBinColor(entry.binStart)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskHistogram;
