import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { items } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single item fetch by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const item = await db
        .select()
        .from(items)
        .where(eq(items.id, parseInt(id)))
        .limit(1);

      if (item.length === 0) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      return NextResponse.json(item[0], { status: 200 });
    }

    // List with pagination, search, and category filter
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let query = db.select().from(items);

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(items.name, `%${search}%`),
          like(items.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(items.category, category));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, imageUrl } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    const newItem = await db
      .insert(items)
      .values({
        name: name.trim(),
        description: description || null,
        category: category.trim(),
        imageUrl: imageUrl || null,
        averageRating: 0,
        totalReviews: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newItem[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, category, imageUrl, averageRating, totalReviews } = body;

    // Check if item exists
    const existingItem = await db
      .select()
      .from(items)
      .where(eq(items.id, parseInt(id)))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim() === '') {
        return NextResponse.json(
          { error: 'Category must be a non-empty string', code: 'INVALID_CATEGORY' },
          { status: 400 }
        );
      }
      updates.category = category.trim();
    }

    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl;
    }

    if (averageRating !== undefined) {
      const rating = parseFloat(averageRating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        return NextResponse.json(
          { error: 'Average rating must be between 0 and 5', code: 'INVALID_RATING' },
          { status: 400 }
        );
      }
      updates.averageRating = rating;
    }

    if (totalReviews !== undefined) {
      const reviews = parseInt(totalReviews);
      if (isNaN(reviews) || reviews < 0) {
        return NextResponse.json(
          { error: 'Total reviews must be a non-negative integer', code: 'INVALID_REVIEWS' },
          { status: 400 }
        );
      }
      updates.totalReviews = reviews;
    }

    const updatedItem = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedItem[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const deletedItem = await db
      .delete(items)
      .where(eq(items.id, parseInt(id)))
      .returning();

    if (deletedItem.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Item deleted successfully', id: parseInt(id) },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}