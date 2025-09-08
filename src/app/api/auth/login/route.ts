import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { loginSchema, verifyPassword, sanitizeString } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    // Sanitize username
    const sanitizedUsername = sanitizeString(username.toLowerCase());

    // Find user by username or email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, sanitizedUsername))
      .limit(1);

    if (user.length === 0) {
      // Check if it's an email instead
      const userByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, sanitizedUsername))
        .limit(1);

      if (userByEmail.length === 0) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, userByEmail[0].passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Create JWT token
      const token = sign(
        { 
          userId: userByEmail[0].id, 
          username: userByEmail[0].username 
        },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Return success with user data (without password)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = userByEmail[0];
      
      return NextResponse.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user[0].passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = sign(
      { 
        userId: user[0].id, 
        username: user[0].username 
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return success with user data (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user[0];
    
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
