import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in to create activities',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { activityType, activityDate, duration, distanceMeters } = body;

    // Validate required fields
    if (!activityType || !activityDate || !duration) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required fields: activityType, activityDate, duration',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Insert the activity with the user's ID
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_date: activityDate,
        duration: duration,
        distance_meters: distanceMeters || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: `Failed to create activity: ${insertError.message}`,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(JSON.stringify(activity), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in to view activities',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch all activities for the authenticated user
    const { data: activities, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .order('activity_date', { ascending: false });

    if (fetchError) {
      console.error('Database error:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: `Failed to fetch activities: ${fetchError.message}`,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(JSON.stringify(activities || []), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
