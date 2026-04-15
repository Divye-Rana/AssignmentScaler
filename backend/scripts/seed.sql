-- Insert Dummy Users
INSERT INTO users (name, email, avatar_url) VALUES 
('Alice Smith', 'alice@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
('Bob Jones', 'bob@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'),
('Charlie Brown', 'charlie@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie');

-- Insert Board
INSERT INTO boards (title, user_id) VALUES 
('Product Roadmap', 1);

-- Insert Lists
INSERT INTO lists (board_id, title, position) VALUES 
(1, 'To Do', 1024),
(1, 'In Progress', 2048),
(1, 'Done', 3072);

-- Insert Cards
INSERT INTO cards (list_id, title, description, position) VALUES 
(1, 'Design System Update', 'Update the core components library with new brand colors.', 1024),
(1, 'Implement Auth', 'Add strict JWT-based authentication for all APIs.', 2048),
(2, 'Kanban Board Drag & Drop', 'Use dnd-kit to add sorting functionality.', 1024),
(3, 'Database Schema', 'Normalize db schema for boards, lists, and cards.', 1024);

-- Insert Labels
INSERT INTO labels (board_id, name, color) VALUES 
(1, 'Feature', '#3b82f6'),
(1, 'Bug', '#ef4444'),
(1, 'Design', '#10b981'),
(1, 'Urgent', '#f59e0b');

-- Associate Labels
INSERT INTO card_labels (card_id, label_id) VALUES 
(1, 3), (2, 1), (3, 1), (3, 4), (4, 1);

-- Associate Members
INSERT INTO card_members (card_id, user_id) VALUES 
(1, 1), (2, 2), (3, 1), (3, 3), (4, 1);
