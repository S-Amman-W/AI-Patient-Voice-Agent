import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicalConditions } from '@/db/schema';
import { insertMedicalConditionClientSchema } from '@/db/schema';
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

    const conditions = await db
      .select()
      .from(medicalConditions)
      .where(eq(medicalConditions.userId, userId))
      .orderBy(medicalConditions.createdAt);

    return NextResponse.json({ conditions }, { status: 200 });
  } catch (error) {
    console.error('Conditions fetch error:', error);
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
    
    console.log('Received medical condition data:', cleanedBody);
    
    // Validate input (using client schema that excludes userId)
    const result = insertMedicalConditionClientSchema.safeParse(cleanedBody);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    // Create condition
    const newCondition = await db
      .insert(medicalConditions)
      .values({
        ...result.data,
        userId,
      })
      .returning();

    return NextResponse.json(
      { message: 'Condition added successfully', condition: newCondition[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Condition creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
