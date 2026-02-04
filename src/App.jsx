import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BackgroundEffects from './components/BackgroundEffects';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BentoGrid from './components/BentoGrid';
import Configurator from './components/Configurator';
import { supabase } from './lib/supabase';

// Mock Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        let userData = JSON.parse(savedUser);

        // Fetch latest profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userData.email)
          .single();

        if (profile) {
          userData = { ...userData, ...profile };
          localStorage.setItem('user', JSON.stringify(userData));
        }

        setUser(userData);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Real-time projects subscription
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    // Initial fetch
    const fetchProjects = async () => {
      console.log("Fetching projects for:", user.email, "Is Admin:", user.is_admin);
      let query = supabase.from('projects').select('*');

      if (!user.is_admin) {
        query = query.eq('owner_email', user.email);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      console.log("Projects fetch result:", { data, error });

      if (data) setProjects(data);
    };

    fetchProjects();

    // Subscribe to changes
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, (payload) => {
        fetchProjects(); // Simplest way to keep sync for now
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const login = async (email, password) => {
    // Strict SELECT: check if user exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Check password
      .single();

    if (error || !profile) {
      console.error("Login failed:", error);
      return null;
    }

    // Persist session
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const register = async (userData) => {
    const isRoot = userData.email === 'oleks160409@gmail.com';
    const newProfile = {
      email: userData.email,
      password: userData.password, // Save password
      name: userData.name || userData.email.split('@')[0],
      phone: userData.phone,
      is_admin: isRoot,
      is_root: isRoot,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single();

    if (error) {
      console.error("Registration failed:", error);
      throw error;
    }

    if (data) {
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return data;
    }
  };

  const addAdmin = async (email) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('email', email);

    if (error) console.error("Error adding admin:", error);
  };

  const removeAdmin = async (email) => {
    if (email === 'oleks160409@gmail.com') return;
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: false })
      .eq('email', email);

    if (error) console.error("Error removing admin:", error);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const addProject = async (projectData) => {
    // Explicitly define what goes into the 'projects' table
    const newProject = {
      title: projectData.title,
      category: projectData.category,
      budget: projectData.budget,
      description: projectData.details || projectData.description,
      owner_email: projectData.owner_email || user?.email,
      status: 'PENDING',
      progress: 0,
      roadmap: [],
      comments: [
        { id: Date.now(), author: 'Олексій (PM)', text: 'Вітаємо у FUTURE! Ми розпочинаємо підготовку вашого проекту. Чекаємо на ваші перші коментарі щодо дизайну.', date: new Date().toISOString() }
      ]
    };

    // 1. Insert into projects table
    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single();

    if (error) {
      console.error("Supabase error (projects):", error);
      return { success: false, error };
    }

    if (data) {
      // 2. Also insert into requests table for admin tracking
      // Requests table has columns: name, email, telegram, details, category, budget, status
      const { error: reqError } = await supabase.from('requests').insert([{
        name: projectData.owner_name || 'Inquiry User',
        email: newProject.owner_email,
        details: newProject.description,
        category: newProject.category,
        budget: newProject.budget,
        telegram: projectData.telegram || '',
        status: 'NEW'
      }]);

      if (reqError) console.error("Supabase error (requests):", reqError);

      setProjects([...projects, data]);
      return { success: true, data };
    }

    return { success: false, error: { message: "Unknown error occurred" } };
  };

  const addComment = async (projectId, commentText) => {
    if (!user) return;
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const newComment = {
      id: Date.now(),
      author: user.is_admin ? `${user.name} (Admin)` : user.name, // Use is_admin
      text: commentText,
      date: new Date().toISOString()
    };

    const updatedComments = [...(targetProject.comments || []), newComment];

    const { error } = await supabase
      .from('projects')
      .update({ comments: updatedComments })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, comments: updatedComments } : p));
    } else {
      console.error("Error adding comment:", error);
    }
  };

  const updateRoadmapStep = async (projectId, stepIdx, newStatus) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const newRoadmap = [...targetProject.roadmap];
    newRoadmap[stepIdx].status = newStatus;
    const completed = newRoadmap.filter(s => s.status === 'completed').length;
    const progress = Math.round((completed / newRoadmap.length) * 100);

    const { error } = await supabase
      .from('projects')
      .update({ roadmap: newRoadmap, progress })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, roadmap: newRoadmap, progress } : p));
    } else {
      console.error("Error updating roadmap step:", error);
    }
  };

  const addRoadmapStep = async (projectId, titles) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const titlesArray = Array.isArray(titles) ? titles : [titles];
    const newSteps = titlesArray.map(title => ({ title, status: 'upcoming' }));
    const newRoadmap = [...targetProject.roadmap, ...newSteps];

    const { error } = await supabase
      .from('projects')
      .update({ roadmap: newRoadmap })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, roadmap: newRoadmap } : p));
    } else {
      console.error("Error adding roadmap step(s):", error);
    }
  };

  const deleteRoadmapStep = async (projectId, stepIdx) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const newRoadmap = targetProject.roadmap.filter((_, idx) => idx !== stepIdx);
    const completed = newRoadmap.filter(s => s.status === 'completed').length;
    const progress = newRoadmap.length > 0 ? Math.round((completed / newRoadmap.length) * 100) : 0;

    const { error } = await supabase
      .from('projects')
      .update({ roadmap: newRoadmap, progress })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, roadmap: newRoadmap, progress } : p));
    } else {
      console.error("Error deleting roadmap step:", error);
    }
  };

  const addResource = async (projectId, resource) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const updatedResources = [...(targetProject.resources || []), { id: Date.now(), ...resource }];

    const { error } = await supabase
      .from('projects')
      .update({ resources: updatedResources })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, resources: updatedResources } : p));
    } else {
      console.error("Error adding resource:", error);
    }
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (!error) {
      const updated = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
      setProjects(updated);
    } else {
      console.error("Error updating project status:", error);
    }
  };

  const approveProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'PAYMENT', progress: 5 })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: 'PAYMENT', progress: 5 } : p));
    } else {
      console.error("Error approving project:", error);
    }
  };

  const payForProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'ACTIVE', progress: 10 })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: 'ACTIVE', progress: 10 } : p));
    } else {
      console.error("Error paying for project:", error);
    }
  };

  const updateProjectData = async (projectId, newData) => {
    const { error } = await supabase
      .from('projects')
      .update(newData)
      .eq('id', projectId);

    if (!error) {
      const updated = projects.map(p => p.id === projectId ? { ...p, ...newData } : p);
      setProjects(updated);
    } else {
      console.error("Error updating project data:", error);
    }
  };

  const deleteProject = async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId));
      return { success: true };
    } else {
      console.error("Error deleting project:", error);
      return { success: false, error };
    }
  };

  const updateUser = async (newUserData) => {
    const updatedUser = { ...user, ...newUserData };

    // Persist to Supabase
    const { error } = await supabase
      .from('profiles')
      .update(newUserData)
      .eq('email', user.email);

    if (!error) {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      console.error("Error updating profile:", error);
    }
  };

  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, projects, addAdmin, removeAdmin, addProject, approveProject, updateProjectStatus, updateProjectData, deleteProject, payForProject, updateUser, addComment, updateRoadmapStep, addRoadmapStep, deleteRoadmapStep, addResource, uploadFile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Layout Component
const MainLayout = ({ children }) => (
  <div style={{ position: 'relative', width: '100%', overflow: 'hidden', backgroundColor: '#000' }}>
    <BackgroundEffects />
    <Navbar />
    <main style={{ position: 'relative', zIndex: 10 }}>
      {children}
    </main>
    <footer style={{ padding: '60px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
      <p>&copy; 2024 FUTURE Agency. All rights reserved.</p>
    </footer>
  </div>
);

const LandingPage = () => (
  <>
    <Hero />
    <BentoGrid />
    <Configurator />
  </>
);

import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

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
