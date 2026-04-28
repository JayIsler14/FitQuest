const db = require('../config/db');

const saveManyToMany = async (client, table, column, userId, values = []) => {
  await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);

  if (!Array.isArray(values) || values.length === 0) return;

  await client.query(
    `
      INSERT INTO ${table} (user_id, ${column})
      SELECT $1, UNNEST($2::int[])
      ON CONFLICT DO NOTHING
    `,
    [userId, values]
  );
};

const normalizeIncomingProfile = (body = {}) => {
  return {
    age: body.age ?? null,
    height: body.height ?? null,
    weight: body.weight ?? null,
    goal: body.goal ?? null,
    level: body.level ?? 1,
    intensity: body.intensity ?? 1,
    weeklyAvailability:
      body.weeklyAvailability ??
      body.weekly_availability ??
      null,
    isPublic:
      body.isPublic ??
      body.is_public ??
      false,
    injuries: Array.isArray(body.injuries) ? body.injuries : [],
    allergies: Array.isArray(body.allergies) ? body.allergies : [],
    healthConditions:
      body.healthConditions ??
      body.health_conditions ??
      [],
    dietaryRestrictions:
      body.dietaryRestrictions ??
      body.dietary_restrictions ??
      []
  };
};

const shapeProfileResponse = (row) => {
  if (!row) return null;

  return {
    ...row,
    weeklyAvailability: row.weekly_availability,
    isPublic: row.is_public,
    healthConditions: row.health_conditions || [],
    dietaryRestrictions: row.dietary_restrictions || [],
    injuries: row.injuries || [],
    allergies: row.allergies || []
  };
};

exports.createProfile = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      age,
      height,
      weight,
      goal,
      level,
      intensity,
      weeklyAvailability,
      isPublic,
      injuries,
      allergies,
      healthConditions,
      dietaryRestrictions
    } = normalizeIncomingProfile(req.body);

    await client.query('BEGIN');

    await client.query(
      `
        INSERT INTO user_profiles
          (user_id, age, height, weight, goal, level, intensity, weekly_availability, is_public)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id)
        DO UPDATE SET
          age = EXCLUDED.age,
          height = EXCLUDED.height,
          weight = EXCLUDED.weight,
          goal = EXCLUDED.goal,
          level = EXCLUDED.level,
          intensity = EXCLUDED.intensity,
          weekly_availability = EXCLUDED.weekly_availability,
          is_public = EXCLUDED.is_public,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        req.user.id,
        age,
        height,
        weight,
        goal,
        level,
        intensity,
        weeklyAvailability,
        isPublic
      ]
    );

    await saveManyToMany(client, 'user_injuries', 'injury_id', req.user.id, injuries);
    await saveManyToMany(client, 'user_allergies', 'allergy_id', req.user.id, allergies);
    await saveManyToMany(
      client,
      'user_health_conditions',
      'condition_id',
      req.user.id,
      healthConditions
    );
    await saveManyToMany(
      client,
      'user_dietary_restrictions',
      'restriction_id',
      req.user.id,
      dietaryRestrictions
    );

    await client.query('COMMIT');

    res.json({ message: 'Profile created' });
  } catch (err) {
    console.error('createProfile error:', err);
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Profile creation failed' });
  } finally {
    client.release();
  }
};

exports.updateProfile = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      age,
      height,
      weight,
      goal,
      level,
      intensity,
      weeklyAvailability,
      isPublic,
      injuries,
      allergies,
      healthConditions,
      dietaryRestrictions
    } = normalizeIncomingProfile(req.body);

    await client.query('BEGIN');

    const updateResult = await client.query(
      `
        UPDATE user_profiles
        SET age = $1,
            height = $2,
            weight = $3,
            goal = $4,
            level = $5,
            intensity = $6,
            weekly_availability = $7,
            is_public = $8,
            profile_change_version = COALESCE(profile_change_version, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $9
      `,
      [
        age,
        height,
        weight,
        goal,
        level,
        intensity,
        weeklyAvailability,
        isPublic,
        req.user.id
      ]
    );

    if (updateResult.rowCount === 0) {
      await client.query(
        `
          INSERT INTO user_profiles
            (user_id, age, height, weight, goal, level, intensity, weekly_availability, is_public, profile_change_version)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
        `,
        [
          req.user.id,
          age,
          height,
          weight,
          goal,
          level,
          intensity,
          weeklyAvailability,
          isPublic
        ]
      );
    }

    await client.query(
      `DELETE FROM generated_plans WHERE user_id = $1`,
      [req.user.id]
    );

    await saveManyToMany(client, 'user_injuries', 'injury_id', req.user.id, injuries);
    await saveManyToMany(client, 'user_allergies', 'allergy_id', req.user.id, allergies);
    await saveManyToMany(
      client,
      'user_health_conditions',
      'condition_id',
      req.user.id,
      healthConditions
    );
    await saveManyToMany(
      client,
      'user_dietary_restrictions',
      'restriction_id',
      req.user.id,
      dietaryRestrictions
    );

    await client.query('COMMIT');

    res.json({ message: 'Profile updated and plans reset' });
  } catch (err) {
    console.error('updateProfile error:', err);
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Profile update failed' });
  } finally {
    client.release();
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
        SELECT
          up.*,
          ARRAY(
            SELECT injury_id
            FROM user_injuries
            WHERE user_id = $1
          ) AS injuries,
          ARRAY(
            SELECT allergy_id
            FROM user_allergies
            WHERE user_id = $1
          ) AS allergies,
          ARRAY(
            SELECT condition_id
            FROM user_health_conditions
            WHERE user_id = $1
          ) AS health_conditions,
          ARRAY(
            SELECT restriction_id
            FROM user_dietary_restrictions
            WHERE user_id = $1
          ) AS dietary_restrictions
        FROM user_profiles up
        WHERE up.user_id = $1
      `,
      [userId]
    );

    res.json(shapeProfileResponse(result.rows[0]));
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};