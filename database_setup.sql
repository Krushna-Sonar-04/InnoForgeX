-- Create Database
CREATE DATABASE IF NOT EXISTS claimshield_ai;

-- Use Database
USE claimshield_ai;

-- Create Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50),
    provider_id VARCHAR(50),
    amount DECIMAL(10,2),
    diagnosis VARCHAR(255),
    procedure_code VARCHAR(100),
    risk_score INT,
    risk_level VARCHAR(20),
    status VARCHAR(20),
    ai_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Fraud Flags Table
CREATE TABLE IF NOT EXISTS fraud_flags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    claim_id INT,
    reason VARCHAR(255),
    severity VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255),
    role VARCHAR(20)
);
