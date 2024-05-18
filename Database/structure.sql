-- --------------------------------------------------------
-- Host:                         mysql.crunchypi.xyz
-- Server version:               10.6.16-MariaDB-0ubuntu0.22.04.1 - Ubuntu 22.04
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             12.7.0.6850
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for portugalia_gestao_gnr
CREATE DATABASE IF NOT EXISTS `portugalia_gestao_gnr` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `portugalia_gestao_gnr`;

-- Dumping structure for table portugalia_gestao_gnr.officers
CREATE TABLE IF NOT EXISTS `officers` (
  `name` varchar(50) NOT NULL,
  `patent` int(11) NOT NULL DEFAULT 0,
  `callsign` varchar(50) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `entry_date` date NOT NULL DEFAULT current_timestamp(),
  `promotion_date` date DEFAULT NULL,
  `phone` int(9) DEFAULT NULL,
  `nif` int(9) NOT NULL,
  `iban` varchar(10) DEFAULT NULL,
  `kms` int(11) NOT NULL DEFAULT 0,
  `discord` bigint(20) NOT NULL,
  `steam` varchar(50) DEFAULT NULL,
  `visible` tinyint(3) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`nif`),
  UNIQUE KEY `Unique Info` (`nif`,`discord`,`iban`,`phone`,`steam`) USING BTREE,
  KEY `FK_officers_patents` (`patent`),
  KEY `FK_officers_status` (`status`),
  CONSTRAINT `FK_officers_patents` FOREIGN KEY (`patent`) REFERENCES `patents` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_officers_status` FOREIGN KEY (`status`) REFERENCES `status` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `telemovel_valido` CHECK (`phone` regexp '^[0-9]{9}$'),
  CONSTRAINT `nif_valido` CHECK (`nif` regexp '^[0-9]{9}$'),
  CONSTRAINT `iban_valido` CHECK (`iban` regexp '^PT[0-9]{5,8}$'),
  CONSTRAINT `visivel_valido` CHECK (`visible` = 0 or `visible` = 1),
  CONSTRAINT `callsign_valida` CHECK (`callsign` regexp '^[FSOCA]-[0-9]+$' or `callsign` = NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='General information about all officers in the force';

-- Data exporting was unselected.

-- Dumping structure for view portugalia_gestao_gnr.officersV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `officersV` (
	`name` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_general_ci',
	`patent` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`callsign` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`status` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`entry_date` DATE NOT NULL,
	`promotion_date` DATE NULL,
	`phone` INT(9) NULL,
	`nif` INT(9) NOT NULL,
	`iban` VARCHAR(10) NULL COLLATE 'utf8mb4_general_ci',
	`kms` INT(11) NOT NULL,
	`discord` BIGINT(20) NOT NULL,
	`steam` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci'
) ENGINE=MyISAM;

-- Dumping structure for table portugalia_gestao_gnr.patents
CREATE TABLE IF NOT EXISTS `patents` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `max_evaluation` int(11) NOT NULL DEFAULT -2,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_gnr.specialunits_officers
CREATE TABLE IF NOT EXISTS `specialunits_officers` (
  `nif` int(11) NOT NULL,
  `unit` int(11) NOT NULL,
  `role` int(11) NOT NULL,
  KEY `Unidades_Unidade_FK` (`unit`) USING BTREE,
  KEY `Unidades_Cargo_FK` (`role`) USING BTREE,
  KEY `FK_specialunits_officers_officers` (`nif`),
  CONSTRAINT `FK_specialunits_officers_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_special_units` FOREIGN KEY (`unit`) REFERENCES `special_units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_specialunits_roles` FOREIGN KEY (`role`) REFERENCES `specialunits_roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_gnr.specialunits_roles
