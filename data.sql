-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Lis 19, 2025 at 09:40 PM
-- Wersja serwera: 8.0.44
-- Wersja PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `data`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `kanban_columns`
--

CREATE TABLE `kanban_columns` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_index` int NOT NULL,
  `is_done_column` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `kanban_columns`
--

INSERT INTO `kanban_columns` (`id`, `name`, `module_id`, `order_index`, `is_done_column`, `created_at`) VALUES
('04c78ea9-0049-4bc5-9410-7282970c7830', 'To review', '1843bbef-bf4c-44c1-9736-ab3818df90de', 4, 0, '2025-11-17 22:05:35'),
('0ca0ebf1-b292-44b2-9485-e4e588058c01', 'Done', '1843bbef-bf4c-44c1-9736-ab3818df90de', 3, 0, '2025-11-17 22:16:22'),
('0f82674b-06ee-431f-a034-2741b4477ab5', 'asd', '76864f75-2c41-4e9f-aa91-f34576fc79aa', 0, 0, '2025-11-19 19:30:29'),
('26768fb1-1850-411c-bdc4-0ab228ff9391', 'asd2', '76864f75-2c41-4e9f-aa91-f34576fc79aa', 1, 0, '2025-11-19 19:30:31'),
('2c4fe28c-5777-4f39-a7d6-a14adb94d858', 'Today', '1843bbef-bf4c-44c1-9736-ab3818df90de', 2, 0, '2025-11-17 22:05:27'),
('3f9251cb-1599-40e6-bfc2-00d79c13cfff', 'Sprint', '1843bbef-bf4c-44c1-9736-ab3818df90de', 1, 0, '2025-11-17 22:05:13'),
('49f3e221-1791-4405-a3a3-27717d0c7f9a', 'Backlog', '1843bbef-bf4c-44c1-9736-ab3818df90de', 0, 0, '2025-11-17 22:05:00'),
('d2c1efc9-61ac-4c89-ae25-6e9d1b84db74', 'd', 'c8b40b1a-f92a-408b-8a73-8718309cb0ef', 2, 0, '2025-11-17 22:15:56'),
('d81b3af3-e102-4fe0-8adb-ed559963b1cb', 's', 'c8b40b1a-f92a-408b-8a73-8718309cb0ef', 1, 0, '2025-11-17 22:15:55'),
('e229a31d-bc5e-4d19-a80f-5972c1df71d2', 'a', 'c8b40b1a-f92a-408b-8a73-8718309cb0ef', 0, 0, '2025-11-17 22:15:53');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `modules`
--

CREATE TABLE `modules` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `project_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `modules`
--

