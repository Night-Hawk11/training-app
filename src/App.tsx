import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodayScreen from './screens/TodayScreen';
import ReadinessScreen from './screens/ReadinessScreen';
import MorningEIScreen from './screens/MorningEIScreen';
import ExercisesDebugScreen from './screens/ExercisesDebugScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/readiness" element={<ReadinessScreen />} />
        <Route path="/morning-ei" element={<MorningEIScreen />} />
        <Route path="/_debug/exercises" element={<ExercisesDebugScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
