import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodayScreen from './screens/TodayScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TodayScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
