const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ddb } = require('../utils/dynamoClient');
const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const USERS_TABLE = process.env.USERS_TABLE_NAME;

exports.registerUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const command = new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        username,
        passwordHash: hashedPassword
      },
      ConditionExpression: 'attribute_not_exists(username)' // prevents duplicates
    });

    await ddb.send(command);
    res.status(201).json({ message: '✅ User registered' });

  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(400).json({ error: '❌ Username already exists' });
    }
    console.error(err);
    res.status(500).json({ error: '❌ Failed to register user' });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const getCmd = new GetCommand({
      TableName: USERS_TABLE,
      Key: { username }
    });

    const result = await ddb.send(getCmd);
    const user = result.Item;

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: '❌ Invalid credentials' });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Login failed' });
  }
};
