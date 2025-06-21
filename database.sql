-- Database Schema for CE Exam System
-- MySQL Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ce_exam_system;
USE ce_exam_system;

-- Table: kelas
CREATE TABLE kelas (
    name VARCHAR(50) PRIMARY KEY,
    year INT NOT NULL,
    semester ENUM('GASAL', 'GENAP') NOT NULL,
    teacher VARCHAR(100) NOT NULL,
    datetime_open DATETIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: peserta
CREATE TABLE peserta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kelas VARCHAR(50) NOT NULL,
    nrp VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    answer LONGTEXT,
    start_time DATETIME,
    submit_time DATETIME,
    is_submitted BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kelas) REFERENCES kelas(name) ON DELETE CASCADE,
    UNIQUE KEY unique_peserta_kelas (nrp, kelas)
);

-- Table: log
CREATE TABLE log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nrp VARCHAR(20) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    dt_access TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(50) DEFAULT 'access',
    user_agent TEXT,
    INDEX idx_nrp (nrp),
    INDEX idx_dt_access (dt_access)
);

-- Insert sample data
INSERT INTO kelas (name, year, semester, teacher, datetime_open, duration) VALUES 
('BASDAT-25E', 2025, 'GENAP', 'Arta Kusuma Hernanda, M.T', '2025-06-25 07:30:00', 120);

-- Insert sample peserta
INSERT INTO peserta (kelas, nrp, name, answer) VALUES 
('BASDAT-25E', '5024221048', 'Mochammad Gery Tauristino', NULL);

-- Create indexes for better performance
CREATE INDEX idx_kelas_datetime ON kelas(datetime_open);
CREATE INDEX idx_peserta_nrp ON peserta(nrp);
CREATE INDEX idx_peserta_kelas ON peserta(kelas);
CREATE INDEX idx_log_nrp_dt ON log(nrp, dt_access);
