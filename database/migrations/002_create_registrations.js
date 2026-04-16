exports.up = function(knex) {
  return knex.schema
    .createTable('registrations', t => {
      t.increments('id').primary();
      t.string('reference_number', 20).unique().notNullable();
      t.integer('user_id').references('id').inTable('users');
      t.string('full_name', 255).notNullable();
      t.date('dob').notNullable();
      t.string('cccd', 12).unique().notNullable();
      t.text('address');
      t.string('phone', 20).notNullable();
      t.string('email', 255).notNullable();
      t.string('licence_category', 5).notNullable();
      t.string('status', 20).defaultTo('pending');
      t.string('student_id', 20).unique();
      t.integer('reviewed_by').references('id').inTable('users');
      t.timestamp('reviewed_at');
      t.text('rejection_reason');
      t.timestamps(true, true);
    })
    .createTable('registration_documents', t => {
      t.increments('id').primary();
      t.integer('registration_id').references('id').inTable('registrations');
      t.string('document_type', 30).notNullable();
      t.string('file_path', 500).notNullable();
      t.string('file_name', 255);
      t.integer('file_size');
      t.string('mime_type', 50);
      t.timestamp('uploaded_at').defaultTo(knex.fn.now());
    })
    .createTable('profile_change_requests', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.string('field_name', 50);
      t.string('old_value', 255);
      t.string('new_value', 255);
      t.string('status', 20).defaultTo('pending');
      t.timestamp('requested_at').defaultTo(knex.fn.now());
      t.integer('reviewed_by').references('id').inTable('users');
      t.timestamp('reviewed_at');
    })
    .createTable('consent_records', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.string('policy_version', 20).notNullable();
      t.timestamp('consented_at').defaultTo(knex.fn.now());
      t.string('actor_context', 100);
      t.specificType('ip_address', 'inet');
      t.text('user_agent');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('consent_records')
    .dropTableIfExists('profile_change_requests')
    .dropTableIfExists('registration_documents')
    .dropTableIfExists('registrations');
};
