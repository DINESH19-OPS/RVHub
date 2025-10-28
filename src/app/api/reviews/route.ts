import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews, items } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

async function updateItemRating(itemId: number) {
  try {
    const itemReviews = await db.select().from(reviews).where(eq(reviews.itemId, itemId));
    
    const averageRating = itemReviews.length > 0
      ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length
      : 0;
    
    await db.update(items)
      .set({
        averageRating,
        totalReviews: itemReviews.length,
        updatedAt: new Date().toISOString()
      })
      .where(eq(items.id, itemId));
  } catch (error) {
    console.error('Error updating item rating:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const itemId = searchParams.get('itemId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const review = await db.select()
        .from(reviews)
        .where(eq(reviews.id, parseInt(id)))
        .limit(1);

      if (review.length === 0) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      return NextResponse.json(review[0], { status: 200 });
    }

    let query = db.select().from(reviews);

    if (itemId) {
      if (isNaN(parseInt(itemId))) {
        return NextResponse.json({
          error: 'Valid itemId is required',
          code: 'INVALID_ITEM_ID'
        }, { status: 400 });
      }
      query = query.where(eq(reviews.itemId, parseInt(itemId)));
    }

    const orderColumn = sort === 'createdAt' ? reviews.createdAt : reviews.createdAt;
    query = order === 'asc' 
      ? query.orderBy(asc(orderColumn))
      : query.orderBy(desc(orderColumn));

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: unknown) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, userId, rating, title, comment } = body;

    if (!itemId || isNaN(parseInt(itemId))) {
      return NextResponse.json({
        error: 'Valid itemId is required',
        code: 'INVALID_ITEM_ID'
      }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
      return NextResponse.json({
        error: 'Rating must be an integer between 1 and 5',
        code: 'INVALID_RATING'
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({
        error: 'Title is required',
        code: 'MISSING_TITLE'
      }, { status: 400 });
    }

    const item = await db.select().from(items).where(eq(items.id, parseInt(itemId))).limit(1);
    if (item.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const newReview = await db.insert(reviews)
      .values({
        itemId: parseInt(itemId),
        userId: userId.trim(),
        rating: parseInt(rating),
        title: title.trim(),
        comment: comment ? comment.trim() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    await updateItemRating(parseInt(itemId));

    return NextResponse.json(newReview[0], { status: 201 });
  } catch (error: unknown) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { rating, title, comment } = body;

    const existingReview = await db.select()
      .from(reviews)
      .where(eq(reviews.id, parseInt(id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updates: {
      rating?: number;
      title?: string;
      comment?: string | null;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString()
    };

    if (rating !== undefined) {
      if (isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
        return NextResponse.json({
          error: 'Rating must be an integer between 1 and 5',
          code: 'INVALID_RATING'
        }, { status: 400 });
      }
      updates.rating = parseInt(rating);
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json({
          error: 'Title must be a non-empty string',
          code: 'INVALID_TITLE'
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (comment !== undefined) {
      updates.comment = comment ? comment.trim() : null;
    }

    const updated = await db.update(reviews)
      .set(updates)
      .where(eq(reviews.id, parseInt(id)))
      .returning();

    if (rating !== undefined) {
      await updateItemRating(existingReview[0].itemId);
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: unknown) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const existingReview = await db.select()
      .from(reviews)
      .where(eq(reviews.id, parseInt(id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const itemId = existingReview[0].itemId;

    const deleted = await db.delete(reviews)
      .where(eq(reviews.id, parseInt(id)))
      .returning();

    await updateItemRating(itemId);

    return NextResponse.json({
      message: 'Review deleted successfully',
      id: deleted[0].id
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}