import { useState, useEffect, useRef } from 'react';
import { createGecko, updateGecko, deleteGecko, createCareLog, deleteCareLog, uploadGeckoPhoto, deleteGeckoPhoto } from '../api';

const CARE_TYPES = [
  { value: 'FEEDING', label: '급여', icon: '🍽️' },
  { value: 'CLEANING', label: '청소', icon: '🧹' },
  { value: 'WATER', label: '물 교체', icon: '💧' },
  { value: 'SHEDDING', label: '탈피', icon: '🦎' },
  { value: 'WEIGHT', label: '체중', icon: '⚖️' },
  { value: 'MATING', label: '메이팅', icon: '💕' },
  { value: 'LAYING', label: '산란', icon: '🥚' },
  { value: 'HEALTH', label: '건강', icon: '🏥' }
];

const GENDERS = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: 'UNKNOWN', label: '미확인' }
];

export default function GeckoModal({ isOpen, onClose, cell, rackId, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    morph: '',
    birthDate: '',
    gender: 'UNKNOWN',
    weight: '',
    notes: ''
  });
  const [careNote, setCareNote] = useState('');
  const [careValue, setCareValue] = useState('');
  const [careLogs, setCareLogs] = useState([]);
  const [loadingType, setLoadingType] = useState(null);
  const [successType, setSuccessType] = useState(null);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (cell?.gecko) {
      setForm({
        name: cell.gecko.name || '',
        morph: cell.gecko.morph || '',
        birthDate: cell.gecko.birthDate ? cell.gecko.birthDate.split('T')[0] : '',
        gender: cell.gecko.gender || 'UNKNOWN',
        weight: cell.gecko.weight || '',
        notes: cell.gecko.notes || ''
      });
      setCareLogs(cell.gecko.careLogs || []);
      setPhotoUrl(cell.gecko.photoUrl || null);
      setIsEditing(false);
    } else {
      setForm({
        name: '',
        morph: '',
        birthDate: '',
        gender: 'UNKNOWN',
        weight: '',
        notes: ''
      });
      setCareLogs([]);
      setPhotoUrl(null);
      setIsEditing(true);
    }
    setLoadingType(null);
    setSuccessType(null);
  }, [cell]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (cell?.gecko) {
        await updateGecko(cell.gecko.id, {
          ...form,
          weight: form.weight ? parseFloat(form.weight) : null
        });
      } else {
        await createGecko({
          ...form,
          weight: form.weight ? parseFloat(form.weight) : null,
          rackId,
          row: cell.row,
          column: cell.col
        });
      }
      onSave();
      onClose();
    } catch (error) {
      alert('저장 실패: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteGecko(cell.gecko.id);
      onSave();
      onClose();
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  const handleCareLog = async (type) => {
    setLoadingType(type);
    setSuccessType(null);
    try {
      const newLog = await createCareLog(cell.gecko.id, {
        type,
        note: careNote,
        value: careValue
      });

      // 로컬 상태에 새 기록 추가 (맨 앞에)
      setCareLogs(prev => [newLog, ...prev]);

      setCareNote('');
      setCareValue('');
      setSuccessType(type);

      // 2초 후 성공 표시 제거
      setTimeout(() => setSuccessType(null), 2000);

      // 백그라운드에서 전체 데이터 갱신
      onSave();
    } catch (error) {
      alert('기록 실패: ' + error.message);
    } finally {
      setLoadingType(null);
    }
  };

  const handleDeleteLog = async (logId) => {
    setDeletingLogId(logId);
    try {
      await deleteCareLog(logId);
      setCareLogs(prev => prev.filter(log => log.id !== logId));
      onSave();
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    } finally {
      setDeletingLogId(null);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const result = await uploadGeckoPhoto(cell.gecko.id, file);
      setPhotoUrl(result.photoUrl);
      onSave();
    } catch (error) {
      alert('사진 업로드 실패: ' + error.message);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm('사진을 삭제하시겠습니까?')) return;

    setUploadingPhoto(true);
    try {
      await deleteGeckoPhoto(cell.gecko.id);
      setPhotoUrl(null);
      onSave();
    } catch (error) {
      alert('사진 삭제 실패: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  const getDaysSince = (dateStr) => {
    if (!dateStr) return null;
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto sm:m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold truncate text-gray-800">
            {cell?.gecko ? cell.gecko.name : '새 개체 등록'}
            <span className="text-xs sm:text-sm text-gray-500 ml-2 font-normal">({cell?.row}층 {cell?.col}번)</span>
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl ml-2">&times;</button>
        </div>

        <div className="p-3 sm:p-4">
          {cell?.gecko && !isEditing ? (
            <>
              {/* 사진 영역 */}
              <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {photoUrl ? (
                      <div className="relative group">
                        <img
                          src={photoUrl}
                          alt={cell.gecko.name}
                          className="w-24 h-24 object-cover rounded-xl border border-gray-300"
                        />
                        <button
                          onClick={handlePhotoDelete}
                          disabled={uploadingPhoto}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all ${uploadingPhoto ? 'opacity-50' : ''}`}
                      >
                        {uploadingPhoto ? (
                          <span className="text-2xl">⏳</span>
                        ) : (
                          <>
                            <span className="text-2xl text-gray-400">📷</span>
                            <span className="text-xs text-gray-400 mt-1">사진 추가</span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* 개체 정보 표시 */}
                  <div className="flex-1 space-y-1.5 text-sm">
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">모프:</span> {cell.gecko.morph || '-'}</p>
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">성별:</span> {GENDERS.find(g => g.value === cell.gecko.gender)?.label || '-'}</p>
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">생년월일:</span> {cell.gecko.birthDate ? cell.gecko.birthDate.split('T')[0] : '-'}</p>
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">체중:</span> {cell.gecko.weight ? `${cell.gecko.weight}g` : '-'}</p>
                  </div>
                </div>
                {cell.gecko.notes && (
                  <p className="mt-3 text-sm text-gray-700 bg-white rounded-lg p-2 border border-gray-200"><span className="font-semibold">메모:</span> {cell.gecko.notes}</p>
                )}
                {photoUrl && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    {uploadingPhoto ? '업로드 중...' : '📷 사진 변경'}
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full mb-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
              >
                ✏️ 정보 수정
              </button>

              {/* 관리 기록 버튼 */}
              <div className="border-t border-gray-200 pt-4 sm:pt-5">
                <h3 className="font-bold mb-3 text-sm sm:text-base text-gray-800">
                  관리 기록 추가
                </h3>
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="메모 (선택)"
                    value={careNote}
                    onChange={e => setCareNote(e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="값"
                    value={careValue}
                    onChange={e => setCareValue(e.target.value)}
                    className="w-16 sm:w-20 px-2 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {CARE_TYPES.map(type => {
                    const isLoading = loadingType === type.value;
                    const isSuccess = successType === type.value;

                    return (
                      <button
                        key={type.value}
                        onClick={() => handleCareLog(type.value)}
                        disabled={isLoading}
                        className={`
                          p-2 rounded-lg text-center transition-all duration-200 border
                          ${isSuccess
                            ? 'bg-emerald-50 border-emerald-400 scale-95'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-95'
                          }
                          ${isLoading ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        <div className="text-xl">
                          {isLoading ? '⏳' : isSuccess ? '✅' : type.icon}
                        </div>
                        <div className="text-xs text-gray-700 font-medium">
                          {isSuccess ? '완료!' : type.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 최근 기록 */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-bold mb-3 text-gray-800">
                  최근 기록 <span className="text-gray-500 font-normal">({careLogs.length}건)</span>
                </h3>
                {careLogs.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {careLogs.map((log, index) => {
                      const typeInfo = CARE_TYPES.find(t => t.value === log.type);
                      const daysSince = getDaysSince(log.createdAt);
                      const isNew = index === 0 && successType;
                      const isDeleting = deletingLogId === log.id;

                      return (
                        <div
                          key={log.id}
                          className={`
                            flex items-center gap-2 text-sm p-2.5 rounded-lg transition-all
                            ${isNew ? 'bg-emerald-50 border border-emerald-300' : 'bg-gray-50 border border-gray-200'}
                            ${isDeleting ? 'opacity-50' : ''}
                          `}
                        >
                          <span>{typeInfo?.icon}</span>
                          <span className="font-medium text-gray-800">{typeInfo?.label}</span>
                          <span className="text-gray-500 text-xs">{formatDate(log.createdAt)}</span>
                          {daysSince !== null && (
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${daysSince >= 3 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {daysSince === 0 ? '오늘' : `${daysSince}일 전`}
                            </span>
                          )}
                          {log.note && <span className="text-gray-600 flex-1 truncate">- {log.note}</span>}
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={isDeleting}
                            className="ml-auto text-gray-400 hover:text-red-500 transition-colors px-1"
                            title="삭제"
                          >
                            {isDeleting ? '⏳' : '✕'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">아직 기록이 없습니다</p>
                )}
              </div>

              {/* 삭제 버튼 */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={handleDelete}
                  className="w-full py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-all"
                >
                  🗑️ 개체 삭제
                </button>
              </div>
            </>
          ) : (
            /* 편집 폼 */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">이름 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">모프</label>
                <input
                  type="text"
                  value={form.morph}
                  onChange={e => setForm({ ...form, morph: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  placeholder="예: Harlequin, Dalmatian"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">성별</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
                >
                  {GENDERS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">생년월일</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">체중 (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={e => setForm({ ...form, weight: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">메모</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                {cell?.gecko && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium transition-all"
                >
                  💾 저장
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
