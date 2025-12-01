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
  `team_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `state` varchar(50) NOT NULL DEFAULT 'incoming',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenges: ~21 rows (ungefähr)
DELETE FROM `challenges`;
INSERT INTO `challenges` (`id`, `name`, `start_location`, `target_location`, `distance`, `start_date`, `end_date`, `creator_id`, `team_id`, `created_at`, `updated_at`, `state`, `is_deleted`) VALUES
	(1, 'Graz-Wien', 'Graz', 'Wien', 200, '2025-07-31 00:00:00.000', '2025-12-31 23:59:00.000', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'open', 0),
	(2, 'Graz-Linz', 'Graz', 'Linz', 180, '2025-05-01 00:00:00.000', '2025-05-31 23:59:00.000', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed', 0),
	(3, 'Graz-Salzburg', 'Graz', 'Salzburg', 270, '2025-04-01 00:00:00.000', '2025-04-30 23:59:00.000', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed', 0),
	(4, 'Graz-Innsbruck', 'Graz', 'Innsbruck', 400, '2025-03-01 00:00:00.000', '2025-03-31 23:59:00.000', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed', 0),
	(18, 'Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 2, '2025-08-06 11:16:19.138', '2025-08-06 11:16:19.138', 'incoming', 0),
	(19, 'Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 2, '2025-08-06 11:20:50.462', '2025-08-06 11:20:50.462', 'incoming', 0),
	(20, 'Another Nice Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 1, 2, '2025-08-07 07:28:50.779', '2025-08-07 07:28:50.779', 'incoming', 1),
	(21, 'test', 'test', 'test', 10, '2025-11-02 09:18:00.000', '2025-11-22 09:18:00.000', 1, 1, '2025-11-03 09:18:24.756', '2025-11-03 09:18:24.000', 'incoming', 1),
	(22, 'test', 'test', 'London', 1, '2025-10-30 10:05:00.000', '2025-11-03 10:05:00.000', 1, 1, '2025-11-03 10:07:06.293', '2025-11-03 10:07:06.000', 'incoming', 1),
	(23, 'test', 'test', 'test', 1, '2025-10-24 10:07:00.000', '2025-11-03 10:07:00.000', 1, 1, '2025-11-03 10:07:26.197', '2025-11-03 10:07:26.000', 'incoming', 1),
	(24, 'test123', 'test1234', 'test12345', 12, '2025-11-04 09:27:00.000', '2025-11-19 09:27:00.000', 1, 1, '2025-11-04 09:27:20.192', '2025-11-04 09:27:20.000', 'incoming', 1),
	(25, 'Britney Spears', 'Kapstadt, Südafrika', 'Magadan, Russland', 21811, '2025-11-04 09:34:00.000', '2222-12-22 22:22:00.000', 1, 1, '2025-11-04 09:36:25.339', '2025-11-04 09:36:25.000', 'incoming', 0),
	(26, 'World Trip', 'Usa', 'Graz', 10, '2025-11-04 10:38:00.000', '2025-11-21 10:38:00.000', 1, 1, '2025-11-04 10:38:36.752', '2025-11-04 10:38:36.000', 'incoming', 1),
	(27, 'testteam', 'testteam', 'testteam', 12345, '2025-11-01 12:42:00.000', '2025-11-11 12:42:00.000', 1, 1, '2025-11-11 12:42:21.332', '2025-11-11 12:42:21.000', 'incoming', 1),
	(28, 'pleasework', 'pleasework', 'pleasework', 112, '2025-10-28 18:15:00.000', '2025-11-22 15:16:00.000', 1, 1, '2025-11-11 15:16:23.687', '2025-11-11 15:16:23.000', 'incoming', 1),
	(29, 'TestChallenge', 'Paris', 'London', 12, '2025-11-03 08:09:00.000', '2025-11-27 08:09:00.000', 1, 1, '2025-11-12 08:10:57.181', '2025-11-12 08:10:57.000', 'open', 1),
	(32, 'DELETEME', 'delete', 'delete', 12, '2025-10-27 08:48:00.000', '2025-11-12 08:48:00.000', 1, 1, '2025-11-12 09:07:09.147', '2025-11-12 09:07:09.000', 'open', 1),
	(33, 'DELETEME', 'delete', 'delete', 12, '2025-11-01 09:07:00.000', '2025-11-30 09:07:00.000', 1, 1, '2025-11-12 09:07:31.226', '2025-11-12 09:07:31.000', 'incoming', 1),
	(34, 'DELETEME', 'delete test', 'delete test', 10, '2025-11-01 09:09:00.000', '2025-11-30 09:09:00.000', 1, 1, '2025-11-12 09:10:13.265', '2025-11-12 09:10:13.000', 'open', 1),
	(35, 'pleasework', 'pleasework', 'test', 123, '2025-10-28 09:11:00.000', '2025-11-28 09:11:00.000', 1, 1, '2025-11-12 09:12:08.794', '2025-11-12 09:12:08.000', 'incoming', 1),
	(36, '1', '1', '1', 1, '2025-11-12 09:22:00.000', '2025-11-28 09:22:00.000', 1, 1, '2025-11-12 09:23:24.975', '2025-11-12 09:23:24.000', 'closed', 1);

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

-- Exportiere Struktur von Tabelle step_together_api.challenge_team
DROP TABLE IF EXISTS `challenge_team`;
CREATE TABLE IF NOT EXISTS `challenge_team` (
  `challenge_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`challenge_id`,`team_id`),
  KEY `fk_team` (`team_id`),
  CONSTRAINT `fk_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenge_team: ~17 rows (ungefähr)
DELETE FROM `challenge_team`;
INSERT INTO `challenge_team` (`challenge_id`, `team_id`, `created_at`) VALUES
	(1, 1, '2025-11-24 10:34:45'),
	(1, 2, '2025-11-24 10:34:45'),
	(1, 3, '2025-11-24 10:34:45'),
	(1, 24, '2025-11-24 10:34:45'),
	(1, 25, '2025-11-24 10:34:45'),
	(1, 26, '2025-11-24 10:34:45'),
	(2, 2, '2025-08-19 06:43:19'),
	(2, 3, '2025-08-19 06:43:19'),
	(19, 1, '2025-11-12 08:13:30'),
	(28, 1, '2025-11-11 14:46:26'),
	(28, 5, '2025-11-11 14:46:26'),
	(28, 26, '2025-11-11 14:46:26'),
	(29, 1, '2025-11-12 07:12:56'),
	(32, 1, '2025-11-12 08:07:09'),
	(33, 1, '2025-11-12 08:07:31'),
	(34, 1, '2025-11-12 08:10:30'),
	(35, 1, '2025-11-12 08:12:08');

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
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.step_logs: ~57 rows (ungefähr)
DELETE FROM `step_logs`;
INSERT INTO `step_logs` (`id`, `user_id`, `challenge_id`, `team_id`, `date`, `number_of_steps`, `is_deleted`) VALUES
	(1, 1, 1, 1, '2025-08-11 00:00:00.000', 20, 0),
	(2, 1, 1, 1, '2025-08-12 00:00:00.000', 10, 0),
	(3, 1, 1, 1, '2025-08-13 00:00:00.000', 80, 0),
	(4, 1, 1, 1, '2025-08-14 00:00:00.000', 70, 0),
	(5, 2, 1, 1, '2025-08-11 00:00:00.000', 20, 0),
	(6, 2, 1, 1, '2025-08-12 00:00:00.000', 10, 0),
	(7, 2, 1, 1, '2025-08-13 00:00:00.000', 2000, 0),
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
	(25, 1, 2, 1, '2025-01-11 00:00:00.000', 20, 0),
	(26, 1, 2, 1, '2025-01-12 00:00:00.000', 10, 0),
	(27, 1, 2, 1, '2025-01-13 00:00:00.000', 80, 0),
	(28, 1, 2, 1, '2025-01-14 00:00:00.000', 70, 0),
	(29, 2, 2, 1, '2025-01-11 00:00:00.000', 20, 0),
	(30, 2, 2, 1, '2025-01-12 00:00:00.000', 10, 0),
	(31, 2, 2, 1, '2025-01-13 00:00:00.000', 80, 0),
	(32, 2, 2, 1, '2025-01-14 00:00:00.000', 70, 0),
	(33, 3, 2, 2, '2025-01-11 00:00:00.000', 20, 0),
	(34, 3, 2, 2, '2025-01-12 00:00:00.000', 10, 0),
	(35, 3, 2, 2, '2025-01-13 00:00:00.000', 80, 0),
	(36, 3, 2, 2, '2025-01-14 00:00:00.000', 70, 0),
	(37, 4, 2, 2, '2025-01-11 00:00:00.000', 20, 0),
	(38, 4, 2, 2, '2025-01-12 00:00:00.000', 10, 0),
	(39, 4, 2, 2, '2025-01-13 00:00:00.000', 80, 0),
	(40, 4, 2, 2, '2025-01-14 00:00:00.000', 70, 0),
	(41, 5, 2, 3, '2025-01-11 00:00:00.000', 20, 0),
	(42, 5, 2, 3, '2025-01-12 00:00:00.000', 10, 0),
	(43, 5, 2, 3, '2025-01-13 00:00:00.000', 80, 0),
	(44, 5, 2, 3, '2025-01-14 00:00:00.000', 70, 0),
	(45, 6, 2, 3, '2025-01-11 00:00:00.000', 20, 0),
	(46, 6, 2, 3, '2025-01-12 00:00:00.000', 10, 0),
	(47, 6, 2, 3, '2025-01-13 00:00:00.000', 80, 0),
	(48, 6, 2, 3, '2025-01-14 00:00:00.000', 70, 0),
	(49, 1, 1, 1, '2025-11-24 09:08:36.000', 322, 0),
	(50, 173, 1, 26, '2025-11-24 11:08:19.000', 12, 0),
	(51, 1, 1, 1, '2025-11-25 00:00:00.000', 416, 0),
	(52, 1, 1, 1, '2025-11-17 00:00:00.000', 25, 0),
	(53, 1, 1, 1, '2025-11-26 00:00:00.000', 3600, 0),
	(54, 149, 1, 26, '2025-11-26 09:29:33.000', 12, 0),
	(55, 1, 1, 1, '2025-11-26 00:00:00.000', 208, 0),
	(56, 1, 1, 1, '2025-11-27 00:00:00.000', 1020, 0),
	(57, 1, 1, 1, '2025-12-01 00:00:00.000', 1000, 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.teams: ~24 rows (ungefähr)
DELETE FROM `teams`;
INSERT INTO `teams` (`id`, `name`, `creator_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(1, 'Graz PHP', 1, '2025-05-14 11:44:47.637', '2025-11-13 10:48:31.542', 0),
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
	(24, 'PHP', 1, '2025-08-06 11:35:12.083', '2025-11-24 09:12:31.282', 0),
	(25, 'Flutter', 1, '2025-08-06 12:04:05.710', '2025-11-24 09:12:18.380', 0),
	(26, 'React', 1, '2025-08-06 12:04:18.742', '2025-11-24 09:31:32.005', 0);

