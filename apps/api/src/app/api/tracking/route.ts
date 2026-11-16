import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@courier/supabase-client';
import { getIndiaPostGateway } from '@courier/gateways';

/**
 * GET /api/tracking
 * Fetch tracking information for a booking
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trackingNumber = searchParams.get('trackingNumber');
  const bookingId = searchParams.get('bookingId');

  if (!trackingNumber && !bookingId) {
    return NextResponse.json(
      { error: 'trackingNumber or bookingId is required' },
      { status: 400 }
    );
  }

  try {
    const gateway = getIndiaPostGateway();

    let trackingData;
    if (trackingNumber) {
      trackingData = await gateway.fetchTracking(trackingNumber);
    } else if (bookingId) {
      // Fetch tracking from database
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('tracking')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Tracking not found for this booking' },
          { status: 404 }
        );
      }

      trackingData = {
        status: data.status as any,
        statusDetails: data.status_details,
        lastUpdated: data.last_updated,
      };
    }

    return NextResponse.json({ tracking: trackingData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracking
 * Update tracking information for a booking (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status, statusDetails } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'bookingId and status are required' },
        { status: 400 }
      );
    }

    const gateway = getIndiaPostGateway();

    await gateway.updateBookingTracking(bookingId, {
      status,
      statusDetails,
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: 'Tracking updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating tracking:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking information' },
      { status: 500 }
    );
  }
}