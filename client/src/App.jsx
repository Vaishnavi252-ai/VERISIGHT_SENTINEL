import React from 'react';
import { Routes, Route } from 'react-router-dom';

// 1. Import your new Landing page
import Landing from './pages/Landing'; 
import Detection from './pages/Detection';
import ImageScan from './pages/ImageScan';
import VideoScan from './pages/VideoScan';
import AudioScan from './pages/AudioScan';
import TextScan from './pages/TextScan';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Explain from './pages/Explain';
import ReportPage from './pages/Report';
import AdminDashboard from './pages/AdminDashboard';
import AdminReportView from './pages/AdminReportView';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import useScrollReveal from './hooks/useScrollReveal';
import GlobalHeatLive from './pages/GlobalHeatLive';
import VerifySuccess from './pages/VerifySuccess';

function App() {
  useScrollReveal();

  return (
    <div className="App">
      <Routes>
        {/* 2. Set Landing page as the home page for "/" */}
        <Route path="/" element={<Landing />} /> 
        
        {/* 3. Move Detection page to "/detection" */}
        <Route path="/detection" element={<ProtectedRoute><Detection /></ProtectedRoute>} />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* These routes are correct */}
        <Route path="/image-scan" element={<ProtectedRoute><ImageScan /></ProtectedRoute>} />
        <Route path="/video-scan" element={<ProtectedRoute><VideoScan /></ProtectedRoute>} />
        <Route path="/audio-scan" element={<ProtectedRoute><AudioScan /></ProtectedRoute>} />
        <Route path="/text-scan" element={<ProtectedRoute><TextScan /></ProtectedRoute>} />
        <Route path="/verify-success" element={<VerifySuccess />} />
        <Route path="/explain/:reportId" element={<ProtectedRoute><Explain /></ProtectedRoute>} />
        <Route path="/report/:detectionId" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/reports/:id" element={<AdminRoute><AdminReportView /></AdminRoute>} />
        <Route path="/global-live" element={<AdminRoute><GlobalHeatLive /></AdminRoute>} />
        {/* Nested admin dashboard routes for live map */}
        <Route path="/admin/dashboard/global-live" element={<AdminRoute><GlobalHeatLive /></AdminRoute>} />
      </Routes>
    </div>
  );
}

export default App;
