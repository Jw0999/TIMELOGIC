import { Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Login from "./screens/Login";
import Home from "./screens/Home";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 size={26} className="spin text-sky" />
      </div>
    );
  }

  return user ? <Home /> : <Login />;
}
