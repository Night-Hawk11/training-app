import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodayScreen from './screens/TodayScreen';
import ReadinessScreen from './screens/ReadinessScreen';
import MorningEIScreen from './screens/MorningEIScreen';
import ReEducationScreen from './screens/ReEducationScreen';
import RapidResponseScreen from './screens/RapidResponseScreen';
import PreviewScreen from './screens/PreviewScreen';
import CalendarScreen from './screens/CalendarScreen';
import GymSessionScreen from './screens/GymSessionScreen';
import TestScreen from './screens/TestScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProgressScreen from './screens/ProgressScreen';
import SettingsScreen from './screens/SettingsScreen';
import ExercisesDebugScreen from './screens/ExercisesDebugScreen';
import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/readiness" element={<ReadinessScreen />} />
        <Route path="/morning-ei" element={<MorningEIScreen />} />
        <Route path="/re-education" element={<ReEducationScreen />} />
        <Route path="/rapid-response" element={<RapidResponseScreen />} />
        <Route path="/preview/:date" element={<PreviewScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/session" element={<GymSessionScreen />} />
        <Route path="/test" element={<TestScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/_debug/exercises" element={<ExercisesDebugScreen />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
