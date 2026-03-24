# Ce script est exécuté par Docker après 00_schema.sql et 01_data.sql

echo "=== Création de la base de test ==="
TEST_DB="${MYSQL_DATABASE}_test"

# 1. On crée la base de données de test et on donne les droits
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$TEST_DB\`; GRANT ALL PRIVILEGES ON \`$TEST_DB\`.* TO '$MYSQL_USER'@'%'; FLUSH PRIVILEGES;"

# 2. On clone la structure et les données de base (Roles, Status) de la DB principale vers la DB de test
mysqldump --set-gtid-purged=OFF -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" | mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$TEST_DB"

echo "=== Base de test ($TEST_DB) prête ! ==="