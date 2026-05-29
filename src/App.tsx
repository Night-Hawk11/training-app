import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodayScreen from './screens/TodayScreen';
import ReadinessScreen from './screens/ReadinessScreen';
import MorningEIScreen from './screens/MorningEIScreen';
import ReEducationScreen from './screens/ReEducationScreen';
import RapidResponseScreen from './screens/RapidResponseScreen';
import ExercisesDebugScreen from './screens/ExercisesDebugScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/readiness" element={<ReadinessScreen />} />
        <Route path="/morning-ei" element={<MorningEIScreen />} />
        <Route path="/re-education" element={<ReEducationScreen />} />
        <Route path="/rapid-response" element={<RapidResponseScreen />} />
        <Route path="/_debug/exercises" element={<ExercisesDebugScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
