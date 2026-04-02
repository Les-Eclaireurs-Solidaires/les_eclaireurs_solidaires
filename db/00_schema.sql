CREATE TABLE IF NOT EXISTS contact_message (
    contact_message_id INTEGER NOT NULL AUTO_INCREMENT,
    contact_message_email VARCHAR(255) NOT NULL,
    contact_message_lastname VARCHAR(255) NOT NULL,
    contact_message_subject VARCHAR(255) NOT NULL,
    contact_message_content TEXT,
    contact_message_created_at DATETIME NOT NULL,
    contact_message_updated_at DATETIME,
    PRIMARY KEY (contact_message_id)
);
CREATE TABLE IF NOT EXISTS `role` (
    role_id INTEGER NOT NULL AUTO_INCREMENT,
    role_name VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (role_id)
);
CREATE TABLE IF NOT EXISTS city (
    city_id INTEGER NOT NULL AUTO_INCREMENT,
    city_name VARCHAR(255) NOT NULL,
    city_zip VARCHAR(20) NOT NULL,
    PRIMARY KEY (city_id),
    INDEX idx_city_name (city_name),
    INDEX idx_city_zip (city_zip)
);
CREATE TABLE IF NOT EXISTS category (
    category_id INTEGER NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (category_id)
);
CREATE TABLE IF NOT EXISTS mission_status (
    mission_status_id INTEGER NOT NULL AUTO_INCREMENT,
    mission_status_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (mission_status_id)
);
CREATE TABLE IF NOT EXISTS inscription_status (
    inscription_status_id INTEGER NOT NULL AUTO_INCREMENT,
    inscription_status_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (inscription_status_id)
);
CREATE TABLE IF NOT EXISTS request_organizer_status (
    request_organizer_status_id INTEGER NOT NULL AUTO_INCREMENT,
    request_organizer_status_name VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (request_organizer_status_id)
);
CREATE TABLE IF NOT EXISTS `user` (
    user_id INTEGER NOT NULL AUTO_INCREMENT,
    user_uuid CHAR(36) NOT NULL UNIQUE,
    user_refresh_token VARCHAR(255),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_firstname VARCHAR(255),
    user_lastname VARCHAR(255),
    user_avatar VARCHAR(255),
    user_created_at DATETIME NOT NULL,
    user_updated_at DATETIME,
    user_deleted_at DATETIME,
    id_city INTEGER NULL,
    id_role INTEGER NOT NULL,
    PRIMARY KEY (user_id),
    FOREIGN KEY (id_city) REFERENCES city(city_id),
    FOREIGN KEY (id_role) REFERENCES role(role_id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS mission (
    mission_id INTEGER NOT NULL AUTO_INCREMENT,
    mission_uuid CHAR(36) NOT NULL UNIQUE,
    mission_name VARCHAR(255) NOT NULL UNIQUE,
    mission_description TEXT,
    mission_date_start DATETIME NOT NULL,
    mission_date_end DATETIME NOT NULL,
    mission_address VARCHAR(255) NOT NULL,
    mission_nbr_volunteer_needed INTEGER NOT NULL,
    mission_created_at DATETIME NOT NULL,
    mission_updated_at DATETIME,
    mission_deleted_at DATETIME,
    id_city INTEGER NOT NULL,
    id_mission_status INTEGER NOT NULL,
    PRIMARY KEY (mission_id),
    FOREIGN KEY (id_city) REFERENCES city(city_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_mission_status) REFERENCES mission_status(mission_status_id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS mission_comment (
    mission_comment_id INTEGER NOT NULL AUTO_INCREMENT,
    mission_comment_content TEXT NOT NULL,
    mission_comment_created_at DATETIME NOT NULL,
    id_mission INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    PRIMARY KEY (mission_comment_id),
    FOREIGN KEY (id_mission) REFERENCES mission(mission_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_user) REFERENCES user(user_id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS `message` (
    message_id INTEGER NOT NULL AUTO_INCREMENT,
    message_uuid CHAR(36) NOT NULL UNIQUE,
    message_content TEXT NOT NULL,
    message_send_at DATETIME NOT NULL,
    id_sender INTEGER NOT NULL,
    id_mission INTEGER NULL,
    PRIMARY KEY (message_id),
    FOREIGN KEY (id_sender) REFERENCES `user`(user_id) ON DELETE RESTRICT,
    FOREIGN KEY  (id_mission) REFERENCES mission(mission_id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS message_recipient (
    message_recipient_id INTEGER NOT NULL AUTO_INCREMENT,
    message_recipient_is_read TINYINT NOT NULL DEFAULT 0,
    id_message INTEGER NOT NULL,
    id_recipient INTEGER NOT NULL,
    PRIMARY KEY (message_recipient_id),
    FOREIGN KEY (id_message) REFERENCES message(message_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_recipient) REFERENCES `user`(user_id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS mission_organizer (
    mission_organizer_id INTEGER NOT NULL AUTO_INCREMENT,
    mission_organizer_is_main TINYINT NOT NULL DEFAULT 0,
    mission_organizer_is_participant TINYINT NOT NULL DEFAULT 0,
    id_mission INTEGER NOT NULL,
    id_organizer INTEGER NOT NULL,
    PRIMARY KEY (mission_organizer_id),
    FOREIGN KEY (id_mission) REFERENCES mission(mission_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_organizer) REFERENCES `user`(user_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_mission_organizer (id_mission, id_organizer)
);
CREATE TABLE IF NOT EXISTS mission_category (
    mission_category_id INTEGER NOT NULL AUTO_INCREMENT,
    id_mission INTEGER NOT NULL,
    id_category INTEGER NOT NULL,
    PRIMARY KEY (mission_category_id),
    FOREIGN KEY (id_mission) REFERENCES mission(mission_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_category) REFERENCES category(category_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_mission_category (id_mission, id_category)
);
CREATE TABLE IF NOT EXISTS inscription (
    inscription_id INTEGER NOT NULL AUTO_INCREMENT,
    inscription_date DATETIME NOT NULL,
    inscription_recall_send_at DATETIME,
    id_user INTEGER NOT NULL,
    id_mission INTEGER NOT NULL,
    id_inscription_status INTEGER NOT NULL,
    PRIMARY KEY (inscription_id),
    FOREIGN KEY (id_user) REFERENCES `user`(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_mission) REFERENCES mission(mission_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_inscription_status) REFERENCES inscription_status(inscription_status_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_user_mission (id_user, id_mission)
);
CREATE TABLE IF NOT EXISTS request_organizer (
    request_organizer_id INTEGER NOT NULL AUTO_INCREMENT,
    request_organizer_content TEXT NOT NULL,
    request_organizer_created_at DATETIME NOT NULL,
    request_organizer_cancelled_at DATETIME,
    request_organizer_resolved_at DATETIME,
    id_user INTEGER NOT NULL,
    id_request_organizer_status INTEGER NOT NULL,
    PRIMARY KEY (request_organizer_id),
    FOREIGN KEY (id_user) REFERENCES `user`(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (id_request_organizer_status) REFERENCES request_organizer_status(request_organizer_status_id) ON DELETE RESTRICT
);