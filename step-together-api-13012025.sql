-- --------------------------------------------------------
-- Host:                         localhost
-- Server-Version:               11.4.9-MariaDB - MariaDB Server
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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenges: ~1 rows (ungefähr)
DELETE FROM `challenges`;
INSERT INTO `challenges` (`id`, `name`, `start_location`, `target_location`, `distance`, `start_date`, `end_date`, `creator_id`, `team_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(40, 'Graz-Wien', 'Graz', 'Wein', 180, '2026-01-06 10:58:00.000', '2026-01-31 10:58:00.000', 184, NULL, '2026-01-08 10:58:53.682', '2026-01-08 10:58:53.000', 0),
	(41, 'Graz-Salzburg', 'Graz', 'Salzburg', 300, '2026-01-14 15:43:00.000', '2026-01-26 15:43:00.000', 184, NULL, '2026-01-12 15:43:26.046', '2026-01-12 15:43:26.000', 0);

-- Exportiere Struktur von Tabelle step_together_api.challenge_progress
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

-- Exportiere Daten aus Tabelle step_together_api.challenge_progress: ~0 rows (ungefähr)
DELETE FROM `challenge_progress`;

-- Exportiere Struktur von Tabelle step_together_api.challenge_team
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

-- Exportiere Daten aus Tabelle step_together_api.challenge_team: ~3 rows (ungefähr)
DELETE FROM `challenge_team`;
INSERT INTO `challenge_team` (`challenge_id`, `team_id`, `created_at`, `is_deleted`) VALUES
	(40, 31, '2026-01-08 10:15:18', 1),
	(40, 32, '2026-01-08 10:34:58', 0),
	(40, 33, '2026-01-12 09:24:42', 0);

-- Exportiere Struktur von Tabelle step_together_api.refresh_tokens
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Daten aus Tabelle step_together_api.refresh_tokens: ~6 rows (ungefähr)
DELETE FROM `refresh_tokens`;
INSERT INTO `refresh_tokens` (`id`, `token`, `user_id`, `expires_at`, `revoked`, `created_at`) VALUES
	(1, 'CdGbTVnnrF8qyIEedKuBMTSujDc1Q9QZnN8f7T2Jr3mjTOdfkTAY5f4j8KiE-7Z_ciTzNtpXqEeNORa7apIP4w', 186, '2026-02-11 14:05:18', 0, '2026-01-12 14:05:18'),
	(2, 'PV5v42q9AfPTx7xv7Um5OGinUvHz0Urj6Hp_09E4xXtEiToxIH4sp_c69yXdC8CXfVJh1v4GTWKLZ7pWJyx3hw', 188, '2026-02-11 14:13:06', 0, '2026-01-12 14:13:06'),
	(3, 'y8fkpUIuYMwwn7dBcRIiWrzlctzQNT_uHkuHLD7z8PkAyPfjnzu33PuelcMvDbxI-jKZG8bohcTh_Web0YJBZg', 186, '2026-02-11 14:13:36', 0, '2026-01-12 14:13:36'),
	(4, 'EkuGEKeVPR9bscCFL5N6394eoo3z0PYzSDoKwOr8WvQvSyoK0NUJpOeoa52yRX8OB3kXniLGTWyC0U8fAHPxLg', 186, '2026-02-11 14:22:32', 0, '2026-01-12 14:22:32'),
	(5, 'MTCEc9HEoElU4SeCeaFcqZWdJwfhosFj8_ALU6Ujma5B1fjHLZIdrDVB5sY-idhLnyhM6auDvmG2co25S-47hA', 186, '2026-02-11 14:31:02', 0, '2026-01-12 14:31:02'),
	(6, 'uAQhPZ6VFlqx9_D6NMff_PO3cETzc9oAeuE-FWMvXsdiybnB6A4k4nP8xKETLJdhlQWiVPjK6BusWVRV4pQ5XQ', 186, '2026-02-11 14:36:06', 0, '2026-01-12 14:36:06');

-- Exportiere Struktur von Tabelle step_together_api.step_logs
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
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.step_logs: ~13 rows (ungefähr)
DELETE FROM `step_logs`;
INSERT INTO `step_logs` (`id`, `user_id`, `challenge_id`, `team_id`, `date`, `number_of_steps`, `is_deleted`) VALUES
	(1, 185, 40, 31, '2026-01-08 00:00:00.000', 1, 0),
	(2, 186, 40, 31, '2026-01-10 00:00:00.000', 1, 0),
	(3, 187, 40, 32, '2026-01-11 00:00:00.000', 1, 0),
	(4, 188, 40, 32, '2026-01-08 00:00:00.000', 17, 0),
	(5, 189, 40, 32, '2026-01-07 00:00:00.000', 1, 0),
	(6, 190, 40, 33, '2026-01-06 00:00:00.000', 1, 0),
	(7, 191, 40, 33, '2026-01-08 00:00:00.000', 28, 0),
	(8, 192, 40, 33, '2026-01-07 00:00:00.000', 1, 0),
	(114, 185, 40, 31, '2026-01-12 00:00:00.000', 1, 0),
	(115, 187, 40, 31, '2026-01-12 00:00:00.000', 2, 0),
	(116, 192, 40, 33, '2026-01-12 00:00:00.000', 1, 0),
	(117, 186, 40, 31, '2026-01-11 00:00:00.000', 3024, 0),
	(118, 186, 40, 31, '2026-01-09 00:00:00.000', 12, 0),
	(119, 186, 40, 31, '2026-01-12 00:00:00.000', 36, 0);

-- Exportiere Struktur von Tabelle step_together_api.teams
DROP TABLE IF EXISTS `teams`;
CREATE TABLE IF NOT EXISTS `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.teams: ~2 rows (ungefähr)
DELETE FROM `teams`;
INSERT INTO `teams` (`id`, `name`, `creator_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(31, 'Team LU', 184, '2026-01-08 11:12:57.324', '2026-01-12 13:58:30.212', 1),
	(32, 'ARBE Team', 184, '2026-01-08 11:34:39.524', '2026-01-08 11:34:39.524', 0),
	(33, 'Team GOSA', 184, '2026-01-12 10:23:53.180', '2026-01-12 10:23:53.180', 0);

-- Exportiere Struktur von Tabelle step_together_api.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `joining_date` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `unique_user_team` (`user_id`,`team_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.team_members: ~9 rows (ungefähr)
DELETE FROM `team_members`;
INSERT INTO `team_members` (`user_id`, `team_id`, `joining_date`, `is_deleted`, `id`) VALUES
	(185, 31, '2026-01-08 11:12:57.326', 0, 1),
	(186, 31, '2026-01-08 11:12:57.326', 0, 2),
	(187, 31, '2026-01-08 11:34:39.525', 0, 3),
	(188, 32, '2026-01-08 11:34:39.525', 0, 4),
	(189, 32, '2026-01-11 12:41:35.702', 0, 5),
	(190, 32, '2026-01-12 10:23:53.182', 0, 6),
	(191, 33, '2026-01-12 10:24:29.721', 0, 7),
	(192, 33, '2026-01-12 10:52:46.000', 0, 8),
	(189, 33, '2026-01-12 15:20:48.442', 1, 16);

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.users: ~9 rows (ungefähr)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `step_length`, `is_active`, `is_verified`, `verification_token`, `password_reset_token`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`, `is_deleted`, `role`, `public_profile`) VALUES
	(184, 'Admin', 'admin@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 10:56:29.720', '2026-01-08 10:56:29.720', 0, 'admin', 1),
	(185, 'Uwe Binder', 'uwe@bfi.at', '$2y$10$NHvWXTA7zDH4GH8Flf.3KOjuVWOxdYdgJoJFaaj2uq16kP65/hice', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:08:43.266', '2026-01-12 10:25:15.291', 0, 'user', 1),
	(186, 'Betuel Celik', 'bet@bfi.at', '$2y$10$u/0BpZcZl/jYmJkg.fJYeubPIrW4b.8.oWA9aYRxWga4dhjPrQMHW', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:09:22.864', '2026-01-08 11:09:22.864', 0, 'user', 1),
	(187, 'Artem Panasiuk', 'artem@bfi.at', '$2y$10$oCHKKEMhVURa9yhItN81gOWqp/9uRM391djp9EecE8PTbxZX0ad2m', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:09:49.938', '2026-01-08 11:09:49.938', 0, 'user', 1),
	(188, 'Lana Durlacher', 'lana@bfi.at', '$2y$10$uSejBQl5boJJCF2sIPXCSOgl84Fr5KrhqPUYNGB9L6tjk3wnZdYu6', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:10:08.922', '2026-01-08 10:35:14.229', 0, 'user', 1),
	(189, 'Jeton Arifi', 'jeton@bfi.at', '$2y$10$zNs2iRXrLD/I1ofwH7J3iuXCYtBslPFKbd5XIk5ddeESjyElraVQK', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:11:36.361', '2026-01-08 11:11:36.361', 0, 'user', 1),
	(190, 'Hava Tasueva', 'hava@bfi.at', '$2y$10$ewmLL9WtRTthNoPnbeRL7OhQn23GMwrmHg66qjylmSOMGkVBsmv7K', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-11 12:37:11.200', '2026-01-12 10:55:53.729', 0, 'user', 1),
	(191, 'Sara Kutschi', 'sara@bfi.at', '$2y$10$D17PauHxgzNN06ZAG33GrO1KVBLqGFJt7Z92o5Z2SR5hb3dgSKo/2', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-12 10:22:06.547', '2026-01-12 10:22:06.547', 0, 'user', 1),
	(192, 'Goca Andelkovic', 'goca@bfi.at', '$2y$10$KvJJ0KqYUmvUrWzK7HZvU.XmMRzFdrGZv6AZoKpFhfw6Lo5BDhENa', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-12 10:24:13.390', '2026-01-12 10:24:13.390', 0, 'user', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
