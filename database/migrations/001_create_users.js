exports.up = function(knex) {
  return knex.schema
    .createTable('roles', t => {
      t.increments('id').primary();
      t.string('name', 50).unique().notNullable();
      t.text('description');
      t.jsonb('permissions');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('users', t => {
      t.increments('id').primary();
      t.string('email', 255).unique().notNullable();
      t.string('password_hash', 255).notNullable();
      t.integer('role_id').references('id').inTable('roles');
      t.string('full_name', 255);
      t.string('phone', 20);
      t.string('status', 20).defaultTo('active');
      t.integer('failed_login_attempts').defaultTo(0);
      t.timestamp('locked_until');
      t.timestamp('last_login');
      t.timestamps(true, true);
    })
    .createTable('sessions', t => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.integer('user_id').references('id').inTable('users');
      t.string('token_hash', 255);
      t.timestamp('expires_at').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('login_attempts', t => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users');
      t.specificType('ip_address', 'inet');
      t.boolean('success');
      t.timestamp('attempted_at').defaultTo(knex.fn.now());
    })
    .createTable('password_reset_tokens', t => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users');
      t.string('token_hash', 255).unique().notNullable();
      t.timestamp('expires_at').notNullable();
      t.boolean('used').defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('audit_log', t => {
      t.increments('id').primary();
      t.integer('user_id');
      t.string('action', 100).notNullable();
      t.string('entity_type', 50);
      t.integer('entity_id');
      t.jsonb('old_value');
      t.jsonb('new_value');
      t.specificType('ip_address', 'inet');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('audit_log')
    .dropTableIfExists('password_reset_tokens')
    .dropTableIfExists('login_attempts')
    .dropTableIfExists('sessions')
    .dropTableIfExists('users')
    .dropTableIfExists('roles');
};
