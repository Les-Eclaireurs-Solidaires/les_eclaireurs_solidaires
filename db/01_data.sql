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
-- 1. Création de quelques villes
INSERT INTO `city` (`city_name`, `city_zip`)
VALUES ('Grenoble', '38000'),
    ('Lyon', '69000'),
    ('Paris', '75000');
-- 2. Création des catégories de missions
INSERT INTO `category` (`category_name`)
VALUES ('Écologie & Environnement'),
    ('Solidarité & Social'),
    ('Éducation & Soutien');
-- 3. Création des utilisateurs (1 Organisateur, 2 Bénévoles)
-- Note : Le mot de passe ici est un hash générique ($2b$10$...) correspondant souvent à "password123" 
-- ou une chaîne bidon. Si tu veux tester la connexion plus tard, il faudra utiliser ton vrai service de hash.
INSERT INTO `user` (
        `user_uuid`,
        `user_email`,
        `user_password`,
        `user_firstname`,
        `user_lastname`,
        `user_created_at`,
        `id_city`,
        `id_role`
    )
VALUES (
        'a1b2c3d4-1111-4111-a111-abcdef123456',
        'orga@test.com',
        'hash_temporaire',
        'Alice',
        'Lorganisatrice',
        NOW(),
        1,
        2
    ),
    (
        'a1b2c3d4-2222-4222-a222-abcdef123456',
        'benevole1@test.com',
        'hash_temporaire',
        'Bob',
        'Lebenevole',
        NOW(),
        1,
        3
    ),
    (
        'a1b2c3d4-3333-4333-a333-abcdef123456',
        'benevole2@test.com',
        'hash_temporaire',
        'Charlie',
        'Lactif',
        NOW(),
        2,
        3
    );
-- 4. Création des missions (1 Publiée, 1 Brouillon, 1 Terminée)
INSERT INTO `mission` (
        `mission_uuid`,
        `mission_name`,
        `mission_description`,
        `mission_date_start`,
        `mission_date_end`,
        `mission_address`,
        `mission_nbr_volunteer_needed`,
        `mission_created_at`,
        `id_city`,
        `id_mission_status`
    )
VALUES (
        'm1111111-1111-4111-a111-abcdef123456',
        'Nettoyage des parcs',
        'Rejoignez-nous pour ramasser les déchets dans le parc Paul Mistral.',
        '2026-05-10 09:00:00',
        '2026-05-10 12:00:00',
        'Parc Paul Mistral',
        10,
        NOW(),
        1,
        2
    ),
    -- PUBLIEE
    (
        'm2222222-2222-4222-a222-abcdef123456',
        'Maraude hivernale',
        'Distribution de soupes et de vêtements chauds.',
        '2026-12-01 19:00:00',
        '2026-12-01 23:00:00',
        'Place Bellecour',
        5,
        NOW(),
        2,
        1
    ),
    -- BROUILLON
    (
        'm3333333-3333-4333-a333-abcdef123456',
        'Soutien scolaire',
        'Aide aux devoirs pour les élèves en difficulté.',
        '2025-01-15 17:00:00',
        '2025-01-15 19:00:00',
        'Maison des associations',
        3,
        '2024-12-10 10:00:00',
        1,
        3
    );
-- TERMINEE
-- 5. Lier les organisateurs aux missions (Alice organise les 3 missions)
-- id_mission = 1, 2, 3 | id_organizer = 1 (Alice)
INSERT INTO `mission_organizer` (`id_mission`, `id_organizer`)
VALUES (1, 1),
    (2, 1),
    (3, 1);
-- 6. Assigner des catégories aux missions
-- Mission 1 (Nettoyage) -> Écologie (1)
-- Mission 2 (Maraude) -> Solidarité (2)
-- Mission 3 (Soutien) -> Éducation (3)
INSERT INTO `mission_category` (`id_mission`, `id_category`)
VALUES (1, 1),
    (2, 2),
    (3, 3);
-- 7. Inscrire des bénévoles aux missions
-- Bob est inscrit et validé (2) sur la mission 1
-- Charlie est en attente (1) sur la mission 1
INSERT INTO `inscription` (
        `inscription_date`,
        `id_user`,
        `id_mission`,
        `id_inscription_status`
    )
VALUES (NOW(), 2, 1, 2),
    (NOW(), 3, 1, 1);