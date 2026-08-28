CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(8) PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  program    VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
