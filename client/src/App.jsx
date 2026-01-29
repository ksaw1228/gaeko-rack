import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { getRacks, moveGecko, swapGeckos, deleteRack } from './api';
import RackGrid from './components/RackGrid';
import GeckoModal from './components/GeckoModal';
import AddRackModal from './components/AddRackModal';
import EditRackModal from './components/EditRackModal';
import GeckoLogo from './components/GeckoLogo';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedRackId, setSelectedRackId] = useState(null);
  const [showAddRack, setShowAddRack] = useState(false);
  const [editingRack, setEditingRack] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const fetchRacks = useCallback(async () => {
    try {
      const data = await getRacks();
      setRacks(data);
    } catch (error) {
      console.error('Failed to fetch racks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRacks();
  }, [fetchRacks]);

  const handleCellClick = (cell, rackId) => {
    setSelectedCell(cell);
    setSelectedRackId(rackId);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const [, targetRackId, targetRow, targetCol] = over.id.split('-').map(Number);
    const geckoId = parseInt(active.id.replace('gecko-', ''));

    const targetRack = racks.find(r => r.id === targetRackId);
    const targetGecko = targetRack?.geckos?.find(g => g.row === targetRow && g.column === targetCol);

    try {
      if (targetGecko) {
        const confirmed = confirm(
          `"${targetGecko.name}"이(가) 있는 위치입니다.\n두 개체의 위치를 교환하시겠습니까?`
        );
        if (!confirmed) return;

        await swapGeckos(geckoId, targetGecko.id);
      } else {
        await moveGecko(geckoId, { rackId: targetRackId, row: targetRow, column: targetCol });
      }
      fetchRacks();
    } catch (error) {
      alert('이동 실패: ' + error.message);
    }
  };

  const handleDeleteRack = async (rackId) => {
    if (!confirm('이 랙과 모든 개체 정보가 삭제됩니다. 계속하시겠습니까?')) return;
    try {
      await deleteRack(rackId);
      fetchRacks();
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  const totalGeckos = racks.reduce((sum, rack) => sum + (rack.geckos?.length || 0), 0);
  const totalCells = racks.reduce((sum, rack) => sum + rack.rows * rack.columns, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GeckoLogo size={80} className="mx-auto animate-bounce" />
          <p className="mt-4 text-gray-600 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <GeckoLogo size={36} className="flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                게코 랙 매니저
              </h1>
              <p className="text-xs text-gray-500">
                {racks.length}개 랙 · {totalGeckos}마리 / {totalCells}칸
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddRack(true)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm shadow-md transition-all hover:scale-105 active:scale-95"
            >
              + <span className="hidden sm:inline">새 랙</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 sm:py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="로그아웃"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3">
        <div className="flex flex-wrap gap-3 sm:gap-5 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
            <span className="text-gray-700">완료</span>
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
            <span className="text-gray-700">관리 필요</span>
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="w-2.5 h-2.5 bg-gray-300 rounded-full"></span>
            <span className="text-gray-700">빈 칸</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {racks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-200">
              <GeckoLogo size={120} className="mx-auto" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mt-6 mb-2">
                아직 랙이 없어요!
              </h2>
              <p className="text-gray-500 mb-6">첫 번째 랙을 추가해서 시작하세요</p>
              <button
                onClick={() => setShowAddRack(true)}
                className="px-8 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium shadow-md transition-all hover:scale-105"
              >
                + 랙 추가하기
              </button>
            </div>
          ) : (
            racks.map(rack => (
              <div key={rack.id} className="relative">
                <RackGrid
                  rack={rack}
                  onCellClick={handleCellClick}
                />
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1">
                  <button
                    onClick={() => setEditingRack(rack)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                    title="랙 수정"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteRack(rack.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="랙 삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </DndContext>
      </main>

      {/* Modals */}
      <GeckoModal
        isOpen={selectedCell !== null}
        onClose={() => {
          setSelectedCell(null);
          setSelectedRackId(null);
        }}
        cell={selectedCell}
        rackId={selectedRackId}
        onSave={fetchRacks}
      />

      <AddRackModal
        isOpen={showAddRack}
        onClose={() => setShowAddRack(false)}
        onSave={fetchRacks}
      />

      <EditRackModal
        isOpen={editingRack !== null}
        onClose={() => setEditingRack(null)}
        rack={editingRack}
        onSave={fetchRacks}
      />
    </div>
  );
}

export default App;
