CREATE DATABASE IF NOT EXISTS portal_dev_psp;
CREATE DATABASE IF NOT EXISTS portal_dev_gnr;

GRANT ALL PRIVILEGES ON portal_dev_psp.* TO 'portal_dev_user'@'%';
GRANT ALL PRIVILEGES ON portal_dev_gnr.* TO 'portal_dev_user'@'%';

FLUSH PRIVILEGES;