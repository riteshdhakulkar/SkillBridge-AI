-- ============================================================================
-- SkillBridge AI - MySQL setup
--
-- Run this ONCE as root in MySQL Workbench (or via the mysql client).
-- It creates the database, the application user, and grants that user access.
--
-- Workbench: Server Side Bar -> right-click your connection -> "Execute SQL File"
--            -> pick this file -> Execute (lightning bolt)
-- ============================================================================

-- 1. Database
CREATE DATABASE IF NOT EXISTS skillbridge_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- 2. Application user
--    'localhost' covers TCP connections that resolve to the loopback name,
--    '127.0.0.1' covers connections made with the IP literal. Both are needed
--    because MySQL matches the host exactly as it was given.
CREATE USER IF NOT EXISTS 'skillbridge_app'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_strong_password';
CREATE USER IF NOT EXISTS 'skillbridge_app'@'127.0.0.1'
  IDENTIFIED BY 'CHANGE_ME_strong_password';

-- 3. Privileges - scoped to this one database only
GRANT ALL PRIVILEGES ON skillbridge_ai.* TO 'skillbridge_app'@'localhost';
GRANT ALL PRIVILEGES ON skillbridge_ai.* TO 'skillbridge_app'@'127.0.0.1';

FLUSH PRIVILEGES;

-- 4. Confirm
SHOW GRANTS FOR 'skillbridge_app'@'localhost';
