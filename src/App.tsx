import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodayScreen from './screens/TodayScreen';
import ExercisesDebugScreen from './screens/ExercisesDebugScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/_debug/exercises" element={<ExercisesDebugScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
