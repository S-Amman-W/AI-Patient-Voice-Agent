import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pastConsultations } from '@/db/schema';
import { insertConsultationClientSchema } from '@/db/schema';
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

    const consultations = await db
      .select()
      .from(pastConsultations)
      .where(eq(pastConsultations.userId, userId))
      .orderBy(pastConsultations.createdAt);

    return NextResponse.json({ consultations }, { status: 200 });
  } catch (error) {
    console.error('Consultations fetch error:', error);
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
    const consultationData = {
      summary: body.summary,
      symptoms: body.symptoms || undefined,
      diagnosis: body.diagnosis || undefined,
      followUpContacts: body.followUpContacts || undefined,
      disclaimer: body.disclaimer,
    };

    console.log('Received consultation data:', consultationData);

    // Validate input (using client schema that excludes userId)
    const result = insertConsultationClientSchema.safeParse(consultationData);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    // Create consultation record
    const newConsultation = await db
      .insert(pastConsultations)
      .values({
        ...result.data,
        userId,
      })
      .returning();

    return NextResponse.json(
      { message: 'Consultation saved successfully', consultation: newConsultation[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Consultation creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