-- Exportiere Struktur von Tabelle step_together_api.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `joining_date` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.team_members: ~106 rows (ungefähr)
DELETE FROM `team_members`;
INSERT INTO `team_members` (`id`, `user_id`, `team_id`, `joining_date`, `is_deleted`) VALUES
	(1, 1, 1, '2025-07-31 10:11:55.302', 0),
	(2, 2, 1, '2025-07-31 10:11:55.302', 0),
	(3, 3, 2, '2025-07-31 10:11:55.302', 0),
	(4, 4, 2, '2025-07-31 10:11:55.302', 0),
	(5, 5, 3, '2025-07-31 10:11:55.302', 0),
	(6, 6, 3, '2025-07-31 10:11:55.310', 0),
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
	(111, 147, 24, '2025-11-24 09:30:23.801', 0),
	(112, 148, 24, '2025-11-24 09:30:23.802', 0),
	(114, 100, 25, '2025-11-24 09:30:49.523', 0),
	(115, 99, 25, '2025-11-24 09:30:49.523', 0),
	(116, 173, 26, '2025-11-24 09:31:32.006', 0),
	(117, 149, 26, '2025-11-24 09:31:32.007', 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.users: ~114 rows (ungefähr)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `step_length`, `is_active`, `is_verified`, `verification_token`, `password_reset_token`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`, `is_deleted`, `role`, `public_profile`) VALUES
	(1, 'Alice Cuper', 'alice@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.95, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-11-24 09:48:56.804', 0, 'admin', 1),
	(2, 'Bob Charlie', 'bob@example.com', '$2y$10$iH.9U3Tx60HWwV51V7WfXezj21A06jBrtSyIlRwcXSJ7HXtI7Qzjy', 10, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-12-01 12:32:56.918', 0, 'user', 1),
	(3, 'Charlie Brown', 'charlie@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-12-01 13:09:04.135', 0, 'user', 1),
	(4, 'Anna Scott', 'anna@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-12-01 13:09:05.535', 0, 'user', 1),
	(5, 'Max Mustermann', 'max.mustermann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(6, 'Lena Schneider', 'lena.schneider@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(7, 'Tim Becker', 'tim.becker@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(8, 'Sophie Weber', 'sophie.weber@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(9, 'Felix Schulz', 'felix.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(10, 'Laura Fischer', 'laura.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(11, 'Jan Richter', 'jan.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(12, 'Hannah Wagner', 'hannah.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(13, 'Lukas Hofmann', 'lukas.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(14, 'Mia Braun', 'mia.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(15, 'Tom Lehmann', 'tom.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(16, 'Emilia Green', 'emilia.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(17, 'Paul Schwarz', 'paul.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(18, 'Charlotte Wolf', 'charlotte.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(19, 'Moritz Fuchs', 'moritz.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(20, 'Julia Meyer', 'julia.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(21, 'David Neumann', 'david.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(22, 'Marie Hartwig', 'marie.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(23, 'Jonas Keller', 'jonas.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(24, 'Clara Bauer', 'clara.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(25, 'Erik Koch', 'erik.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(26, 'Frida Lang', 'frida.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(27, 'Ben Hoffmann', 'ben.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(28, 'Greta Schmidt', 'greta.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(29, 'Leon Wagner', 'leon.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(30, 'Maja Bell', 'maja.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(31, 'Ole Maier', 'ole.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(32, 'Paula Schmitt', 'paula.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(33, 'Simon Wolf', 'simon.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(34, 'Theresa Engel', 'theresa.engel@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(35, 'Vincent Weber', 'vincent.weber@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(36, 'Zoe Keller', 'zoe.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(37, 'Adrian Adams', 'adrian.schroeder@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(38, 'Luisa Schulz', 'luisa.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(39, 'Niklas Schneider', 'niklas.schneider@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(40, 'Amelie Fischer', 'amelie.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(41, 'Bennet Richter', 'bennet.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.89, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(42, 'Finja Hofmann', 'finja.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(43, 'Hannes Braun', 'hannes.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(44, 'Jule Lehmann', 'jule.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(45, 'Konstantin Wright', 'konstantin.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(46, 'Lina Schwarz', 'lina.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(47, 'Marlon Fuchs', 'marlon.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(48, 'Nora Meyer', 'nora.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(49, 'Oscar Neumann', 'oscar.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(50, 'Pia Hartwig', 'pia.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(51, 'Quentin Keller', 'quentin.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(52, 'Romy Bauer', 'romy.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(53, 'Samuel Koch', 'samuel.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(54, 'Tilda Lang', 'tilda.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(55, 'Uwe Hoffmann', 'uwe.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(56, 'Vera Schmidt', 'vera.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(57, 'Walter Wagner', 'walter.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(58, 'Xenia Hall', 'xenia.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(59, 'Yannik Maier', 'yannik.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(60, 'Zara Schmitt', 'zara.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(61, 'Anton Keller', 'anton.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(62, 'Bianca Schulz', 'bianca.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(63, 'Christian Fischer', 'christian.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(64, 'Dina Richter', 'dina.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(65, 'Elias Hofmann', 'elias.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.89, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(66, 'Fiona Braun', 'fiona.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(67, 'Georg Lehmann', 'georg.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(68, 'Hannah Baker', 'hannah.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(69, 'Ivan Schwarz', 'ivan.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(70, 'Jana Wolf', 'jana.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(71, 'Kevin Fuchs', 'kevin.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(72, 'Lara Meyer', 'lara.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(73, 'Max Neumann', 'max.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(74, 'Nina Hartwig', 'nina.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(75, 'Oliver Keller', 'oliver.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(76, 'Pauline Bauer', 'pauline.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(77, 'Quirin Koch', 'quirin.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(78, 'Rosa Lang', 'rosa.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(79, 'Sebastian Hoffmann', 'sebastian.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(80, 'Tina Schmidt', 'tina.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(81, 'Ulf Wagner', 'ulf.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(82, 'Vivian Lewis', 'vivian.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(83, 'Wolfgang Maier', 'wolfgang.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(84, 'Yara Schmitt', 'yara.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(85, 'Zoe Klein', 'zoe.klein@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(86, 'Alexander Fischer', 'alexander.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(87, 'Birgit Schulz', 'birgit.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(88, 'Daniel Richter', 'daniel.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(89, 'Elke Hoffmann', 'elke.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(90, 'Fabian Braun', 'fabian.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(91, 'Gesa Lehmann', 'gesa.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(92, 'Hauke Hill', 'hauke.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(93, 'Ines Schwarz', 'ines.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(94, 'Jens Wolf', 'jens.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(95, 'Karin Fuchs', 'karin.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(96, 'Lena Meyer', 'lena.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(97, 'Marco Neumann', 'marco.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-03 10:27:05.097', 0, 'user', 1),
	(98, 'Jeton Arifi', 'jetong@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-24 09:42:03.536', 0, 'admin', 1),
	(99, 'Goca Andelkovic', 'goca@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-24 09:33:42.521', 0, 'user', 1),
	(100, 'Uwe Binder', 'uwe@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-11-24 09:32:39.190', 0, 'user', 1),
	(147, 'Artem Panasiuk', 'artem@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-08-06 11:09:54.794', '2025-11-24 09:41:02.620', 0, 'admin', 1),
	(148, 'Betül Celik', 'betuel@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-08-06 11:10:08.842', '2025-11-24 09:40:55.487', 0, 'user', 1),
	(149, 'Sara Kutschi', 'sara@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-08-07 07:28:38.852', '2025-11-24 09:40:57.612', 0, 'user', 1),
	(173, 'Lana Durlacher', 'lana@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 12, 1, 0, NULL, NULL, 0, NULL, '2025-10-23 00:00:00.000', '2025-12-01 13:08:58.188', 0, 'admin', 1),
	(174, 'Sophie Weber', 'testuse123r@test.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 12, 1, 0, NULL, NULL, 0, NULL, '2025-11-04 10:06:47.663', '2025-11-24 09:49:03.717', 0, 'admin', 1),
	(175, 'TestNow', 'Testing@test.com', '$2y$10$d8i02ShXVLmVkEH1/8HTw.5YyoKpaoihI0u3kbEmW/Ni0MMk0eHhq', 10, 1, 0, NULL, NULL, 0, NULL, '2025-11-04 10:07:30.464', '2025-11-04 10:07:30.464', 0, 'user', NULL),
	(176, 'Sophie Weber', 'idontknowwhatiamdoing@exampe.com', '$2y$10$/fcyGr47IwgEBFlX.X45ouZuMC6ewvLKJeowSuNEMrSp6cnqHL6n6', NULL, 1, 0, 'a20bf73a0b1128ca4ed4fd9f0966b880d79815de34f286ca8ed16770c92c7c8c', NULL, 0, NULL, '2025-11-06 11:23:50.000', '2025-12-01 13:09:08.803', 0, 'user', 1),
	(177, 'Alex Jemand', 'alex123@example.com', '$2y$10$RbgrteEIf9aAq8IvPOazjOOodo3AC145c5WBtyD/7kk0fvCN3wKTC', NULL, 1, 0, 'e3dccf827a708e6ba63f8ff77b44926a4c65dd03bfe0ce44af85d45ad2bbb5fd', NULL, 0, NULL, '2025-11-06 11:35:36.000', '2025-12-01 13:09:10.153', 0, 'user', 1),
	(178, 'thats a name', 'not-alice@example.com', '$2y$10$CFTKIPRrmFl7k0tbMVCQoOWx7LPcaYp3ilutszbIyHYzLF7wp5rk2', NULL, 1, 0, 'fc5fba99eb342bc2b05a7434adecbea8e89fc605c6c1b6307237ffc14d7ce0b2', NULL, 0, NULL, '2025-11-06 13:11:27.000', '2025-12-01 13:09:11.846', 0, 'user', 1),
	(179, 'pop up', 'testuser123123@test.com', '$2y$10$xobqO3fS/fhqBC02YRhUQ.uGh3X0oVJLmWRXf8sNGh3if3r8aJwxC', NULL, 1, 0, 'cbe5ff0b01ba0cf1ba2a27153f5d61d492b703270d6110326d49765a22d779b7', NULL, 0, NULL, '2025-11-06 14:23:32.000', '2025-12-01 13:09:09.399', 0, 'user', 1),
	(180, 'pop up', 'testmega3000@test.com', '$2y$10$004TNOt4rr5QrXGIoZlX6.1F0veLPE2qW02HxONLM/w4./aa4zBo6', NULL, 1, 0, '16f0d6075faeeda8ae47429abb91a441e0952188fa33279faf867aa55a6cecd2', NULL, 0, NULL, '2025-11-06 14:26:22.000', '2025-12-01 13:09:06.145', 0, 'user', 1),
	(181, 'thats mz namye', 'testuser@test.com', '$2y$10$K2KjlXl8UeGa..wosCpmAuueHctbfKsYidYcXRKjuZ9O/zFFNFJnG', NULL, 1, 0, '240667ea74efae956142e54aeece1d8db8785b7e2cf04272927c4d0ba0b62d6f', NULL, 0, NULL, '2025-11-06 14:27:17.000', '2025-12-01 13:09:06.735', 0, 'user', 1),
	(182, 'test', 'testuserplease@test.com', '$2y$10$I1NyvVhx0sCbkvkstxGEdOFCJbW3mROYiRIomTn1Aq1bc0WCxDNu.', NULL, 1, 0, '2ea2a10bcfa3802f66f46b676a4dce6f6dfdf5e3b34ada663f4b9671d7576058', NULL, 0, NULL, '2025-11-06 14:28:29.000', '2025-12-01 13:09:07.383', 0, 'user', 1),
	(183, 'test', 'testus4124er@test.com', '$2y$10$ybIJpDiAwP6UETy8vK8rmO.1ugPeYBvLf91l6KiozYuIsKsRqrWGa', NULL, 1, 0, '821d3116d857180993809e301ef6012d9469ac365797f8c32888192b817c430b', NULL, 0, NULL, '2025-11-06 14:29:03.000', '2025-12-01 13:09:08.098', 0, 'user', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
