CREATE DATABASE IF NOT EXISTS portal_prod_psp;
CREATE DATABASE IF NOT EXISTS portal_prod_gnr;

GRANT ALL PRIVILEGES ON portal_prod_psp.* TO 'portal_user'@'%';
GRANT ALL PRIVILEGES ON portal_prod_gnr.* TO 'portal_user'@'%';

FLUSH PRIVILEGES;