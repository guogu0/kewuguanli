import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route,
  createRoutesFromElements,
} from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from './components/Navbar.tsx';
import DataUpload from './pages/DataUpload.tsx';
import Statistics from './pages/Statistics.tsx';
import ScheduleQuery from './pages/ScheduleQuery.tsx';
import FreeTeacherQuery from './pages/FreeTeacherQuery.tsx';

const { Content } = Layout;

// 启用 v7 future flags
const router = createRoutesFromElements(
  <Route>
    <Route path="/" element={<DataUpload />} />
    <Route path="/statistics" element={<Statistics />} />
    <Route path="/schedule" element={<ScheduleQuery />} />
    <Route path="/free-teachers" element={<FreeTeacherQuery />} />
  </Route>
);

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Content style={{ padding: '24px', background: '#fff' }}>
          <Routes>
            <Route path="/" element={<DataUpload />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/schedule" element={<ScheduleQuery />} />
            <Route path="/free-teachers" element={<FreeTeacherQuery />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

export default App; 