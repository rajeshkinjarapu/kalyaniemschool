import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>(['STUDENT', 'TEACHER']);

  const fetchAnnouncements = async () => {
    try {
      const res: any = await api.get('/api/announcements');
      setAnnouncements(res.data || res || []);
    } catch (e) {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleRoleToggle = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRoles.length === 0) {
      toast.error('Please select at least one target audience role');
      return;
    }
    try {
      await api.post('/api/announcements', {
        title,
        content,
        targetRoles: targetRoles,
      });
      toast.success('Announcement broadcast successfully!');
      setShowModal(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Error publishing notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this notice?')) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      toast.success('Notice removed successfully');
      fetchAnnouncements();
    } catch (e) {
      toast.error('Failed to remove notice');
    }
  };

  const isManagement = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Announcements Notice Board</h3>
          <p className="text-xs text-gray-400">View and broadcast latest school alerts.</p>
        </div>
        {isManagement && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4.5 h-4.5" />
            <span>Create Notice</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {announcements.map((ann) => (
            <div key={ann.id} className="card p-6 space-y-4 hover:shadow-xs relative group">
              {isManagement && (
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                    {ann.title}
                  </h4>
                  <span className="text-xs text-gray-400 font-medium">
                    Posted on {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="flex gap-1.5 pt-2 flex-wrap">
                {ann.targetRoles.split(',').map((r: string) => (
                  <Badge key={r} variant="default">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              No notices currently posted.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Publish Notice</h3>
              <p className="text-xs text-gray-400">Publish announcements to selected roles.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports Day Holiday Announcement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Announcement Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type notice message details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input"
                ></textarea>
              </div>

              <div>
                <label className="label">Target Audience Roles</label>
                <div className="flex gap-4 text-xs font-semibold pt-1">
                  {['STUDENT', 'TEACHER'].map((role) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm">
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AnnouncementsPage;
