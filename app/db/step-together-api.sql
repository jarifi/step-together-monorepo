-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server-Version:               11.4.2-MariaDB - mariadb.org binary distribution
-- Server-Betriebssystem:        Win64
-- HeidiSQL Version:             12.5.0.6677
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
  `team_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `state` varchar(50) NOT NULL DEFAULT 'incoming',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenges: ~7 rows (ungefähr)
DELETE FROM `challenges`;
INSERT INTO `challenges` (`id`, `name`, `start_location`, `target_location`, `distance`, `start_date`, `end_date`, `creator_id`, `team_id`, `created_at`, `updated_at`, `state`, `is_deleted`) VALUES
	(1, 'Graz-Wien Challenge', 'Graz', 'Wien', 200, '2025-07-31 00:00:00.000', '2025-08-30 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'open', 0),
	(2, 'Graz-Linz Challenge', 'Graz', 'Linz', 180, '2025-05-01 00:00:00.000', '2025-05-31 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed', 0),
	(3, 'Graz-Salzburg Challenge', 'Graz', 'Salzburg', 270, '2025-04-01 00:00:00.000', '2025-04-30 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed', 0),
	(4, 'Graz-Innsbruck Challenge', 'Graz', 'Innsbruck', 400, '2025-03-01 00:00:00.000', '2025-03-31 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed', 0),
	(18, 'Another Nice Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 2, '2025-08-06 11:16:19.138', '2025-08-06 11:16:19.138', 'incoming', 0),
	(19, 'Another Nice Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 2, '2025-08-06 11:20:50.462', '2025-08-06 11:20:50.462', 'incoming', 0),
	(20, 'Another Nice Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 2, '2025-08-07 07:28:50.779', '2025-08-07 07:28:50.779', 'incoming', 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenge_progress: ~9 rows (ungefähr)
DELETE FROM `challenge_progress`;
INSERT INTO `challenge_progress` (`id`, `user_id`, `challenge_id`, `distance_covered`, `total_steps`, `updated_at`, `is_deleted`) VALUES
	(1, 1, 1, 7, 10000, '2025-05-14 11:44:47.654', 0),
	(2, 2, 1, 6, 8000, '2025-05-14 11:44:47.654', 0),
	(3, 1, 2, 7, 10000, '2025-05-14 13:42:50.763', 0),
	(4, 2, 2, 6, 8000, '2025-05-14 13:42:50.763', 0),
	(5, 1, 3, 7, 10000, '2025-05-20 08:23:39.232', 0),
	(6, 2, 3, 6, 8000, '2025-05-20 08:23:39.232', 0),
	(7, 1, 2, 20, 100, '2025-08-06 11:20:02.342', 0),
	(8, 1, 2, 20, 100, '2025-08-06 11:20:36.106', 0),
	(9, 1, 2, 20, 100, '2025-08-06 12:03:21.837', 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.step_logs: ~6 rows (ungefähr)
DELETE FROM `step_logs`;
INSERT INTO `step_logs` (`id`, `user_id`, `challenge_id`, `team_id`, `date`, `number_of_steps`, `is_deleted`) VALUES
	(1, 1, 1, 1, '2025-08-11 00:00:00.000', 20, 0),
	(2, 1, 1, 1, '2025-08-12 00:00:00.000', 10, 0),
	(3, 1, 1, 1, '2025-08-13 00:00:00.000', 80, 0),
	(4, 1, 1, 1, '2025-08-14 00:00:00.000', 70, 0),
	(5, 2, 1, 1, '2025-08-11 00:00:00.000', 20, 0),
	(6, 2, 1, 1, '2025-08-12 00:00:00.000', 10, 0),
	(7, 2, 1, 1, '2025-08-13 00:00:00.000', 80, 0),
	(8, 2, 1, 1, '2025-08-14 00:00:00.000', 70, 0),
	(9, 3, 1, 2, '2025-08-11 00:00:00.000', 20, 0),
	(10, 3, 1, 2, '2025-08-12 00:00:00.000', 10, 0),
	(11, 3, 1, 2, '2025-08-13 00:00:00.000', 80, 0),
	(12, 3, 1, 2, '2025-08-14 00:00:00.000', 70, 0),
	(13, 4, 1, 2, '2025-08-11 00:00:00.000', 20, 0),
	(14, 4, 1, 2, '2025-08-12 00:00:00.000', 10, 0),
	(15, 4, 1, 2, '2025-08-13 00:00:00.000', 80, 0),
	(16, 4, 1, 2, '2025-08-14 00:00:00.000', 70, 0),
	(17, 5, 1, 3, '2025-08-11 00:00:00.000', 20, 0),
	(18, 5, 1, 3, '2025-08-12 00:00:00.000', 10, 0),
	(19, 5, 1, 3, '2025-08-13 00:00:00.000', 80, 0),
	(20, 5, 1, 3, '2025-08-14 00:00:00.000', 70, 0),
	(21, 6, 1, 3, '2025-08-11 00:00:00.000', 20, 0),
	(22, 6, 1, 3, '2025-08-12 00:00:00.000', 10, 0),
	(23, 6, 1, 3, '2025-08-13 00:00:00.000', 80, 0),
	(24, 6, 1, 3, '2025-08-14 00:00:00.000', 70, 0),
	(25, 1, 2, 1, '2025-08-11 00:00:00.000', 20, 0),
    (26, 1, 2, 1, '2025-08-12 00:00:00.000', 10, 0),
    (27, 1, 2, 1, '2025-08-13 00:00:00.000', 80, 0),
    (28, 1, 2, 1, '2025-08-14 00:00:00.000', 70, 0),
    (29, 2, 2, 1, '2025-08-11 00:00:00.000', 20, 0),
    (30, 2, 2, 1, '2025-08-12 00:00:00.000', 10, 0),
    (31, 2, 2, 1, '2025-08-13 00:00:00.000', 80, 0),
    (32, 2, 2, 1, '2025-08-14 00:00:00.000', 70, 0),
    (33, 3, 2, 2, '2025-08-11 00:00:00.000', 20, 0),
    (34, 3, 2, 2, '2025-08-12 00:00:00.000', 10, 0),
    (35, 3, 2, 2, '2025-08-13 00:00:00.000', 80, 0),
    (36, 3, 2, 2, '2025-08-14 00:00:00.000', 70, 0),
    (37, 4, 2, 2, '2025-08-11 00:00:00.000', 20, 0),
    (38, 4, 2, 2, '2025-08-12 00:00:00.000', 10, 0),
    (39, 4, 2, 2, '2025-08-13 00:00:00.000', 80, 0),
    (40, 4, 2, 2, '2025-08-14 00:00:00.000', 70, 0),
    (41, 5, 2, 3, '2025-08-11 00:00:00.000', 20, 0),
    (42, 5, 2, 3, '2025-08-12 00:00:00.000', 10, 0),
    (43, 5, 2, 3, '2025-08-13 00:00:00.000', 80, 0),
    (44, 5, 2, 3, '2025-08-14 00:00:00.000', 70, 0),
    (45, 6, 2, 3, '2025-08-11 00:00:00.000', 20, 0),
    (46, 6, 2, 3, '2025-08-12 00:00:00.000', 10, 0),
    (47, 6, 2, 3, '2025-08-13 00:00:00.000', 80, 0),
    (48, 6, 2, 3, '2025-08-14 00:00:00.000', 70, 0);
	
	


-- Exportiere Struktur von Tabelle step_together_api.teams
DROP TABLE IF EXISTS `teams`;
CREATE TABLE IF NOT EXISTS `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.teams: ~24 rows (ungefähr)
DELETE FROM `teams`;
INSERT INTO `teams` (`id`, `name`, `creator_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(1, 'Team A', 1, '2025-05-14 11:44:47.637', '2025-05-14 11:44:47.637', 0),
	(2, 'Team B', 1, '2025-05-14 13:42:50.744', '2025-05-14 13:42:50.744', 0),
	(3, 'Team C', 1, '2025-05-20 08:23:39.215', '2025-05-20 08:23:39.215', 0),
	(4, 'Team D', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(5, 'Team E', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(6, 'Team F', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(7, 'Team G', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(8, 'Team H', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(9, 'Team I', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(10, 'Team J', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(11, 'Team K', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(12, 'Team L', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(13, 'Team M', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(14, 'Team N', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(15, 'Team O', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(16, 'Team P', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(17, 'Team Q', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(18, 'Team R', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(19, 'Team S', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(20, 'Team T', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167', 0),
	(23, 'Team D', 1, '2025-08-06 11:25:57.371', '2025-08-06 11:25:57.371', 0),
	(24, 'Team D', 1, '2025-08-06 11:35:12.083', '2025-08-06 11:35:12.083', 0),
	(25, 'Team D', 1, '2025-08-06 12:04:05.710', '2025-08-06 12:04:05.710', 0),
	(26, 'Team D', 1, '2025-08-06 12:04:18.742', '2025-08-06 12:04:18.742', 0);

-- Exportiere Struktur von Tabelle step_together_api.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `joining_date` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.team_members: ~108 rows (ungefähr)
DELETE FROM `team_members`;
INSERT INTO `team_members` (`id`, `user_id`, `team_id`, `joining_date`, `is_deleted`) VALUES
	(1, 1, 1, '2025-07-31 10:11:55.302', 0),
	(2, 2, 1, '2025-07-31 10:11:55.302', 0),
	(3, 3, 1, '2025-07-31 10:11:55.302', 0),
	(4, 4, 1, '2025-07-31 10:11:55.302', 0),
	(5, 5, 1, '2025-07-31 10:11:55.302', 0),
	(6, 6, 2, '2025-07-31 10:11:55.310', 0),
	(7, 7, 2, '2025-07-31 10:11:55.310', 0),
	(8, 8, 2, '2025-07-31 10:11:55.310', 0),
	(9, 9, 2, '2025-07-31 10:11:55.310', 0),
	(10, 10, 2, '2025-07-31 10:11:55.310', 0),
	(11, 11, 3, '2025-07-31 10:11:55.319', 0),
	(12, 12, 3, '2025-07-31 10:11:55.319', 0),
	(13, 13, 3, '2025-07-31 10:11:55.319', 0),
	(14, 14, 3, '2025-07-31 10:11:55.319', 0),
	(15, 15, 3, '2025-07-31 10:11:55.319', 0),
	(16, 16, 4, '2025-07-31 10:11:55.322', 0),
	(17, 17, 4, '2025-07-31 10:11:55.322', 0),
	(18, 18, 4, '2025-07-31 10:11:55.322', 0),
	(19, 19, 4, '2025-07-31 10:11:55.322', 0),
	(20, 20, 4, '2025-07-31 10:11:55.322', 0),
	(21, 21, 5, '2025-07-31 10:11:55.325', 0),
	(22, 22, 5, '2025-07-31 10:11:55.325', 0),
	(23, 23, 5, '2025-07-31 10:11:55.325', 0),
	(24, 24, 5, '2025-07-31 10:11:55.325', 0),
	(25, 25, 5, '2025-07-31 10:11:55.325', 0),
	(26, 26, 6, '2025-07-31 10:11:55.328', 0),
	(27, 27, 6, '2025-07-31 10:11:55.328', 0),
	(28, 28, 6, '2025-07-31 10:11:55.328', 0),
	(29, 29, 6, '2025-07-31 10:11:55.328', 0),
	(30, 30, 6, '2025-07-31 10:11:55.328', 0),
	(31, 31, 7, '2025-07-31 10:11:55.331', 0),
	(32, 32, 7, '2025-07-31 10:11:55.331', 0),
	(33, 33, 7, '2025-07-31 10:11:55.331', 0),
	(34, 34, 7, '2025-07-31 10:11:55.331', 0),
	(35, 35, 7, '2025-07-31 10:11:55.331', 0),
	(36, 36, 8, '2025-07-31 10:11:55.334', 0),
	(37, 37, 8, '2025-07-31 10:11:55.334', 0),
	(38, 38, 8, '2025-07-31 10:11:55.334', 0),
	(39, 39, 8, '2025-07-31 10:11:55.334', 0),
	(40, 40, 8, '2025-07-31 10:11:55.334', 0),
	(41, 41, 9, '2025-07-31 10:11:55.337', 0),
	(42, 42, 9, '2025-07-31 10:11:55.337', 0),
	(43, 43, 9, '2025-07-31 10:11:55.337', 0),
	(44, 44, 9, '2025-07-31 10:11:55.337', 0),
	(45, 45, 9, '2025-07-31 10:11:55.337', 0),
	(46, 46, 10, '2025-07-31 10:11:55.339', 0),
	(47, 47, 10, '2025-07-31 10:11:55.339', 0),
	(48, 48, 10, '2025-07-31 10:11:55.339', 0),
	(49, 49, 10, '2025-07-31 10:11:55.339', 0),
	(50, 50, 10, '2025-07-31 10:11:55.339', 0),
	(51, 51, 11, '2025-07-31 10:11:55.342', 0),
	(52, 52, 11, '2025-07-31 10:11:55.342', 0),
	(53, 53, 11, '2025-07-31 10:11:55.342', 0),
	(54, 54, 11, '2025-07-31 10:11:55.342', 0),
	(55, 55, 11, '2025-07-31 10:11:55.342', 0),
	(56, 56, 12, '2025-07-31 10:11:55.347', 0),
	(57, 57, 12, '2025-07-31 10:11:55.347', 0),
	(58, 58, 12, '2025-07-31 10:11:55.347', 0),
	(59, 59, 12, '2025-07-31 10:11:55.347', 0),
	(60, 60, 12, '2025-07-31 10:11:55.347', 0),
	(61, 61, 13, '2025-07-31 10:11:55.349', 0),
	(62, 62, 13, '2025-07-31 10:11:55.349', 0),
	(63, 63, 13, '2025-07-31 10:11:55.349', 0),
	(64, 64, 13, '2025-07-31 10:11:55.349', 0),
	(65, 65, 13, '2025-07-31 10:11:55.349', 0),
	(66, 66, 14, '2025-07-31 10:11:55.352', 0),
	(67, 67, 14, '2025-07-31 10:11:55.352', 0),
	(68, 68, 14, '2025-07-31 10:11:55.352', 0),
	(69, 69, 14, '2025-07-31 10:11:55.352', 0),
	(70, 70, 14, '2025-07-31 10:11:55.352', 0),
	(71, 71, 15, '2025-07-31 10:11:55.355', 0),
	(72, 72, 15, '2025-07-31 10:11:55.355', 0),
	(73, 73, 15, '2025-07-31 10:11:55.355', 0),
	(74, 74, 15, '2025-07-31 10:11:55.355', 0),
	(75, 75, 15, '2025-07-31 10:11:55.355', 0),
	(76, 76, 16, '2025-07-31 10:11:55.358', 0),
	(77, 77, 16, '2025-07-31 10:11:55.358', 0),
	(78, 78, 16, '2025-07-31 10:11:55.358', 0),
	(79, 79, 16, '2025-07-31 10:11:55.358', 0),
	(80, 80, 16, '2025-07-31 10:11:55.358', 0),
	(81, 81, 17, '2025-07-31 10:11:55.362', 0),
	(82, 82, 17, '2025-07-31 10:11:55.362', 0),
	(83, 83, 17, '2025-07-31 10:11:55.362', 0),
	(84, 84, 17, '2025-07-31 10:11:55.362', 0),
	(85, 85, 17, '2025-07-31 10:11:55.362', 0),
	(86, 86, 18, '2025-07-31 10:11:55.365', 0),
	(87, 87, 18, '2025-07-31 10:11:55.365', 0),
	(88, 88, 18, '2025-07-31 10:11:55.365', 0),
	(89, 89, 18, '2025-07-31 10:11:55.365', 0),
	(90, 90, 18, '2025-07-31 10:11:55.365', 0),
	(91, 91, 19, '2025-07-31 10:11:55.368', 0),
	(92, 92, 19, '2025-07-31 10:11:55.368', 0),
	(93, 93, 19, '2025-07-31 10:11:55.368', 0),
	(94, 94, 19, '2025-07-31 10:11:55.368', 0),
	(95, 95, 19, '2025-07-31 10:11:55.368', 0),
	(96, 96, 20, '2025-07-31 10:11:55.371', 0),
	(97, 97, 20, '2025-07-31 10:11:55.371', 0),
	(98, 98, 20, '2025-07-31 10:11:55.371', 0),
	(99, 99, 20, '2025-07-31 10:11:55.371', 0),
	(100, 100, 20, '2025-07-31 10:11:55.371', 0),
	(101, 1, 1, '2025-08-06 11:02:54.145', 0),
	(102, 1, 1, '2025-08-06 11:03:07.510', 0),
	(103, 1, 2, '2025-08-06 11:03:21.322', 0),
	(104, 1, 2, '2025-08-06 11:03:50.353', 0),
	(105, 1, 2, '2025-08-06 12:03:30.192', 0),
	(106, 1, 2, '2025-08-06 12:03:40.788', 0),
	(107, 1, 2, '2025-08-06 12:03:54.224', 0),
	(108, 1, 2, '2025-08-07 07:33:05.050', 0);

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.users: ~104 rows (ungefähr)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `step_length`, `is_active`, `is_verified`, `verification_token`, `password_reset_token`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(1, 'AliceUp CuperUp', 'alice@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 1.2, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-08-14 09:29:22.095', 0),
	(2, 'Bob Smith', 'bob@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 10, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-08-12 08:20:26.712', 0),
	(3, 'Charlie Brown', 'charlie@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-07-31 10:15:53.953', 0),
	(4, 'Anna Scott', 'anna.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.426', 0),
	(5, 'Max Mustermann', 'max.mustermann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(6, 'Lena Schneider', 'lena.schneider@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(7, 'Tim Becker', 'tim.becker@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(8, 'Sophie Weber', 'sophie.weber@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(9, 'Felix Schulz', 'felix.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(10, 'Laura Fischer', 'laura.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(11, 'Jan Richter', 'jan.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(12, 'Hannah Wagner', 'hannah.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(13, 'Lukas Hofmann', 'lukas.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(14, 'Mia Braun', 'mia.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(15, 'Tom Lehmann', 'tom.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(16, 'Emilia Green', 'emilia.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.437', 0),
	(17, 'Paul Schwarz', 'paul.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(18, 'Charlotte Wolf', 'charlotte.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(19, 'Moritz Fuchs', 'moritz.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(20, 'Julia Meyer', 'julia.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(21, 'David Neumann', 'david.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(22, 'Marie Hartwig', 'marie.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(23, 'Jonas Keller', 'jonas.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(24, 'Clara Bauer', 'clara.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(25, 'Erik Koch', 'erik.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(26, 'Frida Lang', 'frida.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(27, 'Ben Hoffmann', 'ben.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(28, 'Greta Schmidt', 'greta.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(29, 'Leon Wagner', 'leon.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(30, 'Maja Bell', 'maja.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.443', 0),
	(31, 'Ole Maier', 'ole.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(32, 'Paula Schmitt', 'paula.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(33, 'Simon Wolf', 'simon.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(34, 'Theresa Engel', 'theresa.engel@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(35, 'Vincent Weber', 'vincent.weber@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(36, 'Zoe Keller', 'zoe.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(37, 'Adrian Adams', 'adrian.schroeder@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.447', 0),
	(38, 'Luisa Schulz', 'luisa.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(39, 'Niklas Schneider', 'niklas.schneider@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(40, 'Amelie Fischer', 'amelie.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(41, 'Bennet Richter', 'bennet.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.89, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(42, 'Finja Hofmann', 'finja.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(43, 'Hannes Braun', 'hannes.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(44, 'Jule Lehmann', 'jule.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(45, 'Konstantin Wright', 'konstantin.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.451', 0),
	(46, 'Lina Schwarz', 'lina.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(47, 'Marlon Fuchs', 'marlon.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(48, 'Nora Meyer', 'nora.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(49, 'Oscar Neumann', 'oscar.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(50, 'Pia Hartwig', 'pia.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(51, 'Quentin Keller', 'quentin.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(52, 'Romy Bauer', 'romy.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(53, 'Samuel Koch', 'samuel.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(54, 'Tilda Lang', 'tilda.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(55, 'Uwe Hoffmann', 'uwe.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(56, 'Vera Schmidt', 'vera.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(57, 'Walter Wagner', 'walter.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(58, 'Xenia Hall', 'xenia.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.454', 0),
	(59, 'Yannik Maier', 'yannik.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(60, 'Zara Schmitt', 'zara.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(61, 'Anton Keller', 'anton.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(62, 'Bianca Schulz', 'bianca.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(63, 'Christian Fischer', 'christian.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(64, 'Dina Richter', 'dina.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(65, 'Elias Hofmann', 'elias.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.89, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(66, 'Fiona Braun', 'fiona.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(67, 'Georg Lehmann', 'georg.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(68, 'Hannah Baker', 'hannah.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.457', 0),
	(69, 'Ivan Schwarz', 'ivan.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(70, 'Jana Wolf', 'jana.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(71, 'Kevin Fuchs', 'kevin.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(72, 'Lara Meyer', 'lara.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(73, 'Max Neumann', 'max.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(74, 'Nina Hartwig', 'nina.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(75, 'Oliver Keller', 'oliver.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(76, 'Pauline Bauer', 'pauline.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(77, 'Quirin Koch', 'quirin.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(78, 'Rosa Lang', 'rosa.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(79, 'Sebastian Hoffmann', 'sebastian.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(80, 'Tina Schmidt', 'tina.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(81, 'Ulf Wagner', 'ulf.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(82, 'Vivian Lewis', 'vivian.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.461', 0),
	(83, 'Wolfgang Maier', 'wolfgang.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(84, 'Yara Schmitt', 'yara.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(85, 'Zoe Klein', 'zoe.klein@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(86, 'Alexander Fischer', 'alexander.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(87, 'Birgit Schulz', 'birgit.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(88, 'Daniel Richter', 'daniel.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(89, 'Elke Hoffmann', 'elke.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(90, 'Fabian Braun', 'fabian.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(91, 'Gesa Lehmann', 'gesa.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(92, 'Hauke Hill', 'hauke.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.466', 0),
	(93, 'Ines Schwarz', 'ines.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(94, 'Jens Wolf', 'jens.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(95, 'Karin Fuchs', 'karin.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(96, 'Lena Meyer', 'lena.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(97, 'Marco Neumann', 'marco.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(98, 'Nadine Hartwig', 'nadine.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(99, 'Oliver Bauer', 'oliver.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(100, 'Petra Koch', 'petra.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957', 0),
	(147, 'Britney Spears', 'britney111@example.com', '$2b$12$KN9dKnPsyC9pc/T4ZnfVNOXlBqWNcmHN.oXKBobSme9109o6qlRDS', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-08-06 11:09:54.794', '2025-08-06 11:09:54.794', 0),
	(148, 'Britney Spears', 'britney1112@example.com', '$2b$12$ugXJdW5dbLebtZrDIItYGehX.7AlBPE9xKAf.7x4vReT1gYLfbI9.', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-08-06 11:10:08.842', '2025-08-06 11:10:08.842', 0),
	(149, 'Britney Spears', 'britney1211@example.com', '$2b$12$lJt8/KETGuYxRk1LhtSB4eHcZ5LQNGhyKRhdTHIXR.9m.Ops6gTTG', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-08-07 07:28:38.852', '2025-08-07 07:28:38.852', 0),
	(150, 'Britney Spears', 'britney13211@example.com', '$2b$12$CMhHdI0oy6SkQ9XzDRgHHe5unQTARrVp8yikc80wc6L2X.wIUpjzS', NULL, 1, 0, NULL, NULL, 0, NULL, '2025-08-11 08:28:11.990', '2025-08-11 08:28:11.990', 0);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
