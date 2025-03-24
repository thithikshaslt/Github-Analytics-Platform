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
        const response = await getCommits(username, 1, 1000); // Fetch up to 1000 commits
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
              borderColor: '#5a329f', // Darker GitHub purple
              backgroundColor: 'rgba(90, 50, 159, 0.2)', // Purple fill with opacity
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
      legend: {
        position: 'top',
        labels: { color: '#e5e5e5' }, // White legend text
      },
      title: {
        display: true,
        text: `Commit Activity for ${username}`,
        color: '#e5e5e5', // White title
      },
      tooltip: {
        backgroundColor: 'rgba(32, 32, 32, 0.8)', // Dark tooltip
        titleColor: '#e5e5e5',
        bodyColor: '#e5e5e5',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date', color: '#e5e5e5' },
        ticks: { color: '#e5e5e5' }, // White ticks
        grid: { color: 'rgba(255, 255, 255, 0.1)' }, // Subtle white grid
      },
      y: {
        title: { display: true, text: 'Number of Commits', color: '#e5e5e5' },
        ticks: { color: '#e5e5e5' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background p-6 dark">
      <h1 className="text-3xl text-foreground mb-6">Commits Dashboard for {username}</h1>
      {error && <p className="text-destructive mb-4">Error: {error}</p>}
      {chartData ? (
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground mb-4">Total Commits: {totalCommits}</p>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <p className="text-foreground">Loading commits...</p>
      )}
    </div>
  );
}

export default CommitsDashboard;