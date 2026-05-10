import { Navigate } from 'react-router-dom';

// Index redirects to Dashboard when authenticated
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
