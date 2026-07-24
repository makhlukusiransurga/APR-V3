-- schema.sql
-- DDL for APR V3 (Analytics Performance & Reward)

CREATE TABLE IF NOT EXISTS USERS (
    id SERIAL PRIMARY KEY,
    nrp VARCHAR(50) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'Staff', 'Manager', 'Admin'
    position VARCHAR(100),
    tier VARCHAR(50) DEFAULT 'Silver',
    email VARCHAR(150),
    telegram_chat_id VARCHAR(100),
    fcm_token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CONFIG (
    key VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS MASTER_JF (
    jf VARCHAR(100) PRIMARY KEY,
    position VARCHAR(100) NOT NULL,
    bobot NUMERIC(5,2) NOT NULL,
    complexity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
    cross_policy BOOLEAN DEFAULT FALSE,
    flag_minor INT DEFAULT 0,
    flag_major INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS VOLUME_CONFIG (
    jf VARCHAR(100) PRIMARY KEY,
    dimensi1 VARCHAR(100),
    low1 INT,
    med1 INT,
    high1 INT,
    bobot1 NUMERIC(5,2),
    dimensi2 VARCHAR(100),
    low2 INT,
    med2 INT,
    high2 INT,
    bobot2 NUMERIC(5,2),
    FOREIGN KEY (jf) REFERENCES MASTER_JF(jf)
);

CREATE TABLE IF NOT EXISTS PENALTY_CONFIG (
    jenis VARCHAR(100) PRIMARY KEY,
    default_val NUMERIC(5,2) NOT NULL,
    min_val NUMERIC(5,2) NOT NULL,
    max_val NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS TASKS (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    jf VARCHAR(100) NOT NULL,
    assignee_nrp VARCHAR(50),
    assigner_nrp VARCHAR(50),
    status VARCHAR(50) NOT NULL, -- 'Open', 'Planning', 'In Progress', 'Done', 'Cancelled'
    deadline TIMESTAMP,
    start_time TIMESTAMP,
    volume INT DEFAULT 1,
    scale NUMERIC(5,2) DEFAULT 1.0,
    need_plan BOOLEAN DEFAULT FALSE,
    is_self BOOLEAN DEFAULT FALSE,
    project_id VARCHAR(100),
    rescuer_nrp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignee_nrp) REFERENCES USERS(nrp),
    FOREIGN KEY (assigner_nrp) REFERENCES USERS(nrp),
    FOREIGN KEY (rescuer_nrp) REFERENCES USERS(nrp),
    FOREIGN KEY (jf) REFERENCES MASTER_JF(jf)
);

CREATE TABLE IF NOT EXISTS SUBTASKS (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    est_hours NUMERIC(5,2) NOT NULL,
    real_hours NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'In Progress', 'Blocked', 'Done'
    dep_subtask_id INT, -- Reference to another subtask if it's dependent
    FOREIGN KEY (task_id) REFERENCES TASKS(id),
    FOREIGN KEY (dep_subtask_id) REFERENCES SUBTASKS(id)
);

CREATE TABLE IF NOT EXISTS BOTTLENECK (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    is_valid BOOLEAN,
    FOREIGN KEY (task_id) REFERENCES TASKS(id)
);

CREATE TABLE IF NOT EXISTS MENTORING (
    id SERIAL PRIMARY KEY,
    mentor_nrp VARCHAR(50) NOT NULL,
    mentee_nrp VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Proposed', -- 'Proposed', 'Approved', 'Completed'
    score NUMERIC(5,2) DEFAULT 0,
    FOREIGN KEY (mentor_nrp) REFERENCES USERS(nrp),
    FOREIGN KEY (mentee_nrp) REFERENCES USERS(nrp)
);

CREATE TABLE IF NOT EXISTS LEARNING (
    id SERIAL PRIMARY KEY,
    nrp VARCHAR(50) NOT NULL,
    jf VARCHAR(100),
    context TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Proposed', -- 'Proposed', 'Approved', 'Completed', 'Rejected'
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nrp) REFERENCES USERS(nrp),
    FOREIGN KEY (jf) REFERENCES MASTER_JF(jf)
);

CREATE TABLE IF NOT EXISTS ANNOUNCEMENTS (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Info', -- 'Info', 'Warning', 'Urgent'
    target_role VARCHAR(50) DEFAULT 'All', -- 'All', 'Staff', 'Manager'
    attachment_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES USERS(nrp)
);

CREATE TABLE IF NOT EXISTS NOTIFS (
    id SERIAL PRIMARY KEY,
    nrp VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    task_id INT,
    type VARCHAR(50), -- 'Task', 'Bottleneck', 'Announcement', 'System'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nrp) REFERENCES USERS(nrp)
);

CREATE TABLE IF NOT EXISTS LOGS (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nrp VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    detail TEXT,
    FOREIGN KEY (nrp) REFERENCES USERS(nrp)
);

CREATE TABLE IF NOT EXISTS REPORTS_CACHE (
    nrp VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL, -- e.g., '2026-07'
    kpi_score NUMERIC(10,2) DEFAULT 0,
    reach_score NUMERIC(10,2) DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'Silver',
    task_done INT DEFAULT 0,
    completion NUMERIC(5,2) DEFAULT 0,
    data_json TEXT,
    PRIMARY KEY (nrp, period),
    FOREIGN KEY (nrp) REFERENCES USERS(nrp)
);

-- Insert Default Config Values
INSERT INTO CONFIG (key, value) VALUES
    ('DELAY_PENALTY_PER_DAY', '5'),
    ('MAX_DELAY_PENALTY', '20'),
    ('PLAN_ACCURACY_THRESHOLD_HIGH', '90'),
    ('PLAN_ACCURACY_THRESHOLD_MED', '70'),
    ('PLAN_ACCURACY_THRESHOLD_LOW', '50'),
    ('PLAN_ACCURACY_BONUS_HIGH', '10'),
    ('PLAN_ACCURACY_BONUS_MED', '5'),
    ('PLAN_ACCURACY_PENALTY', '5'),
    ('LEARNING_APPROVED_XP', '15'),
    ('LEARNING_COMPLETED_XP', '25'),
    ('LEARNING_COMPLETED_H_BONUS', '15'),
    ('COMPLEXITY_LOW_MULTI', '1.0'),
    ('COMPLEXITY_MED_MULTI', '1.5'),
    ('COMPLEXITY_HIGH_MULTI', '2.0')
ON CONFLICT (key) DO NOTHING;

INSERT INTO PENALTY_CONFIG (jenis, default_val, min_val, max_val) VALUES
    ('REVISI_MAYOR', 5, 0, 10),
    ('BOTTLENECK_PALSU', 10, 5, 20),
    ('LATE_RESPOND_MANAGER', 15, 5, 30),
    ('NO_CASE_3_WEEKS', 5, 0, 15)
ON CONFLICT (jenis) DO NOTHING;
