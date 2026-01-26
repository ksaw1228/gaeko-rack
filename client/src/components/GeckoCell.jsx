import { useDraggable, useDroppable } from '@dnd-kit/core';

const statusColors = {
  empty: 'bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300',
  good: 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400',
  urgent: 'bg-rose-50 hover:bg-rose-100 border-2 border-rose-400'
};

const statusBadgeColors = {
  good: 'bg-emerald-500',
  urgent: 'bg-rose-500 animate-pulse'
};

export default function GeckoCell({ cell, rackId, status, onClick, fixedWidth = false }) {
  const { gecko, row, col } = cell;
  const cellId = `cell-${rackId}-${row}-${col}`;

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: gecko ? `gecko-${gecko.id}` : cellId,
    disabled: !gecko
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: cellId
  });

  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      ref={(node) => {
        setDropRef(node);
        if (gecko) setDragRef(node);
      }}
      {...(gecko ? attributes : {})}
      {...(gecko ? listeners : {})}
      className={`
        ${fixedWidth ? 'w-[72px] sm:w-20 flex-shrink-0' : 'flex-1 min-w-[60px] sm:min-w-20'}
        aspect-square rounded-xl sm:rounded-2xl
        flex flex-col items-center justify-center cursor-pointer
        transition-all duration-300 relative overflow-hidden
        ${gecko?.photoUrl ? '' : statusColors[status]}
        ${isOver ? 'ring-4 ring-teal-400 ring-opacity-50 scale-105' : ''}
        ${isDragging ? 'opacity-50 scale-95' : ''}
        shadow-sm hover:shadow-md
      `}
      onClick={handleClick}
    >
      {gecko ? (
        <div className="text-center w-full h-full flex flex-col items-center justify-center pointer-events-none relative">
          {gecko.photoUrl ? (
            <>
              <img
                src={gecko.photoUrl}
                alt={gecko.name}
                className="absolute inset-0 w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl sm:rounded-2xl" />
              <div className={`absolute top-1.5 right-1.5 w-3 h-3 rounded-full ${statusBadgeColors[status]} shadow-lg ring-2 ring-white`} />
              <div className="absolute bottom-1 sm:bottom-1.5 left-0 right-0 text-center">
                <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-lg truncate block px-1">
                  {gecko.name}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className={`absolute top-1.5 right-1.5 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full ${statusBadgeColors[status]} shadow-sm`} />
              <div className="text-2xl sm:text-3xl mb-0.5">🦎</div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-800 truncate max-w-full px-1">
                {gecko.name}
              </span>
              {gecko.morph && (
                <span className="text-[8px] sm:text-[10px] text-gray-500 truncate max-w-full px-1 hidden sm:block">
                  {gecko.morph}
                </span>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center pointer-events-none flex flex-col items-center justify-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
            <span className="text-gray-400 text-lg sm:text-xl">+</span>
          </div>
          <span className="text-[9px] sm:text-xs text-gray-400 hidden sm:block">추가</span>
        </div>
      )}
    </div>
  );
}
