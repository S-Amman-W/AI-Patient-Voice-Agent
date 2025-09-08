import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicalConditions } from '@/db/schema';
import { insertMedicalConditionClientSchema } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    
    // Clean up empty strings to undefined to match schema expectations
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === '' ? undefined : value])
    );
    
    console.log('Received medical condition update data:', cleanedBody);
    
    // Validate input (using client schema that excludes userId)
    const result = insertMedicalConditionClientSchema.safeParse(cleanedBody);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    // Update condition (ensure it belongs to the user)
    const updatedCondition = await db
      .update(medicalConditions)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(medicalConditions.id, resolvedParams.id),
          eq(medicalConditions.userId, userId)
        )
      )
      .returning();

    if (updatedCondition.length === 0) {
      return NextResponse.json({ error: 'Condition not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Condition updated successfully', condition: updatedCondition[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Condition update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Delete condition (ensure it belongs to the user)
    const deletedCondition = await db
      .delete(medicalConditions)
      .where(
        and(
          eq(medicalConditions.id, resolvedParams.id),
          eq(medicalConditions.userId, userId)
        )
      )
      .returning();

    if (deletedCondition.length === 0) {
      return NextResponse.json({ error: 'Condition not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Condition deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Condition deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
