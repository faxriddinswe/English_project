ALTER TABLE students ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN admission_status VARCHAR(20) NOT NULL DEFAULT 'approved';
ALTER TABLE students ADD CONSTRAINT student_admission_status CHECK (admission_status IN ('pending','approved','rejected'));
ALTER TABLE groups ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE courses ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX ix_students_deleted_at ON students (deleted_at);
CREATE INDEX ix_groups_deleted_at ON groups (deleted_at);
CREATE INDEX ix_courses_deleted_at ON courses (deleted_at);
UPDATE students s SET admission_status = 'pending'
WHERE s.status = 'paused' AND EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id AND NOT u.active AND u.role = 'student')
AND EXISTS (SELECT 1 FROM leads l WHERE l.student_id = s.id AND l.source = 'cabinet_signup' AND l.status = 'new');
UPDATE students s SET admission_status = 'rejected'
WHERE s.status = 'archived' AND EXISTS (SELECT 1 FROM leads l WHERE l.student_id = s.id AND l.source = 'cabinet_signup' AND l.status = 'closed');
UPDATE students SET deleted_at = updated_at WHERE status = 'archived';
UPDATE groups SET deleted_at = updated_at WHERE status = 'archived';
UPDATE courses SET deleted_at = updated_at WHERE NOT active;
