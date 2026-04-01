INSERT INTO `role` (`role_name`)
VALUES ('SuperAdmin'),
    ('Organisateur'),
    ('Benevole');
INSERT INTO `inscription_status` (`inscription_status_name`)
VALUES ('EN ATTENTE'),
    ('VALIDEE'),
    ('REFUSEE'),
    ('ANNULEE');
INSERT INTO `mission_status` (`mission_status_name`)
VALUES ('BROUILLON'),
    ('PUBLIEE'),
    ('TERMINEE'),
    ('ANNULEE');
INSERT INTO `request_organizer_status` (`request_organizer_status_name`)
VALUES ('EN ATTENTE'),
    ('VALIDEE'),
    ('REFUSEE'),
    ('ANNULEE');
-- ============================================================================
-- 1. VILLES & CATÉGORIES (Les référentiels)
-- ============================================================================
INSERT INTO `city` (`city_name`, `city_zip`) VALUES
('Grenoble', '38000'), ('Lyon', '69000'), ('Paris', '75000'), 
('Marseille', '13000'), ('Lille', '59000');

INSERT INTO `category` (`category_name`) VALUES
('Écologie & Environnement'), ('Solidarité & Social'), 
('Éducation & Soutien'), ('Santé & Prévention'), ('Sport & Inclusion');


-- ============================================================================
-- 2. UTILISATEURS (51 comptes au total)
-- ============================================================================
-- Le mot de passe est un hash BCrypt générique pour tous (ex: "password123")
SET @hash = '$2b$10$Ep3z3.uE6U7iJ/Dq9nI/1.1z/Z9b7/K/3Z/4Z/5Z/6Z/7Z/8Z/9Z/';

-- 1 SUPER ADMIN (Role 1)
INSERT INTO `user` (`user_uuid`, `user_email`, `user_password`, `user_firstname`, `user_lastname`, `user_created_at`, `id_city`, `id_role`) VALUES
(UUID(), 'admin@eclaireurs.fr', @hash, 'Super', 'Admin', '2026-01-01 10:00:00', 1, 1);

-- 10 ORGANISATEURS (Role 2) - IDs 2 à 11
INSERT INTO `user` (`user_uuid`, `user_email`, `user_password`, `user_firstname`, `user_lastname`, `user_created_at`, `id_city`, `id_role`) VALUES
(UUID(), 'orga1@test.com', @hash, 'Alice', 'Martin', '2026-01-15 09:00:00', 1, 2),
(UUID(), 'orga2@test.com', @hash, 'Marc', 'Dubois', '2026-01-16 14:30:00', 2, 2),
(UUID(), 'orga3@test.com', @hash, 'Sophie', 'Leroux', '2026-01-20 11:15:00', 3, 2),
(UUID(), 'orga4@test.com', @hash, 'Julien', 'Moreau', '2026-02-05 16:45:00', 4, 2),
(UUID(), 'orga5@test.com', @hash, 'Claire', 'Fontaine', '2026-02-10 10:20:00', 5, 2),
(UUID(), 'orga6@test.com', @hash, 'Thomas', 'Blanc', '2026-02-15 09:10:00', 1, 2),
(UUID(), 'orga7@test.com', @hash, 'Emma', 'Garnier', '2026-02-28 15:00:00', 2, 2),
(UUID(), 'orga8@test.com', @hash, 'Lucas', 'Rousseau', '2026-03-01 18:30:00', 3, 2),
(UUID(), 'orga9@test.com', @hash, 'Léa', 'Perrin', '2026-03-10 08:45:00', 4, 2),
(UUID(), 'orga10@test.com', @hash, 'Hugo', 'Lefebvre', '2026-03-15 13:20:00', 5, 2);

