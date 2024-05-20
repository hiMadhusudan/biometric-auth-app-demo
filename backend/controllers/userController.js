const User = require('../models/User');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const base64url = require('base64url');

const rpID = 'localhost'; // Replace with your domain for production
const rpName = 'Biometric Auth App';
const origin = `http://${rpID}:3000`; // Replace with your domain for production

exports.generateRegistrationOptions = async (req, res) => {
  const { username } = req.body;

  let user = await User.findOne({ username });

  if (!user) {
    user = new User({ username, credentials: [] });
    await user.save();
  }

  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: user._id.toString(),
    userName: user.username,
    timeout: 60000,
    attestationType: 'none',
  });

  user.currentChallenge = options.challenge;
  await user.save();

  res.json(options);
};

exports.verifyRegistration = async (req, res) => {
  const { username, attestation } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    console.error('User not found');
    return res.status(400).json({ error: 'User not found' });
  }

  const expectedChallenge = user.currentChallenge;
  console.log('Expected Challenge:', expectedChallenge);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      credential: attestation,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(400).json({ error: error.message });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;
    user.credentials.push({
      credentialPublicKey: base64url.encode(credentialPublicKey),
      credentialID: base64url.encode(Buffer.from(credentialID)),
      counter,
    });
    user.currentChallenge = undefined;
    await user.save();
    console.log('User credentials saved successfully.');
  } else {
    console.error('Verification failed:', verification);
  }

  res.json({ verified });
};

exports.generateAuthenticationOptions = async (req, res) => {
  const { username } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const options = generateAuthenticationOptions({
    timeout: 60000,
    rpID,
    userVerification: 'preferred',
    allowCredentials: user.credentials.map(device => ({
      id: base64url.toBuffer(device.credentialID),
      type: 'public-key',
      transports: ['usb', 'ble', 'nfc', 'internal'],
    })),
  });

  user.currentChallenge = options.challenge;
  await user.save();

  res.json(options);
};
exports.verifyAuthentication = async (req, res) => {
  const { username, assertion } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const expectedChallenge = user.currentChallenge;

  // Convert the assertion raw ID to base64url format for comparison
  const assertionCredentialID = base64url.encode(Buffer.from(assertion.rawId));
  console.log('Assertion Credential ID:', assertionCredentialID);

  // Find the matching credential
  const authenticator = user.credentials.find(device => {
    console.log('Checking device:', device);
    // Compare credential IDs after decoding from base64url
    return base64url.encode(Buffer.from(device.credentialID)) === assertionCredentialID;
  });

  if (!authenticator) {
    console.error('Authenticator not found');
    return res.status(400).json({ error: 'Authenticator not found' });
  }

  console.log('Authenticator found:', authenticator);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      credential: assertion,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: base64url.toBuffer(authenticator.credentialPublicKey),
        credentialID: base64url.toBuffer(authenticator.credentialID),
        counter: authenticator.counter,
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(400).json({ error: error.message });
  }

  const { verified, authenticationInfo } = verification;

  if (verified && authenticationInfo) {
    const { newCounter } = authenticationInfo;
    authenticator.counter = newCounter;
    user.currentChallenge = undefined;
    await user.save();
  }

  res.json({ verified });
};



