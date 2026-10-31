-- Migration 003: Progressive RAG column and index upgrade
ALTER TABLE file_chunks ADD COLUMN embedding_json TEXT DEFAULT '[]';
CREATE INDEX IF NOT EXISTS idx_file_chunks_file_id ON file_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
