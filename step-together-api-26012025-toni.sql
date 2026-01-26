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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenges: ~5 rows (ungefähr)
DELETE FROM `challenges`;
INSERT INTO `challenges` (`id`, `name`, `start_location`, `target_location`, `distance`, `start_date`, `end_date`, `creator_id`, `team_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(40, 'Graz-Wien', 'Keplerstraße 109, Graz, Austria', 'Wien, Austria', 180, '2026-01-06 10:58:00.000', '2026-01-31 10:58:00.000', 184, NULL, '2026-01-08 10:58:53.682', '2026-01-08 10:58:53.000', 0),
	(41, 'Graz-Salzburg', 'Graz, Austria', 'Salzburg, Austria', 300, '2026-01-14 15:43:00.000', '2026-01-26 15:43:00.000', 184, NULL, '2026-01-12 15:43:26.046', '2026-01-12 15:43:26.000', 0),
	(42, 'Another3 Nice Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 189, NULL, '2026-01-21 10:34:39.359', '2026-01-21 10:34:39.359', 0),
	(43, 'Another3 Nice Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 189, NULL, '2026-01-21 10:35:15.138', '2026-01-21 10:35:15.138', 0),
	(44, 'Another3 Nice Challenge', 'Liverpool', 'London', 300, '2025-05-01 00:00:00.000', '2025-06-01 00:00:00.000', 189, NULL, '2026-01-21 10:36:04.873', '2026-01-21 10:36:04.873', 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Daten aus Tabelle step_together_api.refresh_tokens: ~122 rows (ungefähr)
DELETE FROM `refresh_tokens`;
INSERT INTO `refresh_tokens` (`id`, `token`, `user_id`, `expires_at`, `revoked`, `created_at`) VALUES
	(1, 'CdGbTVnnrF8qyIEedKuBMTSujDc1Q9QZnN8f7T2Jr3mjTOdfkTAY5f4j8KiE-7Z_ciTzNtpXqEeNORa7apIP4w', 186, '2026-02-11 14:05:18', 0, '2026-01-12 14:05:18'),
	(2, 'PV5v42q9AfPTx7xv7Um5OGinUvHz0Urj6Hp_09E4xXtEiToxIH4sp_c69yXdC8CXfVJh1v4GTWKLZ7pWJyx3hw', 188, '2026-02-11 14:13:06', 0, '2026-01-12 14:13:06'),
	(3, 'y8fkpUIuYMwwn7dBcRIiWrzlctzQNT_uHkuHLD7z8PkAyPfjnzu33PuelcMvDbxI-jKZG8bohcTh_Web0YJBZg', 186, '2026-02-11 14:13:36', 0, '2026-01-12 14:13:36'),
	(4, 'EkuGEKeVPR9bscCFL5N6394eoo3z0PYzSDoKwOr8WvQvSyoK0NUJpOeoa52yRX8OB3kXniLGTWyC0U8fAHPxLg', 186, '2026-02-11 14:22:32', 0, '2026-01-12 14:22:32'),
	(5, 'MTCEc9HEoElU4SeCeaFcqZWdJwfhosFj8_ALU6Ujma5B1fjHLZIdrDVB5sY-idhLnyhM6auDvmG2co25S-47hA', 186, '2026-02-11 14:31:02', 0, '2026-01-12 14:31:02'),
	(6, 'uAQhPZ6VFlqx9_D6NMff_PO3cETzc9oAeuE-FWMvXsdiybnB6A4k4nP8xKETLJdhlQWiVPjK6BusWVRV4pQ5XQ', 186, '2026-02-11 14:36:06', 0, '2026-01-12 14:36:06'),
	(7, 'dZLfJFEvaQzVN83SX9X6EEvfdHrD_fO9i86RcmnNWbqgivTPUWXIwrsvxaPOqkBVy94L7vAI2JR8yRlshUlTMA', 186, '2026-02-12 07:35:40', 0, '2026-01-13 07:35:40'),
	(8, 'jkhh1IgF-NLGD9ltiMtg7sdWAM0uQYUBJhuw8H2SyzMXZOioZzL_2hZGRtWu7X75t6u2Cx1CixugeZKVx_xPDw', 185, '2026-02-12 07:37:32', 0, '2026-01-13 07:37:32'),
	(9, '20X5zAbE9kd-UZfkHOIN5Nkx5P1bMdMXnY7IUkLG14Jf3obUDfRPpP9qPZvu2lSFrpF1SWYts7UebEQl7UumlQ', 186, '2026-02-12 07:38:16', 0, '2026-01-13 07:38:16'),
	(10, 'XNwlS_NQqO8ITmQ4malO0vnVNJgfbqeEXvKM5nelKqONkCGdSPGkfqB3cN1Xn6YcXU97Gt-g2kYftD4z19HlWA', 186, '2026-02-12 07:41:20', 0, '2026-01-13 07:41:20'),
	(11, '6OOTAw_kQe7guwolpHYYxSBCPWtnRgBsHVG-7CUnTUDvDxiBKeRLtx64eZtO9KbwGQyDURyUN8HqtNpJEvODag', 186, '2026-02-12 08:06:37', 0, '2026-01-13 08:06:37'),
	(12, '_GiWzGvZbkHriOxk3ZIoyqj626KBg3Ktk0pRqBTOZP2c8_DT4SneQo6OMwxRvEOXqqaJYEkdqfNjooxhisMR8g', 186, '2026-02-12 08:06:38', 0, '2026-01-13 08:06:38'),
	(13, '7ezMT3p5S6D311NAG2XLfjXVX35JzEnvE3_xAkleLwftqmmxRrskwTSrcYAFqg2Qef_2CWBh_4SJjA3mIbDKng', 186, '2026-02-12 08:08:35', 0, '2026-01-13 08:08:35'),
	(14, 'l81-yrrPv0WSitotUeBZY4EEx8omuh_iZ5o9LIUZhuF_8h9SD70C1ZWPkNkzi-M4FKK_EKDYML8SnjB3bWtyhA', 186, '2026-02-12 08:10:02', 0, '2026-01-13 08:10:02'),
	(15, 'ybbwdJK8I-w5y-vOzjQAiDCKM976raQoiyNtOzDaFGJ7AoYxqnfKOva84Ubb6DydyCjqLasoa_g6qqvFa-uSpQ', 186, '2026-02-12 08:11:55', 0, '2026-01-13 08:11:55'),
	(16, 'CiHuX4JIPzxxI_t_RH4bTbyPh7tJtUuK6oHnnnwf59NxHbQBdmtZw6wuH8iwqb6KoEh2P5ljL4x6OBL-5L7gFQ', 186, '2026-02-12 08:21:35', 0, '2026-01-13 08:21:35'),
	(17, 'VYAc0L5h4yX2lOS9wl3n7m8yoqAuNZgXDTpKZJhODmNCJQIN41QOIp7rZNsynjhiyNAb7hf6HruyRXdkgFEXGQ', 186, '2026-02-12 08:21:39', 0, '2026-01-13 08:21:39'),
	(18, 'jS2BLhH9HME-bRZc6ADeARrtswBn7wgxfroz0JnFMxbe-czlqnlcUBdXhOGSvqssRYBdbwcI1rroJZyMXy_oXw', 186, '2026-02-12 08:21:46', 0, '2026-01-13 08:21:46'),
	(19, 'UvVqSG1w_CukPg72uI-8lPLz3UeXiq6nAM_ddzqx6F2gDn79p0dMnpUPB5fu7mDZ_z5jHIFQ1aPiERHVWr8YYg', 186, '2026-02-12 08:25:13', 0, '2026-01-13 08:25:13'),
	(20, 'nAS8XhpP2E-IYDqJrep67_EKxkaUi4_ADKzBo1zRycMIRS6ShWg9qzHYny8GSKzWKMGt_zPBVp7jJVvHfgA17A', 186, '2026-02-12 08:25:24', 0, '2026-01-13 08:25:24'),
	(21, 'KFvM-DLzimEWv8dvz1E1niMOKcXeYohxRjsYDTFFUtLXjyfu_vxk366g_D2ct736uIXf0X9WC1UCORLMCXd3sA', 186, '2026-02-12 08:34:35', 0, '2026-01-13 08:34:35'),
	(22, '7VO2xzjugnCA2m1Xnw11Fozdsod6h0wCfstqptMIxK9YBCNSbfP0KJZa8VXEgcrNb3cMU-GkWTgLsy-XqXuHiQ', 186, '2026-02-12 08:37:07', 0, '2026-01-13 08:37:07'),
	(23, 'lBPLoUi6VyxD4Kbe3aaITS9ukAEA-g2MfhkZyeFflZz5X2UXMVI0sG0QN2Bd2-oKk9FjhjJpKCiJtGKK24dd7w', 186, '2026-02-12 08:39:42', 0, '2026-01-13 08:39:42'),
	(24, 'OdW1hwFl5vcNHN8s4kCM_qZQ7YfNBA_WhCkh_tCuQvXfENcHvoDM3A7cd5r23wTxUhlhYG30Aj2vpetEFveHWg', 186, '2026-02-12 08:48:53', 0, '2026-01-13 08:48:53'),
	(25, 'SprmUfdx6wSTIywDwiGekMdMPXAWGwbHgAmO86KYSjOLTrK6QHoPN-U6-BKmDoTpOGDAR5j8sFqmiPbxJ_HjiA', 186, '2026-02-12 08:55:37', 0, '2026-01-13 08:55:37'),
	(26, 'iVNEI7X74CuWKAT0uBx7CwvaLKKeBUFEUXnxjsPbdrJkok-S5cTYrgdV7k_h4NwcKEO7DWi7AIMXuUQ-mL87SA', 186, '2026-02-12 08:55:41', 0, '2026-01-13 08:55:41'),
	(27, '9mMHEFiPOa4NabODJchnR7Bk5cwz240KBIItun_kMKtUeapIYpg_hE77UbYDl4m7pg4r58X7mhCYctykYksvsg', 186, '2026-02-12 08:55:50', 0, '2026-01-13 08:55:50'),
	(28, 'CsFPaa3_0U4nbWCGoDjpQ_7Nw1Cz-zevBcFJcdf_UvGeXZ0Kyk82yCbmIHjw2q27_ofrp-9AhIhcpO3PaLV37g', 186, '2026-02-12 08:55:54', 0, '2026-01-13 08:55:54'),
	(29, '8GZR1DI9JYIGxos1t4Wx9X1sXXNvAVeLE3AsVUGP5ieJtQV3BlFESA3z4do-PgvT9CJIbr_y2lLMucGwpiv9SA', 186, '2026-02-12 08:57:13', 0, '2026-01-13 08:57:13'),
	(30, 'uGdIMQk99eM7D5m0eYAmeGtvOf_tiYHF9iQnX-eCmMQoWL_1ONLqhY4QkhIFvseiI7uaSA5xQGOFsfEL6I6TDQ', 186, '2026-02-12 08:57:17', 0, '2026-01-13 08:57:17'),
	(31, 'olfovFGXEiveiUpsxg0N2TeeuHKKJEyK0fw5aYMZ8fnlPSvJ5t_eCRnrQKBha-Ejsfd0zAhRRXDdNAi2mMgBDQ', 186, '2026-02-12 08:57:21', 0, '2026-01-13 08:57:21'),
	(32, 'eI90dSab7O8O-DKJHqwJ1ECM1Cyi3kKfMLDrTYi8GXV06cEzWersZDm4-FZHH7CC0nG7rWYuW1KsS6Opec3Q9Q', 186, '2026-02-12 08:57:25', 0, '2026-01-13 08:57:25'),
	(33, 'g5D6jGHzLZ2i3S9cAq8eIrHGjvF7bv6SHQTz0BgANF8r1D7zKk8qR1kcvxH9HMn5_OaWVKGuEY-aj5YElft0aA', 186, '2026-02-12 08:57:35', 0, '2026-01-13 08:57:35'),
	(34, 'ZV40VlE7u6dqWzqAtIBPfJEdVvI0s8XLxrf3QFjXVGVunmsazxOUmyLUlNwQkpYbbc3FX7XJKaks0bz_kOsNgA', 186, '2026-02-12 08:57:42', 0, '2026-01-13 08:57:42'),
	(35, 'O4lQD0-gZkkXB4lF_ZBAr0NER3LRlZ9nJObyhiXvLDdM5VT_KrihNJyoBF1_w3hkj6SGeMG_6zugy6d4_PeKSQ', 186, '2026-02-12 09:05:50', 0, '2026-01-13 09:05:50'),
	(36, 'b-pzZIf1J6LMljLmx4F06kIxTOMYxUjObrnD_vX0MX-sJyUmMWLeDl6SDwBX07gYQJCKxcqQIj60oS93W8dgkg', 186, '2026-02-12 09:06:34', 0, '2026-01-13 09:06:34'),
	(37, 'q8Rl7pwZfWHLq8C2E0RnXBBVz0hZZDrCVQNOLAy6uAZzAVTexW38XV3kHi-3oNfhjxvNkAnLTseur-t_xCmulA', 186, '2026-02-12 09:08:35', 0, '2026-01-13 09:08:35'),
	(38, 'AmqS7-RBaUKTxYq_F6_PgfzcDCb3W-1brnzpH-BeBF_Og4ssqxhzuuaoOngjrzr0ZGsdiCOTXbMHmwiAT2YQAQ', 186, '2026-02-12 09:08:40', 0, '2026-01-13 09:08:40'),
	(39, 'Ggsascxe6oyPkD7dRQsrY3AG_3_l0grnGqdTHNE02WvgDTq-ziRPwqQz4Zic9yyKKjI17Czs3idUaJbHK2HW9Q', 186, '2026-02-12 09:09:40', 0, '2026-01-13 09:09:40'),
	(40, 'G02HA5E3OB6EWV_VKMqageyppkB3-Ez-7iQcYUsKX6M5unZuGyx2UaKgQRX2Mezg-vlwzJ04u6xMvGgjqVc24A', 186, '2026-02-12 09:17:07', 0, '2026-01-13 09:17:07'),
	(41, 'kBfmGGVhXICtn7dBbwvYAmR8awlQYIIG4PhQkMKr6Xt9GG-kFKgZPAg7nCfOtUP6OUozwwFH2Q2_jSPqJBNCiA', 186, '2026-02-12 09:28:42', 0, '2026-01-13 09:28:42'),
	(42, '05ztexUDfHHiyTblrz3yCfvRpjxLON1qqwhf2BxuI4liKHqx8XD8UmwYIV6CYb_KvSUy12BRrS4TZ4uaA5GVPg', 186, '2026-02-12 09:31:55', 0, '2026-01-13 09:31:55'),
	(43, 'Z-yYAdAN3bgcXbCJjSnDMTV5GhgddSLNK9Oy781SEyA6YnDLCXITDNw8Hd3LbM8z6JC1DwrLyBZMZxDnl8FtVw', 186, '2026-02-12 09:33:18', 0, '2026-01-13 09:33:18'),
	(44, 'K-9MIKNPuCaOAKsuXN2-tNdVjyUYw5bM7o9AZvGq4Vxb1Bcqe0EWfJPYfXM2RcJ6IusC2GWM82h8_A2yG7kDKQ', 186, '2026-02-12 09:33:53', 0, '2026-01-13 09:33:53'),
	(45, 'rc0TjpjfT8oGyPorqFPZ2hNIzbugNObgUerWac-x1xeNIivXxjd2_6S56cFGvxektTXe06glGBnOFtbCsgYgrg', 186, '2026-02-12 09:46:33', 0, '2026-01-13 09:46:33'),
	(46, 'TE-rQI3CWLMpCPH90-SgiV92UAad-XJCFXT1nSzqN4tQ2NoD3WsMnivputlmWa1eN6UDRwiLkjqyGfHRr97qUA', 186, '2026-02-12 09:50:07', 0, '2026-01-13 09:50:07'),
	(47, 'lRS7qY1bn9_mugo0rruzbDZxJ0TXViblyLLOS9qdGhmk1oJk-jLemv06ph4UAMwho8oNJ1TM2YUo32cz6PRTlQ', 186, '2026-02-12 10:01:43', 0, '2026-01-13 10:01:43'),
	(48, 'I5xlvOWUhxlAsbCZhrJGJreeOZUCqsH_Wu4vy2hsYO0y6ClHWMD4bHp0TpR1OzlYmxO874U4xXJ8TtFW977mIg', 186, '2026-02-12 10:31:00', 0, '2026-01-13 10:31:00'),
	(49, 'TAVknyoY-BdDNAynCNTG3fKnJ-4nIs-pBPd8hAGmXpGJIdKws6F_8LpI4FrqWCnwFMqvq7_BwZkGJnDxNwYqUA', 186, '2026-02-12 10:31:06', 0, '2026-01-13 10:31:06'),
	(50, 'UdkgDi3G1imSKvjkxK9cQNCL8DJTrVRMfa8A2SsQbS2briPEd8i0KWQifFAPmEFnqvY0lRHc9-pDhiSKwqGV1A', 186, '2026-02-12 10:36:23', 0, '2026-01-13 10:36:23'),
	(51, 'sHjMOIUaJXbA0WdYy_1KlZ01qD3hAgPrq_D97fKoTdoztv-w3nbgGdfMd9KIF3xzNKzmnUEFFwUBsQeOy_gzUg', 186, '2026-02-12 10:37:05', 0, '2026-01-13 10:37:05'),
	(52, 'vCx15uaH7I6hC2wXrZTL4K64DDnfqPCTTaFhneRFwFdVeU15DFPrqUSDN2CBsKEfVzTH84uBdLwTkw563c-STg', 186, '2026-02-12 12:38:28', 0, '2026-01-13 12:38:28'),
	(53, 'kPBhZXlPBegkzqZVqmzsNqGxjvu_gdpVs16_cQEdVrcUSdNN_rj7L6ngw2ccPyjXpsW03tJ8y1MkzTu_9PHm4A', 186, '2026-02-12 13:06:34', 0, '2026-01-13 13:06:34'),
	(54, 'QC1r3JFJELS8KiRvapWYfoCemVcUXKl_OCjE2RyaOxgxNJTHRNGRwic4FhUMOcqItiVs09rL7CIOj6GBj0KxZA', 186, '2026-02-13 13:09:48', 0, '2026-01-14 13:09:48'),
	(55, '1SvBb2umuH-6tWyoxk5uLD723QJTnNss7YqHU7b76M4lB4eRHCr4yhls9NhQfpYFKOCBCtrBZ3UUTZwK6cKWoQ', 186, '2026-02-13 13:13:19', 0, '2026-01-14 13:13:19'),
	(56, 'JKZtkiWry1HYXMCe9kgmApCLrdusRX1B8jc6fqasU0GAbI66RT5dcl9D_sTdK0CFEk3XWJQ1BjXHOLGverF5ZQ', 186, '2026-02-13 13:14:56', 0, '2026-01-14 13:14:56'),
	(57, 'cdzRPbw2ADv2UddG3fR__EsBlNFoU51u-QK5oT5CbxLfKy6bS0XhdWDZQulxzIHOJBvk2NEGzRzDMZkQqeJC9w', 186, '2026-02-13 13:20:55', 0, '2026-01-14 13:20:55'),
	(58, 'ZEvUK3qRaGNeg50A5QKfrC8mYKUOBw4vCNlNlhNPY9VYLDS6QVE-k86BRUTU-wbxYPcbHba-zwPnsWF43wSH2w', 186, '2026-02-14 09:53:00', 0, '2026-01-15 09:53:00'),
	(59, 'K8MbnRpaC5-6vRn9QvA3uRNZcagqtct3hibrx7IJJBWhtKJCN1mTTuBcfhDU2PRIjw1z8fWwMtFLVXUSyI-jOw', 186, '2026-02-14 10:11:41', 0, '2026-01-15 10:11:41'),
	(60, 'MhJEg3X7WDtJ00kN2I6-ItShtHRNNQkMJ7_v5vwH97iofWtPc3kA0H0u_XZagNTtgpedx7egTnKcXRTcJEsN5w', 186, '2026-02-18 08:37:20', 0, '2026-01-19 08:37:20'),
	(61, 'S3G_mCR1kvhcBa648R2UvTy5Fsmxlq0a_uZmrN5U42DzlvLxFnVwr1PPeRUrIKJ-lT3CXle2B8ViVOS4diwkUg', 186, '2026-02-18 08:37:54', 0, '2026-01-19 08:37:54'),
	(62, 'j-Rw-1mVDoWyZ4ghsq0NtDR6uD8fKzMnb4DXlVWQsk_fztZQXNwhJgDOrjGwm-4V63t9RE9gtfnqFCgYLOCOGw', 185, '2026-02-18 09:21:15', 0, '2026-01-19 09:21:15'),
	(63, 'nQdZOSHsVAUSc2DXLxr5cfZ-8cyxjaec3X5WG1A8RGN3_extorB7goOANVH9PvJMWFwUqdwYMeoxKpIQwuhDJQ', 185, '2026-02-18 09:30:52', 0, '2026-01-19 09:30:52'),
	(64, 'A91wDUo7Epqvm3pLAytetB6mg5lRBYvU51rqqx8xVYiItF-xCtEEjva-wZsp8RRPwhRXyph6ruxqSenj68ai3Q', 185, '2026-02-18 09:31:58', 0, '2026-01-19 09:31:58'),
	(65, 'gY1AHJ5QnddPEWRQZ7rzPq29TEPZGLSzW9nqWzRgBxD8aRQW84Iv0HqO3csjmgO6iY6GsjICK_7mDRGwJ_kshQ', 185, '2026-02-18 10:07:37', 0, '2026-01-19 10:07:37'),
	(66, 'sI6aWYBi0NGtaWSbYV7JJ_mEModaWDYT1Oa8-VKCHxd4qm2zRmOzG6DJWDNai2ctWkWQ7qLQXYdVVDVgArIRlA', 189, '2026-02-20 09:59:22', 0, '2026-01-21 09:59:22'),
	(67, 'C--dw0qQymUgTiCb7F9T3Xx3qMRNqdtX1QgPrkLWi2WM0TN7MCqjK7q5IkkYAjZ8SEwqm46zRCNyuQMgj_kC5w', 192, '2026-02-20 10:19:16', 0, '2026-01-21 10:19:16'),
	(68, 'xVM38c0lFRjBCVD9EE7b-J4VdRDZ7mSXGQpZayoN5pdTkUIvZYZoOCZnAsLiiUMoyhz-C5vJ-UFwOdyqpcP1OA', 189, '2026-02-20 10:34:27', 0, '2026-01-21 10:34:27'),
	(69, 'wMa0NuOArKrrKsCIsLKL8BJp34sxQWez_hLWAdmV0WBd7yBCiGVwLKZcSa8t5STqUFjXk6EEr5JrXHsfueNY4w', 189, '2026-02-20 10:34:29', 0, '2026-01-21 10:34:29'),
	(70, 'RhPz7Am1-eUGnSj18GEnRslueXg0tOhUD9fYFU35cKkquP8XvKIXKGcz7mkzBU7Lxf6RgrDOvMIaCbpYyEn-XA', 189, '2026-02-20 12:17:55', 0, '2026-01-21 12:17:55'),
	(71, 'N3H-u686G_b5cYfafwBns-PMfzNJjjX0c3Lge9wzFqW90Cq83kYLwzkH8JdFsfsXhrCJfv6Cs3PUQ3JLgeHFNQ', 192, '2026-02-20 12:41:34', 0, '2026-01-21 12:41:34'),
	(72, 'PFNLM2TS3KoltGi7FgNWL4eF0ke81vWMtoF5QxlsxNVoHOQ2Z2Uam1BwTyKORgS9ZYvuo1LtaIKI-DJutvVTrg', 189, '2026-02-20 13:29:25', 0, '2026-01-21 13:29:25'),
	(73, 'BiBX7WKjqxkl5SzBgM0qzl0MHqRgEiHZw_0EE6bNh4ffunGtJMEGJrcyCKrwHQT6a3VbrCZC8DBKH0F550Hq3Q', 189, '2026-02-20 13:38:51', 0, '2026-01-21 13:38:51'),
	(74, 's2hf6_GNL7N0P7BzHTuDe2lqHBrmMvURaEQi7a45pwmjWPCcu1wLAztUMp1-UrneM2MxYwRol3ykUj8RZ_drdQ', 189, '2026-02-21 10:02:27', 0, '2026-01-22 10:02:27'),
	(75, 'JEe7Na2TqAw6RaGLat2LQw9ZJi4LPn9dtrgtG-qO5IuPVXspf4nIoze3j5D9OAp4kr8u8TsnLayifnpUVqUO0A', 192, '2026-02-21 10:21:02', 0, '2026-01-22 10:21:02'),
	(76, 'JS3KU03dNDE9oiO0XzkpOKTXtLJTw_g9oQ4rYmxNdWJSpmXceiI-AdWcj2zjA-CpUTJnMj2Pro6vAW1MvbS_gA', 192, '2026-02-21 10:37:47', 0, '2026-01-22 10:37:47'),
	(77, 'w9s-DHEKbwoKn4cI3TUMRBGs7-j_QT7H5U68sBvR-VAsgRk-DieVx2oP9r0i3DzyBFS5GGxhCpZFan1XkBJdVw', 192, '2026-02-21 10:46:15', 0, '2026-01-22 10:46:15'),
	(78, 'iezaBm9_oUsyyqzgLj26IMY02V18NiM7X2WACGFRJ8cJS4h1IByIcDsUQ-7BErtENWMVhNKDmaGxCEIwIbF1nA', 192, '2026-02-21 10:46:20', 0, '2026-01-22 10:46:20'),
	(79, 'gORqR73Hh2pBYJXGs5FbH9JblXnCouW7wOQRB0N2YXhCacGMVtQQsNualgNaiRDW0oPFCvC-NnxHHwV5tQT-xQ', 192, '2026-02-21 10:47:13', 0, '2026-01-22 10:47:13'),
	(80, 'zXF0tl9YZxrXl2rjCMavqP7qWZA3vToScKRDssBcBR4vXWOjdIxwF2hsVmp8lJWdNEfGA9KSC5514ENd7yS2cg', 192, '2026-02-21 10:47:15', 0, '2026-01-22 10:47:15'),
	(81, 'I4JJl_SgBwUPfs7Xh8m-k1U4uRDjphnvBPcldFbYKcf3ulW8BsjGjfJpmrQLtYWEoJYAMrpSEmJ8JoRBaG0B6A', 192, '2026-02-21 10:48:01', 0, '2026-01-22 10:48:01'),
	(82, 'g7FtqV2RNGhBYewJokdwZQq-QFpXwvnD5dh1Mgo_1NtB8N2B7XU4rOutRb1GNyLisks5-BqfPcL8ievalE1KxA', 192, '2026-02-21 11:36:12', 0, '2026-01-22 11:36:12'),
	(83, 'kPaCVwBB3A-m6m-szT_31UhAdEmbspksUz0UT9wcPdQ9ThN2s4jXVDfSUZa_8rWWwbaX1ItNLybaQyvunQmowg', 192, '2026-02-21 11:37:00', 0, '2026-01-22 11:37:00'),
	(84, '7vsH1bv2P4TpunIve7qB8sKHrr0FrEgogzKo4s3mGGhgD6HvPixlTMy5WQUqsFmj2pWjZ5z5I5J09PcjNJ5cag', 192, '2026-02-21 11:37:03', 0, '2026-01-22 11:37:03'),
	(85, 'EKXx_Gat_4sCVcMtDQFgPO4HOzIG0FHRrhKWu-xJEl1T-lMpuOpkbPrSRm_RAEaLY2bdMLSEh1A3BDF8Tv_9YA', 192, '2026-02-21 11:37:07', 0, '2026-01-22 11:37:07'),
	(86, 'sbTs22mzzRvc3jOwvM7aRWbHKVe7j8gALM9p8QVYcWQTEyfPzepMHzx5Odop7gmy0wBWIzAZNbsYCcTLaghzOw', 192, '2026-02-21 11:38:01', 0, '2026-01-22 11:38:01'),
	(87, 'XRjqUZn_emUnxsDmgQ4-s8RWbXcPCw-1VRp1dBtR5iReekkyy3bOjSj9vwJuoR8xBF8UaeeHe4-CrYtW2wYO6w', 192, '2026-02-21 11:38:03', 0, '2026-01-22 11:38:03'),
	(88, '5zqJmGgBo1DItqrDfy4S72TRPVSl6y4-queyPVfICmkr0vcdlz7vBJOU6SnkFToN6A7GuIHUPldqk4GU8mzJnA', 192, '2026-02-21 11:38:05', 0, '2026-01-22 11:38:05'),
	(89, 'h_6A0p84lkWSQrZgnxCy2MQtR8FR4IvXbxyx4v1I0wet_fuuSZZpIobZDil-FXlQ9ZgSFm1VBOLivkmBY6GTig', 192, '2026-02-21 11:38:07', 0, '2026-01-22 11:38:07'),
	(90, '73iiCHo2EwUk9ohuVZG6CckNnPpYTDSut1dHdDKdLLlcr8JY_IlhHVAJeSR4GUZY2jLRSAA70FYx9G0HgOuRiA', 192, '2026-02-21 11:55:30', 0, '2026-01-22 11:55:30'),
	(91, 'RZ3k5QP5tmCD8D_WqjEWznLMRW9wDY6ZQDtCOTENxlYh9haDMMLVLCPridIE4G86kiLfEBvHDh1xMoBA1UdBkg', 186, '2026-02-21 11:55:45', 0, '2026-01-22 11:55:45'),
	(92, 'FjPCwMAx5p-b-fJmF6lpWUYKoJ-CDm5qmg7LYhonGbT134bMBQHpMuDrT4I_PbCYOtqcHAMdjk4G8qv47VDKHA', 192, '2026-02-21 11:56:08', 0, '2026-01-22 11:56:08'),
	(93, 'FyKCxrEA3Xn2iRihRHQw5sOZpe3xGhaxAWBAIMCedtHUb3bPXCbRE2ZJoe_HBStruAIBihxblPSlnOkLWVlhbw', 192, '2026-02-21 12:37:57', 0, '2026-01-22 12:37:57'),
	(94, 'CQLwKoXeHAb7y8xWQniUEfOAfDlqfxHZmUjhf-AYOt0zzqqsO5SKmbotfkD8i7L3RNbOVv4TaNIYH6_H1biMQA', 186, '2026-02-21 12:38:06', 0, '2026-01-22 12:38:06'),
	(95, 'K8JZqkpjg7LdmweYGo7vmwzmdHHsHqnK4lJ_MrYhC9TrqxE1xVWy5H2qfWyt5A96SG5M2nkfGaIsv69q_v89Kw', 192, '2026-02-21 12:41:29', 0, '2026-01-22 12:41:29'),
	(96, '3s8o2wIkyLEk4OoGpY63PUQP4-zIzqqgto6bRdGTP0IYEfD4t2Q1NPm_NNx4RKqovjjFS_A8bsNCyojiF_wcfg', 192, '2026-02-21 12:42:49', 0, '2026-01-22 12:42:49'),
	(97, 'SybVC3fSS-9uGzpKmv1beqAOhlQy5upbCFibpBu7GiLlK37hxv05g2OEuyFcZRv2k5BYh8Xb7lYGBDcsjTxxOg', 186, '2026-02-21 13:08:41', 0, '2026-01-22 13:08:41'),
	(98, 'x5qUizl71gUJHZpuItjiRW9OfgFwsJ3OpyrtNkxFZ8roFZRN8NGLQW6QC3PXYUt9-S23F8CKtGMtMv-J8KUiUQ', 192, '2026-02-21 13:11:59', 0, '2026-01-22 13:11:59'),
	(99, 'ZDhjpX-qSRRomdQ9_ErkolPcAq7OuHyN0Qa3gzBp3N0NI8YFoY41EcxJ29TA0dwsCQMpEbV0gpfHqBOaq0H3HQ', 186, '2026-02-21 13:12:08', 0, '2026-01-22 13:12:08'),
	(100, 'BYonQd50NdMTh4BbepwqIX2sX7FZzKRP9ZekUWytD1zXWGqKjMsrytrTGJGQz88W7gMbK1xTgqHGRyuloCFJiA', 192, '2026-02-21 13:13:56', 0, '2026-01-22 13:13:56'),
	(101, 'FEc1E-SWiEFVjINPpOSRL2OPqWP-toRjwKDIdP_FYaENX60QxOjzfL9pAXJfYQG-IKHNnYo2jWNNqjTthmQVow', 186, '2026-02-21 13:14:03', 0, '2026-01-22 13:14:03'),
	(102, 'LNzg9CpTcHshpAVBc-WII0UAQX5cBYND2wsjEcXc0y9KaWgZG2L2jm9xEnGuB0rVzSzWtXBcU7OkpHCQOGj0Iw', 192, '2026-02-21 13:14:47', 0, '2026-01-22 13:14:47'),
	(103, 'U3zFS5LnEuGNNO8GQ3XzDHyJ9JjDnNy9YQGuX3dR3V-KX21fgG_AT_1pStpiQjH47cLbfkktAikt2WXwudZ8Lw', 192, '2026-02-21 13:14:49', 0, '2026-01-22 13:14:49'),
	(104, 'Q8aPgVmsV74aebsYJyhJyAo1VRtbfstqSDYkESkk2sMPAiKU3OQ3hihjdRT6hYjNhM0UTvOEzMQlB9bTlLvHuw', 192, '2026-02-21 13:14:51', 0, '2026-01-22 13:14:51'),
	(105, 'CbTKsyCIorJ8q1UVtIsE4uHUqKIfQcYcZ0jFKp8luiKhUA9heqO8r0XPB5f2Q9K9YSkp1k6aPsvvVPj6O4EagA', 192, '2026-02-21 13:40:08', 0, '2026-01-22 13:40:08'),
	(106, '-3pyFs67hfu_EO055hoavgGvNgU905JODuNzf1xkcC3QjrFRknfcQCSHw6FcMhmPjMct4meIqxNgCV2ldxv-3A', 192, '2026-02-21 13:40:19', 0, '2026-01-22 13:40:19'),
	(107, 'edxeLSRLwYut3KexXrU2bafSSnq3iUuXEpqT2ZX_Ua15NdYiwMXhI4IGKDtJW2MjEJzzYhYSEsgENpnnWGwUig', 186, '2026-02-21 13:40:29', 0, '2026-01-22 13:40:29'),
	(108, 'IQ_Y6kRw_N-qxtThKXL8n7OgkJUzs9l3uP0-4KhjsDNS2v6eXVcsQcuG2sr81UryJfGUFCl1V8TpgEquLQ27Nw', 186, '2026-02-21 13:46:37', 0, '2026-01-22 13:46:37'),
	(109, 'sMvWvaQysmLNMZZWZzkvq7NvrhYo8L9dYcdWW3xaedWj8zsL2_onMHYZNj2sKx25SOnpmopeu54d6fewqreIlA', 192, '2026-02-21 13:47:55', 0, '2026-01-22 13:47:55'),
	(110, 'T8OkBpidZfu0-nzDtlin-wDbq9jRbWjBe_1ymwCqZEkbCqS3aJL-ZevSHXYfblxidaKaGV6Oay6wC__4LKJ9Aw', 186, '2026-02-21 13:48:03', 0, '2026-01-22 13:48:03'),
	(111, 'I86nv9VRDTAuCboFbHfp6uZBQx3SLEGaC2Kq4kgDbQPFMhJmZZ1lFNepDxZZf8qu75If9dZ-tP7IVfik_Osorg', 192, '2026-02-21 14:02:14', 0, '2026-01-22 14:02:14'),
	(112, '5m45UBH7CVdxswNvgUsCfnf0ZYzEb7oFOd8l_dCa53X7VIFIbvCXfLnUAk-0KC3n96N3cIwSLkUL13lwGpQKVw', 192, '2026-02-21 14:25:57', 0, '2026-01-22 14:25:57'),
	(113, 'CFCmuC1sPz8zw5mdUw_60RANrwCO1ZQkec5X46jdBpm0GzaXcZfDU-fJwD7nl2G0qwZos10GomQ68jkHIKRtHA', 186, '2026-02-21 14:26:44', 0, '2026-01-22 14:26:44'),
	(114, 's-xG75M1GdTw5fDDlJNgqh-q8nf8iN5EsMqYnD8QXUDqSBa4hx8Ao7e9tAIuiAGM8kxuXvXVWHGNttwdqWx5uw', 192, '2026-02-21 14:26:57', 0, '2026-01-22 14:26:57'),
	(115, 'HZplTP14AS6pnW0hGcoEIjah5bUrK50CR48fu9g-IzACVkn7iJOkFLSMwM3UVpabZzPE1HlYPRKKpseVCs8cyA', 192, '2026-02-21 14:27:08', 0, '2026-01-22 14:27:08'),
	(116, 'yzn21XckQ0n-4HWit7oQZfN-mQNaKFTEQ7sUjs0wSSfoOZHmkyr8rlxwxyi8Svh5twxWpRC8ExX1NIodpbqIWw', 192, '2026-02-21 14:27:13', 0, '2026-01-22 14:27:13'),
	(117, '22He9FYZj8kgyOsl6RMAmToSWg_2mpnUB0ld7u5gkUSKczOMhkqNBiNpcCZFfuHiH8IQLIiCKc0HHhTCYC7PPg', 192, '2026-02-21 14:46:38', 0, '2026-01-22 14:46:38'),
	(118, 'FJdBCAjm5k497Xl2ssR6Ks7QrrOZNesHvn4ciw4geopWc5NV_kbFDNJ0SB_ltAkPwWKyaRukTmdn9EiNP04NzA', 192, '2026-02-21 14:46:59', 0, '2026-01-22 14:46:59'),
	(119, 'HLYWHFaeCKZZImp5zSj3O2g4pSP-qURutpEe1XfBzO7PKv3ywnXiaq18a9LrS-KlNbAN1jUlfMuuUoQ_MkgbYQ', 184, '2026-02-25 12:39:02', 0, '2026-01-26 12:39:02'),
	(120, 'tFuV1WR687pI4sv9G26imDRliTN7P9a-7y9Egs_d3-JU54mOUx6fW7N1RFiMxi3th_J25ZUSPcgIIbMlHZoHDQ', 189, '2026-02-25 12:40:13', 0, '2026-01-26 12:40:13'),
	(121, 'IHk1jfHSbxYiZM6KjaaQu1Ad_9-n9Npr7TUl8mDuWySJtbSkOev2Gz2rMe03j7jJtK_bUbvbwGQ6_nfGVYzo5Q', 189, '2026-02-25 12:41:45', 0, '2026-01-26 12:41:45'),
	(122, 'fvDURDzpDkjx8jaPeCBCbkdQpLS5cXt6MzbAemVxtKy8ptTWydYBeXhNDUub_7BIxfIL9Q46LKOkfMLhQL3G7Q', 189, '2026-02-25 13:02:56', 0, '2026-01-26 13:02:56');

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
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.step_logs: ~30 rows (ungefähr)
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
	(119, 186, 40, 31, '2026-01-12 00:00:00.000', 36, 0),
	(120, 186, 40, 31, '2026-01-13 00:00:00.000', 1999, 0),
	(121, 189, 40, 32, '2026-01-14 00:00:00.000', 1000, 0),
	(122, 186, 40, 31, '2026-01-19 00:00:00.000', 560, 0),
	(123, 189, 40, 32, '2026-01-21 10:59:21.033', 6000, 0),
	(124, 189, 40, 32, '2026-01-21 11:00:40.276', 300, 0),
	(125, 189, 40, 32, '2026-01-20 00:00:00.000', 3000, 0),
	(126, 189, 40, 32, '2026-01-19 00:00:00.000', 6000, 0),
	(127, 189, 40, 32, '2026-01-20 00:00:00.000', 3000, 0),
	(128, 189, 40, 32, '2026-01-21 13:17:56.398', 2000, 0),
	(129, 192, 40, 33, '2026-01-22 11:47:12.778', 2000, 0),
	(130, 192, 40, 33, '2026-01-22 11:47:58.457', 2000, 0),
	(131, 192, 40, 33, '2026-01-22 11:49:19.483', 2000, 0),
	(132, 192, 40, 33, '2026-01-22 12:36:09.870', 3000, 0),
	(133, 192, 40, 33, '2026-01-22 12:36:21.214', 3000, 0),
	(134, 186, 40, 31, '2026-01-22 12:47:28.459', 1000, 0),
	(135, 192, 40, 33, '2026-01-22 14:40:06.788', 12, 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Exportiere Struktur von Tabelle step_together_api.tickets
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Daten aus Tabelle step_together_api.tickets: ~0 rows (ungefähr)
DELETE FROM `tickets`;

-- Exportiere Struktur von Tabelle step_together_api.ticket_messages
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Daten aus Tabelle step_together_api.ticket_messages: ~0 rows (ungefähr)
DELETE FROM `ticket_messages`;

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
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.users: ~9 rows (ungefähr)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `step_length`, `is_active`, `is_verified`, `verification_token`, `password_reset_token`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`, `is_deleted`, `role`, `public_profile`, `avatar_url`) VALUES
	(184, 'Admin', 'admin@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 10:56:29.720', '2026-01-08 10:56:29.720', 0, 'admin', 1, NULL),
	(185, 'Uwe Binder', 'uwe@bfi.at', '$2b$12$1CIjuJRYyQ0HQMfU9nPvMeRAvMNCJNICD8RG7OLqs7tR4s0UwI9Q6', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:08:43.266', '2026-01-19 10:07:37.237', 0, 'user', 1, NULL),
	(186, 'Betuel Celik', 'bet@bfi.at', '$2y$10$u/0BpZcZl/jYmJkg.fJYeubPIrW4b.8.oWA9aYRxWga4dhjPrQMHW', 0.85, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:09:22.864', '2026-01-13 09:17:45.245', 0, 'user', 1, NULL),
	(187, 'Artem Panasiuk', 'artem@bfi.at', '$2y$10$oCHKKEMhVURa9yhItN81gOWqp/9uRM391djp9EecE8PTbxZX0ad2m', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:09:49.938', '2026-01-08 11:09:49.938', 0, 'user', 1, NULL),
	(188, 'Lana Durlacher', 'lana@bfi.at', '$2y$10$uSejBQl5boJJCF2sIPXCSOgl84Fr5KrhqPUYNGB9L6tjk3wnZdYu6', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:10:08.922', '2026-01-08 10:35:14.229', 0, 'user', 1, NULL),
	(189, 'Jeton Arifi', 'jeton@bfi.at', '$2y$10$zNs2iRXrLD/I1ofwH7J3iuXCYtBslPFKbd5XIk5ddeESjyElraVQK', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:11:36.361', '2026-01-26 12:43:04.806', 0, 'user', 1, '/media/profile_pictures/user_189/profile_098064d8896b4cb79796dba82e6e71b8.jpg'),
	(190, 'Hava Tasueva', 'hava@bfi.at', '$2y$10$ewmLL9WtRTthNoPnbeRL7OhQn23GMwrmHg66qjylmSOMGkVBsmv7K', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-11 12:37:11.200', '2026-01-12 10:55:53.729', 0, 'user', 1, NULL),
	(191, 'Sara Kutschi', 'sara@bfi.at', '$2y$10$D17PauHxgzNN06ZAG33GrO1KVBLqGFJt7Z92o5Z2SR5hb3dgSKo/2', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-12 10:22:06.547', '2026-01-12 10:22:06.547', 0, 'user', 1, NULL),
	(192, 'Goca Andelkovic', 'goca@bfi.at', '$2y$10$KvJJ0KqYUmvUrWzK7HZvU.XmMRzFdrGZv6AZoKpFhfw6Lo5BDhENa', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-12 10:24:13.390', '2026-01-12 10:24:13.390', 0, 'user', 1, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
