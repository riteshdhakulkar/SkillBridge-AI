-- ============================================================================
-- SkillBridge AI - MySQL 8.0 schema
--
-- Import via MySQL Workbench:
--   Server Side Bar -> right-click the connection -> "Execute SQL File"
--   OR: Schema tab -> right-click "Schemas" -> "New Schema" -> paste -> Apply
--
-- Field names intentionally match the previous SQLite schema exactly
-- (camelCase) so no frontend code needs to change.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS skillbridge_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE skillbridge_ai;

-- ─────────────────────────────────────────────
-- Table: users
-- ─────────────────────────────────────────────
-- Was SQLite: id INTEGER PK AUTOINCREMENT, email TEXT NOT NULL UNIQUE
-- email is utf8mb4 + ci collation, so uniqueness is case-insensitive.
-- That matches the app, which lowercases every email before it queries.
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fullName   VARCHAR(120)  NOT NULL,
  email      VARCHAR(255)  NOT NULL,
  password   VARCHAR(255)  NOT NULL,          -- bcrypt hash, 60 chars
  createdAt  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─────────────────────────────────────────────
-- Table: analyses
-- ─────────────────────────────────────────────
-- The six skill/roadmap columns were TEXT holding JSON strings in SQLite.
-- MySQL 8 has a native JSON type, so they are real JSON now.
-- NOTE: MySQL JSON columns cannot carry a DEFAULT, so every INSERT must
-- supply a valid JSON value. The app always does (JSON.stringify).
CREATE TABLE IF NOT EXISTS analyses (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId             INT UNSIGNED NULL,
  jobTitle           VARCHAR(200) NOT NULL DEFAULT '',
  companyName        VARCHAR(200) NOT NULL DEFAULT '',
  matchScore         INT          NOT NULL DEFAULT 0,
  resumeSource       VARCHAR(255) NOT NULL DEFAULT '',
  matchedSkills      JSON         NOT NULL,
  missingSkills      JSON         NOT NULL,
  resumeEvidence     JSON         NOT NULL,
  recommendations    JSON         NOT NULL,
  learningRoadmap    JSON         NOT NULL,
  interviewQuestions JSON         NOT NULL,
  createdAt          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Covers "WHERE userId = ? ORDER BY id DESC", which had no index in SQLite.
  KEY idx_analyses_user_created (userId, createdAt),
  CONSTRAINT fk_analyses_user
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
