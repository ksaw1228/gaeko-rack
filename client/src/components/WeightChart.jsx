import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function WeightChart({ careLogs, onClose }) {
  // 체중 기록만 필터링하고 날짜순 정렬
  const weightLogs = careLogs
    .filter(log => log.type === 'WEIGHT' && log.value)
    .map(log => ({
      date: new Date(log.createdAt),
      weight: parseFloat(log.value.replace('g', ''))
    }))
    .filter(log => !isNaN(log.weight))
    .sort((a, b) => a.date - b.date);

  if (weightLogs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-lg p-5" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">📊 체중 그래프</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl"
            >
              &times;
            </button>
          </div>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚖️</div>
            <p className="text-gray-500">체중 기록이 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">체중을 기록하면 그래프로 확인할 수 있어요</p>
          </div>
        </div>
      </div>
    );
  }

  const labels = weightLogs.map(log => {
    const month = log.date.getMonth() + 1;
    const day = log.date.getDate();
    return `${month}/${day}`;
  });

  const weights = weightLogs.map(log => log.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightDiff = maxWeight - minWeight;

  const data = {
    labels,
    datasets: [
      {
        label: '체중 (g)',
        data: weights,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 14
        },
        padding: 12,
        callbacks: {
          title: (items) => {
            const idx = items[0].dataIndex;
            const log = weightLogs[idx];
            return log.date.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label: (item) => ` ${item.raw}g`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280'
        }
      },
      y: {
        min: Math.max(0, minWeight - weightDiff * 0.2 - 5),
        max: maxWeight + weightDiff * 0.2 + 5,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280',
          callback: (value) => `${value}g`
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // 통계 계산
  const latestWeight = weights[weights.length - 1];
  const firstWeight = weights[0];
  const totalChange = latestWeight - firstWeight;
  const avgWeight = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">📊 체중 그래프</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl"
          >
            &times;
          </button>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">현재</p>
            <p className="text-xl font-bold text-gray-800">{latestWeight}g</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">평균</p>
            <p className="text-xl font-bold text-gray-800">{avgWeight}g</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">변화</p>
            <p className={`text-xl font-bold ${totalChange > 0 ? 'text-emerald-600' : totalChange < 0 ? 'text-red-500' : 'text-gray-800'}`}>
              {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}g
            </p>
          </div>
        </div>

        {/* 그래프 */}
        <div className="bg-gray-50 rounded-xl p-4" style={{ height: '300px' }}>
          <Line data={data} options={options} />
        </div>

        {/* 기록 수 */}
        <p className="text-center text-gray-400 text-sm mt-4">
          총 {weightLogs.length}회 기록
        </p>
      </div>
    </div>
  );
}
