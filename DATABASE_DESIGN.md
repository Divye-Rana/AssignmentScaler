# Kanban Application: Database Design

The PostgreSQL database utilizes a highly normalized relational structure designed for performance, cascade deletions, and data integrity.

## Entity Relationship Summary

All core tables utilize `ON DELETE CASCADE` foreign keys. This guarantees that if a parent entity (like a List) is deleted, all dependent children (like Cards, Labels, and Members) are automatically pruned without creating server memory leaks.

---

### Core Tables

#### 1. `users`
Stores all account data and visual identities for team members.
*   `id` (SERIAL PRIMARY KEY)
*   `name` (VARCHAR) - Full name of the user.
*   `email` (VARCHAR UNIQUE)
*   `avatar_url` (TEXT) - Hosted link to their profile icon.

#### 2. `boards`
The highest level container representing a single project space.
*   `id` (SERIAL PRIMARY KEY)
*   `title` (VARCHAR) - Name of the project.
*   `user_id` (INTEGER FK) - Owner of the board `-> users(id)`

#### 3. `lists`
The vertical columns grouping tasks by state (e.g. "To Do", "In Progress").
*   `id` (SERIAL PRIMARY KEY)
*   `board_id` (INTEGER FK) - The parent board `-> boards(id)`
*   `title` (VARCHAR)
*   `position` (REAL) - A float index utilized by `dnd-kit` to allow lightning fast arbitrary dragging without re-indexing all other lists.

#### 4. `cards`
The fundamental task unit representing a piece of work.
*   `id` (SERIAL PRIMARY KEY)
*   `list_id` (INTEGER FK) - The column that currently holds it `-> lists(id)`
*   `title` (VARCHAR)
*   `description` (TEXT)
*   `due_date` (TIMESTAMP)
*   `position` (REAL) - Drag-and-drop sort index.

---

### Nested Features & Many-To-Many Tables

#### 5. `labels`
Master table of global color tags generated for a specific board.
*   `id` (SERIAL) | `board_id` (FK) | `name` (VARCHAR) | `color` (VARCHAR pseudo-hex)

#### 6. `card_labels` (Join Table)
Links cards to multiple colored labels dynamically.
*   `card_id` (FK) + `label_id` (FK) -> **Composite Primary Key**

#### 7. `card_members` (Join Table)
Assigns multiple distinct system users to collaborate on a single card.
*   `card_id` (FK) + `user_id` (FK) -> **Composite Primary Key**

#### 8. `checklists`
Sub-task groupings mounted inside a Card's modal.
*   `id` (SERIAL) | `card_id` (FK) | `title` (VARCHAR)

#### 9. `checklist_items`
The individual togglable checkboxes within a checklist.
*   `id` (SERIAL) | `checklist_id` (FK) | `title` (VARCHAR) | `is_completed` (BOOLEAN)
