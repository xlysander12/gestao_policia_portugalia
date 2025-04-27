| Action                       | Command                                                                                                 |
|------------------------------|---------------------------------------------------------------------------------------------------------|
| Restore from `.sql.gz`       | `gunzip -c backup.sql.gz \| mysql -u root -p database`                                                  |
| Replay binary log for one db | `mysqlbinlog --database=database binlog_file \| mysql -u root -p`                                       |
| Replay only until timestamp  | `mysqlbinlog --stop-datetime="YYYY-MM-DD HH:MM:SS" binlog_file \| mysql -u root -p`                     |
| Replay only db + time        | `mysqlbinlog --database=database --stop-datetime="YYYY-MM-DD HH:MM:SS" binlog_file \| mysql -u root -p` |

More information at: https://chatgpt.com/c/680db860-3e98-8009-9308-05ee60776cc7