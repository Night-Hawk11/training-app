import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodayScreen from './screens/TodayScreen';
import ReadinessScreen from './screens/ReadinessScreen';
import MorningEIScreen from './screens/MorningEIScreen';
import ReEducationScreen from './screens/ReEducationScreen';
import RapidResponseScreen from './screens/RapidResponseScreen';
import GymSessionScreen from './screens/GymSessionScreen';
import RunScreen from './screens/RunScreen';
import TestScreen from './screens/TestScreen';
import HistoryScreen from './screens/HistoryScreen';
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
        <Route path="/session" element={<GymSessionScreen />} />
        <Route path="/run" element={<RunScreen />} />
        <Route path="/test" element={<TestScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/_debug/exercises" element={<ExercisesDebugScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