-- 40 BÉNÉVOLES (Role 3) - IDs 12 à 51
-- Génération en bloc pour simuler une base active
INSERT INTO `user` (`user_uuid`, `user_email`, `user_password`, `user_firstname`, `user_lastname`, `user_created_at`, `id_city`, `id_role`) VALUES
(UUID(), 'ben1@test.com', @hash, 'Camille', 'Ben1', '2026-02-01 10:00:00', 1, 3), (UUID(), 'ben2@test.com', @hash, 'Arthur', 'Ben2', '2026-02-02 10:00:00', 2, 3),
(UUID(), 'ben3@test.com', @hash, 'Louis', 'Ben3', '2026-02-03 10:00:00', 3, 3), (UUID(), 'ben4@test.com', @hash, 'Mila', 'Ben4', '2026-02-04 10:00:00', 4, 3),
(UUID(), 'ben5@test.com', @hash, 'Jules', 'Ben5', '2026-02-05 10:00:00', 5, 3), (UUID(), 'ben6@test.com', @hash, 'Ambre', 'Ben6', '2026-02-06 10:00:00', 1, 3),
(UUID(), 'ben7@test.com', @hash, 'Paul', 'Ben7', '2026-02-07 10:00:00', 2, 3), (UUID(), 'ben8@test.com', @hash, 'Jade', 'Ben8', '2026-02-08 10:00:00', 3, 3),
(UUID(), 'ben9@test.com', @hash, 'Gabin', 'Ben9', '2026-02-09 10:00:00', 4, 3), (UUID(), 'ben10@test.com', @hash, 'Mia', 'Ben10', '2026-02-10 10:00:00', 5, 3),
(UUID(), 'ben11@test.com', @hash, 'Raphaël', 'Ben11', '2026-02-11 10:00:00', 1, 3), (UUID(), 'ben12@test.com', @hash, 'Rose', 'Ben12', '2026-02-12 10:00:00', 2, 3),
(UUID(), 'ben13@test.com', @hash, 'Maël', 'Ben13', '2026-02-13 10:00:00', 3, 3), (UUID(), 'ben14@test.com', @hash, 'Alice', 'Ben14', '2026-02-14 10:00:00', 4, 3),
(UUID(), 'ben15@test.com', @hash, 'Noah', 'Ben15', '2026-02-15 10:00:00', 5, 3), (UUID(), 'ben16@test.com', @hash, 'Anna', 'Ben16', '2026-02-16 10:00:00', 1, 3),
(UUID(), 'ben17@test.com', @hash, 'Eden', 'Ben17', '2026-02-17 10:00:00', 2, 3), (UUID(), 'ben18@test.com', @hash, 'Lina', 'Ben18', '2026-02-18 10:00:00', 3, 3),
(UUID(), 'ben19@test.com', @hash, 'Léon', 'Ben19', '2026-02-19 10:00:00', 4, 3), (UUID(), 'ben20@test.com', @hash, 'Chloé', 'Ben20', '2026-02-20 10:00:00', 5, 3),
(UUID(), 'ben21@test.com', @hash, 'Sacha', 'Ben21', '2026-02-21 10:00:00', 1, 3), (UUID(), 'ben22@test.com', @hash, 'Julia', 'Ben22', '2026-02-22 10:00:00', 2, 3),
(UUID(), 'ben23@test.com', @hash, 'Aaron', 'Ben23', '2026-02-23 10:00:00', 3, 3), (UUID(), 'ben24@test.com', @hash, 'Iris', 'Ben24', '2026-02-24 10:00:00', 4, 3),
(UUID(), 'ben25@test.com', @hash, 'Victor', 'Ben25', '2026-02-25 10:00:00', 5, 3), (UUID(), 'ben26@test.com', @hash, 'Zoé', 'Ben26', '2026-02-26 10:00:00', 1, 3),
(UUID(), 'ben27@test.com', @hash, 'Marius', 'Ben27', '2026-02-27 10:00:00', 2, 3), (UUID(), 'ben28@test.com', @hash, 'Léna', 'Ben28', '2026-02-28 10:00:00', 3, 3),
(UUID(), 'ben29@test.com', @hash, 'Marin', 'Ben29', '2026-03-01 10:00:00', 4, 3), (UUID(), 'ben30@test.com', @hash, 'Inès', 'Ben30', '2026-03-02 10:00:00', 5, 3),
(UUID(), 'ben31@test.com', @hash, 'Côme', 'Ben31', '2026-03-03 10:00:00', 1, 3), (UUID(), 'ben32@test.com', @hash, 'Agathe', 'Ben32', '2026-03-04 10:00:00', 2, 3),
(UUID(), 'ben33@test.com', @hash, 'Gaspard', 'Ben33', '2026-03-05 10:00:00', 3, 3), (UUID(), 'ben34@test.com', @hash, 'Juliette', 'Ben34', '2026-03-06 10:00:00', 4, 3),
(UUID(), 'ben35@test.com', @hash, 'Axel', 'Ben35', '2026-03-07 10:00:00', 5, 3), (UUID(), 'ben36@test.com', @hash, 'Jeanne', 'Ben36', '2026-03-08 10:00:00', 1, 3),
(UUID(), 'ben37@test.com', @hash, 'Evan', 'Ben37', '2026-03-09 10:00:00', 2, 3), (UUID(), 'ben38@test.com', @hash, 'Nina', 'Ben38', '2026-03-10 10:00:00', 3, 3),
(UUID(), 'ben39@test.com', @hash, 'Milo', 'Ben39', '2026-03-11 10:00:00', 4, 3), (UUID(), 'ben40@test.com', @hash, 'Eva', 'Ben40', '2026-03-12 10:00:00', 5, 3);


