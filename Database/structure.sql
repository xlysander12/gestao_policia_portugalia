-- --------------------------------------------------------
-- Host:                         mysql.crunchypi.xyz
-- Server version:               10.11.13-MariaDB-0ubuntu0.24.04.1-log - Ubuntu 24.04
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for portugalia_gestao_psp
CREATE DATABASE IF NOT EXISTS `portugalia_gestao_psp` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `portugalia_gestao_psp`;

-- Dumping structure for table portugalia_gestao_psp.announcements
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author` int(11) NOT NULL,
  `forces` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`forces`)),
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`tags`)),
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `expiration` datetime DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `body` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_announcements_author` (`author`),
  CONSTRAINT `FK_announcements_author` FOREIGN KEY (`author`) REFERENCES `officers` (`nif`) ON UPDATE CASCADE,
  CONSTRAINT `CC_created_before_expiration` CHECK (`expiration` is null or `expiration` >= `created`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.ceremony_decisions
CREATE TABLE IF NOT EXISTS `ceremony_decisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target` int(11) NOT NULL,
  `category` int(11) NOT NULL,
  `ceremony` int(11) NOT NULL DEFAULT 0,
  `decision` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `1_per_target_per_ceremony` (`category`,`target`,`ceremony`),
  KEY `FK_ceremony_decisions_ceremony` (`ceremony`),
  KEY `FK_ceremony_decisions_decision` (`decision`),
  KEY `FK_ceremony_decisions_target` (`target`),
  CONSTRAINT `FK_ceremony_decisions_category` FOREIGN KEY (`category`) REFERENCES `patent_categories` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_ceremony_decisions_ceremony` FOREIGN KEY (`ceremony`) REFERENCES `events` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_ceremony_decisions_decision` FOREIGN KEY (`decision`) REFERENCES `evaluation_decisions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_ceremony_decisions_target` FOREIGN KEY (`target`) REFERENCES `officers` (`nif`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.errors
CREATE TABLE IF NOT EXISTS `errors` (
  `code` varchar(50) NOT NULL,
  `route` varchar(50) NOT NULL,
  `method` enum('GET','POST','PUT','PATCH','DELETE','HEAD') NOT NULL,
  `body` longtext DEFAULT NULL CHECK (json_valid(`body`)),
  `nif` int(11) DEFAULT NULL,
  `stack` longtext NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `reported` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`code`),
  KEY `FK_errors_officers` (`nif`),
  CONSTRAINT `FK_errors_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.evaluation_decisions
CREATE TABLE IF NOT EXISTS `evaluation_decisions` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.evaluation_fields
CREATE TABLE IF NOT EXISTS `evaluation_fields` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `starting_patent` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_evaluation_fields_starting_patent` (`starting_patent`),
  CONSTRAINT `FK_evaluation_fields_starting_patent` FOREIGN KEY (`starting_patent`) REFERENCES `patents` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.evaluation_grades
CREATE TABLE IF NOT EXISTS `evaluation_grades` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.evaluations
CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target` int(11) NOT NULL,
  `author` int(11) NOT NULL,
  `patrol` int(11) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `decision` int(11) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_evaluations_target` (`target`),
  KEY `FK_evaluations_author` (`author`),
  KEY `FK_evaluations_patrol` (`patrol`),
  KEY `FK_evaluations_decision` (`decision`),
  CONSTRAINT `FK_evaluations_author` FOREIGN KEY (`author`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_evaluations_decision` FOREIGN KEY (`decision`) REFERENCES `evaluation_decisions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_evaluations_patrol` FOREIGN KEY (`patrol`) REFERENCES `patrols` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_evaluations_target` FOREIGN KEY (`target`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=591 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.evaluations_data
CREATE TABLE IF NOT EXISTS `evaluations_data` (
  `evaluation` int(11) NOT NULL,
  `field` int(11) NOT NULL,
  `grade` int(11) NOT NULL,
  `comments` text DEFAULT NULL,
  UNIQUE KEY `K_evaluations_data_unique_field_per_evaluation` (`evaluation`,`field`),
  KEY `FK_evaluations_data_field` (`field`),
  KEY `FK_evaluations_data_grade` (`grade`),
  KEY `FK_evaluations_data_evaluation` (`evaluation`) USING BTREE,
  CONSTRAINT `FK_evaluations_data_evaluation` FOREIGN KEY (`evaluation`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_evaluations_data_field` FOREIGN KEY (`field`) REFERENCES `evaluation_fields` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_evaluations_data_grade` FOREIGN KEY (`grade`) REFERENCES `evaluation_grades` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.event_types
CREATE TABLE IF NOT EXISTS `event_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `variant` enum('custom','ceremony','special_unit') NOT NULL DEFAULT 'custom',
  `intent` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_event_types_intent` (`intent`),
  CONSTRAINT `FK_event_types_intent` FOREIGN KEY (`intent`) REFERENCES `intents` (`name`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.events
CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL,
  `special_unit` int(11) DEFAULT NULL,
  `author` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `assignees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`assignees`)),
  `start` datetime NOT NULL DEFAULT current_timestamp(),
  `end` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FK_events_type` (`type`),
  KEY `FK_events_special_unit` (`special_unit`),
  KEY `FK_events_author` (`author`),
  CONSTRAINT `FK_events_author` FOREIGN KEY (`author`) REFERENCES `officers` (`nif`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `FK_events_special_unit` FOREIGN KEY (`special_unit`) REFERENCES `special_units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_events_type` FOREIGN KEY (`type`) REFERENCES `event_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `CC_start_before_end` CHECK (`start` <= `end`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.inactivity_types
CREATE TABLE IF NOT EXISTS `inactivity_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `color` varchar(50) NOT NULL,
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_inactivity_types_status` (`status`),
  CONSTRAINT `FK_inactivity_types_status` FOREIGN KEY (`status`) REFERENCES `status` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.intents
CREATE TABLE IF NOT EXISTS `intents` (
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.last_ceremony
CREATE TABLE IF NOT EXISTS `last_ceremony` (
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.officer_hours
CREATE TABLE IF NOT EXISTS `officer_hours` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `officer` int(11) NOT NULL,
  `week_start` date NOT NULL,
  `week_end` date NOT NULL,
  `minutes` int(11) NOT NULL,
  `submitted_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_hours_officers` (`officer`),
  KEY `FK_officer_hours_officers` (`submitted_by`),
  CONSTRAINT `FK_officer_hours_officers` FOREIGN KEY (`submitted_by`) REFERENCES `officers` (`nif`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `CC_officer_hours_start_greater_end` CHECK (`week_end` > `week_start`)
) ENGINE=InnoDB AUTO_INCREMENT=1435 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.officer_justifications
CREATE TABLE IF NOT EXISTS `officer_justifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `officer` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `start_date` date NOT NULL DEFAULT current_timestamp(),
  `end_date` date DEFAULT NULL,
  `description` text NOT NULL,
  `status` enum('pending','denied','approved') NOT NULL DEFAULT 'pending',
  `comment` text DEFAULT NULL,
  `managed_by` int(11) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FK_officer_justifications_officer` (`officer`),
  KEY `FK_officer_justifications_officers` (`managed_by`),
  KEY `FK_officer_justifications_type` (`type`),
  CONSTRAINT `FK_officer_justifications_officer` FOREIGN KEY (`officer`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_officer_justifications_officers` FOREIGN KEY (`managed_by`) REFERENCES `officers` (`nif`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `FK_officer_justifications_type` FOREIGN KEY (`type`) REFERENCES `inactivity_types` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=158 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.officer_last_dates_fields
CREATE TABLE IF NOT EXISTS `officer_last_dates_fields` (
  `id` varchar(50) NOT NULL,
  `display` text NOT NULL,
  `max_days` int(11) DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.officer_last_dates_values
CREATE TABLE IF NOT EXISTS `officer_last_dates_values` (
  `officer` int(11) NOT NULL,
  `field` varchar(50) NOT NULL,
  `last_date` date DEFAULT NULL,
  UNIQUE KEY `unique_date_per_field_per_office` (`officer`,`field`),
  KEY `FK_last_shift_officer` (`officer`),
  KEY `FK_last_dates_field` (`field`),
  CONSTRAINT `FK_last_dates_field` FOREIGN KEY (`field`) REFERENCES `officer_last_dates_fields` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_last_dates_officer` FOREIGN KEY (`officer`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.officers
CREATE TABLE IF NOT EXISTS `officers` (
  `name` varchar(50) NOT NULL,
  `patent` int(11) NOT NULL DEFAULT 1,
  `callsign` varchar(50) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 5,
  `entry_date` date NOT NULL DEFAULT current_timestamp(),
  `promotion_date` date DEFAULT NULL,
  `phone` int(9) NOT NULL,
  `nif` int(9) NOT NULL,
  `iban` varchar(10) NOT NULL,
  `kms` int(11) NOT NULL DEFAULT 0,
  `discord` varchar(50) NOT NULL DEFAULT '',
  `steam` varchar(255) NOT NULL DEFAULT 'steam:0',
  `visible` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `fired` tinyint(3) NOT NULL DEFAULT 0,
  `fire_reason` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`nif`),
  UNIQUE KEY `Unique Info` (`nif`,`discord`,`iban`,`phone`),
  KEY `FK_officers_patents` (`patent`),
  KEY `FK_officers_status` (`status`),
  CONSTRAINT `FK_officers_patents` FOREIGN KEY (`patent`) REFERENCES `patents` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_officers_status` FOREIGN KEY (`status`) REFERENCES `status` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `telemovel_valido` CHECK (`phone` regexp '^[0-9]{9}$'),
  CONSTRAINT `visivel_valido` CHECK (`visible` = 0 or `visible` = 1),
  CONSTRAINT `callsign_valida` CHECK (`callsign` regexp '^[FSOCA]-([0-9]){2}$'),
  CONSTRAINT `kms_valido` CHECK (`kms` < 5000 or `kms` = 5000),
  CONSTRAINT `nif_valido` CHECK (`nif` regexp '^[0-9]{7,9}$'),
  CONSTRAINT `iban_valido` CHECK (`iban` regexp '^(PT|OK)[0-9]{5,8}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='General information about all officers in the force';

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.patent_categories
CREATE TABLE IF NOT EXISTS `patent_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.patents
CREATE TABLE IF NOT EXISTS `patents` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `category` int(11) NOT NULL,
  `max_evaluation` int(11) NOT NULL DEFAULT -2,
  `leading_char` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_patents_category` (`category`),
  CONSTRAINT `FK_patents_category` FOREIGN KEY (`category`) REFERENCES `patent_categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.patrols
CREATE TABLE IF NOT EXISTS `patrols` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL,
  `special_unit` int(11) DEFAULT NULL,
  `registrar` int(11) NOT NULL,
  `officers` longtext NOT NULL CHECK (json_valid(`officers`)),
  `start` datetime NOT NULL DEFAULT current_timestamp(),
  `end` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `canceled` tinyint(4) GENERATED ALWAYS AS (if(timestampdiff(MINUTE,`start`,`end`) < 5,1,0)) STORED,
  PRIMARY KEY (`id`),
  KEY `FK_patrols_type` (`type`),
  KEY `FK_patrols_special_unit` (`special_unit`),
  KEY `FK_patrols_registrar` (`registrar`),
  CONSTRAINT `FK_patrols_registrar` FOREIGN KEY (`registrar`) REFERENCES `officers` (`nif`) ON UPDATE CASCADE,
  CONSTRAINT `FK_patrols_special_unit` FOREIGN KEY (`special_unit`) REFERENCES `special_units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_patrols_type` FOREIGN KEY (`type`) REFERENCES `patrols_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `start_before_end` CHECK (`start` < `end`)
) ENGINE=InnoDB AUTO_INCREMENT=1968 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.patrols_types
CREATE TABLE IF NOT EXISTS `patrols_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `special` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `session` varchar(64) NOT NULL,
  `nif` int(11) NOT NULL,
  `persistent` tinyint(4) NOT NULL DEFAULT 0,
  `last_used` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`session`),
  KEY `FK_tokens_users` (`nif`),
  CONSTRAINT `FK_tokens_users` FOREIGN KEY (`nif`) REFERENCES `users` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.special_units
CREATE TABLE IF NOT EXISTS `special_units` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT '',
  `acronym` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.specialunits_officers
CREATE TABLE IF NOT EXISTS `specialunits_officers` (
  `officer` int(11) NOT NULL,
  `unit` int(11) NOT NULL,
  `role` int(11) NOT NULL,
  UNIQUE KEY `K_special_units_officers_unique_role_per_unit` (`officer`,`unit`),
  KEY `Unidades_Unidade_FK` (`unit`) USING BTREE,
  KEY `Unidades_Cargo_FK` (`role`) USING BTREE,
  KEY `FK_specialunits_officers_officers` (`officer`) USING BTREE,
  CONSTRAINT `FK_specialunits_officers_officers` FOREIGN KEY (`officer`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_special_units` FOREIGN KEY (`unit`) REFERENCES `special_units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_specialunits_roles` FOREIGN KEY (`role`) REFERENCES `specialunits_roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.specialunits_roles
CREATE TABLE IF NOT EXISTS `specialunits_roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.status
CREATE TABLE IF NOT EXISTS `status` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(50) DEFAULT NULL,
  `can_patrol` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.user_intents
CREATE TABLE IF NOT EXISTS `user_intents` (
  `user` int(11) NOT NULL,
  `intent` varchar(50) NOT NULL,
  `enabled` tinyint(4) NOT NULL DEFAULT 0,
  UNIQUE KEY `UNIQUE_intent_per_user` (`user`,`intent`),
  KEY `FK_user_intents_intent` (`intent`),
  CONSTRAINT `FK_user_intents_intent` FOREIGN KEY (`intent`) REFERENCES `intents` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_user_intents_user` FOREIGN KEY (`user`) REFERENCES `users` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CC_users_intents_enabled` CHECK (`enabled` = 0 or `enabled` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.users
CREATE TABLE IF NOT EXISTS `users` (
  `nif` int(11) NOT NULL COMMENT 'String usada como username. Será o nif do agente em questão',
  `password` varchar(255) DEFAULT NULL COMMENT 'Password "hashed" da conta do agente. NULL significa que a palavra passe é "seguranca"',
  `password_login` tinyint(4) NOT NULL DEFAULT 1,
  `discord_login` tinyint(4) NOT NULL DEFAULT 1,
  `suspended` tinyint(1) NOT NULL DEFAULT 0,
  `last_interaction` datetime DEFAULT NULL,
  PRIMARY KEY (`nif`),
  CONSTRAINT `FK_users_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela com informações de login e permissões de todos os usuarios';

-- Data exporting was unselected.

-- Dumping structure for view portugalia_gestao_psp.announcementsV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `announcementsV` (
	`id` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci',
	`author` INT(11) NOT NULL,
	`forces` LONGTEXT NOT NULL COLLATE 'utf8mb4_bin',
	`tags` LONGTEXT NOT NULL COLLATE 'utf8mb4_bin',
	`created` DATETIME NOT NULL,
	`expiration` DATETIME NULL,
	`title` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`body` LONGTEXT NOT NULL COLLATE 'utf8mb4_unicode_ci'
);

-- Dumping structure for view portugalia_gestao_psp.ceremony_decisionsV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `ceremony_decisionsV` (
	`id` INT(11) NOT NULL,
	`target` INT(11) NOT NULL,
	`category` INT(11) NOT NULL,
	`ceremony` INT(11) NOT NULL,
	`decision` INT(11) NULL,
	`details` TEXT NULL COLLATE 'utf8mb4_unicode_ci'
);

-- Dumping structure for view portugalia_gestao_psp.evaluationsV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `evaluationsV` (
	`id` INT(11) NOT NULL,
	`target` INT(11) NOT NULL,
	`author` INT(11) NOT NULL,
	`patrol` INT(11) NULL,
	`comments` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`decision` INT(11) NULL,
	`timestamp` DATETIME NULL
);

-- Dumping structure for view portugalia_gestao_psp.eventsV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `eventsV` (
	`id` INT(11) NOT NULL,
	`force` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci',
	`type` INT(11) NOT NULL,
	`special_unit` INT(11) NULL,
	`author` INT(11) NOT NULL,
	`title` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`description` MEDIUMTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`assignees` LONGTEXT NOT NULL COLLATE 'utf8mb4_bin',
	`start` DATETIME NOT NULL,
	`end` DATETIME NOT NULL
);

-- Dumping structure for view portugalia_gestao_psp.officersV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `officersV` (
	`name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`patent` INT(11) NOT NULL,
	`patentCategory` INT(11) NOT NULL,
	`callsign` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`status` INT(11) NOT NULL,
	`entry_date` DATE NOT NULL,
	`promotion_date` DATE NULL,
	`phone` INT(9) NOT NULL,
	`nif` INT(9) NOT NULL,
	`iban` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`kms` INT(11) NOT NULL,
	`discord` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`steam` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci'
);

-- Dumping structure for view portugalia_gestao_psp.officersVPatrols
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `officersVPatrols` (
	`name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`patent` INT(11) NOT NULL,
	`patentCategory` INT(11) NOT NULL,
	`callsign` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`status` INT(11) NOT NULL,
	`entry_date` DATE NOT NULL,
	`promotion_date` DATE NULL,
	`phone` INT(11) NOT NULL,
	`nif` INT(11) NOT NULL,
	`iban` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`kms` INT(11) NOT NULL,
	`discord` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`steam` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`officerForce` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci'
);

-- Dumping structure for view portugalia_gestao_psp.patrolsV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `patrolsV` (
	`id` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci',
	`type` INT(11) NOT NULL,
	`special_unit` INT(11) NULL,
	`registrar` INT(11) NOT NULL,
	`officers` LONGTEXT NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`start` DATETIME NOT NULL,
	`end` DATETIME NULL,
	`notes` MEDIUMTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`canceled` TINYINT(4) NULL
);

-- Dumping structure for procedure portugalia_gestao_psp.CheckPatrolSpecial
DELIMITER //
CREATE PROCEDURE `CheckPatrolSpecial`(
	IN `type_id` INT,
	IN `unit_value` INT
)
    READS SQL DATA
    DETERMINISTIC
BEGIN
	DECLARE is_type_special TINYINT;
	SELECT special INTO is_type_special FROM patrols_types WHERE id = type_id;

   IF is_type_special = 1 AND unit_value IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Special unit is required for special patrols';
   END IF;
   
   IF is_type_special = 0 AND unit_value IS NOT NULL THEN
 		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Special unit is not required for regular patrols';
   END IF;
END//
DELIMITER ;

-- Dumping structure for function portugalia_gestao_psp.get_patrol_end
DELIMITER //
CREATE FUNCTION `get_patrol_end`(`patrol_id` INT
) RETURNS timestamp
    READS SQL DATA
BEGIN
	DECLARE patrol_end TIMESTAMP;
	
	SELECT `end` INTO patrol_end
	FROM patrols
	WHERE id = patrol_id
	LIMIT 1;
	
	RETURN patrol_end;
END//
DELIMITER ;

-- Dumping structure for event portugalia_gestao_psp.CheckTokens
DELIMITER //
CREATE EVENT `CheckTokens` ON SCHEDULE EVERY 1 MINUTE STARTS '2025-02-03 19:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
        -- If the token is not persistent and has not been used in the last 2 hours, delete it
        DELETE FROM sessions WHERE persistent = 0 AND TIMESTAMPDIFF(HOUR, last_used, NOW()) > 2;
    
        -- If the token is persistent, instead of 2 hours, check if it has not been used in the last 7 days
        DELETE FROM sessions WHERE persistent = 1 AND TIMESTAMPDIFF(DAY, last_used, NOW()) > 7;
    END//
DELIMITER ;

-- Dumping structure for event portugalia_gestao_psp.EndPatrolsMorning
DELIMITER //
CREATE EVENT `EndPatrolsMorning` ON SCHEDULE EVERY 1 DAY STARTS '2025-02-04 08:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
        UPDATE patrols SET end = CURRENT_TIMESTAMP() WHERE end IS NULL;
    END//
DELIMITER ;

-- Dumping structure for event portugalia_gestao_psp.EndPatrolsNight
DELIMITER //
CREATE EVENT `EndPatrolsNight` ON SCHEDULE EVERY 1 DAY STARTS '2025-02-03 19:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
        UPDATE patrols SET end = CURRENT_TIMESTAMP() WHERE end IS NULL;
    END//
DELIMITER ;

-- Dumping structure for event portugalia_gestao_psp.UpdateLastCeremonyFromEvents
DELIMITER //
CREATE EVENT `UpdateLastCeremonyFromEvents` ON SCHEDULE EVERY 1 MINUTE STARTS '2025-04-23 16:00:00' ON COMPLETION PRESERVE ENABLE DO BEGIN
	DECLARE ceremony DATE;
	
	SELECT 
		`events`.`end`
	INTO
		ceremony
	FROM
		`events`
	JOIN
		event_types ON event_types.id = `events`.`type`
	WHERE
		event_types.variant = "ceremony" AND
		CAST(`events`.`end` AS DATE) > (SELECT COALESCE(MAX(`date`), '1000-01-01') FROM last_ceremony) AND
		`events`.`end` <= CURRENT_TIMESTAMP()
	ORDER BY
		`events`.`end` DESC
	LIMIT 1;
	
	IF ceremony IS NOT NULL THEN
		IF EXISTS (SELECT 1 FROM last_ceremony) THEN
			UPDATE last_ceremony SET `date` = ceremony;
		ELSE
			INSERT INTO last_ceremony (`date`) VALUES (ceremony);
		END IF;
	END IF;
END//
DELIMITER ;

-- Dumping structure for trigger portugalia_gestao_psp.ceremony_decisions_ensure_event_type
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE trigger ceremony_decisions_ensure_event_type
    before insert
    on ceremony_decisions
    for each row
BEGIN
	# Create variable to hold event variant
	DECLARE variant VARCHAR(20);
	
	SELECT 
		event_types.variant INTO variant
	FROM `events`
	JOIN event_types ON `events`.`type` = event_types.id
	WHERE `events`.id = NEW.ceremony;
	
	# If the chosen event is not of variant "ceremony", don't accept it
	IF variant <> 'ceremony' THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ceremony field must be an event of variant "ceremony"';
	END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.evaluations_ensure_timestamp_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `evaluations_ensure_timestamp_insert` BEFORE INSERT ON `evaluations` FOR EACH ROW BEGIN
	IF NEW.patrol IS NULL AND NEW.timestamp IS NULL THEN
		SET NEW.timestamp = CURRENT_TIMESTAMP();
	END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.evaluations_ensure_timestamp_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `evaluations_ensure_timestamp_update` BEFORE UPDATE ON `evaluations` FOR EACH ROW BEGIN
	IF NEW.patrol IS NULL AND NEW.timestamp IS NULL THEN
		SET NEW.timestamp = CURRENT_TIMESTAMP();
	END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.events_ensure_fields_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `events_ensure_fields_insert` BEFORE INSERT ON `events` FOR EACH ROW BEGIN
	# Get the type variant of the Event
	DECLARE variant VARCHAR(20);
	
	SELECT event_types.variant INTO variant FROM event_types WHERE event_types.id = NEW.`type`;

	# If the event type has the "custom" variant, title must not be NULL
	IF variant = 'custom' AND NEW.title IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A title must be given in Custom Events';
	END IF;
	
	# If the event type has the "special_unit" variant, a special unit must be given
	IF variant = 'special_unit' AND NEW.special_unit IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A Special Unit must be given in Special Unit Events';
	END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.events_ensure_fields_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `events_ensure_fields_update` BEFORE UPDATE ON `events` FOR EACH ROW BEGIN
	# Get the type variant of the Event
	DECLARE variant VARCHAR(20);
	
	SELECT event_types.variant INTO variant FROM event_types WHERE event_types.id = NEW.`type`;

	# If the event type has the "custom" variant, title must not be NULL
	IF variant = 'custom' AND NEW.title IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A title must be given in Custom Events';
	END IF;
	
	# If the event type has the "special_unit" variant, a special unit must be given
	IF variant = 'special_unit' AND NEW.special_unit IS NULL THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A Special Unit must be given in Special Unit Events';
	END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.officers_force_callsign_uppercase_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `officers_force_callsign_uppercase_insert` BEFORE INSERT ON `officers` FOR EACH ROW BEGIN
	SET NEW.callsign = UPPER(NEW.callsign);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.officers_force_callsign_uppercase_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `officers_force_callsign_uppercase_update` BEFORE UPDATE ON `officers` FOR EACH ROW BEGIN
	SET NEW.callsign = UPPER(NEW.callsign);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.patrols_check_special_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `patrols_check_special_insert` BEFORE INSERT ON `patrols` FOR EACH ROW BEGIN
	CALL CheckPatrolSpecial(NEW.type, NEW.special_unit);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.patrols_check_special_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `patrols_check_special_update` BEFORE UPDATE ON `patrols` FOR EACH ROW BEGIN
	CALL CheckPatrolSpecial(NEW.type, NEW.special_unit);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `announcementsV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `announcementsV` AS select `combined`.`id` AS `id`,`combined`.`author` AS `author`,`combined`.`forces` AS `forces`,`combined`.`tags` AS `tags`,`combined`.`created` AS `created`,`combined`.`expiration` AS `expiration`,`combined`.`title` AS `title`,`combined`.`body` AS `body` from (select concat('psp',`portugalia_gestao_psp`.`announcements`.`id`) AS `id`,`portugalia_gestao_psp`.`announcements`.`author` AS `author`,`portugalia_gestao_psp`.`announcements`.`forces` AS `forces`,`portugalia_gestao_psp`.`announcements`.`tags` AS `tags`,`portugalia_gestao_psp`.`announcements`.`created` AS `created`,`portugalia_gestao_psp`.`announcements`.`expiration` AS `expiration`,`portugalia_gestao_psp`.`announcements`.`title` AS `title`,`portugalia_gestao_psp`.`announcements`.`body` AS `body` from `portugalia_gestao_psp`.`announcements` union all select concat('gnr',`portugalia_gestao_gnr`.`announcements`.`id`) AS `id`,`portugalia_gestao_gnr`.`announcements`.`author` AS `author`,`portugalia_gestao_gnr`.`announcements`.`forces` AS `forces`,`portugalia_gestao_gnr`.`announcements`.`tags` AS `tags`,`portugalia_gestao_gnr`.`announcements`.`created` AS `created`,`portugalia_gestao_gnr`.`announcements`.`expiration` AS `expiration`,`portugalia_gestao_gnr`.`announcements`.`title` AS `title`,`portugalia_gestao_gnr`.`announcements`.`body` AS `body` from `portugalia_gestao_gnr`.`announcements` where `portugalia_gestao_gnr`.`announcements`.`forces` like '%psp%') `combined` order by case when `combined`.`expiration` is null then 0 else 1 end,`combined`.`created` desc,`combined`.`expiration` desc
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `ceremony_decisionsV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `ceremony_decisionsV` AS select `ceremony_decisions`.`id` AS `id`,`ceremony_decisions`.`target` AS `target`,`ceremony_decisions`.`category` AS `category`,`ceremony_decisions`.`ceremony` AS `ceremony`,`ceremony_decisions`.`decision` AS `decision`,`ceremony_decisions`.`details` AS `details` from (`ceremony_decisions` join `events` on(`ceremony_decisions`.`ceremony` = `events`.`id`)) order by `events`.`start` desc,`ceremony_decisions`.`category` desc
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `evaluationsV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `evaluationsV` AS select `evaluations`.`id` AS `id`,`evaluations`.`target` AS `target`,`evaluations`.`author` AS `author`,`evaluations`.`patrol` AS `patrol`,`evaluations`.`comments` AS `comments`,`evaluations`.`decision` AS `decision`,if(`evaluations`.`patrol` is not null,ifnull(`get_patrol_end`(`evaluations`.`patrol`),current_timestamp()),`evaluations`.`timestamp`) AS `timestamp` from `evaluations` order by if(`evaluations`.`patrol` is not null,ifnull(`get_patrol_end`(`evaluations`.`patrol`),current_timestamp()),`evaluations`.`timestamp`) desc,`evaluations`.`id` desc
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `eventsV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `eventsV` AS select `combined`.`id` AS `id`,`combined`.`force` AS `force`,`combined`.`type` AS `type`,`combined`.`special_unit` AS `special_unit`,`combined`.`author` AS `author`,`combined`.`title` AS `title`,`combined`.`description` AS `description`,`combined`.`assignees` AS `assignees`,`combined`.`start` AS `start`,`combined`.`end` AS `end` from (select `portugalia_gestao_psp`.`events`.`id` AS `id`,`portugalia_gestao_psp`.`events`.`type` AS `type`,`portugalia_gestao_psp`.`events`.`special_unit` AS `special_unit`,`portugalia_gestao_psp`.`events`.`author` AS `author`,case when `portugalia_gestao_psp`.`event_types`.`variant` = 'ceremony' then `portugalia_gestao_psp`.`event_types`.`name` when `portugalia_gestao_psp`.`event_types`.`variant` = 'special_unit' then concat(`portugalia_gestao_psp`.`event_types`.`name`,' - ',`portugalia_gestao_psp`.`special_units`.`name`) else `portugalia_gestao_psp`.`events`.`title` end AS `title`,`portugalia_gestao_psp`.`events`.`description` AS `description`,`portugalia_gestao_psp`.`events`.`assignees` AS `assignees`,`portugalia_gestao_psp`.`events`.`start` AS `start`,`portugalia_gestao_psp`.`events`.`end` AS `end`,'psp' AS `force` from ((`portugalia_gestao_psp`.`events` join `portugalia_gestao_psp`.`event_types` on(`portugalia_gestao_psp`.`events`.`type` = `portugalia_gestao_psp`.`event_types`.`id`)) left join `portugalia_gestao_psp`.`special_units` on(`portugalia_gestao_psp`.`events`.`special_unit` = `portugalia_gestao_psp`.`special_units`.`id`)) union all select `portugalia_gestao_gnr`.`events`.`id` AS `id`,`portugalia_gestao_gnr`.`events`.`type` AS `type`,`portugalia_gestao_gnr`.`events`.`special_unit` AS `special_unit`,`portugalia_gestao_gnr`.`events`.`author` AS `author`,case when `portugalia_gestao_gnr`.`event_types`.`variant` = 'ceremony' then `portugalia_gestao_gnr`.`event_types`.`name` when `portugalia_gestao_gnr`.`event_types`.`variant` = 'special_unit' then concat(`portugalia_gestao_gnr`.`event_types`.`name`,' - ',`portugalia_gestao_gnr`.`special_units`.`name`) else `portugalia_gestao_gnr`.`events`.`title` end AS `title`,`portugalia_gestao_gnr`.`events`.`description` AS `description`,`portugalia_gestao_gnr`.`events`.`assignees` AS `assignees`,`portugalia_gestao_gnr`.`events`.`start` AS `start`,`portugalia_gestao_gnr`.`events`.`end` AS `end`,'gnr' AS `force` from ((`portugalia_gestao_gnr`.`events` join `portugalia_gestao_gnr`.`event_types` on(`portugalia_gestao_gnr`.`events`.`type` = `portugalia_gestao_gnr`.`event_types`.`id`)) left join `portugalia_gestao_gnr`.`special_units` on(`portugalia_gestao_gnr`.`events`.`special_unit` = `portugalia_gestao_gnr`.`special_units`.`id`))) `combined`
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `officersV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `officersV` AS select `officers`.`name` AS `name`,`officers`.`patent` AS `patent`,`patents`.`category` AS `patentCategory`,`officers`.`callsign` AS `callsign`,`officers`.`status` AS `status`,`officers`.`entry_date` AS `entry_date`,`officers`.`promotion_date` AS `promotion_date`,`officers`.`phone` AS `phone`,`officers`.`nif` AS `nif`,`officers`.`iban` AS `iban`,`officers`.`kms` AS `kms`,`officers`.`discord` AS `discord`,`officers`.`steam` AS `steam` from (`officers` join `patents` on(`patents`.`id` = `officers`.`patent`)) where `officers`.`visible` = 1 and `officers`.`fired` = 0 order by `officers`.`patent` desc,cast(substr(`officers`.`callsign`,3) as signed)
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `officersVPatrols`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `officersVPatrols` AS select `combined`.`name` AS `name`,`combined`.`patent` AS `patent`,`combined`.`patent-category` AS `patentCategory`,`combined`.`callsign` AS `callsign`,`combined`.`status` AS `status`,`combined`.`entry_date` AS `entry_date`,`combined`.`promotion_date` AS `promotion_date`,`combined`.`phone` AS `phone`,`combined`.`nif` AS `nif`,`combined`.`iban` AS `iban`,`combined`.`kms` AS `kms`,`combined`.`discord` AS `discord`,`combined`.`steam` AS `steam`,`combined`.`officerForce` AS `officerForce` from (select `portugalia_gestao_psp`.`officers`.`name` AS `name`,`portugalia_gestao_psp`.`officers`.`patent` AS `patent`,`portugalia_gestao_psp`.`patents`.`category` AS `patent-category`,`portugalia_gestao_psp`.`officers`.`callsign` AS `callsign`,`portugalia_gestao_psp`.`officers`.`status` AS `status`,`portugalia_gestao_psp`.`officers`.`entry_date` AS `entry_date`,`portugalia_gestao_psp`.`officers`.`promotion_date` AS `promotion_date`,`portugalia_gestao_psp`.`officers`.`phone` AS `phone`,`portugalia_gestao_psp`.`officers`.`nif` AS `nif`,`portugalia_gestao_psp`.`officers`.`iban` AS `iban`,`portugalia_gestao_psp`.`officers`.`kms` AS `kms`,`portugalia_gestao_psp`.`officers`.`discord` AS `discord`,`portugalia_gestao_psp`.`officers`.`steam` AS `steam`,'psp' AS `officerForce` from (`portugalia_gestao_psp`.`officers` join `portugalia_gestao_psp`.`patents` on(`portugalia_gestao_psp`.`patents`.`id` = `portugalia_gestao_psp`.`officers`.`patent`)) where `portugalia_gestao_psp`.`officers`.`visible` = 1 and `portugalia_gestao_psp`.`officers`.`fired` = 0 union all select `portugalia_gestao_gnr`.`officers`.`name` AS `name`,`portugalia_gestao_gnr`.`officers`.`patent` AS `patent`,`portugalia_gestao_gnr`.`patents`.`category` AS `patent-category`,`portugalia_gestao_gnr`.`officers`.`callsign` AS `callsign`,`portugalia_gestao_gnr`.`officers`.`status` AS `status`,`portugalia_gestao_gnr`.`officers`.`entry_date` AS `entry_date`,`portugalia_gestao_gnr`.`officers`.`promotion_date` AS `promotion_date`,`portugalia_gestao_gnr`.`officers`.`phone` AS `phone`,`portugalia_gestao_gnr`.`officers`.`nif` AS `nif`,`portugalia_gestao_gnr`.`officers`.`iban` AS `iban`,`portugalia_gestao_gnr`.`officers`.`kms` AS `kms`,`portugalia_gestao_gnr`.`officers`.`discord` AS `discord`,`portugalia_gestao_gnr`.`officers`.`steam` AS `steam`,'gnr' AS `officerForce` from (`portugalia_gestao_gnr`.`officers` join `portugalia_gestao_gnr`.`patents` on(`portugalia_gestao_gnr`.`patents`.`id` = `portugalia_gestao_gnr`.`officers`.`patent`)) where `portugalia_gestao_gnr`.`officers`.`visible` = 1 and `portugalia_gestao_gnr`.`officers`.`fired` = 0) `combined` order by `combined`.`patent` desc,cast(substr(`combined`.`callsign`,3) as signed)
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `patrolsV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `patrolsV` AS select concat('psp',`portugalia_gestao_psp`.`patrols`.`id`) AS `id`,`portugalia_gestao_psp`.`patrols`.`type` AS `type`,`portugalia_gestao_psp`.`patrols`.`special_unit` AS `special_unit`,`portugalia_gestao_psp`.`patrols`.`registrar` AS `registrar`,`portugalia_gestao_psp`.`patrols`.`officers` AS `officers`,`portugalia_gestao_psp`.`patrols`.`start` AS `start`,`portugalia_gestao_psp`.`patrols`.`end` AS `end`,`portugalia_gestao_psp`.`patrols`.`notes` AS `notes`,`portugalia_gestao_psp`.`patrols`.`canceled` AS `canceled` from `portugalia_gestao_psp`.`patrols` union all select concat('gnr',`portugalia_gestao_gnr`.`patrols`.`id`) AS `id`,`portugalia_gestao_gnr`.`patrols`.`type` AS `type`,`portugalia_gestao_gnr`.`patrols`.`special_unit` AS `special_unit`,`portugalia_gestao_gnr`.`patrols`.`registrar` AS `registrar`,`portugalia_gestao_gnr`.`patrols`.`officers` AS `officers`,`portugalia_gestao_gnr`.`patrols`.`start` AS `start`,`portugalia_gestao_gnr`.`patrols`.`end` AS `end`,`portugalia_gestao_gnr`.`patrols`.`notes` AS `notes`,`portugalia_gestao_gnr`.`patrols`.`canceled` AS `canceled` from `portugalia_gestao_gnr`.`patrols` order by if(`end` is null,0,1),`start` desc
;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
