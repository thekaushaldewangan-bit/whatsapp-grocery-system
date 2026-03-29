db = db.getSiblingDB('whatsapp-grocery');

db.createCollection('products');
db.createCollection('orders');
db.createCollection('users');
db.createCollection('admins');

print('Database initialized: whatsapp-grocery');
