-- Adds hybrid challenge support:
-- 1) challenge mode (team or individual)
-- 2) individual participants
-- 3) friend invites

ALTER TABLE challenges
    ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'team' AFTER team_id;

CREATE TABLE IF NOT EXISTS challenge_participants (
    id INT NOT NULL AUTO_INCREMENT,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_challenge_participant UNIQUE (challenge_id, user_id),
    CONSTRAINT fk_challenge_participants_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    CONSTRAINT fk_challenge_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS challenge_invites (
    id INT NOT NULL AUTO_INCREMENT,
    challenge_id INT NOT NULL,
    inviter_user_id INT NOT NULL,
    invitee_user_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    PRIMARY KEY (id),
    INDEX idx_challenge_invites_challenge (challenge_id),
    INDEX idx_challenge_invites_invitee (invitee_user_id),
    CONSTRAINT fk_challenge_invites_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    CONSTRAINT fk_challenge_invites_inviter FOREIGN KEY (inviter_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_challenge_invites_invitee FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE CASCADE
);
