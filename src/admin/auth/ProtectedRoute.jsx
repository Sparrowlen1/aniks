import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext"


export default function ProtectedRoute({ children, allowedRoles}) {
    const {user, isLoading} = useAuth();
    const location = useLocation();

    if (isLoading) return null;

    if (!user) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/admin" replace />;
    }
  
    return children;
}
