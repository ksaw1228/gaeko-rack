import { useState, useEffect } from 'react';
import { updateRack } from '../api';

export default function EditRackModal({ isOpen, onClose, rack, onSave }) {
  const [form, setForm] = useState({
    name: '',
    rows: 5,
    columns: 3
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (rack) {
      setForm({
        name: rack.name,
        rows: rack.rows,
        columns: rack.columns
      });
      setError('');
    }
  }, [rack]);

  if (!isOpen || !rack) return null;

  // 줄어드는 영역에 개체가 있는지 확인
  const checkGeckosInRemovedArea = () => {
    const newRows = parseInt(form.rows);
    const newColumns = parseInt(form.columns);

    if (!rack.geckos || rack.geckos.length === 0) {
      return { hasConflict: false, geckos: [] };
    }

    const conflictingGeckos = rack.geckos.filter(gecko => {
      // 행이 줄어들 때: 기존 행 번호가 새로운 행 수보다 크면 충돌
      if (gecko.row > newRows) return true;
      // 열이 줄어들 때: 기존 열 번호가 새로운 열 수보다 크면 충돌
      if (gecko.column > newColumns) return true;
      return false;
    });

    return {
      hasConflict: conflictingGeckos.length > 0,
      geckos: conflictingGeckos
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const newRows = parseInt(form.rows);
    const newColumns = parseInt(form.columns);

    // 유효성 검사
    if (!form.name.trim()) {
      setError('랙 이름을 입력해주세요');
      return;
    }

    if (newRows < 1 || newColumns < 1) {
      setError('행과 열은 1 이상이어야 합니다');
      return;
    }

    // 개체 충돌 확인
    const { hasConflict, geckos } = checkGeckosInRemovedArea();

    if (hasConflict) {
      const geckoNames = geckos.map(g => `"${g.name}" (${g.row}층 ${g.column}번)`).join(', ');
      setError(`다음 개체가 삭제될 영역에 있습니다:\n${geckoNames}\n\n먼저 개체를 다른 위치로 이동해주세요.`);
      return;
    }

    try {
      await updateRack(rack.id, {
        name: form.name.trim(),
        rows: newRows,
        columns: newColumns
      });
      onSave();
      onClose();
    } catch (error) {
      setError('수정 실패: ' + error.message);
    }
  };

  const currentGeckoCount = rack.geckos?.length || 0;
  const newCellCount = form.rows * form.columns;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            ✏️ 랙 수정
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">랙 이름 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
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

          {/* 미리보기 */}
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">미리보기:</p>
            <div className="flex flex-col gap-1.5 items-center">
              {Array.from({ length: Math.min(parseInt(form.rows) || 1, 5) }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-1.5">
                  {Array.from({ length: Math.min(parseInt(form.columns) || 1, 5) }).map((_, colIdx) => {
                    // 해당 위치에 개체가 있는지 확인
                    const row = (parseInt(form.rows) || 1) - rowIdx;
                    const col = colIdx + 1;
                    const hasGecko = rack.geckos?.some(g => g.row === row && g.column === col);

                    return (
                      <div
                        key={colIdx}
                        className={`w-8 h-6 rounded border ${hasGecko ? 'bg-emerald-200 border-emerald-400' : 'bg-emerald-100 border-emerald-300'}`}
                        title={hasGecko ? '개체 있음' : '빈 칸'}
                      />
                    );
                  })}
                  {(parseInt(form.columns) || 1) > 5 && <span className="text-xs text-gray-400 flex items-center">...</span>}
                </div>
              ))}
              {(parseInt(form.rows) || 1) > 5 && <span className="text-xs text-gray-400">...</span>}
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-500">
                {rack.columns}x{rack.rows} → <span className="font-bold text-emerald-600">{form.columns}x{form.rows}</span>
              </span>
              <span className="text-gray-600">
                {currentGeckoCount}마리 / <span className="font-bold">{newCellCount}</span>칸
              </span>
            </div>
          </div>

          {/* 경고 메시지 */}
          {(parseInt(form.rows) < rack.rows || parseInt(form.columns) < rack.columns) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
              ⚠️ 랙 크기를 줄이면 해당 영역에 있는 개체가 없어야 합니다.
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium transition-all"
            >
              💾 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
