import type { APIRoute } from 'astro';
import { getOpenRouterService, getFallbackMotivation, isAIMotivationEnabled, aggregateActivityStats } from '@/lib/services';
import type { MotivationalMessage } from '@/lib/services';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Check if feature is enabled
  if (!isAIMotivationEnabled()) {
    return new Response(
      JSON.stringify({ error: 'AI motivation feature is disabled' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { userId, distanceUnit = 'km', bypassCache = false } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get supabase client
    const supabase = locals.supabase;

    // Aggregate activity stats for current month
    const now = new Date();
    const stats = await aggregateActivityStats(
      supabase,
      userId,
      now,
      distanceUnit
    );

    // Generate motivation
    let motivation: MotivationalMessage;
    const service = getOpenRouterService();

    if (service) {
      try {
        motivation = await service.generateMotivationalMessage(
          userId,
          stats,
          { bypassCache }
        );
      } catch (error) {
        console.error('Failed to generate AI motivation:', error);
        // Use fallback - generic motivational text in English
        motivation = getFallbackMotivation(stats);
      }
    } else {
      // Service not initialized, use fallback
      motivation = getFallbackMotivation(stats);
    }

    return new Response(JSON.stringify(motivation), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error generating motivation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate motivation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
