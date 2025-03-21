import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import AnalysisInsights from './pages/Insights';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/insights/:username" element={<AnalysisInsights />} />
    </Routes>
  );
}

export default App;