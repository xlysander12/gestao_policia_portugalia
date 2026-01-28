-- Allow user to create databases
GRANT CREATE, CREATE TEMPORARY TABLES ON *.*
    TO 'portalseguranca_local'@'%';

GRANT ALL PRIVILEGES ON *.*
TO 'portalseguranca_local'@'%';

FLUSH PRIVILEGES;
