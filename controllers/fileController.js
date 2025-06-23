const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../utils/s3Client');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamoClient');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

require('dotenv').config();

exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileStream = fs.createReadStream(req.file.path);
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.file.filename,
    Body: fileStream,
    ContentType: req.file.mimetype
  };

  try {
    await s3.send(new PutObjectCommand(params));
    fs.unlinkSync(req.file.path); // delete local file
    const { v4: uuidv4 } = require('uuid');
const { ddb } = require('../utils/dynamoClient');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const fileId = uuidv4(); // unique ID per file

const saveToDb = new PutCommand({
  TableName: 'UserFiles',
  Item: {
    username: req.user.username,
    fileId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    uploadedAt: new Date().toISOString()
  }
});

await ddb.send(saveToDb);

    res.json({ message: '✅ File uploaded to S3', file: req.file.filename });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: '❌ Failed to upload' });
  }
};



exports.getUserFiles = async (req, res) => {
  try {
    const command = new QueryCommand({
      TableName: 'UserFiles',
      KeyConditionExpression: 'username = :user',
      ExpressionAttributeValues: {
        ':user': req.user.username
      },
      ScanIndexForward: false // show latest first
    });

    const result = await ddb.send(command);

    res.json({ files: result.Items });
  } catch (err) {
    console.error('Fetch files error:', err);
    res.status(500).json({ error: '❌ Failed to fetch files' });
  }
};

exports.generateDownloadLink = async (req, res) => {
  const filename = req.params.filename;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes

    res.json({ downloadUrl: url });
  } catch (err) {
    console.error('Download link error:', err);
    res.status(500).json({ error: '❌ Failed to generate download link' });
  }
};


exports.deleteFile = async (req, res) => {
  const { fileId } = req.params;
  const username = req.user.username;

  try {
    // Step 1: Get file record from DynamoDB
    const getCmd = new GetCommand({
      TableName: 'UserFiles',
      Key: { username, fileId }
    });

    const result = await ddb.send(getCmd);
    if (!result.Item) {
      return res.status(404).json({ error: '❌ File not found or access denied' });
    }

    const filename = result.Item.filename;

    // Step 2: Delete from S3
    const deleteS3 = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename
    });
    await s3.send(deleteS3);

    // Step 3: Delete from DynamoDB
    const deleteDb = new DeleteCommand({
      TableName: 'UserFiles',
      Key: { username, fileId }
    });
    await ddb.send(deleteDb);

    res.json({ message: '✅ File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: '❌ Failed to delete file' });
  }
};