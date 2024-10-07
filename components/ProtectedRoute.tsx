import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;