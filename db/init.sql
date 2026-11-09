-- PawDonor database schema + dummy seed data.
-- Mounted into /docker-entrypoint-initdb.d, so PostgreSQL runs it ONCE, the first
-- time the data volume is empty. After that the data lives in the named volume.
-- To re-run it: docker compose down -v   (this deletes the volume!)

CREATE TABLE IF NOT EXISTS donors (
  id            SERIAL       PRIMARY KEY,
  pet_name      VARCHAR(80)  NOT NULL,
  photo_url     TEXT,
  species       VARCHAR(3)   NOT NULL CHECK (species IN ('Cat', 'Dog')),
  breed         VARCHAR(80)  NOT NULL,
  age_years     SMALLINT     NOT NULL CHECK (age_years BETWEEN 1 AND 25),
  weight_kg     NUMERIC(4,1) NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 100),
  blood_type    VARCHAR(10)  NOT NULL,
  location      VARCHAR(80)  NOT NULL,
  owner_contact VARCHAR(120) NOT NULL,
  is_available  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- A blood type must belong to the pet's species.
  CONSTRAINT donors_blood_type_by_species CHECK (
    (species = 'Dog' AND blood_type IN ('DEA 1.1+', 'DEA 1.1-', 'DEA 1.2', 'DEA 3', 'DEA 4', 'DEA 5', 'DEA 7'))
    OR (species = 'Cat' AND blood_type IN ('A', 'B', 'AB'))
  )
);

CREATE TABLE IF NOT EXISTS donation_requests (
  id          SERIAL       PRIMARY KEY,
  pet_name    VARCHAR(80)  NOT NULL,
  species     VARCHAR(3)   NOT NULL CHECK (species IN ('Cat', 'Dog')),
  blood_type  VARCHAR(10)  NOT NULL,
  location    VARCHAR(80)  NOT NULL,
  urgency     VARCHAR(6)   NOT NULL DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High')),
  notes       TEXT,
  status      VARCHAR(12)  NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  -- Optional relation: the donor chosen for this request.
  -- If that donor is deleted, the request stays and the link is cleared.
  donor_id    INTEGER      REFERENCES donors (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT requests_blood_type_by_species CHECK (
    (species = 'Dog' AND blood_type IN ('DEA 1.1+', 'DEA 1.1-', 'DEA 1.2', 'DEA 3', 'DEA 4', 'DEA 5', 'DEA 7'))
    OR (species = 'Cat' AND blood_type IN ('A', 'B', 'AB'))
  )
);

CREATE INDEX IF NOT EXISTS idx_donors_species_blood ON donors (species, blood_type);
CREATE INDEX IF NOT EXISTS idx_donors_available     ON donors (is_available);
CREATE INDEX IF NOT EXISTS idx_requests_status      ON donation_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_donor       ON donation_requests (donor_id);

-- ---------------------------------------------------------------------------
-- Dummy data (fictional pets, example.com contacts - no real personal data)
-- ---------------------------------------------------------------------------
INSERT INTO donors (pet_name, species, breed, age_years, weight_kg, blood_type, location, owner_contact, is_available, created_at) VALUES
  ('Bella',   'Dog', 'Golden Retriever',  4, 28.5, 'DEA 1.1-', 'Bandung', 'owner.bella@example.com',   TRUE,  NOW() - INTERVAL '30 days'),
  ('Rocky',   'Dog', 'Labrador Retriever', 5, 31.0, 'DEA 1.1-', 'Jakarta', 'owner.rocky@example.com',   TRUE,  NOW() - INTERVAL '27 days'),
  ('Charlie', 'Dog', 'Beagle',            3, 13.2, 'DEA 1.1+', 'Bandung', 'owner.charlie@example.com', TRUE,  NOW() - INTERVAL '21 days'),
  ('Maggy',   'Dog', 'Siberian Husky',    6, 24.8, 'DEA 4',    'Bandung', 'owner.maggy@example.com',   TRUE,  NOW() - INTERVAL '18 days'),
  ('Max',     'Dog', 'German Shepherd',   7, 34.0, 'DEA 1.1-', 'Bekasi',  'owner.max@example.com',     FALSE, NOW() - INTERVAL '15 days'),
  ('Cookie',  'Dog', 'Poodle',            2, 18.4, 'DEA 1.2',  'Bogor',   'owner.cookie@example.com',  TRUE,  NOW() - INTERVAL '9 days'),
  ('Duchess', 'Dog', 'Mixed breed',       5, 26.0, 'DEA 7',    'Jakarta', 'owner.duchess@example.com', TRUE,  NOW() - INTERVAL '7 days'),
  ('Milo',    'Cat', 'Domestic Shorthair', 2,  4.8, 'A',       'Bandung', 'owner.milo@example.com',    TRUE,  NOW() - INTERVAL '12 days'),
  ('Oyen',    'Cat', 'Kampung',           3,  4.3, 'B',        'Jakarta', 'owner.oyen@example.com',    TRUE,  NOW() - INTERVAL '10 days'),
  ('Simba',   'Cat', 'Maine Coon',        4,  7.1, 'A',        'Bandung', 'owner.simba@example.com',   TRUE,  NOW() - INTERVAL '6 days'),
  ('Nala',    'Cat', 'British Shorthair', 2,  4.5, 'AB',       'Bogor',   'owner.nala@example.com',    TRUE,  NOW() - INTERVAL '4 days'),
  ('Snow',    'Cat', 'Persian',           5,  4.6, 'B',        'Bandung', 'owner.snow@example.com',    FALSE, NOW() - INTERVAL '2 days'),
  ('Leo',     'Cat', 'Ragdoll',           3,  5.9, 'A',        'Bekasi',  'owner.leo@example.com',     TRUE,  NOW() - INTERVAL '1 day');

INSERT INTO donation_requests (pet_name, species, blood_type, location, urgency, notes, status, donor_id, created_at) VALUES
  ('Coco',     'Dog', 'DEA 1.1-', 'Bandung', 'High',   'Severe anemia after surgery, the clinic is looking for a donor within 24 hours.', 'Pending',     NULL, NOW() - INTERVAL '1 day'),
  ('Whiskers', 'Cat', 'B',        'Bandung', 'High',   'Kitten with blood loss, needs a type B donor as soon as possible.',               'Pending',     NULL, NOW() - INTERVAL '2 days'),
  ('Pepper',   'Dog', 'DEA 1.1+', 'Bandung', 'Medium', 'Planned transfusion before treatment next week.',                                 'In Progress', (SELECT id FROM donors WHERE pet_name = 'Charlie'), NOW() - INTERVAL '3 days'),
  ('Mochi',    'Cat', 'A',        'Jakarta', 'Medium', 'Chronic anemia, regular support needed.',                                         'Pending',     NULL, NOW() - INTERVAL '5 days'),
  ('Duke',     'Dog', 'DEA 4',    'Bekasi',  'Low',    'Backup donor wanted for a scheduled surgery.',                                    'Pending',     NULL, NOW() - INTERVAL '6 days'),
  ('Kiko',     'Cat', 'AB',       'Bogor',   'Medium', 'Transfusion finished at a partner clinic.',                                       'Completed',   (SELECT id FROM donors WHERE pet_name = 'Nala'),    NOW() - INTERVAL '12 days'),
  ('Buddy',    'Dog', 'DEA 1.1-', 'Jakarta', 'Low',    'Recovered well, request closed by the owner.',                                    'Completed',   (SELECT id FROM donors WHERE pet_name = 'Rocky'),   NOW() - INTERVAL '20 days');

UPDATE donors SET updated_at = created_at;
UPDATE donation_requests SET updated_at = created_at;
