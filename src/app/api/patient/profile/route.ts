import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patientProfiles } from '@/db/schema';
import { insertPatientProfileSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from 'jsonwebtoken';

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    return NextResponse.json({ profile: profile[0] }, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Clean up empty strings to undefined to match schema expectations
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === '' ? undefined : value])
    );
    
    console.log('Received patient profile data (POST):', cleanedBody);
    
    // Validate input (exclude userId since it comes from token)
    const validationSchema = insertPatientProfileSchema.omit({ userId: true });
    const result = validationSchema.safeParse(cleanedBody);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json(
        { error: 'Profile already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Create profile
    const newProfile = await db
      .insert(patientProfiles)
      .values({
        ...result.data,
        userId,
      })
      .returning();

    return NextResponse.json(
      { message: 'Profile created successfully', profile: newProfile[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Clean up empty strings to undefined to match schema expectations
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === '' ? undefined : value])
    );
    
    console.log('Received patient profile data (PUT):', cleanedBody);
    
    // Validate input (exclude userId since it comes from token)
    const validationSchema = insertPatientProfileSchema.omit({ userId: true });
    const result = validationSchema.safeParse(cleanedBody);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    // Update profile
    const updatedProfile = await db
      .update(patientProfiles)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(patientProfiles.userId, userId))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Profile updated successfully', profile: updatedProfile[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
