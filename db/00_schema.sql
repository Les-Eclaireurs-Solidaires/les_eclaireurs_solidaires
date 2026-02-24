-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : lun. 19 jan. 2026 à 07:59
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `pfr_eclaireurs_solidaires`
--

-- --------------------------------------------------------

--
-- Structure de la table `auto_recall`
--

CREATE TABLE `auto_recall` (
  `auto_recall_id` smallint(6) NOT NULL,
  `auto_recall_title` varchar(50) NOT NULL,
  `auto_recall_content` text NOT NULL,
  `id_template_type` smallint(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `category`
--

CREATE TABLE `category` (
  `category_id` smallint(6) NOT NULL,
  `category_name` varchar(50) NOT NULL,
  `category_descrip` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `category`
--


-- --------------------------------------------------------

--
-- Structure de la table `city`
--

CREATE TABLE `city` (
  `city_id` int(10) NOT NULL,
  `city_name` varchar(50) NOT NULL,
  `city_zip` varchar(5) NOT NULL,
  KEY `idx_city_name` (`city_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `city`
--


-- --------------------------------------------------------

--
-- Structure de la table `competence`
--

CREATE TABLE `competence` (
  `competence_id` smallint(6) NOT NULL,
  `competence_name` varchar(50) NOT NULL,
  `competence_descrip` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `competence`
--


-- --------------------------------------------------------

--
-- Structure de la table `competence_mission`
--

CREATE TABLE `competence_mission` (
  `competence_mission_id` smallint(6) NOT NULL,
  `id_competence` smallint(6) NOT NULL,
  `id_mission` smallint(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `competence_user`
--

CREATE TABLE `competence_user` (
  `competence_user_id` smallint(6) NOT NULL,
  `id_user` smallint(6) NOT NULL,
  `id_competence` smallint(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `contact_message`
--

CREATE TABLE `contact_message` (
  `contact_message_id` smallint(6) NOT NULL,
  `contact_message_title` varchar(50) NOT NULL,
  `contact_message_content` text NOT NULL,
  `contact_message_sender_name` varchar(50) DEFAULT NULL,
  `contact_message_sender_firstname` varchar(50) DEFAULT NULL,
  `contact_message_sender_mail` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `contact_message_admin`
--

CREATE TABLE `contact_message_admin` (
  `contact_message_admin_id` smallint(6) NOT NULL,
  `id_admin` smallint(6) NOT NULL,
  `id_contact_message` smallint(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inscription_mission`
--

CREATE TABLE `inscription_mission` (
  `inscription_mission_id` smallint(6) NOT NULL,
  `inscription_mission_date` datetime DEFAULT NULL,
  `inscription_mission_date_avis` datetime DEFAULT NULL,
  `inscription_mission_lib_avis` varchar(50) DEFAULT NULL,
  `inscription_mission_content_avis` text DEFAULT NULL,
  `inscription_mission_note_avis` smallint(6) DEFAULT NULL,
  `id_status_inscrip` smallint(6) NOT NULL DEFAULT 2,
  `uuid_mission` varchar(36) NOT NULL,
  `uuid_benevolent` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `inscription_mission`
--


-- --------------------------------------------------------

--
-- Structure de la table `mission`
--

CREATE TABLE `mission` (
  `mission_id` smallint(6) NOT NULL,
  `mission_uuid` varchar(36) NOT NULL,
  `mission_name` varchar(50) NOT NULL,
  `mission_descrip` text DEFAULT NULL,
  `mission_date_debut_inscription` datetime DEFAULT NULL,
  `mission_date_fin_inscription` datetime DEFAULT NULL,
  `mission_date_debut` datetime DEFAULT NULL,
  `mission_date_fin` datetime DEFAULT NULL,
  `mission_address` varchar(50) DEFAULT NULL,
  `mission_nbre_participants_max` smallint(6) DEFAULT NULL,
  `mission_is_active` tinyint(1) DEFAULT 1,
  `id_category` smallint(6) NOT NULL,
  `id_city` int(10) NOT NULL,
  `uuid_user_orga` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `mission`
--


-- --------------------------------------------------------

--
-- Structure de la table `role`
--

CREATE TABLE `role` (
  `role_id` smallint(6) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `role`
--


-- --------------------------------------------------------

--
-- Structure de la table `status_inscrip`
--

CREATE TABLE `status_inscrip` (
  `status_inscrip_id` smallint(6) NOT NULL,
  `status_inscrip_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `status_inscrip`
--


-- --------------------------------------------------------

--
-- Structure de la table `template_type`
--

CREATE TABLE `template_type` (
  `template_type_id` smallint(6) NOT NULL,
  `template_type_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  `user_id` smallint(6) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `user_mail` varchar(50) NOT NULL,
  `user_password` varchar(250) NOT NULL,
  `user_refresh_token` varchar(128) NULL,
  `user_date_inscription` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_avatar` varchar(50) DEFAULT 'avatar_default.png',
  `user_tel` char(10) DEFAULT NULL,
  `user_firstname` varchar(50) DEFAULT NULL,
  `user_lastname` varchar(50) DEFAULT NULL,
  `user_address` varchar(250) DEFAULT NULL,
  `id_city` int(10) DEFAULT NULL,
  `id_role` smallint(6) NOT NULL DEFAULT 3
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user`
--


-- --------------------------------------------------------

--
-- Structure de la table `various_request`
--

CREATE TABLE `various_request` (
  `various_request_id` smallint(6) NOT NULL,
  `various_request_object` varchar(50) DEFAULT NULL,
  `various_request_content` text DEFAULT NULL,
  `various_request_date_send` datetime DEFAULT NULL,
  `various_request_date_receive` datetime DEFAULT NULL,
  `id_mission` smallint(6) NOT NULL,
  `id_benevolent` smallint(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `various_request_admin`
--

CREATE TABLE `various_request_admin` (
  `various_request_admin_id` smallint(6) NOT NULL,
  `id_admin` smallint(6) NOT NULL,
  `id_various_request` smallint(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `auto_recall`
--
ALTER TABLE `auto_recall`
  ADD PRIMARY KEY (`auto_recall_id`),
  ADD KEY `id_template_type` (`id_template_type`);

--
-- Index pour la table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Index pour la table `city`
--
ALTER TABLE `city`
  ADD PRIMARY KEY (`city_id`);

--
-- Index pour la table `competence`
--
ALTER TABLE `competence`
  ADD PRIMARY KEY (`competence_id`),
  ADD UNIQUE KEY `competence_name` (`competence_name`);

--
-- Index pour la table `competence_mission`
--
ALTER TABLE `competence_mission`
  ADD PRIMARY KEY (`competence_mission_id`),
  ADD KEY `id_competence` (`id_competence`),
  ADD KEY `id_mission` (`id_mission`);

--
-- Index pour la table `competence_user`
--
ALTER TABLE `competence_user`
  ADD PRIMARY KEY (`competence_user_id`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `id_competence` (`id_competence`);

--
-- Index pour la table `contact_message`
--
ALTER TABLE `contact_message`
  ADD PRIMARY KEY (`contact_message_id`);

--
-- Index pour la table `contact_message_admin`
--
ALTER TABLE `contact_message_admin`
  ADD PRIMARY KEY (`contact_message_admin_id`),
  ADD KEY `id_admin` (`id_admin`),
  ADD KEY `id_contact_message` (`id_contact_message`);

--
-- Index pour la table `inscription_mission`
--
ALTER TABLE `inscription_mission`
  ADD PRIMARY KEY (`inscription_mission_id`),
  ADD KEY `id_status_inscrip` (`id_status_inscrip`),
  ADD KEY `id_mission` (`uuid_mission`),
  ADD KEY `id_benevolent` (`uuid_benevolent`);

--
-- Index pour la table `mission`
--
ALTER TABLE `mission`
  ADD PRIMARY KEY (`mission_id`),
  ADD UNIQUE KEY `mission_uid` (`mission_uuid`),
  ADD KEY `id_category` (`id_category`),
  ADD KEY `id_city` (`id_city`),
  ADD KEY `mission_ibfk_3` (`uuid_user_orga`);

--
-- Index pour la table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Index pour la table `status_inscrip`
--
ALTER TABLE `status_inscrip`
  ADD PRIMARY KEY (`status_inscrip_id`),
  ADD UNIQUE KEY `status_inscrip_name` (`status_inscrip_name`);

--
-- Index pour la table `template_type`
--
ALTER TABLE `template_type`
  ADD PRIMARY KEY (`template_type_id`),
  ADD UNIQUE KEY `template_type_name` (`template_type_name`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_uid` (`user_uuid`),
  ADD UNIQUE KEY `user_uid_2` (`user_uuid`),
  ADD UNIQUE KEY `user_uid_3` (`user_uuid`),
  ADD UNIQUE KEY `user_mail` (`user_mail`),
  ADD KEY `id_city` (`id_city`),
  ADD KEY `id_role` (`id_role`);

--
-- Index pour la table `various_request`
--
ALTER TABLE `various_request`
  ADD PRIMARY KEY (`various_request_id`),
  ADD KEY `id_mission` (`id_mission`),
  ADD KEY `id_benevolent` (`id_benevolent`);

--
-- Index pour la table `various_request_admin`
--
ALTER TABLE `various_request_admin`
  ADD PRIMARY KEY (`various_request_admin_id`),
  ADD KEY `id_admin` (`id_admin`),
  ADD KEY `id_various_request` (`id_various_request`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `auto_recall`
--
ALTER TABLE `auto_recall`
  MODIFY `auto_recall_id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `category`
--
ALTER TABLE `category`
  MODIFY `category_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `city`
--
ALTER TABLE `city`
  MODIFY `city_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65551;

--
-- AUTO_INCREMENT pour la table `competence`
--
ALTER TABLE `competence`
  MODIFY `competence_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `competence_mission`
--
ALTER TABLE `competence_mission`
  MODIFY `competence_mission_id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `competence_user`
--
ALTER TABLE `competence_user`
  MODIFY `competence_user_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT pour la table `contact_message`
--
ALTER TABLE `contact_message`
  MODIFY `contact_message_id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `contact_message_admin`
--
ALTER TABLE `contact_message_admin`
  MODIFY `contact_message_admin_id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `inscription_mission`
--
ALTER TABLE `inscription_mission`
  MODIFY `inscription_mission_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=137;

--
-- AUTO_INCREMENT pour la table `mission`
--
ALTER TABLE `mission`
  MODIFY `mission_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT pour la table `role`
--
ALTER TABLE `role`
  MODIFY `role_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `status_inscrip`
--
ALTER TABLE `status_inscrip`
  MODIFY `status_inscrip_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `template_type`
--
ALTER TABLE `template_type`
  MODIFY `template_type_id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` smallint(6) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT pour la table `various_request`
--
ALTER TABLE `various_request`
  MODIFY `various_request_id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `various_request_admin`
--
ALTER TABLE `various_request_admin`
  MODIFY `various_request_admin_id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `auto_recall`
--
ALTER TABLE `auto_recall`
  ADD CONSTRAINT `auto_recall_ibfk_1` FOREIGN KEY (`id_template_type`) REFERENCES `template_type` (`template_type_id`);

--
-- Contraintes pour la table `competence_mission`
--
ALTER TABLE `competence_mission`
  ADD CONSTRAINT `competence_mission_ibfk_1` FOREIGN KEY (`id_competence`) REFERENCES `competence` (`competence_id`),
  ADD CONSTRAINT `competence_mission_ibfk_2` FOREIGN KEY (`id_mission`) REFERENCES `mission` (`mission_id`);

--
-- Contraintes pour la table `competence_user`
--
ALTER TABLE `competence_user`
  ADD CONSTRAINT `competence_user_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `competence_user_ibfk_2` FOREIGN KEY (`id_competence`) REFERENCES `competence` (`competence_id`);

--
-- Contraintes pour la table `contact_message_admin`
--
ALTER TABLE `contact_message_admin`
  ADD CONSTRAINT `contact_message_admin_ibfk_1` FOREIGN KEY (`id_admin`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `contact_message_admin_ibfk_2` FOREIGN KEY (`id_contact_message`) REFERENCES `contact_message` (`contact_message_id`);

--
-- Contraintes pour la table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`id_city`) REFERENCES `city` (`city_id`),
  ADD CONSTRAINT `user_ibfk_3` FOREIGN KEY (`id_role`) REFERENCES `role` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
