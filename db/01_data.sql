-- ============================================================================
-- 1. RÉFÉRENTIELS (Rôles & Statuts)
-- ============================================================================
INSERT INTO `role` (`role_name`) VALUES 
('SUPERADMIN'), -- ID 1
('ORGANIZER'),  -- ID 2
('VOLUNTEER');  -- ID 3

INSERT INTO `registration_status` (`registration_status_name`) VALUES 
('ONHOLD'),    -- ID 1
('VALIDATED'), -- ID 2
('REFUSED'),   -- ID 3
('CANCELED'),  -- ID 4
('PRESENT'),   -- ID 5
('ABSENT');    -- ID 6

INSERT INTO `mission_status` (`mission_status_name`) VALUES 
('DRAFT'),     -- ID 1
('PUBLISHED'), -- ID 2
('FINISHED'),  -- ID 3
('CANCELED');  -- ID 4

INSERT INTO `request_organizer_status` (`request_organizer_status_name`) VALUES 
('PENDING'),   -- ID 1
('VALIDATED'), -- ID 2
('REFUSED'),   -- ID 3
('CANCELED');  -- ID 4

-- ============================================================================
-- 2. RÉFÉRENTIELS (Villes & Catégories)
-- ============================================================================
INSERT INTO `city` (`city_name`, `city_zip`) VALUES 
('Grenoble', '38000'), -- ID 1
('Lyon', '69000'),     -- ID 2
('Paris', '75000'),    -- ID 3
('Marseille', '13000'),-- ID 4
('Lille', '59000');    -- ID 5

INSERT INTO `category` (`category_name`) VALUES 
('Écologie & Environnement'), -- ID 1
('Solidarité & Social'),      -- ID 2
('Éducation & Soutien'),      -- ID 3
('Santé & Prévention'),       -- ID 4
('Sport & Inclusion');        -- ID 5

