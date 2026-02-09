-- Test Database for Step Together API
-- Contains minimal test data as specified

-- Reset and set session variables
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Create test database
DROP DATABASE IF EXISTS `step_together_api`;
CREATE DATABASE IF NOT EXISTS `step_together_api` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `step_together_api`;

-- Exportiere Struktur von Tabelle step_together_api.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `step_length` double DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_token` varchar(100) DEFAULT NULL,
  `password_reset_token` varchar(100) DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `public_profile` tinyint(1) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.teams
DROP TABLE IF EXISTS `teams`;
CREATE TABLE IF NOT EXISTS `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.challenges
DROP TABLE IF EXISTS `challenges`;
CREATE TABLE IF NOT EXISTS `challenges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `start_location` varchar(191) NOT NULL,
  `target_location` varchar(191) NOT NULL,
  `distance` double NOT NULL,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `team_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `joining_date` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `unique_user_team` (`user_id`,`team_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.challenge_team
DROP TABLE IF EXISTS `challenge_team`;
CREATE TABLE IF NOT EXISTS `challenge_team` (
  `challenge_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`challenge_id`,`team_id`),
  KEY `fk_team` (`team_id`),
  CONSTRAINT `fk_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.challenge_progress
DROP TABLE IF EXISTS `challenge_progress`;
CREATE TABLE IF NOT EXISTS `challenge_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `distance_covered` double NOT NULL,
  `total_steps` int(11) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.step_logs
