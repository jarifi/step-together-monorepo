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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenges: ~4 rows (ungefähr)
DELETE FROM `challenges`;
INSERT INTO `challenges` (`id`, `name`, `start_location`, `target_location`, `distance`, `start_date`, `end_date`, `creator_id`, `team_id`, `created_at`, `updated_at`, `state`) VALUES
	(1, 'Graz-Wien Challenge', 'Graz', 'Wien', 200, '2025-07-31 00:00:00.000', '2025-08-30 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'open'),
	(2, 'Graz-Linz Challenge', 'Graz', 'Linz', 180, '2025-05-01 00:00:00.000', '2025-05-31 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed'),
	(3, 'Graz-Salzburg Challenge', 'Graz', 'Salzburg', 270, '2025-04-01 00:00:00.000', '2025-04-30 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed'),
	(4, 'Graz-Innsbruck Challenge', 'Graz', 'Innsbruck', 400, '2025-03-01 00:00:00.000', '2025-03-31 23:59:59.999', 1, 1, '2025-07-31 09:36:43.290', '2025-07-31 09:36:43.290', 'closed');

-- Exportiere Struktur von Tabelle step_together_api.challenge_progress
DROP TABLE IF EXISTS `challenge_progress`;
CREATE TABLE IF NOT EXISTS `challenge_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `distance_covered` double NOT NULL,
  `total_steps` int(11) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenge_progress: ~6 rows (ungefähr)
DELETE FROM `challenge_progress`;
INSERT INTO `challenge_progress` (`id`, `user_id`, `challenge_id`, `distance_covered`, `total_steps`, `updated_at`) VALUES
	(1, 1, 1, 7, 10000, '2025-05-14 11:44:47.654'),
	(2, 2, 1, 6, 8000, '2025-05-14 11:44:47.654'),
	(3, 1, 2, 7, 10000, '2025-05-14 13:42:50.763'),
	(4, 2, 2, 6, 8000, '2025-05-14 13:42:50.763'),
	(5, 1, 3, 7, 10000, '2025-05-20 08:23:39.232'),
	(6, 2, 3, 6, 8000, '2025-05-20 08:23:39.232');

-- Exportiere Struktur von Tabelle step_together_api.step_logs
DROP TABLE IF EXISTS `step_logs`;
CREATE TABLE IF NOT EXISTS `step_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `date` datetime(3) NOT NULL,
  `number_of_steps` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.step_logs: ~6 rows (ungefähr)
DELETE FROM `step_logs`;
INSERT INTO `step_logs` (`id`, `user_id`, `challenge_id`, `team_id`, `date`, `number_of_steps`) VALUES
	(1, 1, 1, 1, '2025-05-03 00:00:00.000', 20),
	(2, 1, 1, 1, '2025-05-04 00:00:00.000', 10),
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.teams: ~20 rows (ungefähr)
DELETE FROM `teams`;
INSERT INTO `teams` (`id`, `name`, `creator_id`, `created_at`, `updated_at`) VALUES
	(1, 'Team A', 1, '2025-05-14 11:44:47.637', '2025-05-14 11:44:47.637'),
	(2, 'Team B', 1, '2025-05-14 13:42:50.744', '2025-05-14 13:42:50.744'),
	(3, 'Team C', 1, '2025-05-20 08:23:39.215', '2025-05-20 08:23:39.215'),
	(4, 'Team D', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(5, 'Team E', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(6, 'Team F', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(7, 'Team G', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(8, 'Team H', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(9, 'Team I', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(10, 'Team J', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(11, 'Team K', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(12, 'Team L', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(13, 'Team M', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(14, 'Team N', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(15, 'Team O', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(16, 'Team P', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(17, 'Team Q', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(18, 'Team R', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(19, 'Team S', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167'),
	(20, 'Team T', 1, '2025-07-31 09:34:21.167', '2025-07-31 09:34:21.167');

-- Exportiere Struktur von Tabelle step_together_api.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `joining_date` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.team_members: ~100 rows (ungefähr)
DELETE FROM `team_members`;
INSERT INTO `team_members` (`id`, `user_id`, `team_id`, `joining_date`) VALUES
	(1, 1, 1, '2025-07-31 10:11:55.302'),
	(2, 2, 1, '2025-07-31 10:11:55.302'),
	(3, 3, 1, '2025-07-31 10:11:55.302'),
	(4, 4, 1, '2025-07-31 10:11:55.302'),
	(5, 5, 1, '2025-07-31 10:11:55.302'),
	(6, 6, 2, '2025-07-31 10:11:55.310'),
	(7, 7, 2, '2025-07-31 10:11:55.310'),
	(8, 8, 2, '2025-07-31 10:11:55.310'),
	(9, 9, 2, '2025-07-31 10:11:55.310'),
	(10, 10, 2, '2025-07-31 10:11:55.310'),
	(11, 11, 3, '2025-07-31 10:11:55.319'),
	(12, 12, 3, '2025-07-31 10:11:55.319'),
	(13, 13, 3, '2025-07-31 10:11:55.319'),
	(14, 14, 3, '2025-07-31 10:11:55.319'),
	(15, 15, 3, '2025-07-31 10:11:55.319'),
	(16, 16, 4, '2025-07-31 10:11:55.322'),
	(17, 17, 4, '2025-07-31 10:11:55.322'),
	(18, 18, 4, '2025-07-31 10:11:55.322'),
	(19, 19, 4, '2025-07-31 10:11:55.322'),
	(20, 20, 4, '2025-07-31 10:11:55.322'),
	(21, 21, 5, '2025-07-31 10:11:55.325'),
	(22, 22, 5, '2025-07-31 10:11:55.325'),
	(23, 23, 5, '2025-07-31 10:11:55.325'),
	(24, 24, 5, '2025-07-31 10:11:55.325'),
	(25, 25, 5, '2025-07-31 10:11:55.325'),
	(26, 26, 6, '2025-07-31 10:11:55.328'),
	(27, 27, 6, '2025-07-31 10:11:55.328'),
	(28, 28, 6, '2025-07-31 10:11:55.328'),
	(29, 29, 6, '2025-07-31 10:11:55.328'),
	(30, 30, 6, '2025-07-31 10:11:55.328'),
	(31, 31, 7, '2025-07-31 10:11:55.331'),
	(32, 32, 7, '2025-07-31 10:11:55.331'),
	(33, 33, 7, '2025-07-31 10:11:55.331'),
	(34, 34, 7, '2025-07-31 10:11:55.331'),
	(35, 35, 7, '2025-07-31 10:11:55.331'),
	(36, 36, 8, '2025-07-31 10:11:55.334'),
	(37, 37, 8, '2025-07-31 10:11:55.334'),
	(38, 38, 8, '2025-07-31 10:11:55.334'),
	(39, 39, 8, '2025-07-31 10:11:55.334'),
	(40, 40, 8, '2025-07-31 10:11:55.334'),
	(41, 41, 9, '2025-07-31 10:11:55.337'),
	(42, 42, 9, '2025-07-31 10:11:55.337'),
	(43, 43, 9, '2025-07-31 10:11:55.337'),
	(44, 44, 9, '2025-07-31 10:11:55.337'),
	(45, 45, 9, '2025-07-31 10:11:55.337'),
	(46, 46, 10, '2025-07-31 10:11:55.339'),
	(47, 47, 10, '2025-07-31 10:11:55.339'),
	(48, 48, 10, '2025-07-31 10:11:55.339'),
	(49, 49, 10, '2025-07-31 10:11:55.339'),
	(50, 50, 10, '2025-07-31 10:11:55.339'),
	(51, 51, 11, '2025-07-31 10:11:55.342'),
	(52, 52, 11, '2025-07-31 10:11:55.342'),
	(53, 53, 11, '2025-07-31 10:11:55.342'),
	(54, 54, 11, '2025-07-31 10:11:55.342'),
	(55, 55, 11, '2025-07-31 10:11:55.342'),
	(56, 56, 12, '2025-07-31 10:11:55.347'),
	(57, 57, 12, '2025-07-31 10:11:55.347'),
	(58, 58, 12, '2025-07-31 10:11:55.347'),
	(59, 59, 12, '2025-07-31 10:11:55.347'),
	(60, 60, 12, '2025-07-31 10:11:55.347'),
	(61, 61, 13, '2025-07-31 10:11:55.349'),
	(62, 62, 13, '2025-07-31 10:11:55.349'),
	(63, 63, 13, '2025-07-31 10:11:55.349'),
	(64, 64, 13, '2025-07-31 10:11:55.349'),
	(65, 65, 13, '2025-07-31 10:11:55.349'),
	(66, 66, 14, '2025-07-31 10:11:55.352'),
	(67, 67, 14, '2025-07-31 10:11:55.352'),
	(68, 68, 14, '2025-07-31 10:11:55.352'),
	(69, 69, 14, '2025-07-31 10:11:55.352'),
	(70, 70, 14, '2025-07-31 10:11:55.352'),
	(71, 71, 15, '2025-07-31 10:11:55.355'),
	(72, 72, 15, '2025-07-31 10:11:55.355'),
	(73, 73, 15, '2025-07-31 10:11:55.355'),
	(74, 74, 15, '2025-07-31 10:11:55.355'),
	(75, 75, 15, '2025-07-31 10:11:55.355'),
	(76, 76, 16, '2025-07-31 10:11:55.358'),
	(77, 77, 16, '2025-07-31 10:11:55.358'),
	(78, 78, 16, '2025-07-31 10:11:55.358'),
	(79, 79, 16, '2025-07-31 10:11:55.358'),
	(80, 80, 16, '2025-07-31 10:11:55.358'),
	(81, 81, 17, '2025-07-31 10:11:55.362'),
	(82, 82, 17, '2025-07-31 10:11:55.362'),
	(83, 83, 17, '2025-07-31 10:11:55.362'),
	(84, 84, 17, '2025-07-31 10:11:55.362'),
	(85, 85, 17, '2025-07-31 10:11:55.362'),
	(86, 86, 18, '2025-07-31 10:11:55.365'),
	(87, 87, 18, '2025-07-31 10:11:55.365'),
	(88, 88, 18, '2025-07-31 10:11:55.365'),
	(89, 89, 18, '2025-07-31 10:11:55.365'),
	(90, 90, 18, '2025-07-31 10:11:55.365'),
	(91, 91, 19, '2025-07-31 10:11:55.368'),
	(92, 92, 19, '2025-07-31 10:11:55.368'),
	(93, 93, 19, '2025-07-31 10:11:55.368'),
	(94, 94, 19, '2025-07-31 10:11:55.368'),
	(95, 95, 19, '2025-07-31 10:11:55.368'),
	(96, 96, 20, '2025-07-31 10:11:55.371'),
	(97, 97, 20, '2025-07-31 10:11:55.371'),
	(98, 98, 20, '2025-07-31 10:11:55.371'),
	(99, 99, 20, '2025-07-31 10:11:55.371'),
	(100, 100, 20, '2025-07-31 10:11:55.371');

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.users: ~100 rows (ungefähr)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `step_length`, `is_active`, `is_verified`, `verification_token`, `password_reset_token`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`) VALUES
	(1, 'Test User', 'alice@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-07-31 10:15:53.953'),
	(2, 'Bob Smith', 'bob@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-07-31 10:15:53.953'),
	(3, 'Charlie Brown', 'charlie@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.953', '2025-07-31 10:15:53.953'),
	(4, 'Anna Scott', 'anna.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.426'),
	(5, 'Max Mustermann', 'max.mustermann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(6, 'Lena Schneider', 'lena.schneider@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(7, 'Tim Becker', 'tim.becker@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(8, 'Sophie Weber', 'sophie.weber@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(9, 'Felix Schulz', 'felix.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(10, 'Laura Fischer', 'laura.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(11, 'Jan Richter', 'jan.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(12, 'Hannah Wagner', 'hannah.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(13, 'Lukas Hofmann', 'lukas.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(14, 'Mia Braun', 'mia.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(15, 'Tom Lehmann', 'tom.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(16, 'Emilia Green', 'emilia.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.437'),
	(17, 'Paul Schwarz', 'paul.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(18, 'Charlotte Wolf', 'charlotte.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(19, 'Moritz Fuchs', 'moritz.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(20, 'Julia Meyer', 'julia.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(21, 'David Neumann', 'david.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(22, 'Marie Hartwig', 'marie.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(23, 'Jonas Keller', 'jonas.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(24, 'Clara Bauer', 'clara.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(25, 'Erik Koch', 'erik.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(26, 'Frida Lang', 'frida.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(27, 'Ben Hoffmann', 'ben.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(28, 'Greta Schmidt', 'greta.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(29, 'Leon Wagner', 'leon.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(30, 'Maja Bell', 'maja.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.443'),
	(31, 'Ole Maier', 'ole.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(32, 'Paula Schmitt', 'paula.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(33, 'Simon Wolf', 'simon.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(34, 'Theresa Engel', 'theresa.engel@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(35, 'Vincent Weber', 'vincent.weber@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(36, 'Zoe Keller', 'zoe.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(37, 'Adrian Adams', 'adrian.schroeder@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.447'),
	(38, 'Luisa Schulz', 'luisa.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(39, 'Niklas Schneider', 'niklas.schneider@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(40, 'Amelie Fischer', 'amelie.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(41, 'Bennet Richter', 'bennet.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.89, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(42, 'Finja Hofmann', 'finja.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(43, 'Hannes Braun', 'hannes.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(44, 'Jule Lehmann', 'jule.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(45, 'Konstantin Wright', 'konstantin.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.451'),
	(46, 'Lina Schwarz', 'lina.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(47, 'Marlon Fuchs', 'marlon.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(48, 'Nora Meyer', 'nora.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(49, 'Oscar Neumann', 'oscar.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(50, 'Pia Hartwig', 'pia.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(51, 'Quentin Keller', 'quentin.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(52, 'Romy Bauer', 'romy.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(53, 'Samuel Koch', 'samuel.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(54, 'Tilda Lang', 'tilda.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(55, 'Uwe Hoffmann', 'uwe.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(56, 'Vera Schmidt', 'vera.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(57, 'Walter Wagner', 'walter.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(58, 'Xenia Hall', 'xenia.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.454'),
	(59, 'Yannik Maier', 'yannik.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(60, 'Zara Schmitt', 'zara.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(61, 'Anton Keller', 'anton.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(62, 'Bianca Schulz', 'bianca.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(63, 'Christian Fischer', 'christian.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(64, 'Dina Richter', 'dina.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(65, 'Elias Hofmann', 'elias.hofmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.89, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(66, 'Fiona Braun', 'fiona.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(67, 'Georg Lehmann', 'georg.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(68, 'Hannah Baker', 'hannah.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.457'),
	(69, 'Ivan Schwarz', 'ivan.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(70, 'Jana Wolf', 'jana.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(71, 'Kevin Fuchs', 'kevin.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(72, 'Lara Meyer', 'lara.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.74, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(73, 'Max Neumann', 'max.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(74, 'Nina Hartwig', 'nina.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.77, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(75, 'Oliver Keller', 'oliver.keller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(76, 'Pauline Bauer', 'pauline.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.71, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(77, 'Quirin Koch', 'quirin.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(78, 'Rosa Lang', 'rosa.lang@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(79, 'Sebastian Hoffmann', 'sebastian.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(80, 'Tina Schmidt', 'tina.schmidt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(81, 'Ulf Wagner', 'ulf.wagner@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.88, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(82, 'Vivian Lewis', 'vivian.mueller@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.461'),
	(83, 'Wolfgang Maier', 'wolfgang.maier@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(84, 'Yara Schmitt', 'yara.schmitt@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(85, 'Zoe Klein', 'zoe.klein@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(86, 'Alexander Fischer', 'alexander.fischer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.8, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(87, 'Birgit Schulz', 'birgit.schulz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.75, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(88, 'Daniel Richter', 'daniel.richter@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.85, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(89, 'Elke Hoffmann', 'elke.hoffmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.7, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(90, 'Fabian Braun', 'fabian.braun@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.82, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(91, 'Gesa Lehmann', 'gesa.lehmann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.73, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(92, 'Hauke Hill', 'hauke.koenig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.86, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:32:23.466'),
	(93, 'Ines Schwarz', 'ines.schwarz@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.78, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(94, 'Jens Wolf', 'jens.wolf@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.81, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(95, 'Karin Fuchs', 'karin.fuchs@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.76, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(96, 'Lena Meyer', 'lena.meyer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.83, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(97, 'Marco Neumann', 'marco.neumann@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.79, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(98, 'Nadine Hartwig', 'nadine.hartwig@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.87, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(99, 'Oliver Bauer', 'oliver.bauer@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.72, 1, 0, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957'),
	(100, 'Petra Koch', 'petra.koch@example.com', '$2b$12$vN6B/84ztylEhOGB/5VICeD6UFHFwT2NOXT9wZKLKDbbU0GCXME1O', 0.84, 1, 1, NULL, NULL, 0, NULL, '2025-07-31 10:15:53.957', '2025-07-31 10:15:53.957');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
