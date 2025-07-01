-- --------------------------------------------------------
-- Host:                         localhost
-- Server-Version:               11.4.2-MariaDB - mariadb.org binary distribution
-- Server-Betriebssystem:        Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Exportiere Datenbank-Struktur für step_together_api
DROP DATABASE IF EXISTS `step_together_api`;
CREATE DATABASE IF NOT EXISTS `step_together_api` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `step_together_api`;

-- Exportiere Struktur von Tabelle step_together_api.challenges
DROP TABLE IF EXISTS `challenges`;
CREATE TABLE IF NOT EXISTS `challenges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `start_ort` varchar(191) NOT NULL,
  `ziel_ort` varchar(191) NOT NULL,
  `streckenlaenge` double NOT NULL,
  `start_datum` datetime(3) NOT NULL,
  `end_datum` datetime(3) NOT NULL,
  `ersteller_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenges: ~3 rows (ungefähr)
DELETE FROM `challenges`;
INSERT INTO `challenges` (`id`, `name`, `start_ort`, `ziel_ort`, `streckenlaenge`, `start_datum`, `end_datum`, `ersteller_id`, `team_id`, `created_at`, `updated_at`) VALUES
	(1, 'Spring Challenge', 'Berlin', 'Hamburg', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 1, '2025-05-14 11:44:47.646', '2025-05-14 11:44:47.646'),
	(2, 'Spring Challenge', 'Berlin', 'Hamburg', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 2, '2025-05-14 13:42:50.754', '2025-05-14 13:42:50.754'),
	(3, 'Spring Challenge', 'Berlin', 'Hamburg', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 3, '2025-05-20 08:23:39.224', '2025-05-20 08:23:39.224');

-- Exportiere Struktur von Tabelle step_together_api.challenge_progress
DROP TABLE IF EXISTS `challenge_progress`;
CREATE TABLE IF NOT EXISTS `challenge_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `gelaufene_strecke` double NOT NULL,
  `insgesamte_schritte` int(11) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenge_progress: ~6 rows (ungefähr)
DELETE FROM `challenge_progress`;
INSERT INTO `challenge_progress` (`id`, `user_id`, `challenge_id`, `gelaufene_strecke`, `insgesamte_schritte`, `updated_at`) VALUES
	(1, 1, 1, 7, 10000, '2025-05-14 11:44:47.654'),
	(2, 2, 1, 6, 8000, '2025-05-14 11:44:47.654'),
	(3, 1, 2, 7, 10000, '2025-05-14 13:42:50.763'),
	(4, 2, 2, 6, 8000, '2025-05-14 13:42:50.763'),
	(5, 1, 3, 7, 10000, '2025-05-20 08:23:39.232'),
	(6, 2, 3, 6, 8000, '2025-05-20 08:23:39.232');

-- Exportiere Struktur von Tabelle step_together_api.challenge_progresses
DROP TABLE IF EXISTS `challenge_progresses`;
CREATE TABLE IF NOT EXISTS `challenge_progresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `challenge_id` int(11) DEFAULT NULL,
  `gelaufene_strecke` float NOT NULL,
  `insgesamt_schritte` int(11) NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `challenge_id` (`challenge_id`),
  KEY `ix_challenge_progresses_id` (`id`),
  CONSTRAINT `challenge_progresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `challenge_progresses_ibfk_2` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenge_progresses: ~0 rows (ungefähr)
DELETE FROM `challenge_progresses`;

-- Exportiere Struktur von Tabelle step_together_api.schritt_logs
DROP TABLE IF EXISTS `schritt_logs`;
CREATE TABLE IF NOT EXISTS `schritt_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `datum` datetime(3) NOT NULL,
  `anzahl_schritte` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.schritt_logs: ~6 rows (ungefähr)
DELETE FROM `schritt_logs`;
INSERT INTO `schritt_logs` (`id`, `user_id`, `challenge_id`, `team_id`, `datum`, `anzahl_schritte`) VALUES
	(1, 1, 1, 1, '2025-05-03 00:00:00.000', 10000),
	(2, 2, 1, 1, '2025-05-03 00:00:00.000', 8000),
	(3, 1, 2, 2, '2025-05-03 00:00:00.000', 10000),
	(4, 2, 2, 2, '2025-05-03 00:00:00.000', 8000),
	(5, 1, 3, 3, '2025-05-03 00:00:00.000', 10000),
	(6, 2, 3, 3, '2025-05-03 00:00:00.000', 8000);