-- ============================================================================
-- 3. UTILISATEURS (Mot de passe : password)
-- ============================================================================
INSERT INTO `user` (`user_id`, `user_uuid`, `user_refresh_token`, `user_email`, `user_password`, `user_firstname`, `user_lastname`, `user_avatar`, `user_created_at`, `user_updated_at`, `user_deleted_at`, `id_city`, `id_role`) VALUES
(1, '028fc93c-db5b-4a26-b8dc-21309b2c1f25', '$argon2id$v=19$m=65536,t=3,p=4$TFn8MQ1nRGtHNWyhnipOvA$q0BQFAHeJWttLbEmekOcblZ6QtIn4EHYckimqEVScEc', 'admin@test.com', '$argon2id$v=19$m=65536,t=3,p=4$ypablnU1bXIIuDUcfaPBiA$AoAafDmsMdJ1NN67yW2sADrLJbkv6mLsjggzce2J/DY', NULL, NULL, '/avatar/default.png', '2026-04-11 16:05:08', NULL, NULL, NULL, 1),
(2, 'fdccdf50-cf49-4a41-a774-6a6e33a811ed', '$argon2id$v=19$m=65536,t=3,p=4$0es7+3mRycJujfesOllC7Q$JQU5C0tdv/ercBkamajRvPHulY3JHcY1ufWs02+Qbic', 'orga1@test.com', '$argon2id$v=19$m=65536,t=3,p=4$xoAQzQBGiOoWavJtaMSy2g$MRfA8Fw6DN3OCRWYfPYf6fHGMvZlwmjxCdXnsa+2EM0', NULL, NULL, '/avatar/default.png', '2026-04-11 16:08:07', NULL, NULL, NULL, 2),
(3, '17d03ccf-d40e-4b50-9e1b-9d686c1e53e6', '$argon2id$v=19$m=65536,t=3,p=4$ci4GN0XHLECXoVTn+Q2o9Q$eGGcjimb/nfUXOOsiuzNGKUvCrF/Z+GiJQCr/I4lWLg', 'orga2@test.com', '$argon2id$v=19$m=65536,t=3,p=4$1pbX7HSWhK2NFAyzrH6Rbg$7yoECbXx3hmdvwlHB4y40V7WAiTIlWPj3FonES2l9BM', NULL, NULL, '/avatar/default.png', '2026-04-11 16:08:34', NULL, NULL, NULL, 2),
(4, 'daea5057-2cbf-482a-904d-4ad34158fd3d', '$argon2id$v=19$m=65536,t=3,p=4$3FLEwsMxMwCXyFVFzI5peg$EdklwaOWl2+aobmx1/18hhUTzhImzqTQMqeAynrEI3g', 'volunt@test.com', '$argon2id$v=19$m=65536,t=3,p=4$uPk7fSiqP8vDRtrhYPgu2w$Me/wPKkTil6als5qouYeHoBxJFbH1jJo7M5g9x9HqaE', NULL, NULL, '/avatar/default.png', '2026-04-11 16:09:00', NULL, NULL, NULL, 3),
(5, '82d8c91b-9cf9-47cf-ac8d-de3dccf95c41', '$argon2id$v=19$m=65536,t=3,p=4$syt8vlHyIUWUWUwDcapimw$ttngI45M44j1IumjqmaB28m/ci74y0cGeKHiSsj/F08', 'volunt1@test.com', '$argon2id$v=19$m=65536,t=3,p=4$FN4MB3d5jBY0cj8QTaFhzQ$H5TNqiVtmR+LleqXg8zVmLUKtMqDdw4a/cMfidiQMWQ', NULL, NULL, '/avatar/default.png', '2026-04-11 16:09:24', NULL, NULL, NULL, 3),
(6, '08405f18-94c6-4b73-8225-a3611e6e68ab', '$argon2id$v=19$m=65536,t=3,p=4$vVppFuDM5k0M+JoDnbROjQ$ftP8mSJi1xUz+B8f2ue7w89ZUudDAExvrdEuUPnlEFo', 'volunt2@test.com', '$argon2id$v=19$m=65536,t=3,p=4$AV6W/j7eGcy2bggQs9yLlw$COTinht5+rgiSd/kRaY4pA1lXiZMm014VkD1H9FL/PM', NULL, NULL, '/avatar/default.png', '2026-04-11 16:09:39', NULL, NULL, NULL, 3),
(7, 'a3d68254-d49f-4378-9089-cebd1479db28', '$argon2id$v=19$m=65536,t=3,p=4$BVrYAUVofdlluA1txJdJWw$r2dfZerCH1B2y5Lh3b0wM9rtkkMa+TuRuF3PkjTAoIE', 'volunt3@test.com', '$argon2id$v=19$m=65536,t=3,p=4$pf8KkywD9t0vnMlJ7HU+pA$LZ1NzL/z9Z7ZeERfMMbrenY2J73aUWKekCwSooAvJ0k', NULL, NULL, '/avatar/default.png', '2026-04-11 16:09:54', NULL, NULL, NULL, 3);

