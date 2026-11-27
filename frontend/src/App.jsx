import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Grievances from './pages/Grievances.jsx';
import NewGrievance from './pages/NewGrievance.jsx';
import GrievanceDetail from './pages/GrievanceDetail.jsx';
import Reports from './pages/Reports.jsx';
import Departments from './pages/Departments.jsx';
import Users from './pages/Users.jsx';
import Notifications from './pages/Notifications.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Grievances /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute roles={['complainant']}><NewGrievance /></ProtectedRoute>} />
          <Route path="/grievances/:id" element={<ProtectedRoute><GrievanceDetail /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['officer', 'admin']}><Reports /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute roles={['admin']}><Departments /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