-- ============================================================================
-- 3. MISSIONS (10 Missions - Période du 15 Avril au 30 Mai 2026)
-- Status : 2=Publiée, 4=Annulée
-- ============================================================================
INSERT INTO `mission` (`mission_uuid`, `mission_name`, `mission_description`, `mission_date_start`, `mission_date_end`, `mission_address`, `mission_nbr_volunteer_needed`, `mission_created_at`, `id_city`, `id_mission_status`) VALUES
-- Les missions cibles pour les tests de rappel (15 Avril)
(UUID(), 'Collecte alimentaire de Printemps', 'Aidez-nous à trier et distribuer les denrées récoltées pour les familles.', '2026-04-15 08:00:00', '2026-04-15 18:00:00', 'Banque Alimentaire centrale', 15, '2026-03-01 10:00:00', 1, 2), -- M1 (Publiée)
(UUID(), 'Soutien scolaire intensif (Brevet)', 'Accompagnement des élèves de 3ème pour les révisions de Pâques.', '2026-04-15 14:00:00', '2026-04-15 17:00:00', 'Médiathèque Municipale', 5, '2026-03-05 11:00:00', 2, 2), -- M2 (Publiée)

-- Le reste des missions étalées jusqu'au 30 Mai
(UUID(), 'Nettoyage des Berges du Rhône', 'Action citoyenne de ramassage des déchets le long des berges.', '2026-04-20 09:00:00', '2026-04-20 12:30:00', 'Quai Claude Bernard', 25, '2026-03-10 09:00:00', 2, 2), -- M3 (Publiée)
(UUID(), 'Maraude de printemps annulée', 'Distribution de repas chauds et vêtements.', '2026-04-25 19:00:00', '2026-04-25 23:00:00', 'Place de la République', 8, '2026-03-12 14:00:00', 3, 4), -- M4 (ANNULEE)
(UUID(), 'Tournoi de foot inclusif', 'Arbitrage et encadrement logistique du tournoi inter-quartiers.', '2026-05-02 08:30:00', '2026-05-02 18:00:00', 'Stade Vélodrome (Annexe)', 20, '2026-03-15 16:00:00', 4, 2), -- M5 (Publiée)
(UUID(), 'Atelier prévention santé', 'Sensibilisation aux gestes de premiers secours pour le grand public.', '2026-05-10 10:00:00', '2026-05-10 16:00:00', 'Salle des fêtes de Fives', 6, '2026-03-18 08:00:00', 5, 2), -- M6 (Publiée)
(UUID(), 'Rénovation local associatif', 'Peinture et petit bricolage pour rafraîchir nos locaux d accueil.', '2026-05-15 09:00:00', '2026-05-16 18:00:00', '14 Rue de la Solidarité', 10, '2026-03-20 10:30:00', 1, 2), -- M7 (Publiée)
(UUID(), 'Festival Écolo', 'Organisation logistique du festival Zéro Déchet de la ville.', '2026-05-22 08:00:00', '2026-05-24 20:00:00', 'Parc de la Tête d Or', 40, '2026-03-25 11:00:00', 2, 2), -- M8 (Publiée)
(UUID(), 'Accompagnement lecture EHPAD', 'Moment de partage et de lecture avec les résidents.', '2026-05-25 15:00:00', '2026-05-25 17:00:00', 'Résidence Les Tilleuls', 4, '2026-03-26 14:00:00', 3, 2), -- M9 (Publiée)
(UUID(), 'Gala de Charité Annuel', 'Accueil, vestiaire et service pour la grande soirée de levée de fonds.', '2026-05-30 18:00:00', '2026-05-31 01:00:00', 'Palais de la Bourse', 12, '2026-03-28 09:00:00', 2, 2); -- M10 (Publiée)