INSERT INTO `modules` (`id`, `name`, `description`, `project_id`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
('1843bbef-bf4c-44c1-9736-ab3818df90de', 'Test', NULL, '13278123-dea9-4a08-9cb1-07b8b61dc9dc', NULL, NULL, '2025-11-17 15:44:04', '2025-11-17 15:44:04'),
('76864f75-2c41-4e9f-aa91-f34576fc79aa', 'asd', NULL, 'f5d4afa9-1238-41f8-9372-56293b6c8e76', NULL, NULL, '2025-11-19 19:29:36', '2025-11-19 19:29:36'),
('a6543c61-f29e-4689-93d2-f02576463784', 'Lista 2', NULL, '13278123-dea9-4a08-9cb1-07b8b61dc9dc', NULL, NULL, '2025-11-17 00:40:10', '2025-11-17 15:44:01'),
('c8b40b1a-f92a-408b-8a73-8718309cb0ef', 'Asd', NULL, '13278123-dea9-4a08-9cb1-07b8b61dc9dc', NULL, NULL, '2025-11-17 00:40:25', '2025-11-17 00:40:25');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `projects`
--

CREATE TABLE `projects` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `owner_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `projects`
--

INSERT INTO `projects` (`id`, `name`, `description`, `owner_id`, `created_at`, `updated_at`) VALUES
('13278123-dea9-4a08-9cb1-07b8b61dc9dc', 'test', 'asdasdasd', '4fee0005-f833-4651-9643-4ec355d41a9c', '2025-11-16 22:41:42', '2025-11-16 22:41:49'),
('34bf56ea-90f2-48c9-a414-3f4077f1c018', 'Test', 'asdasd', '0193cbd3-090c-4069-b4bf-06f95ccdbc93', '2025-11-14 13:38:05', '2025-11-14 13:38:05'),
('f5d4afa9-1238-41f8-9372-56293b6c8e76', 'test2', 'asd', '4fee0005-f833-4651-9643-4ec355d41a9c', '2025-11-19 19:29:23', '2025-11-19 19:29:23');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `project_members`
--

CREATE TABLE `project_members` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Zrzut danych tabeli `project_members`
--

INSERT INTO `project_members` (`id`, `project_id`, `user_id`, `project_role`, `created_at`) VALUES
('1a6ad995-aee7-4d61-96ce-be170a08cf30', '13278123-dea9-4a08-9cb1-07b8b61dc9dc', '0e817175-7ce8-4e2a-b4d6-d4e38a79f812', 'DEVELOPER', '2025-11-17 00:13:03'),
('7bc41e8c-6439-4b0c-9195-7653989bb401', '13278123-dea9-4a08-9cb1-07b8b61dc9dc', '0193cbd3-090c-4069-b4bf-06f95ccdbc93', 'DEVELOPER', '2025-11-17 00:07:36'),
('92d55c84-b78b-4043-aadd-0f7aa89ac243', '13278123-dea9-4a08-9cb1-07b8b61dc9dc', '4fee0005-f833-4651-9643-4ec355d41a9c', 'PROJECT_MANAGER', '2025-11-19 19:28:22'),
('fb3ae8c2-6b1b-46fd-a3fb-0d005b5d5648', 'f5d4afa9-1238-41f8-9372-56293b6c8e76', '4fee0005-f833-4651-9643-4ec355d41a9c', 'PROJECT_MANAGER', '2025-11-19 19:29:23');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Zrzut danych tabeli `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `created_at`) VALUES
('1acfacb5-0a03-43d1-ba79-573898ee901e', '4fee0005-f833-4651-9643-4ec355d41a9c', '2025-11-17 00:13:52'),
('35cc6803-e19d-4eb6-988d-6c21cfc25cea', '0193cbd3-090c-4069-b4bf-06f95ccdbc93', '2025-11-14 13:38:19'),
('407d40e9-1e8b-4436-9190-4db43a61d604', '4fee0005-f833-4651-9643-4ec355d41a9c', '2025-11-19 19:33:15'),
('4dd88ef0-4c32-4a96-9fcb-9faa70f07fe9', '4fee0005-f833-4651-9643-4ec355d41a9c', '2025-11-14 00:17:25'),
('c86c979d-48f1-4e9b-a9b4-01670df0ede8', '4fee0005-f833-4651-9643-4ec355d41a9c', '2025-11-13 22:51:53'),
('ced5d00f-32ee-4697-a008-ef3a3dacda30', '4fee0005-f833-4651-9643-4ec355d41a9c', '2025-11-19 19:14:21');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `tasks`
--

CREATE TABLE `tasks` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `module_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `column_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignee_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `task_order_index` int NOT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Zrzut danych tabeli `tasks`
--

