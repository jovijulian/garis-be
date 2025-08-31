-- MySQL dump 10.13  Distrib 8.4.6, for macos15.4 (arm64)
--
-- Host: localhost    Database: bookingDB
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `room_id` int NOT NULL,
  `purpose` text NOT NULL,
  `booking_date` date NOT NULL,
  `start_time` time NOT NULL,
  `duration_minutes` int NOT NULL,
  `status` enum('Submit','Approved','Rejected') NOT NULL DEFAULT 'Submit',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `room_id` (`room_id`),
  KEY `booking_date` (`booking_date`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,2,1,'Rapat kickoff Proyek Zeta','2025-09-20','10:00:00',90,'Rejected',NULL,NULL),(3,2,2,'Rapat daily','2025-08-31','19:00:00',60,'Approved',NULL,NULL),(4,2,2,'Rapat Sales','2025-08-31','21:00:00',60,'Approved',NULL,NULL),(5,2,2,'Rapat Manajemen','2025-08-31','21:00:00',60,'Approved',NULL,NULL),(6,3,2,'Rapat Proyek Aplikasi','2025-08-31','21:00:00',60,'Approved',NULL,NULL),(7,2,2,'Rapat Outing','2025-08-31','08:00:00',60,'Approved',NULL,NULL),(8,3,2,'Rapat Finance','2025-08-31','09:00:00',60,'Approved',NULL,NULL);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'Ruang Meeting 1','Ruangan Meeting besar lt 2','2025-08-31 01:13:04','2025-08-31 01:13:36','2025-08-31 01:13:48'),(2,'Ruangan Meeting 1','Ruangan Meeting 1 lt 2','2025-08-31 01:13:54','2025-08-31 01:13:54',NULL),(3,'Ruang Meeting 2','Lt 1','2025-08-31 14:33:11','2025-08-31 14:36:32','2025-08-31 14:36:47');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `token` text,
  `role` tinyint NOT NULL DEFAULT '2',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@admin.com','$2b$10$nnhIJShtQN17RQkyAuN00ey30kTRcXjD6Sl/CJH2CeXdOxZMvGJ..',NULL,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IlN1cGVyIEFkbWluIiwiZW1haWwiOiJhZG1pbkBhZG1pbi5jb20iLCJyb2xlIjoxLCJpYXQiOjE3NTY2MzAxMDUsImV4cCI6MTc1NjcxNjUwNX0.j7foeUcamCKEgf4TrPgdgSwR24UxEfPMYT3u2hxasxU',1,NULL,NULL,NULL),(2,'Andi Indrawan Dummy','andi@gmail.com','$2b$10$V5wLZv6fceRAup83gmf5uOc9mB3tHefpuEnYSDn46sLG/feqB0CkO','081312892981',NULL,2,'2025-08-31 00:41:51','2025-08-31 01:02:18',NULL),(3,'Prawira Dummy','prawira@gmail.com','$2b$10$Yr.WCiFTnGuYlmgstpBg5.dUEwG2VQv5Fg2axf0ug4uK.YMQTfbkq','0829281919','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywibmFtZSI6IlByYXdpcmEgRHVtbXkiLCJlbWFpbCI6InByYXdpcmFAZ21haWwuY29tIiwicm9sZSI6MiwiaWF0IjoxNzU2NjMyNzAwLCJleHAiOjE3NTY3MTkxMDB9.IFc4DA7n1rXwrE7HXDN_Mz54riPspWxKby7WF7Ai_vw',2,'2025-08-31 12:59:27','2025-08-31 13:20:33',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-31 19:18:59
