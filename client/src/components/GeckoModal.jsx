import { useState, useEffect, useRef } from 'react';
import { createGecko, updateGecko, deleteGecko, createCareLog, deleteCareLog, getGeckoPhotos, uploadGeckoPhotoWithDate, setMainPhoto, deletePhoto } from '../api';
import WeightChart from './WeightChart';

const CARE_TYPES = [
  { value: 'FEEDING', label: '급여', icon: '🍽️' },
  { value: 'CLEANING', label: '청소', icon: '🧹' },
  { value: 'SHEDDING', label: '탈피', icon: '🦎' },
  { value: 'WEIGHT', label: '체중', icon: '⚖️' },
  { value: 'MATING', label: '메이팅', icon: '💕' },
  { value: 'LAYING', label: '산란', icon: '🥚' },
  { value: 'OTHER', label: '기타', icon: '📝' }
];

const GENDERS = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: 'UNKNOWN', label: '미확인' }
];

const LAYING_OPTIONS = [
  { value: '유정란', label: '유정란' },
  { value: '무정란', label: '무정란' },
  { value: '모르겠음', label: '모르겠음' }
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
  const [careLogs, setCareLogs] = useState([]);
  const [loadingType, setLoadingType] = useState(null);
  const [successType, setSuccessType] = useState(null);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoDate, setPhotoDate] = useState('');
  const fileInputRef = useRef(null);

  // 팝업 상태
  const [showWeightPopup, setShowWeightPopup] = useState(false);
  const [showMatingPopup, setShowMatingPopup] = useState(false);
  const [showLayingPopup, setShowLayingPopup] = useState(false);
  const [showOtherPopup, setShowOtherPopup] = useState(false);
  const [showWeightChart, setShowWeightChart] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [matingInput, setMatingInput] = useState('');
  const [otherInput, setOtherInput] = useState('');

  // 날짜/시간 설정 상태
  const [usePastDate, setUsePastDate] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  // 사진 목록 불러오기
  const loadPhotos = async (geckoId) => {
    try {
      const photoList = await getGeckoPhotos(geckoId);
      setPhotos(photoList);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

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
      // 사진 목록 불러오기
      loadPhotos(cell.gecko.id);
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
      setPhotos([]);
      setIsEditing(true);
    }
    setLoadingType(null);
    setSuccessType(null);
    // 팝업 초기화
    setShowWeightPopup(false);
    setShowMatingPopup(false);
    setShowLayingPopup(false);
    setShowOtherPopup(false);
    setShowWeightChart(false);
    setShowAllLogs(false);
    setShowPhotoGallery(false);
    setShowPhotoUpload(false);
    setWeightInput('');
    setMatingInput('');
    setOtherInput('');
    setPhotoDate('');
    // 날짜/시간 초기화
    setUsePastDate(false);
    setCustomDate('');
    setCustomTime('');
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

  // 현재 날짜/시간 문자열 가져오기
  const getCurrentDateTimeStrings = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    return { date, time };
  };

  // 날짜/시간 초기값 설정
  const initializeDateTimeInputs = () => {
    const { date, time } = getCurrentDateTimeStrings();
    setCustomDate(date);
    setCustomTime(time);
  };

  const handleCareLog = async (type, note = '', value = '') => {
    setLoadingType(type);
    setSuccessType(null);
    try {
      const logData = {
        type,
        note,
        value
      };

      // 과거 날짜 사용 시 createdAt 추가
      if (usePastDate && customDate && customTime) {
        logData.createdAt = new Date(`${customDate}T${customTime}:00`).toISOString();
      }

      const newLog = await createCareLog(cell.gecko.id, logData);

      // 날짜순 정렬하여 로그 목록 업데이트
      setCareLogs(prev => {
        const updated = [newLog, ...prev];
        return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

      setSuccessType(type);
      setTimeout(() => setSuccessType(null), 2000);
      onSave();

      // 과거 날짜 모드 초기화
      if (usePastDate) {
        setUsePastDate(false);
        setCustomDate('');
        setCustomTime('');
      }
    } catch (error) {
      alert('기록 실패: ' + error.message);
    } finally {
      setLoadingType(null);
    }
  };

  const handleCareButtonClick = (type) => {
    // 급여, 청소, 탈피는 바로 기록
    if (['FEEDING', 'CLEANING', 'SHEDDING'].includes(type)) {
      handleCareLog(type);
    } else if (type === 'WEIGHT') {
      setWeightInput(cell.gecko.weight?.toString() || '');
      setShowWeightPopup(true);
    } else if (type === 'MATING') {
      setMatingInput('');
      setShowMatingPopup(true);
    } else if (type === 'LAYING') {
      setShowLayingPopup(true);
    } else if (type === 'OTHER') {
      setOtherInput('');
      setShowOtherPopup(true);
    }
  };

  const handleWeightSubmit = () => {
    if (!weightInput) {
      alert('체중을 입력해주세요');
      return;
    }
    handleCareLog('WEIGHT', '', weightInput + 'g');
    setShowWeightPopup(false);
    setWeightInput('');
  };

  const handleMatingSubmit = () => {
    handleCareLog('MATING', matingInput ? `수컷: ${matingInput}` : '', '');
    setShowMatingPopup(false);
    setMatingInput('');
  };

  const handleLayingSubmit = (eggType) => {
    handleCareLog('LAYING', eggType, '');
    setShowLayingPopup(false);
  };

  const handleOtherSubmit = () => {
    if (!otherInput.trim()) {
      alert('내용을 입력해주세요');
      return;
    }
    handleCareLog('OTHER', otherInput, '');
    setShowOtherPopup(false);
    setOtherInput('');
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
      const takenAt = photoDate || new Date().toISOString().split('T')[0];
      const result = await uploadGeckoPhotoWithDate(cell.gecko.id, file, takenAt);

      // 첫 번째 사진이면 대표 이미지로 설정
      if (result.isMain) {
        setPhotoUrl(result.photoUrl);
      }

      // 사진 목록 새로고침
      await loadPhotos(cell.gecko.id);
      onSave();
      setShowPhotoUpload(false);
      setPhotoDate('');
    } catch (error) {
      alert('사진 업로드 실패: ' + error.message);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetMainPhoto = async (photoId) => {
    try {
      await setMainPhoto(photoId);
      await loadPhotos(cell.gecko.id);
      // 대표 이미지 URL 업데이트
      const mainPhoto = photos.find(p => p.id === photoId);
      if (mainPhoto) {
        setPhotoUrl(mainPhoto.photoUrl);
      }
      onSave();
    } catch (error) {
      alert('대표 이미지 설정 실패: ' + error.message);
    }
  };

  const handlePhotoDelete = async (photoId) => {
    if (!confirm('사진을 삭제하시겠습니까?')) return;

    try {
      await deletePhoto(photoId);
      await loadPhotos(cell.gecko.id);

      // 대표 이미지가 삭제됐으면 새로운 대표 이미지 설정
      const deletedPhoto = photos.find(p => p.id === photoId);
      if (deletedPhoto?.isMain) {
        const remainingPhotos = photos.filter(p => p.id !== photoId);
        if (remainingPhotos.length > 0) {
          setPhotoUrl(remainingPhotos[0].photoUrl);
        } else {
          setPhotoUrl(null);
        }
      }
      onSave();
    } catch (error) {
      alert('사진 삭제 실패: ' + error.message);
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

  const formatLogDisplay = (log) => {
    const typeInfo = CARE_TYPES.find(t => t.value === log.type);
    let display = typeInfo?.label || log.type;

    if (log.value) {
      display += ` (${log.value})`;
    }
    if (log.note) {
      display += ` - ${log.note}`;
    }
    return { icon: typeInfo?.icon, display };
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
                      <div
                        className="relative group cursor-pointer"
                        onClick={() => setShowPhotoGallery(true)}
                      >
                        <img
                          src={photoUrl}
                          alt={cell.gecko.name}
                          className="w-24 h-24 object-cover rounded-xl border border-gray-300"
                        />
                        {photos.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                            +{photos.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => setShowPhotoUpload(true)}
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
                  </div>

                  {/* 개체 정보 표시 */}
                  <div className="flex-1 space-y-1.5 text-sm">
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">모프:</span> {cell.gecko.morph || '-'}</p>
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">성별:</span> {GENDERS.find(g => g.value === cell.gecko.gender)?.label || '-'}</p>
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">생년월일:</span> {cell.gecko.birthDate ? cell.gecko.birthDate.split('T')[0] : '-'}</p>
                    <p className="text-gray-700 flex items-center gap-2">
                      <span><span className="font-semibold text-gray-900">체중:</span> {cell.gecko.weight ? `${cell.gecko.weight}g` : '-'}</span>
                      <button
                        onClick={() => setShowWeightChart(true)}
                        className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded hover:bg-emerald-200 transition-colors"
                      >
                        📊 그래프
                      </button>
                    </p>
                  </div>
                </div>
                {cell.gecko.notes && (
                  <p className="mt-3 text-sm text-gray-700 bg-white rounded-lg p-2 border border-gray-200"><span className="font-semibold">메모:</span> {cell.gecko.notes}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setShowPhotoUpload(true)}
                    disabled={uploadingPhoto}
                    className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors font-medium"
                  >
                    {uploadingPhoto ? '⏳ 업로드 중...' : '📷 사진 추가'}
                  </button>
                  {photos.length > 0 && (
                    <button
                      onClick={() => setShowPhotoGallery(true)}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      🖼️ 갤러리 ({photos.length})
                    </button>
                  )}
                </div>
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

                {/* 과거 날짜 설정 */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePastDate}
                      onChange={(e) => {
                        setUsePastDate(e.target.checked);
                        if (e.target.checked) {
                          initializeDateTimeInputs();
                        }
                      }}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">과거 날짜로 기록</span>
                  </label>
                  {usePastDate && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {CARE_TYPES.map(type => {
                    const isLoading = loadingType === type.value;
                    const isSuccess = successType === type.value;

                    return (
                      <button
                        key={type.value}
                        onClick={() => handleCareButtonClick(type.value)}
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
                  <>
                    <div className="space-y-2">
                      {careLogs.slice(0, 5).map((log, index) => {
                        const { icon, display } = formatLogDisplay(log);
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
                            <span>{icon}</span>
                            <span className="font-medium text-gray-800 flex-1 truncate">{display}</span>
                            <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</span>
                            {daysSince !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${daysSince >= 3 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {daysSince === 0 ? '오늘' : `${daysSince}일 전`}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              disabled={isDeleting}
                              className="text-gray-400 hover:text-red-500 transition-colors px-1"
                              title="삭제"
                            >
                              {isDeleting ? '⏳' : '✕'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {careLogs.length > 5 && (
                      <button
                        onClick={() => setShowAllLogs(true)}
                        className="w-full mt-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
                      >
                        전체 기록 보기 ({careLogs.length}건) →
                      </button>
                    )}
                  </>
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

      {/* 체중 입력 팝업 */}
      {showWeightPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowWeightPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-72 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">⚖️ 체중 기록</h3>
            {usePastDate && customDate && (
              <p className="text-xs text-center text-emerald-600 bg-emerald-50 rounded-lg py-1.5 mb-3">
                📅 {customDate} {customTime}
              </p>
            )}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                step="0.1"
                min="0"
                max="500"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:border-emerald-500"
                placeholder="0"
                autoFocus
              />
              <span className="text-xl font-bold text-gray-600">g</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWeightPopup(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleWeightSubmit}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
              >
                기록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메이팅 입력 팝업 */}
      {showMatingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowMatingPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">💕 메이팅 기록</h3>
            {usePastDate && customDate && (
              <p className="text-xs text-center text-emerald-600 bg-emerald-50 rounded-lg py-1.5 mb-3">
                📅 {customDate} {customTime}
              </p>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">메이팅한 수컷 (선택)</label>
              <input
                type="text"
                value={matingInput}
                onChange={e => setMatingInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="수컷 이름 입력"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMatingPopup(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleMatingSubmit}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
              >
                기록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 산란 선택 팝업 */}
      {showLayingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowLayingPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🥚 산란 기록</h3>
            {usePastDate && customDate && (
              <p className="text-xs text-center text-emerald-600 bg-emerald-50 rounded-lg py-1.5 mb-3">
                📅 {customDate} {customTime}
              </p>
            )}
            <div className="space-y-2 mb-4">
              {LAYING_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleLayingSubmit(option.value)}
                  className="w-full py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 font-medium text-gray-700 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLayingPopup(false)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 기타 입력 팝업 */}
      {showOtherPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowOtherPopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📝 기타 기록</h3>
            {usePastDate && customDate && (
              <p className="text-xs text-center text-emerald-600 bg-emerald-50 rounded-lg py-1.5 mb-3">
                📅 {customDate} {customTime}
              </p>
            )}
            <div className="mb-4">
              <textarea
                value={otherInput}
                onChange={e => setOtherInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="내용을 입력하세요"
                rows={3}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOtherPopup(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleOtherSubmit}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
              >
                기록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 체중 그래프 */}
      {showWeightChart && (
        <WeightChart
          careLogs={careLogs}
          onClose={() => setShowWeightChart(false)}
        />
      )}

      {/* 전체 기록 보기 팝업 */}
      {showAllLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowAllLogs(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                📋 전체 기록 <span className="text-gray-500 font-normal">({careLogs.length}건)</span>
              </h3>
              <button
                onClick={() => setShowAllLogs(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {careLogs.map((log) => {
                const { icon, display } = formatLogDisplay(log);
                const daysSince = getDaysSince(log.createdAt);
                const isDeleting = deletingLogId === log.id;

                return (
                  <div
                    key={log.id}
                    className={`
                      flex items-center gap-2 text-sm p-2.5 rounded-lg transition-all bg-gray-50 border border-gray-200
                      ${isDeleting ? 'opacity-50' : ''}
                    `}
                  >
                    <span>{icon}</span>
                    <span className="font-medium text-gray-800 flex-1 truncate">{display}</span>
                    <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</span>
                    {daysSince !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${daysSince >= 3 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {daysSince === 0 ? '오늘' : `${daysSince}일 전`}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={isDeleting}
                      className="text-gray-400 hover:text-red-500 transition-colors px-1"
                      title="삭제"
                    >
                      {isDeleting ? '⏳' : '✕'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 사진 업로드 팝업 */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowPhotoUpload(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-80 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📷 사진 추가</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">촬영 날짜</label>
              <input
                type="date"
                value={photoDate || new Date().toISOString().split('T')[0]}
                onChange={e => setPhotoDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`mb-4 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploadingPhoto ? (
                <span className="text-3xl">⏳</span>
              ) : (
                <>
                  <span className="text-3xl text-gray-400 mb-2">📷</span>
                  <span className="text-sm text-gray-500">클릭하여 사진 선택</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => setShowPhotoUpload(false)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 사진 갤러리 팝업 */}
      {showPhotoGallery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowPhotoGallery(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                🖼️ 사진 갤러리 <span className="text-gray-500 font-normal">({photos.length}장)</span>
              </h3>
              <button
                onClick={() => setShowPhotoGallery(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors text-xl"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photoUrl}
                      alt="Gecko photo"
                      className={`w-full aspect-square object-cover rounded-xl border-2 ${photo.isMain ? 'border-emerald-500' : 'border-gray-200'}`}
                    />
                    {photo.isMain && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        대표
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {new Date(photo.takenAt).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!photo.isMain && (
                        <button
                          onClick={() => handleSetMainPhoto(photo.id)}
                          className="w-7 h-7 bg-emerald-500 text-white rounded-full text-xs hover:bg-emerald-600 flex items-center justify-center"
                          title="대표 이미지로 설정"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        onClick={() => handlePhotoDelete(photo.id)}
                        className="w-7 h-7 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowPhotoGallery(false);
                  setShowPhotoUpload(true);
                }}
                className="w-full mt-4 py-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium transition-colors"
              >
                📷 새 사진 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
