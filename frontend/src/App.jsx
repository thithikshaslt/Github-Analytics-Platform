import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import AnalysisInsights from './pages/Insights';
import CommitsDashboard from './pages/CommitsDashboard';

function App() {
  return (
    <Router>
      <div className="w-full">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/insights/:username" element={<AnalysisInsights />} />
          <Route path="/commits/:username" element={<CommitsDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;