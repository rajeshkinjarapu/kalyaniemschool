import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const FeeStructurePage: React.FC = () => {
  const [structures, setStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');

  const fetchData = async () => {
    try {
      const [structRes, classRes]: any = await Promise.all([
        api.get('/api/fees/structures'),
        api.get('/api/classes'),
      ]);
      setStructures(structRes.data || structRes || []);
      setClasses(classRes.data || classRes || []);
    } catch (e) {
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/fees/structures', {
        name,
        term,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        classId,
      });
      toast.success('Fee structure component created!');
      setShowModal(false);
      setName('');
      setAmount('');
      setClassId('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error creating fee component');
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importToast = toast.loading('Uploading fees...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await api.post('/api/fees/structures/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || res;
      toast.success(`Import complete! Added ${data.success} fees.`, { id: importToast });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Bulk import failed. Please verify format rules.', { id: importToast });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Fee Structure Settings</h3>
          <p className="text-xs text-gray-400">Manage term-wise and class-wise fee structures.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleBulkImport}
          />
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-sm">
            Bulk Upload Fees
          </button>
          <Link to="/fees" className="btn-secondary text-sm">
            Payment History
          </Link>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4.5 h-4.5" />
            <span>New Fee Component</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Fee Name</th>
                <th className="px-6 py-4">Term</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {structures.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-4 font-semibold">{s.name}</td>
                  <td className="px-6 py-4 text-gray-500">{s.term}</td>
                  <td className="px-6 py-4">
                    <Badge variant="info">
                      {s.class ? `${s.class.name}-${s.class.section}` : 'All Classes'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-bold">₹{s.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {new Date(s.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {structures.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No fee structures configured. Configure first component!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">Create Fee Component</h3>
              <p className="text-xs text-gray-400">Configure fee amount and due date rules.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Fee Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Applicable Class</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="input"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}-{c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Term</label>
                <select value={term} onChange={(e) => setTerm(e.target.value)} className="input">
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Final">Final Term</option>
                </select>
              </div>

              <div>
                <label className="label">Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input"
                />
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
                  Create Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FeeStructurePage;