-- Exportiere Struktur von Tabelle step_together_api.teams
DROP TABLE IF EXISTS `teams`;
CREATE TABLE IF NOT EXISTS `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.teams: ~3 rows (ungefähr)
DELETE FROM `teams`;
INSERT INTO `teams` (`id`, `name`, `creator_id`, `created_at`, `updated_at`) VALUES
	(1, 'Team Alpha', 1, '2025-05-14 11:44:47.637', '2025-05-14 11:44:47.637'),
	(2, 'Team Alpha', 1, '2025-05-14 13:42:50.744', '2025-05-14 13:42:50.744'),
	(3, 'Team Alpha', 1, '2025-05-20 08:23:39.215', '2025-05-20 08:23:39.215');

-- Exportiere Struktur von Tabelle step_together_api.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `beitrittsdatum` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.team_members: ~6 rows (ungefähr)
DELETE FROM `team_members`;
INSERT INTO `team_members` (`id`, `user_id`, `team_id`, `beitrittsdatum`) VALUES
	(1, 1, 1, '2025-05-01 00:00:00.000'),
	(2, 2, 1, '2025-05-02 00:00:00.000'),
	(3, 1, 2, '2025-05-01 00:00:00.000'),
	(4, 2, 2, '2025-05-02 00:00:00.000'),
	(5, 1, 3, '2025-05-01 00:00:00.000'),
	(6, 2, 3, '2025-05-02 00:00:00.000');

-- Exportiere Struktur von Tabelle step_together_api.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `schrittlaenge` double DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_token` varchar(100) DEFAULT NULL,
  `password_reset_token` varchar(100) DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.users: ~6 rows (ungefähr)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `schrittlaenge`, `is_active`, `is_verified`, `verification_token`, `password_reset_token`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`) VALUES
	(1, 'Test User', 'alice@example.com', '$2b$12$O2zu3sjsx3k8CtygosOyT.ynRP5ctnJuNyi3AECxhf/qaRaZAgbXS', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-06-26 11:49:36.046', '2025-06-26 13:49:57.175'),
	(2, 'Bob Smith', 'bob@example.com', '$2b$12$yPB7YI0/TD.A9xhyYlm6r.smn5YZS80IeoJFbwRp4prDCBju3o9oC', 0.75, 1, 1, NULL, NULL, 0, NULL, '2025-05-14 11:44:47.624', '2025-06-26 13:25:51.875'),
	(3, 'Charlie Brown', 'charlie@example.com', '$2b$12$yPB7YI0/TD.A9xhyYlm6r.smn5YZS80IeoJFbwRp4prDCBju3o9oC', 0.8, 1, 0, NULL, NULL, 0, NULL, '2025-05-14 11:44:47.624', '2025-06-26 13:25:48.872'),
	(10, 'David Miller', 'david@example.com', '$2b$12$yPB7YI0/TD.A9xhyYlm6r.smn5YZS80IeoJFbwRp4prDCBju3o9oC', 0.85, 1, 0, NULL, NULL, 0, NULL, '2025-05-27 09:17:34.053', '2025-06-26 13:25:46.108'),
	(11, 'Eva Johnson', 'eva@example.com', '$2b$12$yPB7YI0/TD.A9xhyYlm6r.smn5YZS80IeoJFbwRp4prDCBju3o9oC', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-05-27 09:50:11.845', '2025-06-26 13:25:43.416'),
	(12, 'Leonie Schmidt', 'leonie@bfi.at', '$2b$12$yPB7YI0/TD.A9xhyYlm6r.smn5YZS80IeoJFbwRp4prDCBju3o9oC', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-06-02 06:31:21.612', '2025-06-26 13:25:38.774'),
	(13, 'Test User', 'testuser@example.com', '$2b$12$yPB7YI0/TD.A9xhyYlm6r.smn5YZS80IeoJFbwRp4prDCBju3o9oC', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-06-26 11:23:56.643', '2025-06-26 11:23:56.643');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
