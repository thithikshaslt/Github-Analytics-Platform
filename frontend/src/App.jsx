import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import AnalysisInsights from './pages/Insights';
import CommitsDashboard from './pages/CommitsDashboard';
import TopRepos from './pages/TopRepos';
import CodebaseIntelligence from './pages/CodebaseIntelligence';

function App() {
  return (
    <Router>
      <div className="w-full">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/insights/:username" element={<AnalysisInsights />} />
          <Route path="/commits/:username" element={<CommitsDashboard />} />
          <Route path="/top-repos/:username" element={<TopRepos />} />
          <Route path="/intelligence" element={<CodebaseIntelligence />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;