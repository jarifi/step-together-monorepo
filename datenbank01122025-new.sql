CREATE TABLE `refresh_tokens` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`token` VARCHAR(500) NOT NULL COLLATE 'utf8mb4_general_ci',
	`user_id` INT(11) NOT NULL,
	`expires_at` DATETIME NOT NULL,
	`revoked` TINYINT(1) NULL DEFAULT NULL,
	`created_at` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `ix_refresh_tokens_token` (`token`) USING BTREE,
	INDEX `user_id` (`user_id`) USING BTREE,
	INDEX `ix_refresh_tokens_id` (`id`) USING BTREE,
	CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=65
;