import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Intro from './pages/Intro';
import Login from './pages/Login';
import Home from './pages/Home';
import Timeline from './pages/Timeline';
import Calendar from './pages/Calendar';
import Layout from './components/Layout';

// Simple Protected Route helper
const ProtectedRoute = ({ children }) => {
    const isAuth = localStorage.getItem('isLoggedIn') === 'true';
    return isAuth ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Intro />} />
                <Route path="/login" element={<Login />} />

                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/timeline"
                    element={
                        <ProtectedRoute>
                            <Timeline />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/calendar"
                    element={
                        <ProtectedRoute>
                            <Calendar />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AnimatedRoutes />
        </BrowserRouter>
    );
}

export default App;
