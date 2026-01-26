import { useState } from 'react';
import { createRack } from '../api';

export default function AddRackModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    rows: 5,
    columns: 3
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRack({
        name: form.name,
        rows: parseInt(form.rows),
        columns: parseInt(form.columns)
      });
      setForm({ name: '', rows: 5, columns: 3 });
      onSave();
      onClose();
    } catch (error) {
      alert('생성 실패: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🦎 새 랙 추가
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">랙 이름 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              placeholder="예: 크레스티드 랙 #1"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">가로 (칸 수)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.columns}
                onChange={e => setForm({ ...form, columns: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">세로 (층 수)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.rows}
                onChange={e => setForm({ ...form, rows: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">미리보기:</p>
            <div className="flex flex-col gap-1.5 items-center">
              {Array.from({ length: Math.min(form.rows, 5) }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-1.5">
                  {Array.from({ length: Math.min(form.columns, 5) }).map((_, colIdx) => (
                    <div key={colIdx} className="w-8 h-6 bg-emerald-100 rounded border border-emerald-300" />
                  ))}
                  {form.columns > 5 && <span className="text-xs text-gray-400 flex items-center">...</span>}
                </div>
              ))}
              {form.rows > 5 && <span className="text-xs text-gray-400">...</span>}
            </div>
            <p className="text-sm text-gray-600 mt-3 text-center font-medium">
              총 <span className="text-emerald-600 font-bold">{form.rows * form.columns}</span>칸
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium transition-all"
          >
            🦎 랙 추가
          </button>
        </form>
      </div>
    </div>
  );
}
