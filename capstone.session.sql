
--@block Creates user, processes, buckets, error log, and error email recipiant tables
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_created TIMESTAMP NOT NULL,
  last_updated TIMESTAMP
);

CREATE TYPE statuses AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE processes (
  process_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id),
  delay_start BOOLEAN NOT NULL,
  start_time TIMESTAMP UNIQUE NOT NULL,
  end_time TIMESTAMP,
  status statuses
);

-- Possible Change: remove skip flag, since duration can be set to 0
CREATE TABLE buckets (
  bucket_id SERIAL PRIMARY KEY,
  process_id INT REFERENCES processes(process_id),
  duration TIME NOT NULL,
  skip_flag BOOLEAN NOT NULL,
  active_flag BOOLEAN NOT NULL
);

CREATE TABLE error_log (
  error_id SERIAL PRIMARY KEY,
  process_id INT REFERENCES processes(process_id),
  failure_time TIMESTAMP NOT NULL,
  failure_stage INT REFERENCES buckets(bucket_id)
);

CREATE TABLE error_email_recipiants (
  email varchar(255) REFERENCES users(email)
);


--@block drops all tables
DROP TABLE error_email_recipiants;
DROP TABLE error_log;
DROP TABLE buckets;
DROP TABLE processes;
DROP TYPE statuses;
DROP TABLE users;


--@block enters in test data - absolute path seems to be necessary for COPY
COPY users(username, password, email, first_created, last_updated) 
FROM 'ABSOLUTE_PATH_TO_FILE/users.csv' 
DELIMITER ',' CSV HEADER;

--@block
COPY processes(user_id, delay_start, start_time, end_time, status) 
FROM 'ABSOLUTE_PATH_TO_FILE/processes.csv' 
DELIMITER ',' CSV HEADER;

--@block
COPY buckets(process_id, duration, skip_flag, active_flag) 
FROM 'ABSOLUTE_PATH_TO_FILE/buckets.csv' 
DELIMITER ',' CSV HEADER;

--@block
COPY error_log(process_id, failure_time, failure_stage) 
FROM 'ABSOLUTE_PATH_TO_FILE/error_log.csv' 
DELIMITER ',' CSV HEADER;

--@block
COPY error_email_recipiants
FROM 'ABSOLUTE_PATH_TO_FILE/error_email_recipiants.csv' 
DELIMITER ',' CSV HEADER;


--@block displays all tables
SELECT * FROM users;
SELECT * FROM processes;
SELECT * FROM buckets; 
SELECT * FROM error_log;
SELECT * FROM error_email_recipiants;