import React from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2 } from 'lucide-react';
import Card from './Card';
import './List.css';

function List({ list, cards, onAddCard, onCardClick, onDeleteList }) {
  // Sortable hook for the list itself
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `list-${list.id}`,
    data: {
      type: 'List',
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Extract card IDs for SortableContext
  const cardIds = cards.map(c => `card-${c.id}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`list-container ${isDragging ? 'list-drag-overlay' : ''}`}
    >
      <div className="list-header" {...attributes} {...listeners}>
        <span>{list.title}</span>
        {onDeleteList && (
          <button onClick={onDeleteList} style={{ color: 'var(--text-muted)' }} onPointerDown={(e) => e.stopPropagation()}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="list-cards">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} onClick={() => onCardClick?.(card)} />
          ))}
        </SortableContext>
      </div>

      <button className="add-card-btn" onClick={() => onAddCard(list.id)}>
        <Plus size={16} /> Add a card
      </button>
    </div>
  );
}

export default List;