-- ============================================================================
-- 4. AFFECTATION DES ORGANISATEURS (Gestion Multi-Orga)
-- ============================================================================
INSERT INTO `mission_organizer` (`id_mission`, `id_organizer`) VALUES
(1, 2),          -- M1 gérée par Orga1
(2, 3), (2, 4),  -- M2 gérée par Orga2 et Orga3 (Multi)
(3, 5),          -- M3 gérée par Orga4
(4, 6),          -- M4 gérée par Orga5 (Celle qui est annulée)
(5, 7), (5, 8),  -- M5 gérée par Orga6 et Orga7 (Multi)
(6, 9),          -- M6 gérée par Orga8
(7, 10), (7, 2), -- M7 gérée par Orga9 et Orga1 (Multi)
(8, 3),          -- M8 gérée par Orga2
(9, 4),          -- M9 gérée par Orga3
(10, 5), (10, 6), (10, 7); -- M10 gérée par 3 orgas pour le gros event


-- ============================================================================
-- 5. AFFECTATION DES CATÉGORIES
-- ============================================================================
INSERT INTO `mission_category` (`id_mission`, `id_category`) VALUES
(1, 2),          -- M1: Solidarité
(2, 3),          -- M2: Education
(3, 1),          -- M3: Ecologie
(4, 2), (4, 4),  -- M4: Solidarité & Santé
(5, 5), (5, 2),  -- M5: Sport & Solidarité
(6, 4),          -- M6: Santé
(7, 2),          -- M7: Solidarité
(8, 1),          -- M8: Ecologie
(9, 2), (9, 3),  -- M9: Solidarité & Education
(10, 2);         -- M10: Solidarité


-- ============================================================================
-- 6. INSCRIPTIONS DES BÉNÉVOLES (Test de tous les statuts)
-- Status : 1=En Attente, 2=Validée, 3=Refusée, 4=Annulée
-- ============================================================================
-- Pour la mission 1 (15 Avril) - On blinde les validations pour tester les rappels !
INSERT INTO `inscription` (`inscription_date`, `id_user`, `id_mission`, `id_inscription_status`) VALUES
('2026-03-05 10:00:00', 12, 1, 2), ('2026-03-06 14:00:00', 13, 1, 2), ('2026-03-07 09:00:00', 14, 1, 2),
('2026-03-08 11:30:00', 15, 1, 2), ('2026-03-09 16:45:00', 16, 1, 2), ('2026-03-10 18:20:00', 17, 1, 1), -- En attente
('2026-03-11 08:15:00', 18, 1, 4), -- Le bénévole a annulé
('2026-03-12 12:00:00', 19, 1, 3); -- Refusé par l'orga

-- Pour la mission 2 (15 Avril)
INSERT INTO `inscription` (`inscription_date`, `id_user`, `id_mission`, `id_inscription_status`) VALUES
('2026-03-10 10:00:00', 20, 2, 2), ('2026-03-11 14:00:00', 21, 2, 2), ('2026-03-12 09:00:00', 22, 2, 1);

-- Inscriptions éparpillées sur le reste
INSERT INTO `inscription` (`inscription_date`, `id_user`, `id_mission`, `id_inscription_status`) VALUES
('2026-03-15 10:00:00', 23, 3, 2), ('2026-03-16 10:00:00', 24, 3, 2), ('2026-03-17 10:00:00', 25, 3, 2),
('2026-03-18 10:00:00', 26, 4, 4), ('2026-03-19 10:00:00', 27, 4, 4), -- Mission annulée, inscriptions passent en annulé
('2026-03-20 10:00:00', 28, 5, 2), ('2026-03-21 10:00:00', 29, 5, 2), ('2026-03-22 10:00:00', 30, 5, 1),
('2026-03-23 10:00:00', 31, 6, 2), ('2026-03-24 10:00:00', 32, 6, 1),
('2026-03-25 10:00:00', 33, 7, 2), ('2026-03-26 10:00:00', 34, 7, 2),
('2026-03-27 10:00:00', 35, 9, 2), ('2026-03-28 10:00:00', 36, 9, 1),
('2026-03-28 11:00:00', 37, 10, 1),('2026-03-28 14:00:00', 38, 10, 1);
