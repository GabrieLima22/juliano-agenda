-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geracao: 31/10/2025 as 16:57
-- Versao do servidor: 10.4.32-MariaDB
-- Versao do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `juliano_agenda`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `agenda_closure_settings`
--

CREATE TABLE `agenda_closure_settings` (
  `id` tinyint(3) unsigned NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `message` text DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `agenda_closure_settings` (`id`, `is_enabled`, `starts_at`, `ends_at`, `message`, `updated_at`) VALUES
(1, 0, NULL, NULL, NULL, NOW());

-- --------------------------------------------------------

--
-- Estrutura para tabela `meetings`
--

CREATE TABLE `meetings` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `participants` text NOT NULL,
  `description` text DEFAULT NULL,
  `agenda` text DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `meeting_type` enum('presencial','zoom','meet','external') NOT NULL DEFAULT 'presencial',
  `online_link` varchar(500) DEFAULT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0,
  `recurrence_type` varchar(20) DEFAULT NULL,
  `recurrence_day_of_month` int(11) DEFAULT NULL,
  `recurrence_days_of_week` varchar(100) DEFAULT NULL,
  `recurrence_monthly_week` int(11) DEFAULT NULL,
  `recurrence_monthly_weekday` varchar(10) DEFAULT NULL,
  `recurrence_monthly_rules` text DEFAULT NULL,
  `excluded_occurrence_dates` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `meetings`
--

INSERT INTO `meetings` (`id`, `title`, `date`, `time`, `participants`, `description`, `agenda`, `duration_minutes`, `meeting_type`, `online_link`, `is_recurring`, `recurrence_type`, `recurrence_day_of_month`, `recurrence_days_of_week`, `recurrence_monthly_week`, `recurrence_monthly_weekday`, `excluded_occurrence_dates`, `created_at`, `status`) VALUES
('0587c2e1-d79e-47d8-ad83-2f6d147034c8', '33333', '2025-10-21', '18:52:00', '[\"333\"]', '333', '333', 333, 'presencial', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-31 16:52:55', 'approved'),
('93ef05e6-bf7c-49b9-9275-43753cf3de02', 'teste', '2025-10-21', '19:42:00', '[\"teste\"]', 'teste', 'teste', 35, 'zoom', 'http://localhost/juliano-agenda/api/meetings.php', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-31 16:43:00', 'approved'),
('ed662ba8-48b6-45ae-8659-084ddc2af13c', 'Planejamento', '2025-10-21', '18:10:00', '[\"Juliano\",\"Claudia\",\"Gabriel\"]', 'falar sobre financancas, urgente.', 'falar sobre financancas, urgente.', 20, 'presencial', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-31 16:49:42', 'approved'),
('f48d3521-e3a0-4082-88c0-dafed936d067', 'teste', '2025-10-21', '19:50:00', '[\"tes\"]', 'teste', 'teste', 30, 'zoom', 'http://localhost/juliano-agenda/api/meetings.php', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-31 16:50:25', 'approved');

--
-- Indices para tabelas despejadas
--

ALTER TABLE `meetings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_status` (`status`);

ALTER TABLE `agenda_closure_settings`
  ADD PRIMARY KEY (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
