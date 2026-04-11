const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('users').del();
  const hash = await bcrypt.hash('Admin1234', 12);
  await knex('users').insert([
    { id: 1, email: 'admin@sds.vn', password_hash: hash, role_id: 3, full_name: 'Admin SDS', phone: '0901000001' },
    { id: 2, email: 'instructor@sds.vn', password_hash: hash, role_id: 2, full_name: 'Tran Van B', phone: '0912345678' },
    { id: 3, email: 'learner@sds.vn', password_hash: hash, role_id: 1, full_name: 'Nguyen Van A', phone: '0901234567' },
    { id: 4, email: 'director@sds.vn', password_hash: hash, role_id: 4, full_name: 'Le Van C', phone: '0901000004' },
  ]);
};
