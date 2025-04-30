
--@block Creates user, processes, buckets, error log, and error email recipients tables
create table public.users (
  user_id serial not null,
  username character varying(255) not null,
  password character varying(255) not null,
  email character varying(255) not null,
  first_created timestamp without time zone not null,
  last_updated timestamp without time zone null,
  constraint users_pkey primary key (user_id),
  constraint users_email_key unique (email),
  constraint users_username_key unique (username)
) TABLESPACE pg_default;

CREATE TYPE statuses AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

create table public.processes (
  process_id serial not null,
  user_id integer null,
  delay_start boolean null,
  start_time timestamp with time zone null,
  end_time timestamp with time zone null,
  status public.statuses null,
  constraint processes_pkey primary key (process_id),
  constraint processes_user_id_fkey foreign KEY (user_id) references users (user_id)
) TABLESPACE pg_default;

create table public.buckets (
  bucket_id serial not null,
  process_id integer not null,
  duration integer not null,
  description character varying null,
  constraint buckets_pkey primary key (bucket_id),
  constraint buckets_process_id_fkey foreign KEY (process_id) references processes (process_id)
) TABLESPACE pg_default;

create table public.error_log (
  error_id serial not null,
  process_id integer null,
  failure_time timestamp with time zone null,
  failure_stage integer null,
  message text null,
  constraint error_log_pkey primary key (error_id),
  constraint error_log_failure_stage_fkey foreign KEY (failure_stage) references buckets (bucket_id),
  constraint error_log_process_id_fkey foreign KEY (process_id) references processes (process_id)
) TABLESPACE pg_default;

create table public.error_email_recipients (
  email_recipient_id serial not null,
  user_id integer not null,
  email character varying(255) not null,
  constraint error_email_recipiants_pkey primary key (email_recipient_id),
  constraint error_email_recipiants_email_fkey foreign KEY (email) references users (email),
  constraint error_email_recipiants_user_id_fkey foreign KEY (user_id) references users (user_id)
) TABLESPACE pg_default;

--@block drops all tables
DROP TABLE error_email_recipients;
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
FROM 'ABSOLUTE_PATH_TO_FILE/error_email_recipients.csv' 
DELIMITER ',' CSV HEADER;


--@block displays all tables
SELECT * FROM users;
SELECT * FROM processes;
SELECT * FROM buckets; 
SELECT * FROM error_log;
SELECT * FROM error_email_recipients;
