import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCommits } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function CommitsDashboard() {
  const { username } = useParams();
  const [commits, setCommits] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCommits(username)
      .then((response) => {
        setCommits(response.data.commits);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(err.message);
      });
  }, [username]);

  // Aggregate commits by date (daily count)
  const commitDates = commits.reduce((acc, commit) => {
    const date = new Date(commit.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(commitDates),
    datasets: [
      {
        label: 'Commits Over Time',
        data: Object.values(commitDates),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `${username}'s Commit Activity` },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 w-full">
      <h1 className="text-3xl text-gray-900 mb-6">Commits Dashboard for {username}</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {commits.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <Line data={chartData} options={options} />
          <p className="mt-4 text-gray-600">Total Commits: {commits.length}</p>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-900">Loading...</span>
        </div>
      )}
    </div>
  );
}

export default CommitsDashboard;