DROP TABLE IF EXISTS `step_logs`;
CREATE TABLE IF NOT EXISTS `step_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `date` datetime(3) NOT NULL,
  `number_of_steps` int(11) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.refresh_tokens
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(500) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `ix_refresh_tokens_token` (`token`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  KEY `ix_refresh_tokens_id` (`id`) USING BTREE,
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.tickets
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_by_user_id` bigint(20) unsigned NOT NULL,
  `title` varchar(150) NOT NULL,
  `state` enum('open','pending','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tickets_user` (`created_by_user_id`),
  KEY `idx_tickets_state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Struktur von Tabelle step_together_api_test.ticket_messages
DROP TABLE IF EXISTS `ticket_messages`;
CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint(20) unsigned NOT NULL,
  `sender_id` bigint(20) unsigned NOT NULL,
  `sender_type` enum('user','admin') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_messages_ticket` (`ticket_id`),
  KEY `idx_messages_sender` (`sender_id`),
  KEY `idx_messages_created` (`created_at`),
  CONSTRAINT `fk_ticket_messages_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Struktur von Trigger step_together_api_test.before_team_member_insert
DROP TRIGGER IF EXISTS `before_team_member_insert`;
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `before_team_member_insert` BEFORE INSERT ON `team_members` FOR EACH ROW BEGIN
DECLARE overlapping_count INT;

    -- Wir zählen, ob es bereits Teilnahmen gibt, die sich zeitlich überschneiden
    SELECT COUNT(*) INTO overlapping_count
    FROM team_members tm
    JOIN challenge_team ct_old ON tm.team_id = ct_old.team_id
    JOIN challenges c_old ON ct_old.challenge_id = c_old.id
    -- Wir holen die Zeitdaten der NEUEN Challenge, für die sich der User gerade anmeldet
    JOIN challenge_team ct_new ON ct_new.team_id = NEW.team_id
    JOIN challenges c_new ON ct_new.challenge_id = c_new.id
    WHERE tm.user_id = NEW.user_id
      AND tm.is_deleted = 0
      AND ct_old.is_deleted = 0
      AND ct_new.is_deleted = 0
      -- Überlappungs-Logik
      AND c_old.start_date <= c_new.end_date
      AND c_old.end_date >= c_new.start_date;

    -- Wenn eine Überschneidung gefunden wurde, verhindern wir den Insert
    IF overlapping_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User ist in diesem Zeitraum bereits für eine Challenge registriert.';
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Exportiere Struktur von Trigger step_together_api_test.challenge_team_before_insert
DROP TRIGGER IF EXISTS `challenge_team_before_insert`;
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `challenge_team_before_insert` BEFORE INSERT ON `challenge_team` FOR EACH ROW BEGIN
    DECLARE overlapping_user_id INT;

    -- Prüfen, ob ein User des Teams bereits woanders registriert ist
    SELECT tm_new.user_id INTO overlapping_user_id
    FROM team_members tm_new
    JOIN team_members tm_old ON tm_new.user_id = tm_old.user_id
    JOIN challenge_team ct_old ON tm_old.team_id = ct_old.team_id
    JOIN challenges c_old ON ct_old.challenge_id = c_old.id
    JOIN challenges c_new ON c_new.id = NEW.challenge_id
    WHERE tm_new.team_id = NEW.team_id
      AND tm_old.team_id != NEW.team_id
      AND tm_new.is_deleted = 0
      AND tm_old.is_deleted = 0
      AND ct_old.is_deleted = 0
      AND c_old.start_date <= c_new.end_date
      AND c_old.end_date >= c_new.start_date
    LIMIT 1;

    -- Wenn ein Konflikt gefunden wurde, Abbruch mit Fehlermeldung
    IF overlapping_user_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ein Teammitglied ist bereits in einer anderen Challenge in diesem Zeitraum.';
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Insert test data below

-- Reset auto increment before inserting to ensure predictable IDs
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE teams AUTO_INCREMENT = 1;
ALTER TABLE challenges AUTO_INCREMENT = 1;

-- Insert admin user
INSERT INTO users (name, email, hashed_password, role, is_active, is_verified, created_at, updated_at) VALUES
('Admin User', 'admin@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 'admin', 1, 1, NOW(3), NOW(3));

-- Insert test users with role=user
INSERT INTO users (name, email, hashed_password, role, is_active, is_verified, created_at, updated_at) VALUES
('Test User 1', 'user1@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 'user', 1, 1, NOW(3), NOW(3)),
('Test User 2', 'user2@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 'user', 1, 1, NOW(3), NOW(3)),
('Test User 3', 'user3@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 'user', 1, 1, NOW(3), NOW(3)),
('Test User 4', 'user4@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 'user', 1, 1, NOW(3), NOW(3)),
('Test User 5', 'user5@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 'user', 1, 1, NOW(3), NOW(3));

-- Insert test teams
INSERT INTO teams (name, creator_id, created_at, updated_at) VALUES
('Test Team 1', 2, NOW(3), NOW(3)),
('Test Team 2', 3, NOW(3), NOW(3));

-- Add team members
INSERT INTO team_members (user_id, team_id, joining_date, is_deleted) VALUES
(2, 1, NOW(3), 0), -- User 1 in Team 1
(3, 1, NOW(3), 0), -- User 2 in Team 1
(4, 2, NOW(3), 0), -- User 3 in Team 2
(5, 1, NOW(3), 0), -- User 4 in Team 1
(6, 2, NOW(3), 0); -- User 5 in Team 2

-- Insert 3 test challenges: 1 past, 1 current, 1 upcoming
INSERT INTO challenges (name, start_location, target_location, distance, start_date, end_date, creator_id, team_id, created_at, updated_at, is_deleted) VALUES
('Past Challenge', 'Graz', 'Wien', 200, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), 1, NULL, NOW(3), NOW(3), 0), -- Past challenge
('Current Challenge', 'Linz', 'Salzburg', 150, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 1, NULL, NOW(3), NOW(3), 0), -- Current challenge
('Upcoming Challenge', 'Innsbruck', 'Bregenz', 180, DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 21 DAY), 1, NULL, NOW(3), NOW(3), 0); -- Upcoming challenge

-- Associate teams with challenges
INSERT INTO challenge_team (challenge_id, team_id, created_at, is_deleted) VALUES
(2, 1, NOW(), 0), -- Current challenge for Team 1
(3, 2, NOW(), 0); -- Upcoming challenge for Team 2

-- Reset auto increment to appropriate values after inserts
ALTER TABLE users AUTO_INCREMENT = 10;
ALTER TABLE teams AUTO_INCREMENT = 10;
ALTER TABLE challenges AUTO_INCREMENT = 10;

-- Restore session variables
/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