INSERT INTO `tasks` (`id`, `title`, `description`, `module_id`, `column_id`, `assignee_id`, `reporter_id`, `priority`, `task_order_index`, `due_date`, `created_at`, `updated_at`) VALUES
('241873f6-ea90-415b-b651-56351ec46ba0', 'asdddasd', NULL, 'c8b40b1a-f92a-408b-8a73-8718309cb0ef', 'd2c1efc9-61ac-4c89-ae25-6e9d1b84db74', NULL, '92d55c84-b78b-4043-aadd-0f7aa89ac243', 'MEDIUM', 0, NULL, '2025-11-19 19:28:22', '2025-11-19 20:53:07'),
('68bae628-d853-4dc4-ab40-0d8330ee9d58', 'asd', NULL, 'c8b40b1a-f92a-408b-8a73-8718309cb0ef', 'd2c1efc9-61ac-4c89-ae25-6e9d1b84db74', NULL, '92d55c84-b78b-4043-aadd-0f7aa89ac243', 'MEDIUM', 1, NULL, '2025-11-19 20:52:40', '2025-11-19 20:53:07'),
('85c9c81c-a7fa-48aa-bb55-787534971fd8', 'asd', NULL, '76864f75-2c41-4e9f-aa91-f34576fc79aa', '0f82674b-06ee-431f-a034-2741b4477ab5', NULL, 'fb3ae8c2-6b1b-46fd-a3fb-0d005b5d5648', 'MEDIUM', 0, NULL, '2025-11-19 19:31:13', '2025-11-19 19:31:37');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `task_comments`
--

CREATE TABLE `task_comments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `time_logs`
--

CREATE TABLE `time_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_minutes` int NOT NULL,
  `log_date` date NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pwd_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `system_role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Zrzut danych tabeli `users`
--

INSERT INTO `users` (`id`, `email`, `full_name`, `pwd_hash`, `system_role`, `created_at`, `updated_at`) VALUES
('0193cbd3-090c-4069-b4bf-06f95ccdbc93', 'test2@gmail.com', 'Jakub Testowy', '$2b$10$matmYKKb7VLUTzf.0LpmNumSUPl5pV2CFBkvX7Bq.yOsT/i6KavMy', 'USER', '2025-11-14 13:37:45', '2025-11-14 13:37:45'),
('0e817175-7ce8-4e2a-b4d6-d4e38a79f812', 'test3@gmail.com', 'Testowy Test', '$2b$10$5l3O/aq8T.P9OAYCR/1OWu21T1QlG67kbB4dRTVLiNiSRpAKmnRKK', 'USER', '2025-11-17 00:12:47', '2025-11-17 00:12:47'),
('4fee0005-f833-4651-9643-4ec355d41a9c', 'test@gmail.com', 'Jakub Testowy', '$2b$10$vrjBqwRLudXZ3GEXjleU8.79O4Rkh9uUECUdGKfSx6e5LFF5TVfZO', 'USER', '2025-11-06 19:56:03', '2025-11-13 20:24:29');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `kanban_columns`
--
ALTER TABLE `kanban_columns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_module_id_fk` (`module_id`);

--
-- Indeksy dla tabeli `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indeksy dla tabeli `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indeksy dla tabeli `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_id` (`project_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeksy dla tabeli `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeksy dla tabeli `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module_id` (`module_id`),
  ADD KEY `column_id` (`column_id`),
  ADD KEY `assignee_id` (`assignee_id`),
  ADD KEY `reporter_id` (`reporter_id`);

--
-- Indeksy dla tabeli `task_comments`
--
ALTER TABLE `task_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `author_id` (`author_id`);

--
-- Indeksy dla tabeli `time_logs`
--
ALTER TABLE `time_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `member_id` (`member_id`);

--
-- Indeksy dla tabeli `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `kanban_columns`
--
ALTER TABLE `kanban_columns`
  ADD CONSTRAINT `kanban_columns_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `modules`
--
ALTER TABLE `modules`
  ADD CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

--
-- Ograniczenia dla tabeli `project_members`
--
ALTER TABLE `project_members`
  ADD CONSTRAINT `project_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ograniczenia dla tabeli `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`column_id`) REFERENCES `kanban_columns` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`assignee_id`) REFERENCES `project_members` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_ibfk_4` FOREIGN KEY (`reporter_id`) REFERENCES `project_members` (`id`) ON DELETE RESTRICT;

--
-- Ograniczenia dla tabeli `task_comments`
--
ALTER TABLE `task_comments`
  ADD CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `project_members` (`id`) ON DELETE RESTRICT;

--
-- Ograniczenia dla tabeli `time_logs`
--
ALTER TABLE `time_logs`
  ADD CONSTRAINT `time_logs_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `time_logs_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `project_members` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
