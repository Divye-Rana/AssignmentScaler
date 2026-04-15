import React, { useState, useEffect } from 'react';
import { X, Calendar, AlignLeft, CheckSquare, Tag, Users, Trash2 } from 'lucide-react';
import api from '../services/api';
import './CardModal.css';

function CardModal({ card, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(card.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState(card.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  
  // Advanced features state
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  
  // Local card state to handle updates smoothly
  const [localCard, setLocalCard] = useState(card);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setAvailableUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTitle = (e) => {
    if (e.key === 'Enter') {
      onUpdate(card.id, { title });
      setIsEditingTitle(false);
    }
  };

  const handleSaveDescription = () => {
    onUpdate(card.id, { description });
    setIsEditingDesc(false);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    onUpdate(card.id, { due_date: newDate });
    setLocalCard({ ...localCard, due_date: newDate });
  };

  const toggleMember = async (user) => {
    try {
      const isAssigned = localCard.members?.some(m => m.id === user.id);
      let newMembers = localCard.members || [];
      
      if (isAssigned) {
        await api.delete(`/cards/${card.id}/members/${user.id}`);
        newMembers = newMembers.filter(m => m.id !== user.id);
      } else {
        await api.post(`/cards/${card.id}/members`, { user_id: user.id });
        newMembers = [...newMembers, user];
      }
      setLocalCard({ ...localCard, members: newMembers });
      // Tell parent board to force refresh or update optimistic
      onUpdate(card.id, { members: newMembers }); 
    } catch (err) {
      console.error(err);
    }
  };

  // Checklists logic
  const handleAddChecklist = async () => {
    const cTitle = window.prompt("Checklist Name");
    if (!cTitle) return;
    try {
      const res = await api.post(`/cards/${card.id}/checklists`, { title: cTitle });
      const newChecklist = { ...res.data, items: [] };
      setLocalCard({
        ...localCard,
        checklists: [...(localCard.checklists || []), newChecklist]
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklistItem = async (checklistId) => {
    const iTitle = window.prompt("Item Name");
    if (!iTitle) return;
    try {
      const res = await api.post(`/checklists/${checklistId}/items`, { title: iTitle });
      const updatedChecklists = localCard.checklists.map(c => {
        if (c.id === checklistId) {
          return { ...c, items: [...c.items, res.data] };
        }
        return c;
      });
      setLocalCard({ ...localCard, checklists: updatedChecklists });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklistItem = async (item) => {
    const isCompleted = !item.is_completed;
    try {
      await api.put(`/checklists/items/${item.id}`, { is_completed: isCompleted });
      const updatedChecklists = localCard.checklists.map(c => {
        return {
          ...c,
          items: c.items.map(i => i.id === item.id ? { ...i, is_completed: isCompleted } : i)
        };
      });
      setLocalCard({ ...localCard, checklists: updatedChecklists });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {isEditingTitle ? (
            <input 
              autoFocus 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              onKeyDown={handleSaveTitle} 
              onBlur={() => { onUpdate(card.id, { title }); setIsEditingTitle(false); }}
              style={{ fontSize: '1.25rem', fontWeight: 600, padding: '0.25rem', backgroundColor: 'transparent', color: 'inherit', border: '1px solid var(--accent-color)' }}
            />
          ) : (
            <h2 onClick={() => setIsEditingTitle(true)} style={{ cursor: 'pointer' }}>{title}</h2>
          )}
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div className="modal-main">

            {/* Labels and Members Mini Display */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
               {localCard.members?.length > 0 && (
                 <div>
                   <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>MEMBERS</h3>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     {localCard.members.map(m => (
                       <img key={m.id} src={m.avatar_url} alt={m.name} title={m.name} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fff' }} />
                     ))}
                   </div>
                 </div>
               )}
               {localCard.due_date && (
                 <div>
                   <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DUE DATE</h3>
                   <div style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--tertiary-bg)', borderRadius: '4px' }}>
                     {new Date(localCard.due_date).toLocaleDateString()}
                   </div>
                 </div>
               )}
            </div>

            <div className="modal-section">
              <h3><AlignLeft size={16} /> Description</h3>
              {isEditingDesc ? (
                <div className="desc-edit">
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    autoFocus
                  />
                  <div className="desc-actions">
                    <button className="btn-primary" onClick={handleSaveDescription}>Save</button>
                    <button className="btn-secondary" onClick={() => setIsEditingDesc(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="desc-display" onClick={() => setIsEditingDesc(true)}>
                  {description || 'Add a more detailed description...'}
                </div>
              )}
            </div>

            {/* Checklists */}
            {localCard.checklists && localCard.checklists.map(checklist => {
              const totalItems = checklist.items?.length || 0;
              const completedItems = checklist.items?.filter(i => i.is_completed).length || 0;
              const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

              return (
                <div key={checklist.id} className="modal-section">
                  <h3><CheckSquare size={16} /> {checklist.title}</h3>
                  <div style={{ width: '100%', backgroundColor: 'var(--primary-bg)', height: '6px', borderRadius: '3px', marginBottom: '1rem' }}>
                     <div style={{ width: `${progress}%`, backgroundColor: progress === 100 ? 'var(--accent-color)' : '#333', height: '100%', borderRadius: '3px', transition: 'width 0.2s' }}></div>
                  </div>
                  <div className="checklist-placeholder">
                    {checklist.items?.map(item => (
                      <div key={item.id} className="checklist-item">
                        <input 
                           type="checkbox" 
                           checked={item.is_completed} 
                           onChange={() => handleToggleChecklistItem(item)}
                        /> 
                        <span style={{ textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? 'var(--text-muted)' : 'inherit' }}>
                           {item.title}
                        </span>
                      </div>
                    ))}
                    <button className="sidebar-btn" onClick={() => handleAddChecklistItem(checklist.id)} style={{ marginTop: '0.5rem', width: 'fit-content' }}>
                      Add an item
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
          
          <div className="modal-sidebar">
            <h3>Add to card</h3>
            
            {/* Members Toggle */}
            <div style={{ position: 'relative' }}>
              <button className="sidebar-btn" onClick={() => setShowUsers(!showUsers)} style={{ width: '100%' }}>
                <Users size={14}/> Members
              </button>
              {showUsers && (
                <div style={{ position: 'absolute', top: '100%', left: 0, width: '200px', backgroundColor: 'var(--tertiary-bg)', border: '1px solid var(--border-color)', zIndex: 10, padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                   {availableUsers.map(user => {
                     const isAssigned = localCard.members?.some(m => m.id === user.id);
                     return (
                       <div key={user.id} onClick={() => toggleMember(user)} style={{ display: 'flex', alignItems: 'center', padding: '0.25rem', gap: '0.5rem', cursor: 'pointer', backgroundColor: isAssigned ? '#333' : 'transparent', borderRadius: '4px' }}>
                          <img src={user.avatar_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                          <span>{user.name}</span>
                       </div>
                     )
                   })}
                </div>
              )}
            </div>

            <button className="sidebar-btn" style={{ width: '100%' }}><Tag size={14}/> Labels (Coming soon)</button>
            <button className="sidebar-btn" style={{ width: '100%' }} onClick={handleAddChecklist}><CheckSquare size={14}/> Checklist</button>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Due Date</span>
              <input type="date" className="sidebar-btn" value={localCard.due_date ? localCard.due_date.substring(0, 10) : ''} onChange={handleDateChange} style={{ width: '100%' }} />
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>Actions</h3>
            <button className="sidebar-btn" onClick={() => onDelete(card.id)} style={{ width: '100%', color: 'var(--danger-color)' }}>
              <Trash2 size={14}/> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