-- ============================================================================
-- 4. MISSIONS
-- ============================================================================
INSERT INTO `mission` (`mission_id`, `mission_uuid`, `mission_name`, `mission_description`, `mission_date_start`, `mission_date_end`, `mission_address`, `mission_nbr_volunteer_needed`, `mission_created_at`, `id_city`, `id_mission_status`) VALUES
(1, UUID(), 'Distribution Alimentaire Paris', 'Distribution repas.', '2026-10-01 19:00:00', '2026-10-01 23:00:00', 'Place de la République', 10, NOW(), 3, 2), -- PUBLISHED
(2, UUID(), 'Nettoyage Parc (Brouillon)', 'Ramassage déchets.', '2026-11-05 09:00:00', '2026-11-05 12:00:00', 'Parc de la Tête dOr', 5, NOW(), 2, 1), -- DRAFT
(3, UUID(), 'Soutien Scolaire Hiver', 'Aide aux devoirs.', '2026-12-10 17:00:00', '2026-12-10 19:00:00', 'Bibliothèque Alcazar', 3, NOW(), 4, 2), -- PUBLISHED
(4, UUID(), 'Maraude Annulée', 'Annulée cause météo.', '2026-08-20 20:00:00', '2026-08-20 23:00:00', 'Châtelet', 8, NOW(), 3, 4), -- CANCELED (ID 4)
(5, UUID(), 'Festival Solidaire (Terminé)', 'Concert.', '2025-05-10 10:00:00', '2025-05-10 23:00:00', 'Vieux Lyon', 20, NOW(), 2, 3), -- FINISHED (ID 3)
(6, UUID(), 'Collecte de Jouets', 'Pour Noël.', '2026-12-15 14:00:00', '2026-12-15 18:00:00', 'Vieux Port', 15, NOW(), 4, 2), -- PUBLISHED
(7, UUID(), 'Atelier CV pour tous', 'Aide recherche emploi.', '2026-09-01 18:00:00', '2026-09-01 20:00:00', 'Mairie du 10e', 4, NOW(), 3, 2), -- PUBLISHED
(8, UUID(), 'Plantation darbres', 'Reboisement.', '2026-11-20 08:30:00', '2026-11-20 17:00:00', 'Monts dOr', 50, NOW(), 2, 2), -- PUBLISHED
(9, UUID(), 'Aide aux devoirs (Brouillon)', 'A venir.', '2026-09-15 17:30:00', '2026-09-15 19:30:00', 'Quartier Nord', 2, NOW(), 4, 1), -- DRAFT
(10, UUID(), 'Gala de Charité', 'Récolte de dons.', '2026-12-31 19:00:00', '2027-01-01 02:00:00', 'Hôtel de Ville', 5, NOW(), 3, 2); -- PUBLISHED

-- ============================================================================
-- 5. CATÉGORIES DES MISSIONS
-- ============================================================================
INSERT INTO `mission_category` (`id_mission`, `id_category`) VALUES
(1, 2), (2, 1), (3, 3), (4, 2), (5, 2), (6, 2), (7, 3), (8, 1), (9, 3), (10, 2);

-- ============================================================================
-- 6. ORGANISATEURS DES MISSIONS (La logique "Mes projets" vs "Mon équipe")
-- ============================================================================
INSERT INTO `mission_organizer` (`mission_organizer_is_main`, `id_mission`, `id_organizer`) VALUES
(1, 1, 2), (0, 1, 3), -- M1 : Orga 1 (ID 2) crée, Orga 2 (ID 3) aide
(1, 2, 2),            -- M2 : Orga 1 seul
(1, 3, 2),            -- M3 : Orga 1 seul
(1, 4, 3),            -- M4 : Orga 2 seul
(1, 5, 3), (0, 5, 2), -- M5 : Orga 2 crée, Orga 1 aide
(1, 6, 3),            -- M6 : Orga 2 seul
(1, 7, 2),            -- M7 : Orga 1 seul
(1, 8, 3), (0,8,4),    -- M8 : Orga 2 seul, Orga en Volunteer (ID 4) aide
(1, 9, 2),            -- M9 : Orga 1 seul
(1, 10, 3);           -- M10 : Orga 2 seul


-- ============================================================================
-- 7. INSCRIPTIONS DES BÉNÉVOLES (La logique "Mes inscriptions")
-- ============================================================================
INSERT INTO `registration` (`registration_date`, `id_user`, `id_mission`, `id_registration_status`) VALUES
(NOW(), 4, 1, 2), -- Bénévole 1 (ID 4) validé sur M1
(NOW(), 5, 1, 1), -- Bénévole 2 (ID 5) en attente sur M1
(NOW(), 4, 3, 2), -- Bénévole 1 validé sur M3
(NOW(), 4, 5, 5), -- Bénévole 1 était PRESENT sur la M5 terminée
(NOW(), 5, 5, 6), -- Bénévole 2 était ABSENT sur la M5 terminée
(NOW(), 2, 6, 2), -- L'Orga 1 s'inscrit en tant que bénévole sur la M6 de l'Orga 2
(NOW(), 4, 8, 3), -- Bénévole 1 refusé sur la M8
(NOW(), 5, 10, 2);-- Bénévole 2 validé sur la M10