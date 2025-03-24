import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCommits } from '../services/api';
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
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function CommitsDashboard() {
  const { username } = useParams();
  const [commits, setCommits] = useState([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        // Fetch all commits (no pagination for simplicity—adjust if needed)
        const response = await getCommits(username, 1, 1000); // Bump perPage to get more
        console.log("Commits Response:", response.data);
        setCommits(response.data.commits);
        setTotalCommits(response.data.totalCommits);

        // Process commits for chart
        const commitDates = response.data.commits.reduce((acc, commit) => {
          const date = new Date(commit.date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }); // e.g., "Mar 2025"
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const labels = Object.keys(commitDates).sort((a, b) => new Date(a) - new Date(b));
        const data = labels.map((label) => commitDates[label]);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Commits Over Time',
              data,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      }
    };
    fetchCommits();
  }, [username]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Commit Activity for ${username}` },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Number of Commits' }, beginAtZero: true },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl text-gray-900 mb-6">Commits Dashboard for {username}</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {chartData ? (
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 mb-4">Total Commits: {totalCommits}</p>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <p className="text-gray-900">Loading commits...</p>
      )}
    </div>
  );
}

export default CommitsDashboard;