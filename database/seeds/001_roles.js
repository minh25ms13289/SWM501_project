exports.seed = async function(knex) {
  await knex('roles').del();
  await knex('roles').insert([
    { id: 1, name: 'learner', description: 'Student/Learner driver' },
    { id: 2, name: 'instructor', description: 'Driving instructor' },
    { id: 3, name: 'admin', description: 'Centre administrator' },
    { id: 4, name: 'director', description: 'Centre director' },
    { id: 5, name: 'compliance_officer', description: 'Compliance/Data protection officer' },
  ]);
};
