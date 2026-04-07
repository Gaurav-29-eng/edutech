import { Navigate } from 'react-router-dom';

function AdminRoute({ children }) {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const parsedUser = JSON.parse(user);
  
  if (parsedUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default AdminRoute;
