import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { safeGetItem, safeRemoveItem, safeSetItem, safeJsonParse } from '../utils/storage.js';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const ROOT_EMAIL = 'oleks160409@gmail.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const projectsRef = useRef(projects);

  const debug = (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  };

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = safeGetItem('user');
        if (!savedUser) return;

        const parsed = safeJsonParse(savedUser);
        if (!parsed) {
          safeRemoveItem('user');
          return;
        }

        let userData = parsed;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userData.email)
          .single();

        if (error) debug('Profile fetch failed:', error);

        if (profile) {
          userData = { ...userData, ...profile };
          safeSetItem('user', JSON.stringify(userData));
        }

        setUser(userData);
      } catch (error) {
        console.error('Auth init failed:', error);
        safeRemoveItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    let isCancelled = false;

    const fetchProjects = async () => {
      let query = supabase.from('projects').select('*');
      if (!user.is_admin) query = query.eq('owner_email', user.email);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) console.error('Projects fetch failed:', error);
      if (isCancelled) return;
      setProjects(Array.isArray(data) ? data : []);
    };

    fetchProjects();

    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => fetchProjects(),
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const login = useCallback(async (email, password) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !profile) {
      debug('Login failed:', error);
      return null;
    }

    safeSetItem('user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (userData) => {
    const isRoot = userData.email === ROOT_EMAIL;
    const newProfile = {
      email: userData.email,
      password: userData.password,
      name: userData.name || userData.email.split('@')[0],
      phone: userData.phone,
      is_admin: isRoot,
      is_root: isRoot,
      avatar:
        userData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single();

    if (error) {
      debug('Registration failed:', error);
      throw error;
    }

    if (!data) throw new Error('Registration failed: empty response');

    safeSetItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const addAdmin = useCallback(async (email) => {
    const { error } = await supabase.from('profiles').update({ is_admin: true }).eq('email', email);
    if (error) console.error('Error adding admin:', error);
  }, []);

  const removeAdmin = useCallback(async (email) => {
    if (email === ROOT_EMAIL) return;
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: false })
      .eq('email', email);
    if (error) console.error('Error removing admin:', error);
  }, []);

  const logout = useCallback(() => {
    safeRemoveItem('user');
    setUser(null);
    setProjects([]);
  }, []);

  const addProject = useCallback(async (projectData) => {
    const newProject = {
      title: projectData.title,
      category: projectData.category,
      budget: projectData.budget,
      description: projectData.details || projectData.description,
      owner_email: projectData.owner_email || user?.email,
      status: 'PENDING',
      progress: 0,
      roadmap: [
        { title: 'Збір вимог', status: 'upcoming' },
        { title: 'Проектування', status: 'upcoming' },
        { title: 'Дизайн', status: 'upcoming' },
        { title: 'Верстка та програмування', status: 'upcoming' },
        { title: 'Тестування', status: 'upcoming' },
        { title: 'Запуск', status: 'upcoming' },
        { title: 'Підтримка та розвиток', status: 'upcoming' },
      ],
      comments: [
        {
          id: Date.now(),
          author: 'Олексій (PM)',
          text: 'Вітаємо у magmostudio! Ми розпочинаємо підготовку вашого проекту. Чекаємо на ваші перші коментарі щодо дизайну.',
          date: new Date().toISOString(),
        },
      ],
    };

    const { data, error } = await supabase.from('projects').insert([newProject]).select().single();
    if (error) {
      console.error('Supabase error (projects):', error);
      return { success: false, error };
    }

    if (!data) return { success: false, error: { message: 'Unknown error occurred' } };

    const { error: reqError } = await supabase.from('requests').insert([
      {
        name: projectData.owner_name || 'Inquiry User',
        email: newProject.owner_email,
        details: newProject.description,
        category: newProject.category,
        budget: newProject.budget,
        telegram: projectData.telegram || '',
        status: 'NEW',
      },
    ]);
    if (reqError) console.error('Supabase error (requests):', reqError);

    setProjects((prev) => [data, ...prev]);
    return { success: true, data };
  }, [user?.email]);

  const addComment = useCallback(async (projectId, commentText) => {
    if (!user) return;
    const targetProject = projectsRef.current.find((p) => p.id === projectId);
    if (!targetProject) return;

    const newComment = {
      id: Date.now(),
      author: user.is_admin ? `${user.name || user.email} (Admin)` : (user.name || user.email),
      text: commentText,
      date: new Date().toISOString(),
    };

    const updatedComments = [...(targetProject.comments || []), newComment];

    const { error } = await supabase
      .from('projects')
      .update({ comments: updatedComments })
      .eq('id', projectId);

    if (error) {
      console.error('Error adding comment:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, comments: updatedComments } : p)),
    );
  }, [user]);

  const updateRoadmapStep = useCallback(async (projectId, stepIdx, newStatus) => {
    const targetProject = projectsRef.current.find((p) => p.id === projectId);
    if (!targetProject) return;
    if (!Array.isArray(targetProject.roadmap) || !targetProject.roadmap[stepIdx]) return;

    const newRoadmap = [...targetProject.roadmap];
    newRoadmap[stepIdx] = { ...newRoadmap[stepIdx], status: newStatus };
    const completed = newRoadmap.filter((s) => s.status === 'completed').length;
    const progress = newRoadmap.length > 0 ? Math.round((completed / newRoadmap.length) * 100) : 0;

    const { error } = await supabase
      .from('projects')
      .update({ roadmap: newRoadmap, progress })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating roadmap step:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, roadmap: newRoadmap, progress } : p)),
    );
  }, []);

  const addRoadmapStep = useCallback(async (projectId, titles) => {
    const targetProject = projectsRef.current.find((p) => p.id === projectId);
    if (!targetProject) return;

    const titlesArray = Array.isArray(titles) ? titles : [titles];
    const newSteps = titlesArray.map((title) => ({ title, status: 'upcoming' }));
    const newRoadmap = [...(targetProject.roadmap || []), ...newSteps];

    const { error } = await supabase.from('projects').update({ roadmap: newRoadmap }).eq('id', projectId);

    if (error) {
      console.error('Error adding roadmap step(s):', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, roadmap: newRoadmap } : p)),
    );
  }, []);

  const deleteRoadmapStep = useCallback(async (projectId, stepIdx) => {
    const targetProject = projectsRef.current.find((p) => p.id === projectId);
    if (!targetProject) return;
    if (!Array.isArray(targetProject.roadmap)) return;

    const newRoadmap = targetProject.roadmap.filter((_, idx) => idx !== stepIdx);
    const completed = newRoadmap.filter((s) => s.status === 'completed').length;
    const progress = newRoadmap.length > 0 ? Math.round((completed / newRoadmap.length) * 100) : 0;

    const { error } = await supabase
      .from('projects')
      .update({ roadmap: newRoadmap, progress })
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting roadmap step:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, roadmap: newRoadmap, progress } : p)),
    );
  }, []);

  const addResource = useCallback(async (projectId, resource) => {
    const targetProject = projectsRef.current.find((p) => p.id === projectId);
    if (!targetProject) return;

    const updatedResources = [...(targetProject.resources || []), { id: Date.now(), ...resource }];

    const { error } = await supabase
      .from('projects')
      .update({ resources: updatedResources })
      .eq('id', projectId);

    if (error) {
      console.error('Error adding resource:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, resources: updatedResources } : p)),
    );
  }, []);

  const updateProjectStatus = useCallback(async (projectId, newStatus) => {
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
    if (error) {
      console.error('Error updating project status:', error);
      return;
    }

    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)));
  }, []);

  const approveProject = useCallback(async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'PAYMENT', progress: 5 })
      .eq('id', projectId);

    if (error) {
      console.error('Error approving project:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: 'PAYMENT', progress: 5 } : p)),
    );
  }, []);

  const payForProject = useCallback(async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'ACTIVE', progress: 10 })
      .eq('id', projectId);

    if (error) {
      console.error('Error paying for project:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: 'ACTIVE', progress: 10 } : p)),
    );
  }, []);

  const updateProjectData = useCallback(async (projectId, newData) => {
    const { error } = await supabase.from('projects').update(newData).eq('id', projectId);
    if (error) {
      console.error('Error updating project data:', error);
      return { success: false, error };
    }

    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...newData } : p)));
    return { success: true };
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      console.error('Error deleting project:', error);
      return { success: false, error };
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    return { success: true };
  }, []);

  const updateUser = useCallback(async (newUserData) => {
    if (!user?.email) return;
    const { error } = await supabase.from('profiles').update(newUserData).eq('email', user.email);
    if (error) {
      console.error('Error updating profile:', error);
      return;
    }

    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    safeSetItem('user', JSON.stringify(updatedUser));
  }, [user]);

  const uploadFile = useCallback(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
    return data.publicUrl;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      projects,
      login,
      register,
      logout,
      addAdmin,
      removeAdmin,
      addProject,
      approveProject,
      updateProjectStatus,
      updateProjectData,
      deleteProject,
      payForProject,
      updateUser,
      addComment,
      updateRoadmapStep,
      addRoadmapStep,
      deleteRoadmapStep,
      addResource,
      uploadFile,
    }),
    [
      user,
      loading,
      projects,
      login,
      register,
      logout,
      addAdmin,
      removeAdmin,
      addProject,
      approveProject,
      updateProjectStatus,
      updateProjectData,
      deleteProject,
      payForProject,
      updateUser,
      addComment,
      updateRoadmapStep,
      addRoadmapStep,
      deleteRoadmapStep,
      addResource,
      uploadFile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
