import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { goalService } from '../../services/goal.service.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'weekly_interviews', targetValue: 1, deadline: '' });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalService.getGoals();
      if (res.success) {
        setGoals(res.goals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await goalService.createGoal(form);
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await goalService.deleteGoal(id);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">Goals</h1>
          <p className="text-sm text-[var(--theme-secondary-text)]">Track your interview preparation targets</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Goal'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input label="Goal Title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Weekly Mock Interviews" />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--theme-secondary-text)]">Goal Type</label>
              <select className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-sm text-[var(--theme-text)] focus:border-[var(--theme-primary)] focus:outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="weekly_interviews">Weekly Interviews</option>
                <option value="monthly_interviews">Monthly Interviews</option>
                <option value="target_score">Target Readiness Score</option>
              </select>
            </div>

            <Input label="Target Value" type="number" required min="1" value={form.targetValue} onChange={e => setForm({...form, targetValue: Number(e.target.value)})} />
            <Input label="Deadline" type="date" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">Save Goal</Button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-[var(--theme-secondary-text)]">Loading goals...</p>
        ) : goals.length > 0 ? (
          goals.map(goal => {
            const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            const isCompleted = goal.status === 'completed';
            const isFailed = goal.status === 'failed';
            return (
              <div key={goal._id} className="relative rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--theme-text)]">{goal.title}</h3>
                    <p className="mt-1 text-xs text-[var(--theme-secondary-text)]">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(goal._id)} className="text-[var(--theme-danger)] hover:underline text-xs font-semibold">Delete</button>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm font-medium text-[var(--theme-text)]">
                    <span>{goal.currentValue} / {goal.targetValue}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--theme-surface-alt)]">
                    <div 
                      className={`h-full rounded-full ${isCompleted ? 'bg-[var(--theme-success)]' : isFailed ? 'bg-[var(--theme-danger)]' : 'bg-[var(--theme-primary)]'}`} 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
                
                <div className="mt-4 text-xs font-semibold uppercase">
                  {isCompleted ? <span className="text-[var(--theme-success)]">Completed</span> : isFailed ? <span className="text-[var(--theme-danger)]">Failed</span> : <span className="text-[var(--theme-primary)]">In Progress</span>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--theme-text)]">No goals set</h3>
            <p className="mt-2 text-[var(--theme-secondary-text)]">Set weekly or monthly targets to track your progress consistently.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
