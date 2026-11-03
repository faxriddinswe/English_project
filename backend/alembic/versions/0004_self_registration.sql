ALTER TABLE users ADD COLUMN registration_pending BOOLEAN NOT NULL DEFAULT false;
UPDATE users u SET registration_pending = true WHERE u.role = 'student' AND NOT u.active AND EXISTS (SELECT 1 FROM students s WHERE s.user_id=u.id AND s.admission_status='pending' AND s.deleted_at IS NULL);
