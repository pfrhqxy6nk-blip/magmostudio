import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BackgroundEffects from './components/BackgroundEffects';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import BentoGrid from './components/BentoGrid';
import Configurator from './components/Configurator';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './auth/AuthContext';

// Layout Component
const MainLayout = ({ children }) => (
  <div style={{ position: 'relative', width: '100%', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
    <BackgroundEffects />
    <Navbar />
    <main style={{ position: 'relative', zIndex: 10 }}>
      {children}
    </main>
    <Footer />
  </div>
);

const LandingPage = () => (
  <>
    <Hero />
    <BentoGrid />
    <Configurator />
  </>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile" element={<ProfileGate />} />
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}

const ProfileGate = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Dashboard /> : <AuthPage />;
};

export default App;
