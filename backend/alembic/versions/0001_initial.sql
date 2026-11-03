CREATE EXTENSION IF NOT EXISTS btree_gist;


CREATE TABLE rate_limits (
	key VARCHAR(64) NOT NULL, 
	"window" INTEGER NOT NULL, 
	count INTEGER NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (key)
)

;


CREATE TABLE users (
	username VARCHAR(100) NOT NULL, 
	password_hash TEXT NOT NULL, 
	role VARCHAR(20) NOT NULL, 
	active BOOLEAN NOT NULL, 
	must_change_password BOOLEAN NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (role IN ('teacher','student')), 
	UNIQUE (username)
)

;


CREATE TABLE audit_logs (
	actor_id UUID, 
	action VARCHAR(100) NOT NULL, 
	object_id UUID NOT NULL, 
	details JSONB NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;


CREATE TABLE media_assets (
	owner_id UUID NOT NULL, 
	visibility VARCHAR(20) NOT NULL, 
	object_key VARCHAR(200) NOT NULL, 
	mime VARCHAR(100) NOT NULL, 
	size INTEGER NOT NULL, 
	alt VARCHAR(500) NOT NULL, 
	public_prepared BOOLEAN NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (visibility IN ('public','private') AND size > 0), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	UNIQUE (object_key)
)

;


CREATE TABLE sessions (
	user_id UUID NOT NULL, 
	token_hash VARCHAR(64) NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	revoked BOOLEAN NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	UNIQUE (token_hash)
)

;

CREATE INDEX ix_sessions_user_id ON sessions (user_id);

CREATE INDEX ix_sessions_expires_at ON sessions (expires_at);


CREATE TABLE students (
	user_id UUID, 
	full_name VARCHAR(200) NOT NULL, 
	phone VARCHAR(13) NOT NULL, 
	parent_phone VARCHAR(13), 
	joined_on DATE NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	private_note TEXT NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (status IN ('active','paused','left','archived')), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE INDEX ix_students_phone ON students (phone);

CREATE INDEX ix_students_status ON students (status);

CREATE INDEX ix_students_full_name ON students (full_name);


CREATE TABLE content (
	kind VARCHAR(40) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	data JSONB NOT NULL, 
	published_data JSONB, 
	published_title VARCHAR(200), 
	media_id UUID, 
	published_media_id UUID, 
	published BOOLEAN NOT NULL, 
	consent BOOLEAN NOT NULL, 
	approved BOOLEAN NOT NULL, 
	sort_order INTEGER NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (kind IN ('hero','bio','stat','benefit','result','testimonial','gallery','faq','contact','privacy','settings')), 
	FOREIGN KEY(media_id) REFERENCES media_assets (id), 
	FOREIGN KEY(published_media_id) REFERENCES media_assets (id)
)

;

CREATE INDEX ix_content_kind ON content (kind);


CREATE TABLE courses (
	name VARCHAR(200) NOT NULL, 
	slug VARCHAR(100) NOT NULL, 
	short_description TEXT NOT NULL, 
	description TEXT NOT NULL, 
	audience TEXT NOT NULL, 
	level VARCHAR(100) NOT NULL, 
	features JSONB NOT NULL, 
	duration VARCHAR(100) NOT NULL, 
	lessons_per_week INTEGER, 
	lesson_minutes INTEGER, 
	format VARCHAR(30) NOT NULL, 
	schedule VARCHAR(200) NOT NULL, 
	marketing_price NUMERIC(18, 2), 
	image_id UUID, 
	sort_order INTEGER NOT NULL, 
	active BOOLEAN NOT NULL, 
	published BOOLEAN NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (marketing_price IS NULL OR marketing_price >= 0), 
	UNIQUE (slug), 
	FOREIGN KEY(image_id) REFERENCES media_assets (id)
)

;


CREATE TABLE payments (
	student_id UUID NOT NULL, 
	amount NUMERIC(18, 2) NOT NULL, 
	received_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	method VARCHAR(30) NOT NULL, 
	reference VARCHAR(200) NOT NULL, 
	actor_id UUID NOT NULL, 
	idempotency_key VARCHAR(100) NOT NULL, 
	payload_hash VARCHAR(64) NOT NULL, 
	void_reason TEXT, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (actor_id, idempotency_key), 
	CHECK (amount > 0), 
	CHECK (method IN ('cash','bank_transfer','other')), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;

CREATE INDEX ix_payments_received_at ON payments (received_at);

CREATE INDEX ix_payments_student_id ON payments (student_id);


CREATE TABLE groups (
	course_id UUID NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	level VARCHAR(100) NOT NULL, 
	capacity INTEGER NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE, 
	status VARCHAR(20) NOT NULL, 
	monthly_price NUMERIC(18, 2) NOT NULL, 
	location VARCHAR(500) NOT NULL, 
	billing_policy VARCHAR(30) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (capacity > 0 AND monthly_price >= 0), 
	CHECK (end_date IS NULL OR end_date >= start_date), 
	CHECK (status IN ('active','paused','ended','archived')), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
)

;

CREATE INDEX ix_groups_status ON groups (status);


CREATE TABLE leads (
	full_name VARCHAR(200) NOT NULL, 
	phone VARCHAR(13) NOT NULL, 
	course_id UUID, 
	comment TEXT NOT NULL, 
	source VARCHAR(500) NOT NULL, 
	status VARCHAR(30) NOT NULL, 
	follow_up_at TIMESTAMP WITH TIME ZONE, 
	trial_at TIMESTAMP WITH TIME ZONE, 
	closed_reason TEXT, 
	student_id UUID, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (status IN ('new','contacted','trial_scheduled','converted','closed')), 
	FOREIGN KEY(course_id) REFERENCES courses (id), 
	FOREIGN KEY(student_id) REFERENCES students (id)
)

;

CREATE INDEX ix_leads_status ON leads (status);

CREATE INDEX ix_leads_phone ON leads (phone);


CREATE TABLE refunds (
	payment_id UUID NOT NULL, 
	amount NUMERIC(18, 2) NOT NULL, 
	reason TEXT NOT NULL, 
	actor_id UUID NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (amount > 0), 
	FOREIGN KEY(payment_id) REFERENCES payments (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;

CREATE INDEX ix_refunds_payment_id ON refunds (payment_id);


CREATE TABLE assessment_results (
	student_id UUID NOT NULL, 
	group_id UUID NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	score NUMERIC(10, 2) NOT NULL, 
	max_score NUMERIC(10, 2) NOT NULL, 
	feedback TEXT NOT NULL, 
	private_note TEXT NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (max_score > 0 AND score >= 0 AND score <= max_score), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(group_id) REFERENCES groups (id)
)

;

CREATE INDEX ix_assessment_results_student_id ON assessment_results (student_id);


CREATE TABLE assignments (
	group_id UUID NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	description TEXT NOT NULL, 
	media_id UUID, 
	link VARCHAR(1000), 
	deadline TIMESTAMP WITH TIME ZONE NOT NULL, 
	published BOOLEAN NOT NULL, 
	deadline_lock BOOLEAN NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(group_id) REFERENCES groups (id), 
	FOREIGN KEY(media_id) REFERENCES media_assets (id)
)

;

CREATE INDEX ix_assignments_group_id ON assignments (group_id);


CREATE TABLE lead_history (
	lead_id UUID NOT NULL, 
	actor_id UUID, 
	note TEXT NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(lead_id) REFERENCES leads (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;

CREATE INDEX ix_lead_history_lead_id ON lead_history (lead_id);


CREATE TABLE lessons (
	group_id UUID NOT NULL, 
	starts_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	ends_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	original_starts_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	change_reason TEXT NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (group_id, original_starts_at), 
	CHECK (ends_at > starts_at), 
	CHECK (status IN ('scheduled','completed','cancelled')), 
	FOREIGN KEY(group_id) REFERENCES groups (id)
)

;

CREATE INDEX ix_lessons_starts_at ON lessons (starts_at);

CREATE INDEX ix_lesson_group_start ON lessons (group_id, starts_at);


CREATE TABLE materials (
	group_id UUID NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	media_id UUID, 
	link VARCHAR(1000), 
	published BOOLEAN NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(group_id) REFERENCES groups (id), 
	FOREIGN KEY(media_id) REFERENCES media_assets (id)
)

;

CREATE INDEX ix_materials_group_id ON materials (group_id);


CREATE TABLE memberships (
	student_id UUID NOT NULL, 
	group_id UUID NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE, 
	exit_reason VARCHAR(40), 
	note TEXT NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (student_id, group_id, start_date), 
	CHECK (end_date IS NULL OR end_date > start_date), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(group_id) REFERENCES groups (id)
)

;

CREATE INDEX ix_membership_interval ON memberships (group_id, start_date, end_date);

CREATE INDEX ix_memberships_student_id ON memberships (student_id);

CREATE INDEX ix_memberships_group_id ON memberships (group_id);


CREATE TABLE notification_outbox (
	lead_id UUID NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	attempts INTEGER NOT NULL, 
	next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	lease_until TIMESTAMP WITH TIME ZONE, 
	lease_token VARCHAR(64), 
	last_safe_error VARCHAR(100), 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (lead_id), 
	FOREIGN KEY(lead_id) REFERENCES leads (id)
)

;

CREATE INDEX ix_outbox_due ON notification_outbox (status, next_attempt_at);


CREATE TABLE schedule_rules (
	group_id UUID NOT NULL, 
	weekday INTEGER NOT NULL, 
	local_time TIME WITHOUT TIME ZONE NOT NULL, 
	duration_minutes INTEGER NOT NULL, 
	timezone VARCHAR(40) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (group_id, weekday, local_time), 
	CHECK (weekday BETWEEN 0 AND 6 AND duration_minutes BETWEEN 15 AND 480), 
	FOREIGN KEY(group_id) REFERENCES groups (id)
)

;

CREATE INDEX ix_schedule_rules_group_id ON schedule_rules (group_id);


CREATE TABLE attendance (
	lesson_id UUID NOT NULL, 
	student_id UUID NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	actor_id UUID NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (lesson_id, student_id), 
	CHECK (status IN ('present','late','absent','excused')), 
	FOREIGN KEY(lesson_id) REFERENCES lessons (id), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;

CREATE INDEX ix_attendance_student_id ON attendance (student_id);


CREATE TABLE invoices (
	student_id UUID NOT NULL, 
	membership_id UUID, 
	period_start DATE NOT NULL, 
	period_end DATE NOT NULL, 
	due_date DATE NOT NULL, 
	amount NUMERIC(18, 2) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	void_reason TEXT, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (membership_id, period_start, period_end), 
	CHECK (amount >= 0 AND period_end > period_start), 
	CHECK (status IN ('draft','issued','void')), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(membership_id) REFERENCES memberships (id)
)

;

CREATE INDEX ix_invoices_student_id ON invoices (student_id);

CREATE INDEX ix_invoice_student_period ON invoices (student_id, period_start);


CREATE TABLE submissions (
	assignment_id UUID NOT NULL, 
	student_id UUID NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (assignment_id, student_id), 
	FOREIGN KEY(assignment_id) REFERENCES assignments (id), 
	FOREIGN KEY(student_id) REFERENCES students (id)
)

;

CREATE INDEX ix_submissions_student_id ON submissions (student_id);


CREATE TABLE adjustments (
	invoice_id UUID NOT NULL, 
	amount NUMERIC(18, 2) NOT NULL, 
	reason TEXT NOT NULL, 
	actor_id UUID NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(invoice_id) REFERENCES invoices (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;

CREATE INDEX ix_adjustments_invoice_id ON adjustments (invoice_id);


CREATE TABLE invoice_lines (
	invoice_id UUID NOT NULL, 
	description TEXT NOT NULL, 
	amount NUMERIC(18, 2) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (amount >= 0), 
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
)

;

CREATE INDEX ix_invoice_lines_invoice_id ON invoice_lines (invoice_id);


CREATE TABLE payment_allocations (
	payment_id UUID NOT NULL, 
	invoice_id UUID NOT NULL, 
	amount NUMERIC(18, 2) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (payment_id, invoice_id), 
	CHECK (amount >= 0), 
	FOREIGN KEY(payment_id) REFERENCES payments (id), 
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
)

;

CREATE INDEX ix_payment_allocations_invoice_id ON payment_allocations (invoice_id);

CREATE INDEX ix_payment_allocations_payment_id ON payment_allocations (payment_id);


CREATE TABLE submission_revisions (
	submission_id UUID NOT NULL, 
	revision INTEGER NOT NULL, 
	text TEXT NOT NULL, 
	media_id UUID, 
	late BOOLEAN NOT NULL, 
	feedback TEXT NOT NULL, 
	private_note TEXT NOT NULL, 
	score NUMERIC(10, 2), 
	max_score NUMERIC(10, 2), 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (submission_id, revision), 
	CHECK (score IS NULL OR (max_score > 0 AND score >= 0 AND score <= max_score)), 
	FOREIGN KEY(submission_id) REFERENCES submissions (id), 
	FOREIGN KEY(media_id) REFERENCES media_assets (id)
)

;

CREATE INDEX ix_submission_revisions_submission_id ON submission_revisions (submission_id);

ALTER TABLE memberships ADD CONSTRAINT membership_no_overlap EXCLUDE USING gist (student_id WITH =, group_id WITH =, daterange(start_date,end_date,'[)') WITH &&);

ALTER TABLE lessons ADD CONSTRAINT teacher_lesson_no_overlap EXCLUDE USING gist (tstzrange(starts_at,ends_at,'[)') WITH &&) WHERE (status <> 'cancelled');
CREATE UNIQUE INDEX one_teacher_only ON users (role) WHERE role = 'teacher';
ALTER TABLE payments ADD COLUMN idempotency_response JSONB;
