-- ==========================================
-- ClaimShield AI Production Database Schema
-- ==========================================

-- Create Database
CREATE DATABASE IF NOT EXISTS claimshield_ai;
USE claimshield_ai;

-- 1. Claims Table
-- Stores the primary healthcare claim details, computed AI risk metrics, and audit lifecycle status.
CREATE TABLE IF NOT EXISTS claims (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) NOT NULL,
    patient_name VARCHAR(100) DEFAULT NULL,
    provider_id VARCHAR(50) NOT NULL,
    provider_name VARCHAR(100) DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    diagnosis VARCHAR(255) DEFAULT NULL,
    procedure_code VARCHAR(100) DEFAULT NULL,
    risk_score INT DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'LOW',
    status VARCHAR(20) DEFAULT 'PENDING',
    ai_summary TEXT DEFAULT NULL,
    audit_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fraud Flags Table
-- Relates to the claims table (one-to-many) to log multiple anomalies flagged by the AI engine.
CREATE TABLE IF NOT EXISTS fraud_flags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    claim_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

-- 3. Users Table
-- Stores user accounts for claims auditors and administrators with hashed passwords.
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'AUDITOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
