import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, age } = req.body;

    // Basic validation for all required fields
    if (!name || !email || !password || age === undefined || age === null || typeof age !== 'number' || age <= 0) {
      return res.status(400).json({ message: 'Name, valid email, valid password, and valid age are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all initial data and set onboardingCompleted to true
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        age: age,
        onboardingCompleted: true, // Set to true as initial data is collected
      },
      select: { // Select fields to return, excluding sensitive data
        id: true,
        name: true,
        email: true,
        age: true,
        onboardingCompleted: true,
      }
    });

    // Remove sensitive data from response (password)
    const { password: _, ...userWithoutSensitiveData } = user;

    return res.status(201).json({
      message: 'User created successfully',
      user: userWithoutSensitiveData,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 