exports.up = function(knex) {
  return knex.schema
    .createTable('vehicles', t => {
      t.increments('id').primary();
      t.string('plate_number', 20).unique().notNullable();
      t.string('make', 50); t.string('model', 50); t.integer('year');
      t.string('status', 30).defaultTo('active');
      t.date('next_inspection_date');
      t.decimal('odometer_km', 10, 1).defaultTo(0);
      t.timestamps(true, true);
    })
    .createTable('instructor_profiles', t => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').unique();
      t.specificType('categories', 'varchar[]');
      t.string('certificate_number', 50);
      t.date('certificate_expiry');
      t.jsonb('available_schedule');
      t.string('status', 20).defaultTo('active');
      t.timestamps(true, true);
    })
    .createTable('session_slots', t => {
      t.increments('id').primary();
      t.integer('instructor_id').references('user_id').inTable('instructor_profiles');
      t.date('date').notNullable(); t.time('start_time').notNullable(); t.time('end_time').notNullable();
      t.integer('max_learners').defaultTo(3);
      t.integer('vehicle_id').references('id').inTable('vehicles');
      t.string('status', 20).defaultTo('open');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.unique(['instructor_id', 'date', 'start_time']);
    })
    .createTable('bookings', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.integer('session_slot_id').references('id').inTable('session_slots');
      t.string('status', 20).defaultTo('scheduled');
      t.timestamp('booked_at').defaultTo(knex.fn.now());
      t.timestamp('cancelled_at');
      t.unique(['learner_id', 'session_slot_id']);
    })
    .createTable('question_bank', t => {
      t.increments('id').primary();
      t.string('category', 50).notNullable(); t.text('text').notNullable();
      t.jsonb('options').notNullable(); t.string('correct_answer', 5).notNullable();
      t.text('explanation'); t.boolean('is_critical').defaultTo(false);
      t.specificType('licence_categories', 'varchar[]');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('theory_tests', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.string('licence_category', 5); t.timestamp('started_at').defaultTo(knex.fn.now());
      t.timestamp('submitted_at'); t.integer('score'); t.integer('total_questions').defaultTo(25);
      t.boolean('passed'); t.integer('time_limit_seconds').defaultTo(1140);
    })
    .createTable('fee_schedules', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.string('fee_type', 30).notNullable();
      t.decimal('amount', 12, 2).notNullable();
      t.date('due_date');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('payments', t => {
      t.increments('id').primary();
      t.integer('learner_id').references('id').inTable('users');
      t.decimal('amount', 12, 2).notNullable();
      t.string('payment_method', 30);
      t.string('reference_number', 50).unique();
      t.integer('recorded_by').references('id').inTable('users');
      t.boolean('voided').defaultTo(false);
      t.date('payment_date').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payments').dropTableIfExists('fee_schedules')
    .dropTableIfExists('theory_tests').dropTableIfExists('question_bank')
    .dropTableIfExists('bookings').dropTableIfExists('session_slots')
    .dropTableIfExists('instructor_profiles').dropTableIfExists('vehicles');
};
