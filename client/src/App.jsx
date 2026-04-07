import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import StudentDashboard from './pages/StudentDashboard';
import Profile from './pages/Profile';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import AdminHome from './pages/admin/AdminHome';
import AdminCourses from './pages/admin/AdminCourses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import CreateCourse from './pages/admin/CreateCourse';
import EditCourse from './pages/admin/EditCourse';
import AddCourse from './pages/admin/AddCourse';
import UploadLecture from './pages/admin/UploadLecture';

// Protected route component for logged-in users
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
        <Routes>
          {/* Public Routes with Navbar */}
          <Route path="/" element={<><Navbar /><Home /><BottomNav /></>} />
          <Route path="/login" element={<><Navbar /><Login /><BottomNav /></>} />
          <Route path="/signup" element={<><Navbar /><Signup /><BottomNav /></>} />
          <Route path="/courses" element={<><Navbar /><CourseList /><BottomNav /></>} />
          <Route path="/courses/:id" element={<><Navbar /><CourseDetail /><BottomNav /></>} />
          
          {/* Protected Routes - Require Login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <><Navbar /><StudentDashboard /><BottomNav /></>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <><Navbar /><Profile /><BottomNav /></>
              </ProtectedRoute>
            }
          />
          {/* Admin Routes - Protected */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <AdminHome />
                </AdminDashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <AdminCourses />
                </AdminDashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses/create"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <CreateCourse />
                </AdminDashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <AdminUsers />
                </AdminDashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses/edit/:id"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <EditCourse />
                </AdminDashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/add-course"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <AddCourse />
                </AdminDashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/upload-lecture"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <UploadLecture />
                </AdminDashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute>
                <AdminDashboard>
                  <AdminPayments />
                </AdminDashboard>
              </AdminRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
