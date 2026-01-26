import { useMemo } from 'react';
import GeckoCell from './GeckoCell';

const CARE_THRESHOLD_DAYS = 3;

function getGeckoStatus(gecko) {
  if (!gecko) return 'empty';

  const now = new Date();
  const threshold = new Date(now.getTime() - CARE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const lastFeeding = gecko.careLogs?.find(log => log.type === 'FEEDING');
  const lastCleaning = gecko.careLogs?.find(log => log.type === 'CLEANING');

  const needsFeeding = !lastFeeding || new Date(lastFeeding.createdAt) < threshold;
  const needsCleaning = !lastCleaning || new Date(lastCleaning.createdAt) < threshold;

  if (needsFeeding || needsCleaning) return 'urgent';
  return 'good';
}

export default function RackGrid({ rack, onCellClick }) {
  const grid = useMemo(() => {
    const cells = [];
    for (let row = rack.rows; row >= 1; row--) {
      const rowCells = [];
      for (let col = 1; col <= rack.columns; col++) {
        const gecko = rack.geckos?.find(g => g.row === row && g.column === col);
        rowCells.push({ row, col, gecko });
      }
      cells.push(rowCells);
    }
    return cells;
  }, [rack]);

  const needsScroll = rack.columns > 4;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-5 mb-4 sm:mb-6 border border-gray-200">
      <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
        {rack.name}
        <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1">
          {rack.columns}x{rack.rows}
        </span>
      </h2>

      <div className={needsScroll ? "overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0" : ""}>
        <div
          className="bg-gray-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-2"
          style={needsScroll ? { minWidth: `${rack.columns * 80 + 56}px` } : {}}
        >
          {grid.map((rowCells, rowIdx) => (
            <div key={rowIdx} className="flex gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 last:mb-0">
              {/* 층 표시 */}
              <div className="w-7 sm:w-9 flex-shrink-0 flex items-center justify-center text-gray-600 text-xs sm:text-sm font-medium">
                {rack.rows - rowIdx}층
              </div>
              {/* 셀들 */}
              {rowCells.map((cell) => (
                <GeckoCell
                  key={`${rack.id}-${cell.row}-${cell.col}`}
                  cell={cell}
                  rackId={rack.id}
                  status={getGeckoStatus(cell.gecko)}
                  onClick={() => onCellClick(cell, rack.id)}
                  fixedWidth={needsScroll}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {needsScroll && (
        <p className="text-xs text-gray-400 mt-2 text-center sm:hidden">
          ← 스크롤 →
        </p>
      )}
    </div>
  );
}
