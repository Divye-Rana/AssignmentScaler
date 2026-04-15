import React, { useEffect, useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  horizontalListSortingStrategy, 
  arrayMove, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';

import api from '../services/api';
import List from './List';
import Card from './Card';
import CardModal from './CardModal';
import './Board.css';

function Board({ boardId }) {
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [users, setUsers] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const fetchBoard = async () => {
    try {
      const res = await api.get(`/boards/${boardId}`);
      setBoard(res.data.board);
      setLists(res.data.lists);
      setCards(res.data.cards);
      
      // Also fetch all available users for the filter
      const usersRes = await api.get('/users');
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (listId) => {
    const title = window.prompt("Enter card title");
    if (!title) return;
    try {
      const res = await api.post('/cards', { list_id: listId, title, description: '' });
      setCards([...cards, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddList = async () => {
    const title = window.prompt("Enter list title");
    if (!title) return;
    try {
      const res = await api.post('/lists', { board_id: boardId, title });
      setLists([...lists, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list?')) return;
    try {
      await api.delete(`/lists/${listId}`);
      setLists((prev) => prev.filter(l => l.id !== listId));
    } catch (err) {
      console.error(err);
    }
  };

  // -- DND HANDLERS --
  const onDragStart = (event) => {
    const { active } = event;
    const { type, list, card } = active.data.current;

    if (type === 'List') setActiveList(list);
    if (type === 'Card') setActiveCard(card);
  };

  const onDragOver = (event) => {
    // Only handle Card movements between lists
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;

    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverList = over.data.current?.type === 'List';

    if (!isActiveCard) return;

    // Card over another card
    if (isActiveCard && isOverCard) {
      setCards((prev) => {
        const activeIndex = prev.findIndex((c) => c.id === active.data.current.card.id);
        const overIndex = prev.findIndex((c) => c.id === over.data.current.card.id);

        if (prev[activeIndex].list_id !== prev[overIndex].list_id) {
          // Different list
          const modifiedArray = [...prev];
          modifiedArray[activeIndex].list_id = prev[overIndex].list_id;
          return arrayMove(modifiedArray, activeIndex, overIndex);
        }
        // Same list
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Card over empty list
    if (isActiveCard && isOverList) {
      setCards((prev) => {
        const activeIndex = prev.findIndex((c) => c.id === active.data.current.card.id);
        const overListId = over.data.current.list.id;
        
        if (prev[activeIndex].list_id !== overListId) {
          const modifiedArray = [...prev];
          modifiedArray[activeIndex].list_id = overListId;
          return arrayMove(modifiedArray, activeIndex, activeIndex); 
        }
        return prev;
      });
    }
  };

  const onDragEnd = async (event) => {
    setActiveCard(null);
    setActiveList(null);

    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const isActiveList = active.data.current?.type === 'List';
    const isActiveCard = active.data.current?.type === 'Card';

    if (isActiveList) {
      // Reordering lists
      setLists((prev) => {
        const activeIndex = prev.findIndex((l) => l.id === active.data.current.list.id);
        const overIndex = prev.findIndex((l) => l.id === over.data.current.list.id);
        const newLists = arrayMove(prev, activeIndex, overIndex);
        
        // Optimistic UI, you'd then sync `newLists` positions to backend
        return newLists;
      });
    }

    if (isActiveCard) {
      // Reorder cards
      setCards((prev) => {
        const activeIndex = prev.findIndex((c) => c.id === active.data.current.card.id);
        const overIndex = prev.findIndex((c) => c.id === over.data.current.card.id || c.list_id === over.data.current.list?.id);
        const newCards = arrayMove(prev, activeIndex, overIndex !== -1 ? overIndex : activeIndex);

        // Optimistic DB update
        const cardObj = newCards[activeIndex]; 
        if (cardObj) {
           api.patch(`/cards/${cardObj.id}/reorder`, {
             list_id: cardObj.list_id,
             // Dummy position calculation for simplicity
             position: activeIndex * 1024 + 1024 
           }).catch(err => console.error(err));
        }

        return newCards;
      });
    }
  };

  if (loading) return <div className="board-loading">Loading board...</div>;
  if (!board) return <div className="board-loading">Board not found</div>;

  const listIds = lists.map(l => `list-${l.id}`);

  return (
    <div className="board-container">
      <div className="board-header">
        <h2>{board.title}</h2>
        <div className="board-header-actions">
          <select 
            value={memberFilter} 
            onChange={(e) => setMemberFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--secondary-bg)', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <option value="">All Members</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Search cards..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--secondary-bg)', color: 'var(--text-main)' }}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="board-lists">
          <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => {
              const listCards = cards.filter((c) => {
                const matchesList = c.list_id === list.id;
                const matchesSearch = searchQuery === '' || c.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesMember = memberFilter === '' || (c.members && c.members.some(m => String(m.id) === String(memberFilter)));
                return matchesList && matchesSearch && matchesMember;
              });
              return (
                <List 
                  key={list.id} 
                  list={list} 
                  cards={listCards} 
                  onAddCard={handleAddCard} 
                  onCardClick={(card) => setSelectedCard(card)}
                  onDeleteList={() => handleDeleteList(list.id)}
                />
              );
            })}
          </SortableContext>
          <div onClick={handleAddList} className="add-list-btn" role="button" tabIndex={0}>
            + Add another list
          </div>
        </div>

        {/* Drag Overlays for smooth dragging visuals */}
        <DragOverlay>
          {activeList && (
            <List list={activeList} cards={cards.filter(c => c.list_id === activeList.id)} />
          )}
          {activeCard && <Card card={activeCard} />}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          onUpdate={(id, updates) => {
            setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            api.put(`/cards/${id}`, updates).catch(err => console.error(err));
          }}
          onDelete={async (id) => {
            if (!window.confirm('Delete this card?')) return;
            try {
              await api.delete(`/cards/${id}`);
              setCards(prev => prev.filter(c => c.id !== id));
              setSelectedCard(null);
            } catch (err) {
               console.error(err);
            }
          }}
        />
      )}
    </div>
  );
}

export default Board;
