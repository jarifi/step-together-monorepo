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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.challenges: ~1 rows (ungefähr)
DELETE FROM `challenges`;
INSERT INTO `challenges` (`id`, `name`, `start_location`, `target_location`, `distance`, `start_date`, `end_date`, `creator_id`, `team_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(40, 'Graz-Wien', 'Graz', 'Wein', 180, '2026-01-06 10:58:00.000', '2026-01-31 10:58:00.000', 184, NULL, '2026-01-08 10:58:53.682', '2026-01-08 10:58:53.000', 0);

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

-- Exportiere Daten aus Tabelle step_together_api.challenge_team: ~2 rows (ungefähr)
DELETE FROM `challenge_team`;
INSERT INTO `challenge_team` (`challenge_id`, `team_id`, `created_at`, `is_deleted`) VALUES
	(40, 31, '2026-01-08 10:15:18', 0),
	(40, 32, '2026-01-08 10:34:58', 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportiere Daten aus Tabelle step_together_api.refresh_tokens: ~138 rows (ungefähr)
DELETE FROM `refresh_tokens`;
INSERT INTO `refresh_tokens` (`id`, `token`, `user_id`, `expires_at`, `revoked`, `created_at`) VALUES
	(1, 'YmiuXdtXPNdyg_52fO3iu58RVc4FuneMPAng1VuxHL5VasUo-oB_oYXWGx2HLEoBL3HHW28YXPM10eWT0h_kRA', 185, '2026-02-07 10:09:16', 0, '2026-01-08 10:09:16'),
	(2, 'tEUKmsSf1VOn0ATZVtlQaN8FEAVG5jssr_4SZIT9SHnpi54CgYXylK8_rH3F3YQfvFUJYi1xiXCja2nGRsDQ_A', 186, '2026-02-07 10:10:01', 0, '2026-01-08 10:10:01'),
	(3, 'elUS1ks350UJpRkEl0AHWyQgZRZf7y_ohrk0vsIbWMJz8iDynrSm9nFnWeu7eTYdqkfLVXgTHOCWOsR7puqcjA', 185, '2026-02-07 10:11:06', 0, '2026-01-08 10:11:06'),
	(4, 'V9KL7V2O5uA44rdLVxnJ8mO7Qc_r-hQcDu3EkNf7QNoVjI2T8-IOE1iHYo57PnOkzLenQ9rZab9LUlPEnUUv_g', 189, '2026-02-07 10:11:47', 0, '2026-01-08 10:11:47'),
	(5, '0kjhT30QN_bBn8M935lu7FGQQJ0c_pjhFg-NHClyAsbKJXFuyKp66aht-pidq3PJwYyNV_psq5z3fOc4_pSyDg', 185, '2026-02-07 10:15:45', 0, '2026-01-08 10:15:45'),
	(6, 'cHAtpToA-eoj3nUSJtBcVZSogwbJ6mEepEc64ogvEdMtv0nJn1FIO8m3c9NddTzMtEdWKd10-6oS8flrI3caMg', 187, '2026-02-07 10:15:52', 0, '2026-01-08 10:15:52'),
	(7, 'BkWp7rmBAyAXX5vwh9SNqWOMAVLbVZlVWcP2GB8XCezCPuQ0Qk957_DkNxnD9h-HrXFNIgbUuRWxboR0bFukeg', 186, '2026-02-07 10:16:05', 0, '2026-01-08 10:16:05'),
	(8, 'bpyL2q4l6JzprYIqSwUPNT4dWzntT4YWaDQX0-bhMVwCLbF_VqJbMWNoUOu3za_UPaHtqeffxLEFvexdXtN1xw', 185, '2026-02-07 10:18:39', 0, '2026-01-08 10:18:39'),
	(9, 'VHCPcF0NTtrTE_B44qYLQqeMofB3Cn2wC7pc7jclRnZu58t11lg0XP2ltIKQ6OmF86pxoJKYzejnAcVAWoDTvQ', 185, '2026-02-07 10:21:04', 0, '2026-01-08 10:21:04'),
	(10, '33r82HhaIkdHbcNUeZbT5pypO3jsxfj77WFHwbh5ygMByS4obISDGVsyPStj38ZjG-6vAfvEgM3iMS2szezlaw', 185, '2026-02-07 10:34:55', 0, '2026-01-08 10:34:55'),
	(11, 'SIeCw0Np92gevIg8TeFWVJ_zSi5AuyGUqFIq8JrjaI5HveLxf3_4CFNi6Zv9Ypz7qF-tj0k71BgGUXPWcnWYBQ', 186, '2026-02-07 10:35:11', 0, '2026-01-08 10:35:11'),
	(12, '50xcpL3CDLYG3cknz1_FXJnyWevRGJSoL_4U13q60X-PEmRr2N6PlVbUz-ReLZbmAC-ND9jIA8aByh1rhD5MUQ', 188, '2026-02-07 10:35:14', 0, '2026-01-08 10:35:14'),
	(13, 'Y3tq_1lTsisoFXWx-WJzJF89MmYAYLvUdvBqz1inaM6YO_nYdkw90-fP12IcgE0e5RNkFymQ4T_UMGu3Z3xcOA', 186, '2026-02-07 10:36:27', 0, '2026-01-08 10:36:27'),
	(14, 'FaK8-J_xaeszxWRiFYfOaIuTBmEkqkK9CGTA4a2zaOwxsxLgftRYFGjlGNzBY-KcppwxOIsXNlJlqo0be4nXKQ', 187, '2026-02-07 10:36:32', 0, '2026-01-08 10:36:32'),
	(15, '6K_u8w_wqdUkwg_oJeALwHQtXbcMS6uNBcvsETA1wuv4VkcCP_vLnt99gmqH9wKBd1K6KUtvVNeGJ3gP8lTwBA', 186, '2026-02-07 10:36:53', 0, '2026-01-08 10:36:53'),
	(16, 'a62nU01XGIuZN5GPUtx-wXU8h9VYBRSfypvDC0kD0x25JF7eRmgVLg7JCzh0ZxTMu0c1T8p0eJPbSBpezohEhQ', 186, '2026-02-07 10:37:15', 0, '2026-01-08 10:37:15'),
	(17, 'C9L3ESKMYKWyMrBB0nhwysgIEQLYubrtpQ2SSj3dlFdVrcfEuuyN13G2P5UtikHRLJKb6h12wOzzu3su5Go1tQ', 186, '2026-02-07 10:37:15', 0, '2026-01-08 10:37:15'),
	(18, 'E2D2CK1ji8G5cAjD0MM4gqjtFJXLG3ASDWCzUD5i6qCpztQUMtF3n7A3oLjRrnQWjk4FuPULSP3HU6-X2H5RXw', 186, '2026-02-07 10:37:16', 0, '2026-01-08 10:37:16'),
	(19, 'tPxD0-GN9TpH_DfF-4pY09XxqQMxa18BitUvHO0v_skAoJMM_P8x38u3L7M08IFtaE6gt07zxlxK07LcMLHIJw', 188, '2026-02-07 10:37:43', 0, '2026-01-08 10:37:43'),
	(20, 'DVBz7ku6S2kfsrrQHHfIGafRuPa7KbwpgKAw2SyUnbEW0__nHoSi0Z0snlPKjndKk2WkBuc3d0bftJxFEE-KcA', 188, '2026-02-07 10:37:43', 0, '2026-01-08 10:37:43'),
	(21, 'fjvR-k0jEtHlFgpywYPbjpJPxUulRjV7CYKytxNsWrI_0AoILocXPQHkbnQyKdOht1G5Xi4W8ie50sWLSZ8A3w', 186, '2026-02-07 10:37:48', 0, '2026-01-08 10:37:48'),
	(22, 'cQ1AmK2qOEJwS0XPrieFUEjn3Tru1JxoCuNeycuuFz_Fe3L-lroYrKW3ttPnIWlaVxMiKzcEvysSa5GI6GJRoQ', 186, '2026-02-07 10:41:57', 0, '2026-01-08 10:41:57'),
	(23, '1YVSyXAI2TrXnrZjdk-20nM1KxZTblIfTuINmyDtOT8UcSdRlTYiZzD-aBEM8aREbNb6H09rVxRGEodpknl3sQ', 189, '2026-02-07 11:35:13', 0, '2026-01-08 11:35:13'),
	(24, 'Eoh8eXIdfz6rs5DKPITlIvNaY-XbVBRWrLXfdVmN8JcVkeXV6GObxV1-xv83_Ra0Zv1q__C9LKWdojP_nY6hHw', 186, '2026-02-07 11:36:19', 0, '2026-01-08 11:36:19'),
	(25, '972o6AqPoZIFbGSzQToDRqXFr4EHWwRuJ_EwvaXJASHbpAmMoTDjUEkwdPE9NLkjEev1kMT3pD9VI9Wl1o73zQ', 186, '2026-02-07 11:37:59', 0, '2026-01-08 11:37:59'),
	(26, 'y_R-uwA1SXqkLPrNJQVlScqS4eV85WeDnf1PQgEfbaCEhRYILU-lrTTrJCEfgmUHlUdRXM8Xv2ngl_nPQWGpUQ', 186, '2026-02-07 11:37:59', 0, '2026-01-08 11:37:59'),
	(27, 'kMDutfK0Ye8s-oZJzYuI97Gmb6kBsH_sFIsRyPK_9-GsCfvtKCuC0Z6oKX-Eq-fzHhKwR-I5HF_17nSxzsGU3Q', 186, '2026-02-07 11:45:46', 0, '2026-01-08 11:45:46'),
	(28, 'ck0QT3RGyT0agLrvDfEPIL6xGM-RUzPJZBXROxiXR_pOngtbIfIVZw4OO83Yhx6vpUQT8smINt4rrBjDr0xduw', 186, '2026-02-07 11:54:48', 0, '2026-01-08 11:54:48'),
	(29, 'zY1rHZUSolxcg3YIomdlysCjoSvdtvpo1Dz2V1oZ4Oj1t_T8PCT7EVG7P2r4SP9FZgg70nv3TTw6jmNcqB535w', 186, '2026-02-07 12:00:39', 0, '2026-01-08 12:00:39'),
	(30, 'fWrqUul_5hNcO3KBxyDYfBRJQ7ToRR8YvBc9Hf7eqaWV84mmxry9R-NFRFj1uW3rXbWhcpA72A9uy-sWeMQs7w', 185, '2026-02-07 12:00:45', 0, '2026-01-08 12:00:45'),
	(31, 'z4AFmv1SY2ga2eKkT7-MIOMjTIeqaUyuzjofL8rzq5J3GPZyuBeRCuc5RlD2V3POXHpraPvlYV2gmacNtxicNQ', 186, '2026-02-07 12:19:46', 0, '2026-01-08 12:19:46'),
	(32, 'YOuHYl1D5x5JSpgbSZYgAf3fkugg6QeyuetkShgYNwpb5JbgM9DeSaTNXAkYkFbjPTjCeJMRJE-uMD3peIjWFQ', 186, '2026-02-07 12:20:53', 0, '2026-01-08 12:20:53'),
	(33, '6fwVhfZaLKQjwNXhtAeVIgDVfm9j0VaS31ETQZL-j_BcqoXgvl_LMjunvxTU-MF0DLuUycBLcJQzRrBSbj-voA', 186, '2026-02-07 12:37:18', 0, '2026-01-08 12:37:18'),
	(34, '8Xom6UweJ4V4WtUwGcGyVN7eclL361Ti7Ao3VLs5jX0irj5UYBSNkjcHtqQP6twXCN8_VOr_MygleX2DZ81TcQ', 186, '2026-02-07 12:37:56', 0, '2026-01-08 12:37:56'),
	(35, 'hNeDyPZp7uekjM5SNCFbnXeIqj8prB_yEDYfCiOZczkAkcXKWmLuvAivrhszsFA5CSAhVSO_eaFbkUlv521H6A', 186, '2026-02-07 13:04:33', 0, '2026-01-08 13:04:33'),
	(36, '5uh0L6imgy7MvMZayF6lw_jjSuCP1r-Uv0IX6hf87u9lrWoFwN_Kjm_Ff3rFeAe59fxWUStMGnFqxRyuxbEy2g', 186, '2026-02-07 13:04:43', 0, '2026-01-08 13:04:43'),
	(37, 'xccgMBqjEnuU7JgbL8INiPIKZOB-qNuiGqa6RkcYLizmJL7X8QgQDTB9ar66QI55vC_Njzt7HrAsER0N1GbAfQ', 186, '2026-02-07 13:08:15', 0, '2026-01-08 13:08:15'),
	(38, 'Ip-AYqPepjBQUqvgs6hRoTOWC3gKnZFJOf23_YegK7e2vFjOADMfVG_8xBzC74bz5hRbv19w4rgocQXV2v_m1w', 186, '2026-02-07 13:16:11', 0, '2026-01-08 13:16:11'),
	(39, 'apkb-njwd7HjJpO0PLvqTZzVkfYyZ90JtxYMRGZV_bTvIpTeVVT5_CFvCz5wI98MFFLler1uZMx6spB7N2_BfA', 186, '2026-02-07 13:16:32', 0, '2026-01-08 13:16:32'),
	(40, 'gcMZb4dM7fsKjUk1A3Mf6atdryOuHho5XrkGfBPt23qkJDPO9n8L01iCIAsrJHXWvAgVqkddbfGCQvFb5IsmxQ', 186, '2026-02-07 13:16:37', 0, '2026-01-08 13:16:37'),
	(41, 'Uu1xKUWw-To1-tKTl6bxUCqr1Sn-C-7DD1-L4dKd1aqjLFDBg8QM7eUbwSJ1L5nnMa0mK6JxXIdy0Nsin2Y0Xg', 186, '2026-02-07 13:17:27', 0, '2026-01-08 13:17:27'),
	(42, 'wtGVAsuyrvjqqoeBrJG2RQcTs6DU-ETcH32g1s08rXsvlwPEOenMWMsm00y484P-3w50YCN9AgUpJDp9zIZ6Tw', 186, '2026-02-07 13:25:09', 0, '2026-01-08 13:25:09'),
	(43, 'fsCJAAkSNmdx7PjHkJIYvBKarBrUqGO1fURjgAyNoplZ-rQgSlfjIg0WsxlpXFAhalQMJE4FPAHc3Mym-TX0DQ', 186, '2026-02-07 13:26:33', 0, '2026-01-08 13:26:33'),
	(44, 'e8YFDxs29Um3eyu-Lg-vL-L4xVMT9iDE8Fu3NPmphoG8ydrZEtXYsljS3hURlqDBX8ebwZHLDsNIwBmuvD-23w', 186, '2026-02-07 13:29:31', 0, '2026-01-08 13:29:31'),
	(45, '-5ZLcCvoRHxJktAxd4_oOuUpInOWW2foAE8UnyNEztcEw_LNGqkjJKD1s49sX6s4QzliB7FeN47sPauuiKj5RA', 186, '2026-02-07 13:30:46', 0, '2026-01-08 13:30:46'),
	(46, 'xs3QBklxcyA7d3qJT5F2HSlmKcwfNHWLhkliVvzXjqUC6JQ9mRcBF6-jLcdFGIrtHCxD6_UwjAM1BjOvYrsp8w', 186, '2026-02-07 13:36:19', 0, '2026-01-08 13:36:19'),
	(47, 'qFjOHGx_xplnzrdbI_ywr-yOEFjqWkZZhc2dGA9lHj2AQC7x_egpvKrz2RwYyag-7U0nm7OflbjUP5CD_L4JmQ', 186, '2026-02-07 13:37:27', 0, '2026-01-08 13:37:27'),
	(48, 'FVwaPY_OxchnGxqxtPavmpV7kwEOcasmGL3DgkNV8swdDtLooDulDuJPD4Usfj6RqwQVvXCtFSJ8WIqcaJmSlQ', 186, '2026-02-07 13:39:34', 0, '2026-01-08 13:39:34'),
	(49, 'PLKdLNmNSUDGrOgs0cQRJSeTHtBboTFokghXewpyOCh1Z2Pjl_MPdkBAqa_Ldx_8FycbjwuakIRrhXuN-YrEig', 186, '2026-02-07 13:39:45', 0, '2026-01-08 13:39:45'),
	(50, 'ucyxendzSxSz1ZjQ8GMz_w72gLlcZWgXCYrepSAEFC871moVCo1J9UR2zVYMf_kPimk8OweLBHNA3WVAXvGHlA', 186, '2026-02-07 13:39:45', 0, '2026-01-08 13:39:45'),
	(51, 'xwdGPFjnnEkdWyIs16UrPpn0oBQSzSM04o-k5ZgFmJRWGVjoVPNp3ddqgyXTouCPQz5s1oLGBdfuhFrnKrpOqw', 186, '2026-02-07 13:41:55', 0, '2026-01-08 13:41:55'),
	(52, 'TcgMqyk8_6Fz_ia7oBwQoxelPGYvM2j0byjS82wOPWVF2Qz9-DrYPWQalkG7ZtDFT5yPrGEYecw0sn1Spxfvvw', 185, '2026-02-07 13:41:56', 0, '2026-01-08 13:41:56'),
	(53, '5Oh7Ctin4McoaDeFYMO1W7Zr6ZksiZjJ-PUbyrgEneeTxgdY_UAI0ESjnV7yRHFLuMUcqGTTzrUgTXlSBpUTZQ', 186, '2026-02-07 13:41:57', 0, '2026-01-08 13:41:57'),
	(54, 'jEatWsJ9BlGbjb9mp6af-WHkbdhpnZlJeAdT-CV2h2pQvic7wpQ5sv440VNvtwdbd5tGetY0rS7Qvs41_6DmKQ', 184, '2026-02-07 13:46:20', 0, '2026-01-08 13:46:20'),
	(55, 'GYupiYLQhGgGqHmbpS0S-S78ETdV7_EjX_CRQF-Ha_ZslMEHos6v3_gyWaifUK85YzFptYPGVmkYgoY_Oa1niA', 188, '2026-02-07 13:47:04', 0, '2026-01-08 13:47:04'),
	(56, 'G2HYWL3dH2kIBfcF3A5UbK-d0JDyuuSAASMWGRyET6rPPvKvV7ynwJkLW8_eu624ulvfR0qodMtO5nl32kaKug', 188, '2026-02-07 13:50:22', 0, '2026-01-08 13:50:22'),
	(57, 'mjfI5Av9XnqDveSlzIgLyDxlntjIT0WSau-EGFQjBTDivc78smScYW73p6ISlxYAvgfYRf-DORMCPKNGpP2Mow', 188, '2026-02-07 13:51:12', 0, '2026-01-08 13:51:12'),
	(58, 'gNThqmwPtY0cqqB-uCSa5JECcfuRRdQnnJYqVYZFlFLthScffyOdykUcta_TfFvHqVYmRDMUx71YeQTJG1Fx3A', 186, '2026-02-07 13:52:00', 0, '2026-01-08 13:52:00'),
	(59, 'SAtMKkbAxHVtzb8rDvsVu4nnEd2BB_wv-XeclumuIJSR7p3oBOfToA9WCStYUHTXmXuf2oFuGUmITukhzDW9Jw', 186, '2026-02-07 13:52:14', 0, '2026-01-08 13:52:14'),
	(60, 'ZzyBWocEk0Cf0_3ThhIaMyECXMcgC2XkCP64XhHPiJIYO_YaXTY_Gu7NLx0LgzRlsQSbg4Ob7Qzz5Mz7M1bc4Q', 186, '2026-02-07 13:52:14', 0, '2026-01-08 13:52:14'),
	(61, 'VYRfnJfAkCaQdkFGAff-GHGkybjyRTLvm44hYGgWh7AVEakwP6EIegWN5jtzC6B2WSpW-7jtenu4taBPzGwRwQ', 186, '2026-02-07 13:52:14', 0, '2026-01-08 13:52:14'),
	(62, 'asyvuNDIF21mckIonIR0XvC2zKcZiHFzzYoXT5KmVPM_KzvC7zgJhBJwFLnZkWSnXGQo_CQT_zd4lV4owHFb0A', 186, '2026-02-07 13:52:25', 0, '2026-01-08 13:52:25'),
	(63, 'zn9YZehj8ycUY-tQWXMIoAVQb1woDHaKL0tMZb5a9sxNIj_GuoOO4ZhaU5JboB1ts-43A3bS_l8IMgGVu-64Bg', 186, '2026-02-07 13:53:11', 0, '2026-01-08 13:53:11'),
	(64, 'JN-5gfDKOjR8biEYqA88ZqIUOgB9fPP826z141PAecHa1xBTUpeOZUWGDdZMZLVXUTy8hYDfNjybeGzG7TVqzw', 188, '2026-02-07 13:58:33', 0, '2026-01-08 13:58:33'),
	(65, 'o7Wc-RFNobboDOtcADlj3JCVZUmOEkl07uH03GSExEkr1s60ski8r_K-3-eefC-e0M05DT0WmjsUBtOXmQBsUg', 188, '2026-02-07 13:58:36', 0, '2026-01-08 13:58:36'),
	(66, 'oVbXW4aD8oczSJSPRKQl2e65Xf48wqkKLYPcj_GEsIWTmRUTUbX-b4BsBEMXxsAt0PsCGzGcQvpAHDKKHJXjNg', 188, '2026-02-07 13:58:36', 0, '2026-01-08 13:58:36'),
	(67, 'cknWwYV4cJEAGmZc0ZD79-eNfireuSQ7-Xr334cPZYMFw7mGHKNC13biW79WPkzz08wbn0bQKaQMtmSvtxPzsw', 188, '2026-02-07 13:58:36', 0, '2026-01-08 13:58:36'),
	(68, 'tibfGm4_1jPKOvdK1r7DL76wfTiUZwCSiS8w9LK5NDGxlAaaYiHxAfUZaKBbJTHQilYVq4TyW64C_u0vkh4zrw', 188, '2026-02-07 13:58:36', 0, '2026-01-08 13:58:36'),
	(69, 'a1DCNqGEc7fSfoKNvuOZLR04jdagUEaE_Hp3h8D-OZCiWVLyCl-motfybtnm7CR7gl8WCIBOyiOcFr4Z7DZ4nw', 186, '2026-02-07 14:14:55', 0, '2026-01-08 14:14:55'),
	(70, 'IJPAOcHhLCestCFGqzaHT6RrEobDD1xQnDLJBQ3Y8x3auc4kAHXJCZ6CpqaXQnqA-ituwNI-yXI1-s1lxrb3qA', 186, '2026-02-07 14:18:26', 0, '2026-01-08 14:18:26'),
	(71, 'Je7xgCxBJoBHmGRFLB3_ZOxDaotGyLm9TexoxZhKhvglo0oqBaR3_yVcvlAuDisoDfQt-VEWX-xBhlOrgum8_Q', 186, '2026-02-07 14:22:13', 0, '2026-01-08 14:22:13'),
	(72, 'SPdGJi2xfLjqrt_j676xs4nRBnpPM6uQdQNEoC_EQi-d490ge_z0p9k6TiPg5dAvLIds5ds4q_ZoonztJGxyFQ', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(73, 'l_1MVkdEWROIxVVaANSUJaEBgtE9VzrXZrqU32-POuTVVZI1rDbi1jEyeapHN1z5xSNcwvmv6ag6L6f9iXUQhw', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(74, '9guBt4Mi4qOMK2hNAvTWf_IFmZnpqOkzdpU8Tyi434Drs65Y3lSyy9gV46KEstgXYY5IzYIBYd7XTu15yWlI5g', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(75, 'lG4ro3RcGRo8Hbo4uymSFzUQN3AEdUwcUFu2zjeISzAJdF0yYT-u7gMqtmZ1lf9ZiD1DyP8hYI3fAbwjjduZ5w', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(76, 'bMCHqWIp_MD1HHyuzVnRWgWFP9xD6dP6ny_OnDfseLlVghMXhx1A_kipCTrmuhJ9pJ-Aqr1vfzU5FGu7UdmheA', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(77, 'CkOqBzjX6N_aH69s7KEJiZk3FmyK7Xr874hRs179b9d-nWTL3Ab_qSFLOQnThCaLA3h0RP0b1fNbSLsRWSp5AA', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(78, 'kJZIpLcTaqY_h_vEgQbYqzeAxHExhEXmglSgVHQ2puQrUbb8N-hFf4erM5yPrW8u_y5A8coX_Ye3AlN687CHWw', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(79, 'kgfe6b2tlW_iIRn4h7EVHk9kSScHto1dtnH1Kq2i4-B8oJzH5VPCNLChwO4qTgYktKglRAYHxAM_dJBZIIajkA', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(80, 'YcEeWytARPR2A1tWsgCrXhAE9TIe5kolCwtMCyay-elOf7wbi0krHY94FYGYXoQb-EFUhRNOZW9Jm1zxedmh_A', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(81, 'HQ-6cPrkOCK_qIrvehEiAuYysAKFe1o4LGYUPzouy5d5hGoDqw10eD1pQfyW4hCpcXSTLuv2naprKdN-nqcyAQ', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(82, 'AmJRrcIgu9rtItL-bcAfmuSbLqsqttbfeGMg3ki8YsYlTsaV-OKd8zTyKkYKBBjpQFOgv2CyushQF6u1k15teA', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(83, '0eeVKeCQsBkmaGV0Ntsc69NWayIUdoK2uF4z8IuQGvAnoFa469pIt7_QDIwH5wHcRkipL9j3oqGGYovP1Hr0jw', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(84, 'w0fmiYxeGpIMaEZ4lMuMYie-eUYE719dm5I9x5llb1lDBTx1fOE47ld0O7hJu_IUCSyFFOdVVTLNbEeDmvJLhA', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(85, 'XGVT_AdqnIWyROP9VK6iFV0e09YVbxGz-tc7lV_iZiRGLH0jpQ2ulkkC31t-8TFcBw6wlYwl0qJI8aBD8Xaf3g', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(86, '3WlyvXbzu7EYsGO20NUf--axI2Ugf5IssVCwDNjVNIfxrNTUZBNJC5q90RhxRv85hmkbDqw1ar24xBfI4_U-6A', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(87, 'iCkGt3mWo6rmt7bQTHnsg0fhKhU3uT5DD75c73phQ5YF8ocMC6oEK67oF_EybsGLuaRVm_Mfn5xSAbb5kHW2YQ', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(88, 'MSCrvEtujcVyv3jxyeevavXC0NG8GHi-lmXnH57_i7MNSxOxI6JdB6GK0cZsLfINmUVZ4fu6TVY9hdhiDMJoDw', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(89, 'aKWg9hWriG885yrYgYHY3v58Ce6i0J56NQRpN31o3rJIWZ77K9fLsbx7BJnBvk2m_t2o-KZJ3OopfUVnxnTS3Q', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(90, '4bwomdCUD8TOOWLtJSd3UKN2eHtXzvZ02GEq7jKih7cPTCW-Ao_TXTfs-q23B4S6gIMIsRBpPZDYMBMxGDNdCg', 186, '2026-02-07 14:36:47', 0, '2026-01-08 14:36:47'),
	(91, 'vsJTRahbTTPZ88uP5nJatRuEMnzdvG7rHqyyINFqk2kdPMXTmCv3z3i8qgXQaaZKgKczzcgOJze17ifg7o1POA', 186, '2026-02-07 14:39:44', 0, '2026-01-08 14:39:44'),
	(92, 'oZQFClSB9i1nsZ8dbj1S0T-Dgb9mlcYM6Md73o8Q05GZsZtfuUpOhriILWZriV3cWCIPAJJYzjzFDItvMVzTTQ', 186, '2026-02-07 14:44:44', 0, '2026-01-08 14:44:44'),
	(93, 'LhmguF5wPEi2tK-gGazxvFZdxn9XtsG4EwONBz8MEaeufThD8XWAmTjcUNYb8h8052BGOrGeCjRnIokP9cVyaA', 186, '2026-02-07 14:47:52', 0, '2026-01-08 14:47:52'),
	(94, '7Ai0eTkSSGpmml6Eb-bHGBkr2ldp4rlVCZGZ7C31LLTse-cs5thk_br9RJlg-e_Z5-Ai3Wi9Kns5MSM0rwiRwg', 186, '2026-02-07 14:48:58', 0, '2026-01-08 14:48:58'),
	(95, 'NAb4pKKXhFrK5XUwk-3dmeAW8NvV4uzos4Cg5Lyfq8a-q9SbABdq-Yz8JNMpCNpNKgfheNlwOoCkFoZXPZAdjQ', 186, '2026-02-07 14:49:34', 0, '2026-01-08 14:49:34'),
	(96, 'SMZPf5K9316c0uB3aYmF6Iwgm-suGuIvIna5j2CMSsNNgCU2Gvy8R2WN1v_z0HA9XLlnzERmaw1lTmjE-lfUag', 186, '2026-02-07 14:51:17', 0, '2026-01-08 14:51:17'),
	(97, 'Ww7-1W14nG0P0JrbPWkHpi1NnUfQhpC_c8iScvOVs2QeQWcBoS2tYzqeoTn5LljrTEOdFsWqlLM1qOWI1wb2ig', 186, '2026-02-07 14:51:50', 0, '2026-01-08 14:51:50'),
	(98, 'Uxc4HFpAZH4Il4NmS2r9OFAHWgzYc48NZtIbmwg6WzZlBauKvd0Nf0hOgxzrQ4Ii_t62xSqXVWO4OQU2nlV5gg', 186, '2026-02-10 11:31:00', 0, '2026-01-11 11:31:00'),
	(99, '0CTiOBZKe2jVtkz8_HYE2AbzblhJ0u8lz2Vd2UcpYLp_cmjVesUBS7roZ9Ez93C3lHVGC_QM-dTE2J0HJk5Lgw', 186, '2026-02-10 11:33:59', 0, '2026-01-11 11:33:59'),
	(100, 'uOziqW01nBbx2CGTPkV8wDHMrw9PioNOF3Phn3VIU5hw1t8yz7yYreLGYFq26OpA0NFqTfETJ9wNcGhN9LLq3Q', 190, '2026-02-10 11:37:44', 0, '2026-01-11 11:37:44'),
	(101, 'IdNzQ58B_jNwZXUo2iWJWcKuws06_6NWbgWlzi5Z7b__9K2Hprkr_9BdYBq04vKYFoVkL0vAs8HC3z0v3DRnjw', 190, '2026-02-10 11:43:10', 0, '2026-01-11 11:43:10'),
	(102, 'dafx88qmbrzSsDnCxJu5EjPx_V6teSx2yuEzniFnkL3VRi5usb_EAsnD5QM-on0SbtGYSteEMsc6sM9Bv2FINQ', 186, '2026-02-10 11:43:27', 0, '2026-01-11 11:43:27'),
	(103, 'xZ7iVUXJHPyElJUNz_pC-kNrriUwIknq7iB0LGv_A5MbOP736ee5Shoqcn1GxYoKUn9dczaSuvnXXwiyvtSC8w', 186, '2026-02-10 11:58:06', 0, '2026-01-11 11:58:06'),
	(104, 'uuY5ZvrWkWrERNVCCnzc71VazB0WxJrvWDJAX-omxxy3-aRNnIZtLLUjwgweOYmTzVGjunfJPTLpRMg3fszpPg', 186, '2026-02-10 11:58:06', 0, '2026-01-11 11:58:06'),
	(105, 'PKSQfPTw7wHnDu6IuqoSRf1wKELjPcZ6ol2mGtDd8voE1jwLHAxlcGGU2_wntq7nCwafjBJWcoG1JudUlnpgYw', 186, '2026-02-10 11:58:06', 0, '2026-01-11 11:58:06'),
	(106, '8Earqk47fqP36rH4m337sqpsZai8qfV7yH_1UiFFMWOQ7Lfq92s_mwlaiRMK0ea9GdqZ9mpftbJRSzFoRtiprg', 186, '2026-02-10 11:58:26', 0, '2026-01-11 11:58:26'),
	(107, 'k_x5Pib_0O9gIkcpAnr2_3UknekgXquyq2bMpuvZHOLgmvuk2epxjNZwlYaHmVKei3r7y14ABNH82P0nzVd6sQ', 186, '2026-02-10 12:46:21', 0, '2026-01-11 12:46:21'),
	(108, '3cbrkoAumTCr5WCGjwZuHzE8mTP6X1pJtYXU_2PV7L9Yveu4rrUizmOeDcEO0Jquo9pnWfIpY01-vzH-CqRPfQ', 186, '2026-02-10 12:46:21', 0, '2026-01-11 12:46:21'),
	(109, 'NU87mfiQmb_iNobYrjyshUmcAQEnFDXdsyUPxzG7T7QHbyOEIY4LdWOlsUaa44YRdHvzdadHriY9Fp3eLkKcpA', 186, '2026-02-10 12:46:21', 0, '2026-01-11 12:46:21'),
	(110, 'sGcmFgF_eWtI9BJbEmPIBsZeGBmfjisFqYER_15IlxrNE38LEHkmQnboAnl9kbKdLcxYOVCKi_XPG7TInOofQg', 186, '2026-02-10 12:46:41', 0, '2026-01-11 12:46:41'),
	(111, 'Haub5UF5422_VxyTzqJq0P89FGJx1ssAGy3ohO8xdR5Gp6eUEUr1mgDcM9Fa1BZIMlJAOP8YBy8Sht9w86soiQ', 186, '2026-02-10 16:43:57', 0, '2026-01-11 16:43:57'),
	(112, 'co1rs8t2Pdu2PHDSW-iIYk1w3-Mj3IOO4_yfFKWZ0QF3zEXc495oFvUVDO9F4Z43pyQJeArAHpIbut8GErR7lg', 186, '2026-02-10 16:44:13', 0, '2026-01-11 16:44:13'),
	(113, '8L3ZAnHDohEZqgEldNOXGS8aNzpjenIbXsIDGZp1zOPxu-d9YYqLlKqFFHsbUraUVjDiCU0sHylgXwOSNqlXqw', 186, '2026-02-10 16:44:17', 0, '2026-01-11 16:44:17'),
	(114, 'JOCTYY2A3clGApjU-SMrcTxAVPVZsQyBPFIcPmQ0jHlr6JDvr41SYLTmMsFEBf-EL1Mu-GeHn3OtkbY1D3oKAA', 186, '2026-02-10 16:44:22', 0, '2026-01-11 16:44:22'),
	(115, '--Nie-Ld6JEi1FOd6KZUl2WDwR0pqL4OPRtg54oMK2X3JrePnM03j7Ogq8tvkJ6KM7EwJTeR7wdU20sXSRWoUw', 186, '2026-02-10 16:45:48', 0, '2026-01-11 16:45:48'),
	(116, 'BxT1itKmsUaHHK8DZlHN362tCH9v7eIQ5G0a9xK2gEBUJCD3irk2yZ38dCe3e8Bwwtf-tQNnx5JxTyNuwBVgPg', 186, '2026-02-10 16:46:01', 0, '2026-01-11 16:46:01'),
	(117, 'AM7O7_yjLnGM3zTZ1hEFfFBpDzc7KfI3tg4NcW2MaydSvIfrKC5ZLw6UdbiVQhNHeBKtnwlRwucpSVYg6QdqxQ', 186, '2026-02-10 16:49:25', 0, '2026-01-11 16:49:25'),
	(118, 'rbs18vNU9e-uxRMrZ3sJr6fJr1QfpqOLvBlgpyIqM6Wk5KqCyA2AnyiT5StxSTUHgXB0Z1NxpfWxTjp6GOaIHA', 186, '2026-02-10 16:49:29', 0, '2026-01-11 16:49:29'),
	(119, 'LoUZVdePFlIgw3JZ1AizHTuey6IX1dlD7TE1h4qYIRYLq9OCOmfw8oHcEPxkN_0sQ58zByNWlMg-M7E_MOtVuw', 186, '2026-02-10 16:49:33', 0, '2026-01-11 16:49:33'),
	(120, 'lG4cfogBZ5KHPC682F5TD3llCZDGI5HCmwH5hGFKVTYQ_EBc1qkXzRuLbwI2ySCM0GC0lcR_tfQq7UmG4r97wQ', 186, '2026-02-10 17:00:33', 0, '2026-01-11 17:00:33'),
	(121, 'tEfPkqVU2c_5WMzx_JWVFL6Q957Zhtd0sBzaGCvM0YeP404jBy517Drox3-3EFcwY3DNvpqMcrqN__EXesGdyw', 186, '2026-02-10 17:09:46', 0, '2026-01-11 17:09:46'),
	(122, 'LT73HOTxyAhNJPSJhgM18gEyIJRvdBD5K09lB3fWkm7Y0qc1_e6NsZS0AsZYKed1xhC8rasErugDevJ-AthXtg', 186, '2026-02-10 17:09:58', 0, '2026-01-11 17:09:58'),
	(123, '7kJg2UuKTeMCUn2g8br5pfhbgoo_LNeVDioHrcJpBg6lqe89FwxJ6K4mEceDu8XnohtWt3Z-J8ff6drh6rgguA', 186, '2026-02-10 17:10:47', 0, '2026-01-11 17:10:47'),
	(124, 'vb5WRQ-Cign02RywyKOvxbxQ2OlrV9B_m6eeKu_sB5GsVrGLaqOd0efskB-PT7kFhPKZ5k0cqOwE18Sgw3pkgg', 186, '2026-02-10 17:10:56', 0, '2026-01-11 17:10:56'),
	(125, 'BHJm119qyamYsKUJ0LFTyF-qHwJWvd_mAAUSprDLMNsvL4nxIS8FIMao5qSKGFa-VZt2Gmo9fSzVFIxnt60cyg', 186, '2026-02-10 17:13:15', 0, '2026-01-11 17:13:15'),
	(126, 'dqxUnqQ4yC8WZRwCEiIHy8qQqhAmsfKDuJeWiUpZJxQQAaBsRQZjPHR9xVwXmwkZlLRYrc7CqPTMZlryNmuB7g', 186, '2026-02-10 17:15:43', 0, '2026-01-11 17:15:43'),
	(127, 'xx0sZ8S5I4U54sSYQbDjVa8GeD7sRcEg4ZO5wsBKv5ifHgWJ3I8HUosA2KIyexgIy4S8ssrqMEy4zSSb20phDw', 186, '2026-02-10 17:16:42', 0, '2026-01-11 17:16:42'),
	(128, 'JkUCanJnB831prgBgLjPoCE-lAf_uvoODsGoZ7nrULQ_0PLjEIXQYB4_sQTVzncFzk72HoMtp9O6cf9T_hDTcw', 186, '2026-02-10 17:17:06', 0, '2026-01-11 17:17:06'),
	(129, 'mvxpBzb4-xv_qtK-fjLvNEJYvlNjz_JXpBEFLYWPzcGcSgfVw9TNlTJbNWwxsqq0xaT4o2DR5hV-F0cgq59B5w', 186, '2026-02-10 17:18:17', 0, '2026-01-11 17:18:17'),
	(130, 'MADdkNjR_b3DCPLOJYBzFKdz1ILMbRPuKoGbGW3vIm5Vy6UaLKYayEV7i0ljks41U5wSRwG3fc_kfwDNrVDQ1g', 186, '2026-02-10 17:20:25', 0, '2026-01-11 17:20:25'),
	(131, 'tCv7A1gkJxyRAzUstRXS9AsmsdEqtHcXdd5FwJKuSw0twHe0Wm2qjgtk-aZxkA7TgUXr4ZHeQAhyx45vi_-oEQ', 186, '2026-02-10 17:20:28', 0, '2026-01-11 17:20:28'),
	(132, 'DnMdytLDaQ5M4y32kpM00LZ59zSTyRWHztzbmMK8OXY2xWNgVupbRp5ezkMmKGU8BKL0xvrrTeKfe2RY5JMMSg', 186, '2026-02-10 17:25:10', 0, '2026-01-11 17:25:10'),
	(133, 'bC_OJK7AXegvB9fKH1rto-eHA37Nnvoq5KsIBevMGuW8dpMbZ6iIXQL7B4UOs532XfNyl7Np-Hip8fij95IojA', 186, '2026-02-10 17:25:14', 0, '2026-01-11 17:25:14'),
	(134, 'nMwHQ-VUpmjXYViiIuzvkPIIn3G5yf1g1ZLDFjNtSivyWtRAONRw3ye2_3LjD2BEYe8BBRn8Klw1XO-06i8vYA', 186, '2026-02-10 17:28:39', 0, '2026-01-11 17:28:39'),
	(135, 'byQUMQKxh7qr4b95JAj-dHF_ZIeSr6r28py3vfQtjG-EiJmBH59idWrUUPMaK38d3V3F7VG1tmcrbpvu71um2A', 186, '2026-02-10 17:30:29', 0, '2026-01-11 17:30:29'),
	(136, 'piM5J1n83rr4mWbtdS6xhp_T5fZQ83KK8w47YG21-BboF1ivbBFrqvhcF_4_9-67mQ0v8L_7ldweK4P-ro7grw', 186, '2026-02-10 17:36:31', 0, '2026-01-11 17:36:31'),
	(137, 'ly5z0b4SDLvGmDIcaRViVcshtrCykQTSOb-SgZrR2BlotDtvpC_0ZWXAh17BRPtZ2whNeYYdorD8rcU6hY9D1Q', 186, '2026-02-10 17:42:50', 0, '2026-01-11 17:42:50'),
	(138, 'LAUoSf2kBI2LBLn6C_B5jWCfKIbW-lix45slpE6ebCM0X65piWqTohOyrPCP7XxzSTW-VTR2a9sNMYqL9mzOOw', 186, '2026-02-10 17:45:49', 0, '2026-01-11 17:45:49'),
	(139, '8KRHPRIdynsEdcBAesmAE26F_14Xcc-8xU5WyjQxNZXfOdFPThW9M8gO6bfCc1wt7YagBny1LnlWk687Ffkt_A', 186, '2026-02-10 17:48:03', 0, '2026-01-11 17:48:03'),
	(140, 'P4GA573lsFHt3KITwglb8dLItmUUvs65ZbKD-FGYHj7pvkbrh7bMEO_-gAcj9PO7PEv68hCByW9PtNcuwKmh6Q', 186, '2026-02-10 17:49:34', 0, '2026-01-11 17:49:34'),
	(141, 'sUjtWH1fR-cAvq74WZNIA6eBcwgkw4KaYQf7v46TR1qpIss_wwzzOxpQaPJXjV9BkvBSfV3CM_U1tiqfdRp6ag', 186, '2026-02-10 17:49:40', 0, '2026-01-11 17:49:40'),
	(142, 'MaO4s3y_pRHPnbPByxxjKM7nCLxNO9ksOd6e6WUwlSPZ7cpRYz_EDlAoHVM-W35q9ZRsryjyTahcn3Q31j0HRg', 186, '2026-02-10 17:50:40', 0, '2026-01-11 17:50:40'),
	(143, 'e6_2E_H2xW90OzKKNl2pVMZ5_bfUemWrgXDtuPHUx6X5cak7YIyOy74pPVvzBWkI56GoTyBGApshiYTf9pW8-Q', 186, '2026-02-10 17:52:26', 0, '2026-01-11 17:52:26'),
	(144, '-4_DBxk2i6bxOAh2i5Fw8S5bKD4sWBeOqljR-JBw_iXKjkR0fU8p5Sa-m1sbRRNa7JCQyvLb0fwnfEh81sODwA', 186, '2026-02-10 18:16:00', 0, '2026-01-11 18:16:00'),
	(145, 'SOo1oy-IoyyoWUZbdRX_RT8WbTMpotaDaIy3iDDEm4MQAZoO5dAb41Zcvv-IzO0qZA003waTvJygvfo-62XXyw', 186, '2026-02-10 18:19:07', 0, '2026-01-11 18:19:07'),
	(146, 'TyoCP0OgR1YCvsNqbvlAwK1KIBmurIhRLTPQiScYcx9WDTMCu3qwVRdLLmJKtt46GhfUib2337wgW8lJWSH_ug', 186, '2026-02-10 18:22:09', 0, '2026-01-11 18:22:09'),
	(147, '95kQr8TERKHRk-UoXf1e1og-UDYIfbNEZ8SYgH3IGA2AtEoZTKz0QU-HgtlNeBoeL9rfDnw8b1k8D6okF5UTHA', 186, '2026-02-10 18:28:50', 0, '2026-01-11 18:28:50'),
	(148, 'ACj317qD_FsbSdalpyFJ6XEPQIK8Qx35tiuymaoVSmtXP9O3Gj0seIBqXgRslVJE7pivtPgRsXLLrdGOCRT7zw', 186, '2026-02-10 18:49:12', 0, '2026-01-11 18:49:12'),
	(149, '_cXVyNP3ObuaNZV1cWGHo1QHFniAYp6fascgXPMOTS1WBIqjo8UdeQeb1PL7u7vaVhJ7ttLMdYGnG07kyO4LyQ', 186, '2026-02-10 18:54:10', 0, '2026-01-11 18:54:10'),
	(150, '5bpNZ0xIQ-TBmLCY5ZW0-uk-6GPorUlCqckIdm0W7IV3Yk83jFJetlDpcBJnGtyq51eWYOWIT_pGONc1IrEGtA', 186, '2026-02-10 19:11:24', 0, '2026-01-11 19:11:24'),
	(151, 'x_mzzKHYpBfIFIgnERKWa7br9rSoFdLU5IHVutWcYspf-9reIWLGWPkJbWseJQfYvSfVjK9DjS5Yo9eGSCpqHw', 186, '2026-02-10 19:15:32', 0, '2026-01-11 19:15:32');

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.step_logs: ~11 rows (ungefähr)
DELETE FROM `step_logs`;
INSERT INTO `step_logs` (`id`, `user_id`, `challenge_id`, `team_id`, `date`, `number_of_steps`, `is_deleted`) VALUES
	(1, 185, 40, 31, '2026-01-08 00:00:00.000', 120, 0),
	(2, 187, 40, 32, '2026-01-08 00:00:00.000', 2000, 0),
	(3, 187, 40, 32, '2026-01-07 00:00:00.000', 3000, 0),
	(4, 185, 40, 31, '2026-01-07 00:00:00.000', 8371, 0),
	(5, 186, 40, 32, '2026-01-08 00:00:00.000', 5308, 0),
	(6, 186, 40, 32, '2026-01-06 00:00:00.000', 4500, 0),
	(7, 186, 40, 32, '2026-01-07 00:00:00.000', 6000, 0),
	(8, 186, 40, 32, '2026-01-08 00:00:00.000', 20, 0),
	(9, 188, 40, 31, '2026-01-08 00:00:00.000', 0, 0),
	(10, 186, 40, 32, '2026-01-11 00:00:00.000', 32649, 0),
	(11, 186, 40, 32, '2026-01-10 00:00:00.000', 6000, 0),
	(12, 186, 40, 32, '2026-01-09 00:00:00.000', 6250, 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.teams: ~2 rows (ungefähr)
DELETE FROM `teams`;
INSERT INTO `teams` (`id`, `name`, `creator_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
	(31, 'Team LU', 184, '2026-01-08 11:12:57.324', '2026-01-08 11:12:57.324', 0),
	(32, 'ARBE Team', 184, '2026-01-08 11:34:39.524', '2026-01-08 11:34:39.524', 0);

-- Exportiere Struktur von Tabelle step_together_api.team_members
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `joining_date` datetime(3) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.team_members: ~7 rows (ungefähr)
DELETE FROM `team_members`;
INSERT INTO `team_members` (`id`, `user_id`, `team_id`, `joining_date`, `is_deleted`) VALUES
	(1, 188, 31, '2026-01-08 11:12:57.326', 0),
	(2, 185, 31, '2026-01-08 11:12:57.326', 0),
	(3, 187, 32, '2026-01-08 11:34:39.525', 1),
	(4, 186, 32, '2026-01-08 11:34:39.525', 1),
	(5, 187, 32, '2026-01-11 12:41:35.701', 0),
	(6, 186, 32, '2026-01-11 12:41:35.701', 0),
	(7, 190, 32, '2026-01-11 12:41:35.702', 0);

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
) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle step_together_api.users: ~6 rows (ungefähr)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `email`, `hashed_password`, `step_length`, `is_active`, `is_verified`, `verification_token`, `password_reset_token`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`, `is_deleted`, `role`, `public_profile`) VALUES
	(184, 'Admin', 'admin@bfi.at', '$2y$10$wNi.RuvbalU2/ugcwvpMc.VbGanG/cs.ZTOWwVtmDBqE/aWZGMuiK', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 10:56:29.720', '2026-01-08 10:56:29.720', 0, 'admin', 1),
	(185, 'Uwe', 'uwe@bfi.at', '$2y$10$NHvWXTA7zDH4GH8Flf.3KOjuVWOxdYdgJoJFaaj2uq16kP65/hice', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:08:43.266', '2026-01-08 11:08:43.266', 0, 'user', 1),
	(186, 'Betuel Celik', 'bet@bfi.at', '$2y$10$u/0BpZcZl/jYmJkg.fJYeubPIrW4b.8.oWA9aYRxWga4dhjPrQMHW', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:09:22.864', '2026-01-08 11:09:22.864', 0, 'user', 1),
	(187, 'Artem Panasiuk', 'artem@bfi.at', '$2y$10$oCHKKEMhVURa9yhItN81gOWqp/9uRM391djp9EecE8PTbxZX0ad2m', 0.75, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:09:49.938', '2026-01-08 11:09:49.938', 0, 'user', 1),
	(188, 'Lana Durlacher', 'lana@bfi.at', '$2y$10$uSejBQl5boJJCF2sIPXCSOgl84Fr5KrhqPUYNGB9L6tjk3wnZdYu6', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:10:08.922', '2026-01-08 10:35:14.229', 0, 'user', 1),
	(189, 'Jeton Arifi', 'jeton@bfi.at', '$2y$10$zNs2iRXrLD/I1ofwH7J3iuXCYtBslPFKbd5XIk5ddeESjyElraVQK', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-08 11:11:36.361', '2026-01-08 11:11:36.361', 0, 'user', 1),
	(190, 'Toni1', 'toni1@bfi.at', '$2y$10$ewmLL9WtRTthNoPnbeRL7OhQn23GMwrmHg66qjylmSOMGkVBsmv7K', NULL, 1, 0, NULL, NULL, 0, NULL, '2026-01-11 12:37:11.200', '2026-01-11 12:37:11.200', 0, 'user', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
