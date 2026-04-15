import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Card.css';

function Card({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: {
      type: 'Card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card-container ${isDragging ? 'card-drag-overlay' : ''}`}
      onClick={onClick}
    >
      <div className="card-title">{card.title}</div>
      {/* If there were labels associated directly to the card */}
      {card.labels && card.labels.length > 0 && (
        <div className="card-badges">
          {card.labels.map((L) => (
            <div key={L.id} className="card-badge" style={{ backgroundColor: L.color }} title={L.name}></div>
          ))}
        </div>
      )}
      
      {/* Map assigned members */}
      {card.members && card.members.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {card.members.map((member) => (
            <img 
              key={member.id} 
              src={member.avatar_url} 
              alt={member.name} 
              title={member.name} 
              style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fff' }} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Card;
