exports.up = function(knex) {
  return knex.schema
    .createTable('training_progress', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users').unique();
      t.integer('theory_hours').defaultTo(0);
      t.integer('cabin_hours').defaultTo(0);
      t.integer('practical_hours').defaultTo(0);
      t.decimal('dat_km', 8, 1).defaultTo(0);
      t.string('licence_category', 5);
      t.timestamp('last_updated').defaultTo(knex.fn.now());
    })
    .createTable('session_records', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.integer('session_slot_id').references('id').inTable('session_slots');
      t.integer('duration_minutes').defaultTo(60);
      t.string('dat_source', 20); t.string('dat_reference', 50);
      t.decimal('dat_km', 6, 1); t.boolean('verified').defaultTo(false);
      t.timestamp('recorded_at').defaultTo(knex.fn.now());
    })
    .createTable('skill_assessments', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.integer('instructor_id').references('id').inTable('users');
      t.integer('vehicle_control').checkBetween([1, 5]);
      t.integer('road_awareness').checkBetween([1, 5]);
      t.integer('parking').checkBetween([1, 5]);
      t.integer('emergency_stops').checkBetween([1, 5]);
      t.text('comments'); t.boolean('locked').defaultTo(true);
      t.timestamp('submitted_at').defaultTo(knex.fn.now());
    })
    .createTable('exam_eligibility_checks', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.string('check_rule', 100); t.string('check_value', 100);
      t.boolean('passed'); t.integer('checked_by').references('id').inTable('users');
      t.timestamp('checked_at').defaultTo(knex.fn.now());
    })
    .createTable('immutable_audit_log', t => {
      t.bigIncrements('id').primary();
      t.integer('actor_id').notNullable();
      t.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now());
      t.string('entity_type', 50).notNullable();
      t.integer('entity_id').notNullable();
      t.string('field_name', 100).notNullable();
      t.text('old_value'); t.text('new_value');
      t.specificType('ip_address', 'inet');
      t.string('device_fingerprint', 255);
      t.string('prev_hash', 64); t.string('current_hash', 64);
    })
    .createTable('maintenance_records', t => {
      t.increments('id').primary();
      t.integer('vehicle_id').references('id').inTable('vehicles');
      t.string('type', 50); t.date('maintenance_date');
      t.decimal('odometer_km', 10, 1); t.string('status', 20).defaultTo('scheduled');
      t.text('notes'); t.integer('recorded_by').references('id').inTable('users');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('maintenance_records')
    .dropTableIfExists('immutable_audit_log')
    .dropTableIfExists('exam_eligibility_checks')
    .dropTableIfExists('skill_assessments')
    .dropTableIfExists('session_records')
    .dropTableIfExists('training_progress');
};