CREATE TABLE IF NOT EXISTS `specialunits_roles` (
  `id` int(11) NOT NULL,
  `role` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_gnr.special_units
CREATE TABLE IF NOT EXISTS `special_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT '',
  `acronym` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_gnr.status
CREATE TABLE IF NOT EXISTS `status` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_gnr.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `token` varchar(50) NOT NULL,
  `nif` int(11) NOT NULL,
  `last_used` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`token`),
  KEY `FK_tokens_users` (`nif`),
  CONSTRAINT `FK_tokens_users` FOREIGN KEY (`nif`) REFERENCES `users` (`nif`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for procedure portugalia_gestao_gnr.TransferOfficerToArchive
DELIMITER //
CREATE PROCEDURE `TransferOfficerToArchive`(
	IN `OfficerNif` INT,
	IN `Reason` TEXT
)
    MODIFIES SQL DATA
    SQL SECURITY INVOKER
    COMMENT 'Transfers all officer data to the archive database'
BEGIN
	DECLARE loop_val INT;
   DECLARE num_rows INT;
   DECLARE working_table VARCHAR(100);
	
   /* Create a temporary table that will store all tables that need to be copied */
   /* Delete this table if it already exists*/
   DROP TEMPORARY TABLE IF EXISTS ToTransferTables;
   CREATE TEMPORARY TABLE ToTransferTables (id INT, nome VARCHAR(100));
	 
   INSERT INTO ToTransferTables
   VALUES (0, 'officers'), (1, 'specialunits_officers');
	 
   /* Get the number of rows in the temporary table */
   SELECT COUNT(*) INTO num_rows FROM ToTransferTables;
	 
   /* Initialize loop_val to 0 */
   SET loop_val = 0;
	 
   /* Start loop */
   WHILE loop_val < num_rows DO
   	/* Get the table name */
   	SELECT nome INTO working_table FROM ToTransferTables WHERE id = loop_val;
		
		/* Get the names of all columns separately */
		SET @table_columns = (SELECT GROUP_CONCAT(COLUMN_NAME) FROM information_schema.COLUMNS WHERE table_schema = 'portugalia_gestao_psp' AND TABLE_NAME = working_table AND COLUMN_NAME != 'despedimento');
		
      /* Transfer the values to the archive DB */
      SET @statement = CONCAT('INSERT INTO portugalia_gestao_psp_arquivo.', working_table, ' (', @table_columns, ') SELECT ', @table_columns, ' FROM portugalia_gestao_psp.', working_table, ' WHERE nif = ?');
      PREPARE stmt FROM @statement;
      EXECUTE stmt USING OfficerNif;
      DEALLOCATE PREPARE stmt;
		
		/* Increment loop_val */
		SET loop_val = loop_val + 1;
	END WHILE;
	
	/* Update the "firing_reason" column in the archive table */
	UPDATE portugalia_gestao_psp_arquivo.officers SET firing_reason = Reason WHERE nif = OfficerNif;
	
	/* Drop the temporary table */
	DROP TEMPORARY TABLE ToTransferTables;
END//
DELIMITER ;

-- Dumping structure for table portugalia_gestao_gnr.users
CREATE TABLE IF NOT EXISTS `users` (
  `nif` int(11) NOT NULL COMMENT 'String usada como username. Será o nif do agente em questão',
  `password` varchar(50) DEFAULT NULL COMMENT 'Password "hashed" da conta do agente. NULL significa que a palavra passe é "seguranca"',
  `intents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{"officer": false, "inactivity": false, "punishments": false, "evaluations": false}' COMMENT 'JSON com todos os intents (AKA permissoes) que a conta tem.\r\nLista de todos os Intents:\r\nofficer (Insert, Delete or Alter officer basic information)\r\ninactivity (Accept or Deny Inactivity requests)\r\npunishments (Insert, Delete or Alter officer punishments history)',
  PRIMARY KEY (`nif`),
  CONSTRAINT `FK_users_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabela com informações de login e permissões de todos os usuarios';

-- Data exporting was unselected.

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `officersV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `portugalia_gestao_gnr`.`officersV` AS select `a`.`name` AS `name`,`b`.`name` AS `patent`,`a`.`callsign` AS `callsign`,`c`.`name` AS `status`,`a`.`entry_date` AS `entry_date`,`a`.`promotion_date` AS `promotion_date`,`a`.`phone` AS `phone`,`a`.`nif` AS `nif`,`a`.`iban` AS `iban`,`a`.`kms` AS `kms`,`a`.`discord` AS `discord`,`a`.`steam` AS `steam` from ((`portugalia_gestao_psp`.`officers` `a` join `portugalia_gestao_psp`.`patents` `b`) join `portugalia_gestao_psp`.`status` `c`) where `a`.`patent` = `b`.`id` and `a`.`status` = `c`.`id` and `a`.`visible` = 1 order by case when `a`.`callsign` like 'F-%' then 1 when `a`.`callsign` like 'S-%' then 2 when `a`.`callsign` like 'O-%' then 3 when `a`.`callsign` like 'C-%' then 4 when `a`.`callsign` like 'A-%' then 5 else 6 end,cast(substr(`a`.`callsign`,3) as signed);


-- Dumping database structure for portugalia_gestao_psp
CREATE DATABASE IF NOT EXISTS `portugalia_gestao_psp` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `portugalia_gestao_psp`;

-- Dumping structure for table portugalia_gestao_psp.officers
CREATE TABLE IF NOT EXISTS `officers` (
  `name` varchar(50) NOT NULL,
  `patent` int(11) NOT NULL DEFAULT 0,
  `callsign` varchar(50) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `entry_date` date NOT NULL DEFAULT current_timestamp(),
  `promotion_date` date DEFAULT NULL,
  `phone` int(9) DEFAULT NULL,
  `nif` int(9) NOT NULL,
  `iban` varchar(10) DEFAULT NULL,
  `kms` int(11) NOT NULL DEFAULT 0,
  `discord` bigint(20) NOT NULL,
  `steam` varchar(50) DEFAULT NULL,
  `visible` tinyint(3) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`nif`),
  UNIQUE KEY `Unique Info` (`nif`,`discord`,`iban`,`phone`,`steam`) USING BTREE,
  KEY `FK_officers_patents` (`patent`),
  KEY `FK_officers_status` (`status`),
  CONSTRAINT `FK_officers_patents` FOREIGN KEY (`patent`) REFERENCES `patents` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_officers_status` FOREIGN KEY (`status`) REFERENCES `status` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `telemovel_valido` CHECK (`phone` regexp '^[0-9]{9}$'),
  CONSTRAINT `nif_valido` CHECK (`nif` regexp '^[0-9]{9}$'),
  CONSTRAINT `iban_valido` CHECK (`iban` regexp '^PT[0-9]{5,8}$'),
  CONSTRAINT `visivel_valido` CHECK (`visible` = 0 or `visible` = 1),
  CONSTRAINT `callsign_valida` CHECK (`callsign` regexp '^[FSOCA]-[0-9]+$' or `callsign` = NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='General information about all officers in the force';

-- Data exporting was unselected.

-- Dumping structure for view portugalia_gestao_psp.officersV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `officersV` (
	`name` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_general_ci',
	`patent` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`callsign` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`status` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`entry_date` DATE NOT NULL,
	`promotion_date` DATE NULL,
	`phone` INT(9) NULL,
	`nif` INT(9) NOT NULL,
	`iban` VARCHAR(10) NULL COLLATE 'utf8mb4_general_ci',
	`kms` INT(11) NOT NULL,
	`discord` BIGINT(20) NOT NULL,
	`steam` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci'
) ENGINE=MyISAM;

-- Dumping structure for table portugalia_gestao_psp.patents
CREATE TABLE IF NOT EXISTS `patents` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `max_evaluation` int(11) NOT NULL DEFAULT -2,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.specialunits_officers
CREATE TABLE IF NOT EXISTS `specialunits_officers` (
  `nif` int(11) NOT NULL,
  `unit` int(11) NOT NULL,
  `role` int(11) NOT NULL,
  KEY `Unidades_Unidade_FK` (`unit`) USING BTREE,
  KEY `Unidades_Cargo_FK` (`role`) USING BTREE,
  KEY `FK_specialunits_officers_officers` (`nif`),
  CONSTRAINT `FK_specialunits_officers_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_special_units` FOREIGN KEY (`unit`) REFERENCES `special_units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_specialunits_roles` FOREIGN KEY (`role`) REFERENCES `specialunits_roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.specialunits_roles
CREATE TABLE IF NOT EXISTS `specialunits_roles` (
  `id` int(11) NOT NULL,
  `role` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.special_units
CREATE TABLE IF NOT EXISTS `special_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT '',
  `acronym` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.status
CREATE TABLE IF NOT EXISTS `status` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `token` varchar(50) NOT NULL,
  `nif` int(11) NOT NULL,
  `last_used` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`token`),
  KEY `FK_tokens_users` (`nif`),
  CONSTRAINT `FK_tokens_users` FOREIGN KEY (`nif`) REFERENCES `users` (`nif`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for procedure portugalia_gestao_psp.TransferOfficerToArchive
DELIMITER //
CREATE PROCEDURE `TransferOfficerToArchive`(
	IN `OfficerNif` INT,
	IN `Reason` TEXT
)
    MODIFIES SQL DATA
    SQL SECURITY INVOKER
    COMMENT 'Transfers all officer data to the archive database'
BEGIN
	DECLARE loop_val INT;
   DECLARE num_rows INT;
   DECLARE working_table VARCHAR(100);
	
   /* Create a temporary table that will store all tables that need to be copied */
   /* Delete this table if it already exists*/
   DROP TEMPORARY TABLE IF EXISTS ToTransferTables;
   CREATE TEMPORARY TABLE ToTransferTables (id INT, nome VARCHAR(100));
	 
   INSERT INTO ToTransferTables
   VALUES (0, 'officers'), (1, 'specialunits_officers');
	 
   /* Get the number of rows in the temporary table */
   SELECT COUNT(*) INTO num_rows FROM ToTransferTables;
	 
   /* Initialize loop_val to 0 */
   SET loop_val = 0;
	 
   /* Start loop */
   WHILE loop_val < num_rows DO
   	/* Get the table name */
   	SELECT nome INTO working_table FROM ToTransferTables WHERE id = loop_val;
		
		/* Get the names of all columns separately */
		SET @table_columns = (SELECT GROUP_CONCAT(COLUMN_NAME) FROM information_schema.COLUMNS WHERE table_schema = 'portugalia_gestao_psp' AND TABLE_NAME = working_table AND COLUMN_NAME != 'despedimento');
		
      /* Transfer the values to the archive DB */
      SET @statement = CONCAT('INSERT INTO portugalia_gestao_psp_arquivo.', working_table, ' (', @table_columns, ') SELECT ', @table_columns, ' FROM portugalia_gestao_psp.', working_table, ' WHERE nif = ?');
      PREPARE stmt FROM @statement;
      EXECUTE stmt USING OfficerNif;
      DEALLOCATE PREPARE stmt;
		
		/* Increment loop_val */
		SET loop_val = loop_val + 1;
	END WHILE;
	
	/* Update the "firing_reason" column in the archive table */
	UPDATE portugalia_gestao_psp_arquivo.officers SET firing_reason = Reason WHERE nif = OfficerNif;
	
	/* Drop the temporary table */
	DROP TEMPORARY TABLE ToTransferTables;
END//
DELIMITER ;

-- Dumping structure for table portugalia_gestao_psp.users
CREATE TABLE IF NOT EXISTS `users` (
  `nif` int(11) NOT NULL COMMENT 'String usada como username. Será o nif do agente em questão',
  `password` varchar(50) DEFAULT NULL COMMENT 'Password "hashed" da conta do agente. NULL significa que a palavra passe é "seguranca"',
  `intents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{"officer": false, "inactivity": false, "punishments": false, "evaluations": false}' COMMENT 'JSON com todos os intents (AKA permissoes) que a conta tem.\r\nLista de todos os Intents:\r\nofficer (Insert, Delete or Alter officer basic information)\r\ninactivity (Accept or Deny Inactivity requests)\r\npunishments (Insert, Delete or Alter officer punishments history)',
  PRIMARY KEY (`nif`),
  CONSTRAINT `FK_users_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabela com informações de login e permissões de todos os usuarios';

-- Data exporting was unselected.

-- Dumping structure for trigger portugalia_gestao_psp.ForceCallsignUpperInsert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `ForceCallsignUpperInsert` BEFORE INSERT ON `officers` FOR EACH ROW BEGIN
	SET NEW.callsign = UPPER(NEW.callsign);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger portugalia_gestao_psp.ForceCallsignUpperUpdate
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `ForceCallsignUpperUpdate` BEFORE UPDATE ON `officers` FOR EACH ROW BEGIN
	SET NEW.callsign = UPPER(NEW.callsign);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `officersV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `officersV` AS select `a`.`name` AS `name`,`b`.`name` AS `patent`,`a`.`callsign` AS `callsign`,`c`.`name` AS `status`,`a`.`entry_date` AS `entry_date`,`a`.`promotion_date` AS `promotion_date`,`a`.`phone` AS `phone`,`a`.`nif` AS `nif`,`a`.`iban` AS `iban`,`a`.`kms` AS `kms`,`a`.`discord` AS `discord`,`a`.`steam` AS `steam` from ((`officers` `a` join `patents` `b`) join `status` `c`) where `a`.`patent` = `b`.`id` and `a`.`status` = `c`.`id` and `a`.`visible` = 1 order by case when `a`.`callsign` like 'F-%' then 1 when `a`.`callsign` like 'S-%' then 2 when `a`.`callsign` like 'O-%' then 3 when `a`.`callsign` like 'C-%' then 4 when `a`.`callsign` like 'A-%' then 5 else 6 end,cast(substr(`a`.`callsign`,3) as signed);


-- Dumping database structure for portugalia_gestao_psp_arquivo
CREATE DATABASE IF NOT EXISTS `portugalia_gestao_psp_arquivo` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `portugalia_gestao_psp_arquivo`;

-- Dumping structure for table portugalia_gestao_psp_arquivo.officers
CREATE TABLE IF NOT EXISTS `officers` (
  `name` varchar(50) NOT NULL,
  `patent` int(11) NOT NULL DEFAULT 0,
  `callsign` varchar(50) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `entry_date` date NOT NULL DEFAULT current_timestamp(),
  `promotion_date` date DEFAULT NULL,
  `phone` int(9) DEFAULT NULL,
  `nif` int(9) NOT NULL,
  `iban` varchar(10) DEFAULT NULL,
  `kms` int(11) NOT NULL DEFAULT 0,
  `discord` bigint(20) NOT NULL,
  `steam` varchar(50) DEFAULT NULL,
  `visible` tinyint(3) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`nif`),
  UNIQUE KEY `Unique Info` (`nif`,`discord`,`iban`,`phone`,`steam`) USING BTREE,
  KEY `FK_officers_patents` (`patent`),
  KEY `FK_officers_status` (`status`),
  CONSTRAINT `FK_officers_patents` FOREIGN KEY (`patent`) REFERENCES `patents` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_officers_status` FOREIGN KEY (`status`) REFERENCES `status` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `telemovel_valido` CHECK (`phone` regexp '^[0-9]{9}$'),
  CONSTRAINT `nif_valido` CHECK (`nif` regexp '^[0-9]{9}$'),
  CONSTRAINT `iban_valido` CHECK (`iban` regexp '^PT[0-9]{5,8}$'),
  CONSTRAINT `visivel_valido` CHECK (`visible` = 0 or `visible` = 1),
  CONSTRAINT `callsign_valida` CHECK (`callsign` regexp '^[FSOCA]-[0-9]+$' or `callsign` = NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='General information about all officers in the force';

-- Data exporting was unselected.

-- Dumping structure for view portugalia_gestao_psp_arquivo.officersV
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `officersV` 
) ENGINE=MyISAM;

-- Dumping structure for table portugalia_gestao_psp_arquivo.patents
CREATE TABLE IF NOT EXISTS `patents` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `max_evaluation` int(11) NOT NULL DEFAULT -2,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp_arquivo.specialunits_officers
CREATE TABLE IF NOT EXISTS `specialunits_officers` (
  `nif` int(11) NOT NULL,
  `unit` int(11) NOT NULL,
  `role` int(11) NOT NULL,
  KEY `Unidades_Unidade_FK` (`unit`) USING BTREE,
  KEY `Unidades_Cargo_FK` (`role`) USING BTREE,
  KEY `FK_specialunits_officers_officers` (`nif`),
  CONSTRAINT `FK_specialunits_officers_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_special_units` FOREIGN KEY (`unit`) REFERENCES `special_units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_specialunits_officers_specialunits_roles` FOREIGN KEY (`role`) REFERENCES `specialunits_roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp_arquivo.specialunits_roles
CREATE TABLE IF NOT EXISTS `specialunits_roles` (
  `id` int(11) NOT NULL,
  `role` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp_arquivo.special_units
CREATE TABLE IF NOT EXISTS `special_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT '',
  `acronym` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp_arquivo.status
CREATE TABLE IF NOT EXISTS `status` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp_arquivo.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `token` varchar(50) NOT NULL,
  `nif` int(11) NOT NULL,
  `last_used` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`token`),
  KEY `FK_tokens_users` (`nif`),
  CONSTRAINT `FK_tokens_users` FOREIGN KEY (`nif`) REFERENCES `users` (`nif`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table portugalia_gestao_psp_arquivo.users
CREATE TABLE IF NOT EXISTS `users` (
  `nif` int(11) NOT NULL COMMENT 'String usada como username. Será o nif do agente em questão',
  `password` varchar(50) DEFAULT NULL COMMENT 'Password "hashed" da conta do agente. NULL significa que a palavra passe é "seguranca"',
  `intents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{"officer": false, "inactivity": false, "punishments": false, "evaluations": false}' COMMENT 'JSON com todos os intents (AKA permissoes) que a conta tem.\r\nLista de todos os Intents:\r\nofficer (Insert, Delete or Alter officer basic information)\r\ninactivity (Accept or Deny Inactivity requests)\r\npunishments (Insert, Delete or Alter officer punishments history)',
  PRIMARY KEY (`nif`),
  CONSTRAINT `FK_users_officers` FOREIGN KEY (`nif`) REFERENCES `officers` (`nif`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabela com informações de login e permissões de todos os usuarios';

-- Data exporting was unselected.

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `officersV`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `portugalia_gestao_psp_arquivo`.`officersV` AS select `a`.`name` AS `name`,`b`.`name` AS `patent`,`a`.`callsign` AS `callsign`,`c`.`name` AS `status`,`a`.`entry_date` AS `entry_date`,`a`.`promotion_date` AS `promotion_date`,`a`.`phone` AS `phone`,`a`.`nif` AS `nif`,`a`.`iban` AS `iban`,`a`.`kms` AS `kms`,`a`.`discord` AS `discord`,`a`.`steam` AS `steam`,`a`.`firing_reason` AS `firing_reason` from ((`portugalia_gestao_psp_arquivo`.`officers` `a` join `portugalia_gestao_psp_arquivo`.`patents` `b`) join `portugalia_gestao_psp_arquivo`.`status` `c`) where `a`.`patent` = `b`.`id` and `a`.`status` = `c`.`id` and `a`.`visible` = 1 order by case when `a`.`callsign` like 'F-%' then 1 when `a`.`callsign` like 'S-%' then 2 when `a`.`callsign` like 'O-%' then 3 when `a`.`callsign` like 'C-%' then 4 when `a`.`callsign` like 'A-%' then 5 else 6 end,cast(substr(`a`.`callsign`,3) as signed);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
